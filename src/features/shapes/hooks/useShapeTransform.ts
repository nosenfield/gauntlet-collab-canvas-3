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
      const shape = node.attrs as Shape;

      // Get current position
      let x = node.x();
      let y = node.y();

      // Get shape dimensions
      const width = shape.width || 0;
      const height = shape.height || 0;

      // Constrain to canvas boundaries
      const constrained = constrainPosition(x, y, width, height);
      
      // Update node position if constrained
      if (constrained.x !== x || constrained.y !== y) {
        node.x(constrained.x);
        node.y(constrained.y);
        x = constrained.x;
        y = constrained.y;
      }

      // Debounce Firestore update
      debouncedUpdate.debounced(shapeId, { x, y });
    },
    [debouncedUpdate]
  );

  /**
   * Handle shape drag end
   */
  const handleDragEnd = useCallback(
    (shapeId: string, e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target;
      const x = node.x();
      const y = node.y();

      // Flush any pending debounced update and send final position
      debouncedUpdate.flush();
      updateShape(shapeId, { x, y });
      
      isTransformingRef.current.delete(shapeId);
      console.log('✅ Drag end:', shapeId, { x, y });
    },
    [updateShape, debouncedUpdate]
  );

  /**
   * Handle shape resize
   * 
   * @param shapeId - ID of shape being resized
   * @param newWidth - New width
   * @param newHeight - New height
   * @param newX - New x position (may change during resize from top/left handles)
   * @param newY - New y position (may change during resize from top/left handles)
   */
  const handleResize = useCallback(
    (
      shapeId: string,
      newWidth: number,
      newHeight: number,
      newX?: number,
      newY?: number
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

      // Debounce Firestore update
      debouncedUpdate.debounced(shapeId, updates);
    },
    [debouncedUpdate]
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
   */
  const handleRotate = useCallback(
    (shapeId: string, newRotation: number) => {
      const normalized = normalizeRotation(newRotation);

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

