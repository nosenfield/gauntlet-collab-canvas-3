/**
 * useDrawing Hook
 * 
 * Manages drawing state and interactions for canvas shapes.
 * Handles drawing tools, preview rendering, and shape creation.
 */

import { useState, useCallback } from 'react';
import type { DrawingTool, Point } from '@/types';

interface DrawingState {
  isDrawing: boolean;
  drawStart: Point | null;
  drawCurrent: Point | null;
}

interface DrawingActions {
  startDrawing: (position: Point, tool: DrawingTool) => void;
  updateDrawing: (position: Point) => void;
  finishDrawing: () => void;
  cancelDrawing: () => void;
}

/**
 * Custom hook for drawing management
 */
export const useDrawing = (): DrawingState & DrawingActions => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<Point | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<Point | null>(null);

  /**
   * Start drawing operation
   */
  const startDrawing = useCallback((position: Point, tool: DrawingTool) => {
    if (tool.activeTool === 'rectangle') {
      setIsDrawing(true);
      setDrawStart(position);
      setDrawCurrent(position);
    }
  }, []);

  /**
   * Update drawing position during drag
   */
  const updateDrawing = useCallback((position: Point) => {
    if (isDrawing) {
      setDrawCurrent(position);
    }
  }, [isDrawing]);

  /**
   * Finish drawing operation
   */
  const finishDrawing = useCallback(() => {
    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  }, []);

  /**
   * Cancel drawing operation
   */
  const cancelDrawing = useCallback(() => {
    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  }, []);

  return {
    // State
    isDrawing,
    drawStart,
    drawCurrent,
    
    // Actions
    startDrawing,
    updateDrawing,
    finishDrawing,
    cancelDrawing
  };
};
