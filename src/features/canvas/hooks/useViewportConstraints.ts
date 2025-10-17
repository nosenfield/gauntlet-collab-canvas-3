/**
 * useViewportConstraints Hook
 * 
 * Ensures viewport stays within valid constraints when window is resized.
 * Adjusts zoom and pan to prevent showing canvas beyond boundaries.
 */

import { useEffect } from 'react';
import { constrainViewport } from '../utils/coordinateTransform';

interface UseViewportConstraintsProps {
  viewportWidth: number;
  viewportHeight: number;
  currentX: number;
  currentY: number;
  currentScale: number;
  onUpdate: (x: number, y: number, scale: number) => void;
}

/**
 * Calculate zoom scale constraints based on viewport size
 * (Same logic as in useZoom.ts)
 */
function calculateZoomConstraints(
  viewportWidth: number,
  viewportHeight: number
): { minScale: number; maxScale: number } {
  const CANVAS_SIZE = 10000;
  const MIN_VISIBLE_SIZE = 100;

  // Max zoom out: Show entire 10,000px canvas across LARGER viewport dimension
  const minScale = Math.max(
    viewportWidth / CANVAS_SIZE,
    viewportHeight / CANVAS_SIZE
  );

  // Max zoom in: Show only 100px across SMALLER viewport dimension
  const maxScale = Math.min(
    viewportWidth / MIN_VISIBLE_SIZE,
    viewportHeight / MIN_VISIBLE_SIZE
  );

  return { minScale, maxScale };
}

/**
 * Custom hook to maintain viewport constraints on window resize
 */
export function useViewportConstraints({
  viewportWidth,
  viewportHeight,
  currentX,
  currentY,
  currentScale,
  onUpdate,
}: UseViewportConstraintsProps): void {
  useEffect(() => {
    // Calculate current zoom constraints based on new window size
    const { minScale, maxScale } = calculateZoomConstraints(
      viewportWidth,
      viewportHeight
    );

    // Check if current scale is out of bounds
    let newScale = currentScale;
    let needsUpdate = false;

    if (currentScale < minScale) {
      // Zoomed out too far - adjust to minScale
      newScale = minScale;
      needsUpdate = true;
    } else if (currentScale > maxScale) {
      // Zoomed in too far - adjust to maxScale
      newScale = maxScale;
      needsUpdate = true;
    }

    // Always check if position needs constraining (even if scale didn't change)
    const constrained = constrainViewport(
      currentX,
      currentY,
      viewportWidth,
      viewportHeight,
      newScale
    );

    // Update viewport if scale changed or position was constrained
    if (needsUpdate || constrained.x !== currentX || constrained.y !== currentY) {
      onUpdate(constrained.x, constrained.y, newScale);
    }
  }, [viewportWidth, viewportHeight, currentX, currentY, currentScale, onUpdate]);
}

