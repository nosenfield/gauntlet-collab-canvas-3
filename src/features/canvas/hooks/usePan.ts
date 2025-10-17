/**
 * usePan Hook
 * 
 * Handles mouse drag events for panning the canvas.
 * Constrains panning to canvas boundaries.
 */

import { useCallback, useRef } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import { constrainViewport } from '../utils/coordinateTransform';

interface UsePanProps {
  viewportWidth: number;
  viewportHeight: number;
  scale: number;
  onPan: (x: number, y: number) => void;
}

interface UsePanReturn {
  handleMouseDown: (e: KonvaEventObject<MouseEvent>) => void;
  handleMouseMove: (e: KonvaEventObject<MouseEvent>) => void;
  handleMouseUp: () => void;
}

/**
 * Custom hook for pan gesture handling
 */
export function usePan({
  viewportWidth,
  viewportHeight,
  scale,
  onPan,
}: UsePanProps): UsePanReturn {
  const isDragging = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    // Only pan with left mouse button
    if (e.evt.button !== 0) return;

    // Get the stage to check if we're clicking on the background
    const stage = e.target.getStage();
    if (!stage) return;

    // Only start panning if clicking on the stage (not on a shape)
    if (e.target === stage) {
      isDragging.current = true;
      const pos = stage.getPointerPosition();
      if (pos) {
        lastPosition.current = { x: pos.x, y: pos.y };
      }
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (!isDragging.current) return;

      const stage = e.target.getStage();
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      // Calculate delta movement
      const dx = pos.x - lastPosition.current.x;
      const dy = pos.y - lastPosition.current.y;

      // Update last position
      lastPosition.current = { x: pos.x, y: pos.y };

      // Calculate new stage position
      const newX = stage.x() + dx;
      const newY = stage.y() + dy;

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
    [viewportWidth, viewportHeight, scale, onPan]
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}

