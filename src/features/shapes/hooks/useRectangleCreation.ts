/**
 * useRectangleCreation Hook
 * 
 * Handles mouse interactions for creating rectangles on the canvas.
 * - Mouse down: Start rectangle creation
 * - Mouse move: Update rectangle preview
 * - Mouse up: Create rectangle in Firestore
 */

import { useState, useCallback, useRef } from 'react';
import type Konva from 'konva';
import { screenToCanvas } from '../../canvas/utils/coordinateTransform';
import { useShapes } from './useShapes';
import { useTool } from './useTool';
import { useViewport } from '../../canvas/store/viewportStore';
import { DEFAULT_RECTANGLE_PROPS, MIN_SHAPE_SIZE } from '../constants/defaultShapeProps';

/**
 * Rectangle being created (preview state)
 */
interface RectangleInProgress {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

/**
 * Rectangle bounds (normalized)
 */
interface RectangleBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * useRectangleCreation Hook Return Type
 */
interface UseRectangleCreationReturn {
  isCreating: boolean;
  previewRectangle: RectangleBounds | null;
  handleMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleMouseUp: (e: Konva.KonvaEventObject<MouseEvent>) => void;
}

/**
 * Hook for creating rectangles via click-drag
 * 
 * @returns Event handlers and preview state for rectangle creation
 */
export function useRectangleCreation(): UseRectangleCreationReturn {
  const { currentTool } = useTool();
  const { createShape, getNextZIndex } = useShapes();
  const { viewport } = useViewport();
  
  const [rectangleInProgress, setRectangleInProgress] = useState<RectangleInProgress | null>(null);
  const isCreatingRef = useRef(false);

  /**
   * Calculate normalized rectangle bounds from start/end points
   */
  const calculateBounds = useCallback((rect: RectangleInProgress): RectangleBounds => {
    const x = Math.min(rect.startX, rect.currentX);
    const y = Math.min(rect.startY, rect.currentY);
    const width = Math.abs(rect.currentX - rect.startX);
    const height = Math.abs(rect.currentY - rect.startY);

    return { x, y, width, height };
  }, []);

  /**
   * Convert preview rectangle to bounds for rendering
   */
  const previewRectangle = rectangleInProgress ? calculateBounds(rectangleInProgress) : null;

  /**
   * Handle mouse down - start rectangle creation
   */
  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only create rectangles when rectangle tool is selected
    if (currentTool !== 'rectangle') return;

    // Don't start if clicking on a shape (future: will be handled by selection)
    if (e.target !== e.target.getStage()) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Convert screen coordinates to canvas coordinates
    const canvasPos = screenToCanvas(
      pointerPos.x,
      pointerPos.y,
      viewport.x,
      viewport.y,
      viewport.scale
    );

    // Start rectangle creation
    setRectangleInProgress({
      startX: canvasPos.x,
      startY: canvasPos.y,
      currentX: canvasPos.x,
      currentY: canvasPos.y,
    });
    isCreatingRef.current = true;

    console.log('🎨 Started rectangle creation at:', canvasPos);
  }, [currentTool, viewport]);

  /**
   * Handle mouse move - update rectangle preview
   */
  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isCreatingRef.current || !rectangleInProgress) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Convert screen coordinates to canvas coordinates
    const canvasPos = screenToCanvas(
      pointerPos.x,
      pointerPos.y,
      viewport.x,
      viewport.y,
      viewport.scale
    );

    // Update preview
    setRectangleInProgress({
      ...rectangleInProgress,
      currentX: canvasPos.x,
      currentY: canvasPos.y,
    });
  }, [rectangleInProgress, viewport]);

  /**
   * Handle mouse up - create rectangle in Firestore
   */
  const handleMouseUp = useCallback(async () => {
    if (!isCreatingRef.current || !rectangleInProgress) return;

    const bounds = calculateBounds(rectangleInProgress);

    // Only create if rectangle is large enough
    if (bounds.width >= MIN_SHAPE_SIZE && bounds.height >= MIN_SHAPE_SIZE) {
      try {
        // Get next z-index for proper layering
        const zIndex = await getNextZIndex();

        // Create rectangle in Firestore
        await createShape({
          type: 'rectangle',
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
          ...DEFAULT_RECTANGLE_PROPS,
          zIndex,
        });

        console.log('✅ Rectangle created:', bounds);
      } catch (error) {
        console.error('❌ Failed to create rectangle:', error);
      }
    } else {
      console.log('⚠️ Rectangle too small, not creating');
    }

    // Reset creation state
    setRectangleInProgress(null);
    isCreatingRef.current = false;
  }, [rectangleInProgress, calculateBounds, createShape, getNextZIndex]);

  return {
    isCreating: isCreatingRef.current,
    previewRectangle,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}

