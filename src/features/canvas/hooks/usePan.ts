/**
 * usePan Hook
 * 
 * Handles scroll/wheel events for panning the canvas.
 * Regular scroll (no modifiers) pans the canvas.
 * Cmd/Ctrl + scroll will be used for zoom (STAGE1-4).
 * Constrains panning to canvas boundaries.
 */

import { useCallback } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import { constrainViewport } from '../utils/coordinateTransform';

interface UsePanProps {
  viewportWidth: number;
  viewportHeight: number;
  scale: number;
  currentX: number;
  currentY: number;
  onPan: (x: number, y: number) => void;
}

interface UsePanReturn {
  handleWheel: (e: KonvaEventObject<WheelEvent>) => void;
}

/**
 * Custom hook for pan gesture handling via scroll/wheel
 */
export function usePan({
  viewportWidth,
  viewportHeight,
  scale,
  currentX,
  currentY,
  onPan,
}: UsePanProps): UsePanReturn {
  const handleWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      // Prevent default scroll behavior
      e.evt.preventDefault();

      // Skip if Cmd/Ctrl is pressed (reserved for zoom in STAGE1-4)
      if (e.evt.ctrlKey || e.evt.metaKey) {
        return;
      }

      // Get scroll deltas
      // deltaX: horizontal scroll, deltaY: vertical scroll
      const dx = e.evt.deltaX;
      const dy = e.evt.deltaY;

      // Calculate new stage position
      // Invert deltas to make scroll feel natural (scroll down = pan down)
      const newX = currentX - dx;
      const newY = currentY - dy;

      // Constrain to canvas boundaries
      const constrained = constrainViewport(
        newX,
        newY,
        viewportWidth,
        viewportHeight,
        scale
      );

      // Update viewport
      onPan(constrained.x, constrained.y);
    },
    [viewportWidth, viewportHeight, scale, currentX, currentY, onPan]
  );

  return {
    handleWheel,
  };
}

