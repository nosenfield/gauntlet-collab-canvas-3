/**
 * useLineDraw Hook
 * 
 * Manages the interactive drawing of lines via click-and-drag.
 * Creates two-point lines with start and end coordinates.
 * 
 * Features:
 * - Two-point line (start to end)
 * - Points stored relative to line position [0, 0, x2, y2]
 * - Enforces minimum length (10px)
 * - Provides preview dimensions for rendering
 */

import { useState, useCallback } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import { SHAPE_CONSTANTS } from '../types';

interface Point {
  x: number;
  y: number;
}

interface LineDimensions {
  x: number;        // Position (start point X)
  y: number;        // Position (start point Y)
  points: number[]; // [0, 0, x2, y2] - relative to (x, y)
}

interface UseLineDrawReturn {
  isDrawing: boolean;
  previewLine: LineDimensions | null;
  startDrawing: (e: KonvaEventObject<MouseEvent>) => void;
  updateDrawing: (e: KonvaEventObject<MouseEvent>) => void;
  finishDrawing: (e: KonvaEventObject<MouseEvent>) => LineDimensions | null;
  cancelDrawing: () => void;
}

const MIN_LENGTH = SHAPE_CONSTANTS.MIN_LINE_LENGTH;

/**
 * Calculate line length from points array
 */
function calculateLineLength(points: number[]): number {
  if (points.length < 4) return 0;
  const dx = points[2] - points[0];
  const dy = points[3] - points[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * useLineDraw
 * 
 * Hook for managing interactive line drawing with click-and-drag.
 * Creates two-point lines from start to end.
 * 
 * @returns Drawing state and event handlers
 * 
 * @example
 * ```tsx
 * function Canvas() {
 *   const { isDrawing, previewLine, startDrawing, updateDrawing, finishDrawing } = useLineDraw();
 *   
 *   return (
 *     <>
 *       <Stage 
 *         onMouseDown={startDrawing}
 *         onMouseMove={updateDrawing}
 *         onMouseUp={finishDrawing}
 *       >
 *         {isDrawing && previewLine && <PreviewLine {...previewLine} />}
 *       </Stage>
 *     </>
 *   );
 * }
 * ```
 */
export function useLineDraw(): UseLineDrawReturn {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);

  /**
   * Calculate line dimensions from start and current points
   * Points are stored relative to line position (start point becomes 0,0)
   */
  const calculateLine = useCallback((start: Point, current: Point): LineDimensions => {
    // Line position is the start point
    const x = start.x;
    const y = start.y;
    
    // Points relative to position
    // Start point is (0, 0) in local coordinates
    // End point is relative to start
    const points = [
      0,
      0,
      current.x - start.x,
      current.y - start.y,
    ];
    
    return { x, y, points };
  }, []);

  /**
   * Get preview line for rendering
   */
  const previewLine = (() => {
    if (!isDrawing || !startPoint || !currentPoint) {
      return null;
    }
    return calculateLine(startPoint, currentPoint);
  })();

  /**
   * Start drawing line on mouse down
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

    console.log('[LineDraw] Start drawing at:', { canvasX, canvasY });
    
    setIsDrawing(true);
    setStartPoint({ x: canvasX, y: canvasY });
    setCurrentPoint({ x: canvasX, y: canvasY });
  }, []);

  /**
   * Update preview line as mouse moves
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
   * Returns null if line length is below minimum
   */
  const finishDrawing = useCallback((e: KonvaEventObject<MouseEvent>): LineDimensions | null => {
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
    const line = calculateLine(startPoint, endPoint);

    console.log('[LineDraw] Finish drawing:', line);

    // Reset drawing state
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);

    // Check minimum length
    const length = calculateLineLength(line.points);
    if (length < MIN_LENGTH) {
      console.log('[LineDraw] Line too short, discarding');
      return null;
    }

    return line;
  }, [isDrawing, startPoint, calculateLine]);

  /**
   * Cancel drawing (e.g., on escape key)
   */
  const cancelDrawing = useCallback(() => {
    console.log('[LineDraw] Drawing cancelled');
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  }, []);

  return {
    isDrawing,
    previewLine,
    startDrawing,
    updateDrawing,
    finishDrawing,
    cancelDrawing,
  };
}

