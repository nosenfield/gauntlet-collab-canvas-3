/**
 * useCircleDraw Hook
 * 
 * Manages the interactive drawing of circles via click-and-drag.
 * Uses bounding box approach: user drags to define a rectangle,
 * and circle fits within that bounding box.
 * 
 * Features:
 * - Supports dragging in all directions from start point
 * - Calculates radius from bounding box dimensions
 * - Enforces minimum size (10px radius)
 * - Provides preview dimensions for rendering
 */

import { useState, useCallback } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import { SHAPE_CONSTANTS } from '../types';

interface Point {
  x: number;
  y: number;
}

interface CircleDimensions {
  x: number;        // Center X
  y: number;        // Center Y
  radius: number;   // Radius (average of radiusX and radiusY for data model)
  width: number;    // Width (radiusX * 2)
  height: number;   // Height (radiusY * 2)
  radiusX: number;  // Horizontal radius (for preview rendering)
  radiusY: number;  // Vertical radius (for preview rendering)
}

interface UseCircleDrawReturn {
  isDrawing: boolean;
  previewCircle: CircleDimensions | null;
  startDrawing: (e: KonvaEventObject<MouseEvent>) => void;
  updateDrawing: (e: KonvaEventObject<MouseEvent>) => void;
  finishDrawing: (e: KonvaEventObject<MouseEvent>) => CircleDimensions | null;
  cancelDrawing: () => void;
}

const MIN_SIZE = SHAPE_CONSTANTS.MIN_DIMENSION;

/**
 * useCircleDraw
 * 
 * Hook for managing interactive circle drawing with click-and-drag.
 * Uses bounding box approach: circle fits within dragged rectangle.
 * 
 * @returns Drawing state and event handlers
 * 
 * @example
 * ```tsx
 * function Canvas() {
 *   const { isDrawing, previewCircle, startDrawing, updateDrawing, finishDrawing } = useCircleDraw();
 *   
 *   return (
 *     <>
 *       <Stage 
 *         onMouseDown={startDrawing}
 *         onMouseMove={updateDrawing}
 *         onMouseUp={finishDrawing}
 *       >
 *         {isDrawing && previewCircle && <PreviewCircle {...previewCircle} />}
 *       </Stage>
 *     </>
 *   );
 * }
 * ```
 */
export function useCircleDraw(): UseCircleDrawReturn {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);

  /**
   * Calculate circle/ellipse dimensions from bounding box
   * Ellipse fills the entire rectangle defined by start and current points
   */
  const calculateCircle = useCallback((start: Point, current: Point): CircleDimensions => {
    // Calculate bounding box
    const rawWidth = current.x - start.x;
    const rawHeight = current.y - start.y;
    
    // Determine top-left corner (handle negative dimensions)
    const boxX = rawWidth >= 0 ? start.x : current.x;
    const boxY = rawHeight >= 0 ? start.y : current.y;
    
    // Absolute dimensions of bounding box
    const boxWidth = Math.abs(rawWidth);
    const boxHeight = Math.abs(rawHeight);
    
    // Ellipse fills entire bounding box
    const radiusX = boxWidth / 2;
    const radiusY = boxHeight / 2;
    
    // Center of the ellipse
    const centerX = boxX + radiusX;
    const centerY = boxY + radiusY;
    
    // For data model, use average radius (will be scaled via scaleX/scaleY later if needed)
    const radius = Math.min(radiusX, radiusY);
    
    return {
      x: centerX,
      y: centerY,
      radius,
      width: boxWidth,
      height: boxHeight,
      radiusX,
      radiusY,
    };
  }, []);

  /**
   * Get preview circle for rendering
   */
  const previewCircle = (() => {
    if (!isDrawing || !startPoint || !currentPoint) {
      return null;
    }
    return calculateCircle(startPoint, currentPoint);
  })();

  /**
   * Start drawing circle on mouse down
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

    console.log('[CircleDraw] Start drawing at:', { canvasX, canvasY });
    
    setIsDrawing(true);
    setStartPoint({ x: canvasX, y: canvasY });
    setCurrentPoint({ x: canvasX, y: canvasY });
  }, []);

  /**
   * Update preview circle as mouse moves
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
   * Returns null if radius is below minimum size
   */
  const finishDrawing = useCallback((e: KonvaEventObject<MouseEvent>): CircleDimensions | null => {
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
    const circle = calculateCircle(startPoint, endPoint);

    console.log('[CircleDraw] Finish drawing:', circle);

    // Reset drawing state
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);

    // Check minimum size (both radii must meet minimum)
    if (circle.radiusX < MIN_SIZE || circle.radiusY < MIN_SIZE) {
      console.log('[CircleDraw] Circle too small, discarding');
      return null;
    }

    return circle;
  }, [isDrawing, startPoint, calculateCircle]);

  /**
   * Cancel drawing (e.g., on escape key)
   */
  const cancelDrawing = useCallback(() => {
    console.log('[CircleDraw] Drawing cancelled');
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  }, []);

  return {
    isDrawing,
    previewCircle,
    startDrawing,
    updateDrawing,
    finishDrawing,
    cancelDrawing,
  };
}

