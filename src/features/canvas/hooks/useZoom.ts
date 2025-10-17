/**
 * useZoom Hook
 * 
 * Handles zoom functionality with Cmd/Ctrl + Scroll.
 * Implements cursor-centered zoom with scale constraints.
 * 
 * Zoom Constraints (from PRD):
 * - Max Zoom In: Viewport displays 100px across smaller dimension
 * - Max Zoom Out: Viewport displays 10,000px across larger dimension
 */

import { useCallback } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import { constrainViewport } from '../utils/coordinateTransform';

interface UseZoomProps {
  viewportWidth: number;
  viewportHeight: number;
  currentX: number;
  currentY: number;
  currentScale: number;
  onZoom: (x: number, y: number, scale: number) => void;
}

interface UseZoomReturn {
  handleWheel: (e: KonvaEventObject<WheelEvent>) => void;
}

// Zoom settings
const ZOOM_SPEED = 0.001; // Zoom sensitivity

/**
 * Calculate zoom scale constraints based on viewport size
 * 
 * Per PRD:
 * - Max zoom out: Show full 10,000px canvas across LARGER viewport dimension
 * - Max zoom in: Show only 100px across SMALLER viewport dimension
 * 
 * @param viewportWidth - Current viewport width in pixels
 * @param viewportHeight - Current viewport height in pixels
 * @returns Min and max scale values
 */
function calculateZoomConstraints(
  viewportWidth: number,
  viewportHeight: number
): { minScale: number; maxScale: number } {
  const CANVAS_SIZE = 10000;
  const MIN_VISIBLE_SIZE = 100;

  // Max zoom out: Show entire 10,000px canvas across LARGER viewport dimension
  // Use Math.max to ensure the canvas fits within the larger dimension
  const minScale = Math.max(
    viewportWidth / CANVAS_SIZE,
    viewportHeight / CANVAS_SIZE
  );

  // Max zoom in: Show only 100px across SMALLER viewport dimension
  // Use Math.min to constrain by the smaller dimension
  const maxScale = Math.min(
    viewportWidth / MIN_VISIBLE_SIZE,
    viewportHeight / MIN_VISIBLE_SIZE
  );

  return { minScale, maxScale };
}

/**
 * Custom hook for zoom gesture handling
 */
export function useZoom({
  viewportWidth,
  viewportHeight,
  currentX,
  currentY,
  currentScale,
  onZoom,
}: UseZoomProps): UseZoomReturn {
  const handleWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      // Only handle zoom if Cmd/Ctrl is pressed
      if (!e.evt.ctrlKey && !e.evt.metaKey) {
        return;
      }

      // Prevent default zoom behavior
      e.evt.preventDefault();

      const stage = e.target.getStage();
      if (!stage) return;

      // Get pointer position (cursor position in screen coordinates)
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Calculate zoom delta from wheel event
      // Negative deltaY = scroll up = zoom in
      // Positive deltaY = scroll down = zoom out
      const delta = -e.evt.deltaY * ZOOM_SPEED;
      
      // Calculate new scale
      let newScale = currentScale * (1 + delta);

      // Apply zoom constraints
      const { minScale, maxScale } = calculateZoomConstraints(
        viewportWidth,
        viewportHeight
      );
      newScale = Math.max(minScale, Math.min(maxScale, newScale));

      // If scale didn't change (hit constraint), do nothing
      if (newScale === currentScale) return;

      // Calculate cursor position in canvas coordinates (before zoom)
      const pointerCanvasX = (pointer.x - currentX) / currentScale;
      const pointerCanvasY = (pointer.y - currentY) / currentScale;

      // Calculate new stage position to keep cursor point fixed
      // The cursor point in canvas coords should map to the same screen position
      const newX = pointer.x - pointerCanvasX * newScale;
      const newY = pointer.y - pointerCanvasY * newScale;

      // Constrain viewport to canvas boundaries
      const constrained = constrainViewport(
        newX,
        newY,
        viewportWidth,
        viewportHeight,
        newScale
      );

      // Update viewport with new zoom and position
      onZoom(constrained.x, constrained.y, newScale);
    },
    [viewportWidth, viewportHeight, currentX, currentY, currentScale, onZoom]
  );

  return {
    handleWheel,
  };
}

