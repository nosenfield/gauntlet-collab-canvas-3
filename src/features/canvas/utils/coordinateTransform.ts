/**
 * Coordinate Transformation Utilities
 * 
 * Functions to convert between screen and canvas coordinates,
 * and to constrain viewport to canvas boundaries.
 */

import { CANVAS_CONSTANTS } from '@/types/canvas';

const CANVAS_WIDTH = CANVAS_CONSTANTS.width;
const CANVAS_HEIGHT = CANVAS_CONSTANTS.height;

/**
 * Convert screen coordinates to canvas coordinates
 * 
 * @param screenX - X coordinate in screen space
 * @param screenY - Y coordinate in screen space
 * @param stageX - Stage X position
 * @param stageY - Stage Y position
 * @param scale - Current zoom scale
 * @returns Canvas coordinates
 */
export function screenToCanvas(
  screenX: number,
  screenY: number,
  stageX: number,
  stageY: number,
  scale: number
): { x: number; y: number } {
  return {
    x: (screenX - stageX) / scale,
    y: (screenY - stageY) / scale,
  };
}

/**
 * Convert canvas coordinates to screen coordinates
 * 
 * @param canvasX - X coordinate in canvas space
 * @param canvasY - Y coordinate in canvas space
 * @param stageX - Stage X position
 * @param stageY - Stage Y position
 * @param scale - Current zoom scale
 * @returns Screen coordinates
 */
export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  stageX: number,
  stageY: number,
  scale: number
): { x: number; y: number } {
  return {
    x: canvasX * scale + stageX,
    y: canvasY * scale + stageY,
  };
}

/**
 * Constrain viewport position to canvas boundaries
 * Prevents panning beyond the 10,000 x 10,000 canvas edges
 * 
 * @param x - Desired stage X position
 * @param y - Desired stage Y position
 * @param viewportWidth - Viewport width in pixels
 * @param viewportHeight - Viewport height in pixels
 * @param scale - Current zoom scale
 * @returns Constrained position
 */
export function constrainViewport(
  x: number,
  y: number,
  viewportWidth: number,
  viewportHeight: number,
  scale: number
): { x: number; y: number } {
  // Calculate visible canvas area
  const visibleCanvasWidth = viewportWidth / scale;
  const visibleCanvasHeight = viewportHeight / scale;

  // Constrain X (prevent panning past left or right edge)
  let constrainedX = x;
  const minX = -(CANVAS_WIDTH - visibleCanvasWidth) * scale;
  const maxX = 0;
  constrainedX = Math.max(minX, Math.min(maxX, constrainedX));

  // Constrain Y (prevent panning past top or bottom edge)
  let constrainedY = y;
  const minY = -(CANVAS_HEIGHT - visibleCanvasHeight) * scale;
  const maxY = 0;
  constrainedY = Math.max(minY, Math.min(maxY, constrainedY));

  return {
    x: constrainedX,
    y: constrainedY,
  };
}

