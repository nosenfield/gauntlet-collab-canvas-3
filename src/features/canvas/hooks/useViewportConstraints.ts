/**
 * useViewportConstraints Hook
 * 
 * Ensures viewport stays within valid constraints when window is resized.
 * Adjusts zoom and pan to prevent showing canvas beyond boundaries.
 */

import { useEffect } from 'react';
import { constrainViewport } from '../utils/coordinateTransform';
import { calculateZoomConstraints } from '../utils/zoomConstraints';

interface UseViewportConstraintsProps {
  viewportWidth: number;
  viewportHeight: number;
  currentX: number;
  currentY: number;
  currentScale: number;
  onUpdate: (x: number, y: number, scale: number) => void;
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

