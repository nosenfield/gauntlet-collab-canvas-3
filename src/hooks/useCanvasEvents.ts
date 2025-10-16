/**
 * useCanvasEvents Hook
 * 
 * Manages canvas event handling for mouse interactions.
 * Handles cursor tracking, drawing, and navigation events.
 */

import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePresence } from '@/hooks/usePresence';
import { useShapes } from '@/hooks/useShapes';
import { useDrawing } from '@/hooks/useDrawing';
import type { CanvasHook } from '@/types';

interface CanvasEventHandlers {
  handleCanvasMouseDown: (event: any) => void;
  handleCanvasMouseMove: (event: any) => void;
  handleCanvasMouseUp: () => void;
  handleCursorMove: (event: any) => void;
}

/**
 * Custom hook for canvas event handling
 */
export const useCanvasEvents = (
  canvasHook: CanvasHook,
  drawingHook: ReturnType<typeof useDrawing>
): CanvasEventHandlers => {
  const { currentUser } = useAuth();
  const { updateCursor: updatePresenceCursor } = usePresence();
  const { addShape } = useShapes();
  const { tool, screenToCanvas, handleMouseDown, handleMouseMove, handleMouseUp } = canvasHook;
  const { isDrawing, drawStart, drawCurrent, startDrawing, updateDrawing, finishDrawing } = drawingHook;

  /**
   * Handle cursor position updates
   */
  const handleCursorMove = useCallback((event: any) => {
    if (!currentUser || !currentUser.id) return;

    const canvasPos = screenToCanvas(event.evt.clientX, event.evt.clientY);
    updatePresenceCursor(currentUser.id, canvasPos);
  }, [currentUser, updatePresenceCursor, screenToCanvas]);

  /**
   * Handle mouse down for drawing
   */
  const handleCanvasMouseDown = useCallback((event: any) => {
    if (!currentUser || !currentUser.id) return;

    const canvasPos = screenToCanvas(event.evt.clientX, event.evt.clientY);
    updatePresenceCursor(currentUser.id, canvasPos);
    
    if (tool.activeTool === 'rectangle') {
      startDrawing(canvasPos, tool);
    } else {
      // Call original handler for panning
      handleMouseDown(event);
    }
  }, [currentUser, tool, screenToCanvas, updatePresenceCursor, startDrawing, handleMouseDown]);

  /**
   * Handle mouse move during drawing
   */
  const handleCanvasMouseMove = useCallback((event: any) => {
    if (!currentUser || !currentUser.id) return;

    const canvasPos = screenToCanvas(event.evt.clientX, event.evt.clientY);
    updatePresenceCursor(currentUser.id, canvasPos);

    if (isDrawing && tool.activeTool === 'rectangle') {
      updateDrawing(canvasPos);
    } else {
      // Call original handler for other interactions
      handleMouseMove(event);
    }
  }, [currentUser, isDrawing, tool, screenToCanvas, updatePresenceCursor, updateDrawing, handleMouseMove]);

  /**
   * Handle mouse up to complete drawing
   */
  const handleCanvasMouseUp = useCallback(() => {
    if (!currentUser) return;

    if (isDrawing && tool.activeTool === 'rectangle' && drawStart && drawCurrent) {
      // Calculate rectangle dimensions
      const x = Math.min(drawStart.x, drawCurrent.x);
      const y = Math.min(drawStart.y, drawCurrent.y);
      const width = Math.abs(drawCurrent.x - drawStart.x);
      const height = Math.abs(drawCurrent.y - drawStart.y);

      // Only create rectangle if it has meaningful dimensions
      if (width > 5 && height > 5) {
        addShape({
          type: 'rectangle',
          x,
          y,
          width,
          height,
          fill: currentUser.color,
          createdBy: currentUser.id
        });
      }

      // Reset drawing state
      finishDrawing();
    } else {
      // Call original handler for other interactions
      handleMouseUp();
    }
  }, [currentUser, isDrawing, tool, drawStart, drawCurrent, addShape, finishDrawing, handleMouseUp]);

  return {
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    handleCursorMove
  };
};
