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
import { calculateZoomConstraints } from '../utils/zoomConstraints';

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

