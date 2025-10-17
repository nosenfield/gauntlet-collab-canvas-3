/**
 * Zoom Constraints Utilities
 * 
 * Calculates zoom scale constraints based on viewport size.
 * Per PRD requirements:
 * - Max zoom out: Show full 10,000px canvas across larger viewport dimension
 * - Max zoom in: Show only 100px across smaller viewport dimension
 */

import type { ZoomConstraints } from '@/types/canvas';

const CANVAS_SIZE = 10000;
const MIN_VISIBLE_SIZE = 100;

/**
 * Calculate zoom scale constraints based on viewport size
 * 
 * @param viewportWidth - Current viewport width in pixels
 * @param viewportHeight - Current viewport height in pixels
 * @returns Min and max scale values
 */
export function calculateZoomConstraints(
  viewportWidth: number,
  viewportHeight: number
): ZoomConstraints {
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

