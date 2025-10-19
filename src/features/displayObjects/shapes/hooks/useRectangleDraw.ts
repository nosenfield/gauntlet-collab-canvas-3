/**
 * useRectangleDraw Hook
 * 
 * Manages the interactive drawing of rectangles via click-and-drag.
 * Handles mouse events for:
 * - Mouse down: Start drawing
 * - Mouse move: Update preview dimensions
 * - Mouse up: Finalize and create shape
 * 
 * Features:
 * - Supports dragging in all directions from start point
 * - Enforces minimum size (10x10px)
 * - Provides preview dimensions for rendering
 */

import { useState, useCallback } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import { SHAPE_CONSTANTS } from '../types';

interface Point {
  x: number;
  y: number;
}

interface RectangleDimensions {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseRectangleDrawReturn {
  isDrawing: boolean;
  previewRect: RectangleDimensions | null;
  startDrawing: (e: KonvaEventObject<MouseEvent>) => void;
  updateDrawing: (e: KonvaEventObject<MouseEvent>) => void;
  finishDrawing: (e: KonvaEventObject<MouseEvent>) => RectangleDimensions | null;
  cancelDrawing: () => void;
}

const MIN_SIZE = SHAPE_CONSTANTS.MIN_DIMENSION;

/**
 * useRectangleDraw
 * 
 * Hook for managing interactive rectangle drawing with click-and-drag.
 * 
 * @returns Drawing state and event handlers
 * 
 * @example
 * ```tsx
 * function Canvas() {
 *   const { isDrawing, previewRect, startDrawing, updateDrawing, finishDrawing } = useRectangleDraw();
 *   
 *   return (
 *     <>
 *       <Stage 
 *         onMouseDown={startDrawing}
 *         onMouseMove={updateDrawing}
 *         onMouseUp={finishDrawing}
 *       >
 *         {isDrawing && previewRect && <PreviewRectangle {...previewRect} />}
 *       </Stage>
 *     </>
 *   );
 * }
 * ```
 */
export function useRectangleDraw(): UseRectangleDrawReturn {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);

  /**
   * Calculate rectangle dimensions from start and current points
   * Supports dragging in any direction
   */
  const calculateRect = useCallback((start: Point, current: Point): RectangleDimensions => {
    // Calculate raw dimensions
    const rawWidth = current.x - start.x;
    const rawHeight = current.y - start.y;
    
    // Determine top-left corner (handle negative dimensions)
    const x = rawWidth >= 0 ? start.x : current.x;
    const y = rawHeight >= 0 ? start.y : current.y;
    
    // Absolute dimensions
    const width = Math.abs(rawWidth);
    const height = Math.abs(rawHeight);
    
    return { x, y, width, height };
  }, []);

  /**
   * Get preview rectangle for rendering
   */
  const previewRect = (() => {
    if (!isDrawing || !startPoint || !currentPoint) {
      return null;
    }
    return calculateRect(startPoint, currentPoint);
  })();

  /**
   * Start drawing rectangle on mouse down
   */
  const startDrawing = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Convert screen coordinates to canvas coordinates
    const scale = stage.scaleX();
    const stageX = stage.x();
    const stageY = stage.y();
    
    const canvasX = (pointerPosition.x - stageX) / scale;
    const canvasY = (pointerPosition.y - stageY) / scale;

    console.log('[RectangleDraw] Start drawing at:', { canvasX, canvasY });
    
    setIsDrawing(true);
    setStartPoint({ x: canvasX, y: canvasY });
    setCurrentPoint({ x: canvasX, y: canvasY });
  }, []);

  /**
   * Update preview rectangle as mouse moves
   */
  const updateDrawing = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || !startPoint) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Convert screen coordinates to canvas coordinates
    const scale = stage.scaleX();
    const stageX = stage.x();
    const stageY = stage.y();
    
    const canvasX = (pointerPosition.x - stageX) / scale;
    const canvasY = (pointerPosition.y - stageY) / scale;

    setCurrentPoint({ x: canvasX, y: canvasY });
  }, [isDrawing, startPoint]);

  /**
   * Finish drawing and return final dimensions
   * Returns null if dimensions are below minimum size
   */
  const finishDrawing = useCallback((e: KonvaEventObject<MouseEvent>): RectangleDimensions | null => {
    if (!isDrawing || !startPoint) {
      return null;
    }

    const stage = e.target.getStage();
    if (!stage) {
      setIsDrawing(false);
      setStartPoint(null);
      setCurrentPoint(null);
      return null;
    }

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) {
      setIsDrawing(false);
      setStartPoint(null);
      setCurrentPoint(null);
      return null;
    }

    // Convert screen coordinates to canvas coordinates
    const scale = stage.scaleX();
    const stageX = stage.x();
    const stageY = stage.y();
    
    const canvasX = (pointerPosition.x - stageX) / scale;
    const canvasY = (pointerPosition.y - stageY) / scale;

    const endPoint = { x: canvasX, y: canvasY };
    const rect = calculateRect(startPoint, endPoint);

    console.log('[RectangleDraw] Finish drawing:', rect);

    // Reset drawing state
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);

    // Check minimum size
    if (rect.width < MIN_SIZE || rect.height < MIN_SIZE) {
      console.log('[RectangleDraw] Rectangle too small, discarding');
      return null;
    }

    return rect;
  }, [isDrawing, startPoint, calculateRect]);

  /**
   * Cancel drawing (e.g., on escape key)
   */
  const cancelDrawing = useCallback(() => {
    console.log('[RectangleDraw] Drawing cancelled');
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  }, []);

  return {
    isDrawing,
    previewRect,
    startDrawing,
    updateDrawing,
    finishDrawing,
    cancelDrawing,
  };
}

