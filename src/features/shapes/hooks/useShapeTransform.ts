/**
 * Shape Transform Hook
 * 
 * Handles drag, resize, and rotate operations for shapes.
 * Includes canvas boundary constraints and debounced Firestore updates.
 */

import { useCallback, useMemo, useRef } from 'react';
import type Konva from 'konva';
import type { Shape } from '../../../types/firebase';
import { useShapes } from './useShapes';
import { debounceWithFlush } from '../../../utils/debounce';
import { useShapesMap } from '../store/shapesStore';

/**
 * Canvas boundary constraints
 */
const CANVAS_MIN_X = 0;
const CANVAS_MIN_Y = 0;
const CANVAS_MAX_X = 10000;
const CANVAS_MAX_Y = 10000;

/**
 * Minimum shape dimensions
 */
const MIN_WIDTH = 10;
const MIN_HEIGHT = 10;

/**
 * Debounce delay for Firestore updates (ms)
 */
const UPDATE_DEBOUNCE_MS = 300;

/**
 * Constrain position to canvas boundaries
 */
function constrainPosition(
  x: number,
  y: number,
  width: number,
  height: number
): { x: number; y: number } {
  return {
    x: Math.max(CANVAS_MIN_X, Math.min(x, CANVAS_MAX_X - width)),
    y: Math.max(CANVAS_MIN_Y, Math.min(y, CANVAS_MAX_Y - height)),
  };
}

/**
 * Constrain dimensions to minimum size
 */
function constrainDimensions(width: number, height: number): { width: number; height: number } {
  return {
    width: Math.max(MIN_WIDTH, width),
    height: Math.max(MIN_HEIGHT, height),
  };
}

/**
 * Normalize rotation to 0-360 degrees
 */
function normalizeRotation(rotation: number): number {
  const normalized = rotation % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

/**
 * Shape Transform Hook
 * 
 * Provides handlers for shape transformation operations.
 */
export function useShapeTransform() {
  const { updateShape } = useShapes();
  const shapesMap = useShapesMap();
  
  // Track if we're currently transforming (to prevent redundant updates)
  const isTransformingRef = useRef<Set<string>>(new Set());

  /**
   * Debounced update to Firestore
   */
  const debouncedUpdate = useMemo(() => {
    const { debounced, flush } = debounceWithFlush(
      (shapeId: string, updates: Partial<Shape>) => {
        updateShape(shapeId, updates);
        console.log('🔄 Debounced shape update:', shapeId, updates);
      },
      UPDATE_DEBOUNCE_MS
    );

    return { debounced, flush };
  }, [updateShape]);

  /**
   * Handle shape drag start
   */
  const handleDragStart = useCallback((shapeId: string) => {
    isTransformingRef.current.add(shapeId);
    console.log('🎯 Drag start:', shapeId);
  }, []);

  /**
   * Handle shape drag move
   */
  const handleDragMove = useCallback(
    (shapeId: string, e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      
      // Get shape data from store (not from node.attrs which may be stale)
      const shape = shapesMap.get(shapeId);
      if (!shape) return;

      // Get current position (center of shape)
      let centerX = node.x();
      let centerY = node.y();

      // Get shape dimensions from actual shape data
      const width = shape.width || 0;
      const height = shape.height || 0;

      // Convert center to top-left for storage
      let topLeftX = centerX - width / 2;
      let topLeftY = centerY - height / 2;

      // Constrain to canvas boundaries (using top-left coords)
      const constrained = constrainPosition(topLeftX, topLeftY, width, height);
      
      // Update node position if constrained (convert back to center)
      if (constrained.x !== topLeftX || constrained.y !== topLeftY) {
        node.x(constrained.x + width / 2);
        node.y(constrained.y + height / 2);
        topLeftX = constrained.x;
        topLeftY = constrained.y;
      }

      // Debounce Firestore update (store top-left position)
      debouncedUpdate.debounced(shapeId, { x: topLeftX, y: topLeftY });
    },
    [debouncedUpdate, shapesMap]
  );

  /**
   * Handle shape drag end
   */
  const handleDragEnd = useCallback(
    (shapeId: string, e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      
      // Get shape data from store (not from node.attrs)
      const shape = shapesMap.get(shapeId);
      if (!shape) return;
      
      // Get current position (center)
      const centerX = node.x();
      const centerY = node.y();
      
      // Get shape dimensions from actual shape data
      const width = shape.width || 0;
      const height = shape.height || 0;
      
      // Convert center to top-left for storage
      const topLeftX = centerX - width / 2;
      const topLeftY = centerY - height / 2;

      // Flush any pending debounced update and send final position
      debouncedUpdate.flush();
      updateShape(shapeId, { x: topLeftX, y: topLeftY });
      
      isTransformingRef.current.delete(shapeId);
      console.log('✅ Drag end:', shapeId, { x: topLeftX, y: topLeftY });
    },
    [updateShape, debouncedUpdate, shapesMap]
  );

  /**
   * Handle shape resize
   * 
   * @param shapeId - ID of shape being resized
   * @param newWidth - New width
   * @param newHeight - New height
   * @param newX - New x position (may change during resize from top/left handles)
   * @param newY - New y position (may change during resize from top/left handles)
   * @param stageRef - Optional stage reference for optimistic updates
   */
  const handleResize = useCallback(
    (
      shapeId: string,
      newWidth: number,
      newHeight: number,
      newX?: number,
      newY?: number,
      stageRef?: any
    ) => {
      // Constrain dimensions
      const constrained = constrainDimensions(newWidth, newHeight);

      // Build update object
      const updates: Partial<Shape> = {
        width: constrained.width,
        height: constrained.height,
      };

      // Include position if provided
      if (newX !== undefined) updates.x = newX;
      if (newY !== undefined) updates.y = newY;

      // Optimistic update: Update Konva node immediately for smooth resize
      if (stageRef?.current) {
        const shape = shapesMap.get(shapeId);
        if (shape) {
          const shapeNode = stageRef.current.findOne(`#shape-${shapeId}`);
          if (shapeNode) {
            // Update position (center)
            const centerX = (updates.x ?? shape.x) + constrained.width / 2;
            const centerY = (updates.y ?? shape.y) + constrained.height / 2;
            shapeNode.x(centerX);
            shapeNode.y(centerY);
            
            // Update child Rect dimensions
            const rect = shapeNode.findOne('Rect');
            if (rect) {
              rect.width(constrained.width);
              rect.height(constrained.height);
              rect.x(-constrained.width / 2);
              rect.y(-constrained.height / 2);
            }
          }
        }
      }

      // Debounce Firestore update
      debouncedUpdate.debounced(shapeId, updates);
    },
    [debouncedUpdate, shapesMap]
  );

  /**
   * Handle resize end (flush pending updates)
   */
  const handleResizeEnd = useCallback(
    (
      shapeId: string,
      finalWidth: number,
      finalHeight: number,
      finalX?: number,
      finalY?: number
    ) => {
      // Constrain dimensions
      const constrained = constrainDimensions(finalWidth, finalHeight);

      // Build update object
      const updates: Partial<Shape> = {
        width: constrained.width,
        height: constrained.height,
      };

      // Include position if provided
      if (finalX !== undefined) updates.x = finalX;
      if (finalY !== undefined) updates.y = finalY;

      // Flush any pending updates and send final dimensions
      debouncedUpdate.flush();
      updateShape(shapeId, updates);
      
      console.log('✅ Resize end:', shapeId, updates);
    },
    [updateShape, debouncedUpdate]
  );

  /**
   * Handle shape rotation
   * 
   * @param shapeId - ID of shape being rotated
   * @param newRotation - New rotation in degrees
   * @param stageRef - Optional stage reference for optimistic updates
   */
  const handleRotate = useCallback(
    (shapeId: string, newRotation: number, stageRef?: any) => {
      const normalized = normalizeRotation(newRotation);

      // Optimistic update: Update Konva node immediately for smooth rotation
      if (stageRef?.current) {
        const shapeNode = stageRef.current.findOne(`#shape-${shapeId}`);
        if (shapeNode) {
          shapeNode.rotation(normalized);
        }
      }

      // Debounce Firestore update
      debouncedUpdate.debounced(shapeId, { rotation: normalized });
    },
    [debouncedUpdate]
  );

  /**
   * Handle rotation end (flush pending updates)
   */
  const handleRotateEnd = useCallback(
    (shapeId: string, finalRotation: number) => {
      const normalized = normalizeRotation(finalRotation);

      // Flush any pending updates and send final rotation
      debouncedUpdate.flush();
      updateShape(shapeId, { rotation: normalized });
      
      console.log('✅ Rotate end:', shapeId, { rotation: normalized });
    },
    [updateShape, debouncedUpdate]
  );

  return {
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleResize,
    handleResizeEnd,
    handleRotate,
    handleRotateEnd,
    constrainPosition,
    constrainDimensions,
  };
}

