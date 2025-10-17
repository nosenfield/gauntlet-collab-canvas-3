/**
 * Grid Utility Functions
 * 
 * Helper functions for calculating grid lines and viewport culling.
 */

/**
 * Canvas Bounds
 */
interface CanvasBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Calculate visible grid lines within viewport bounds
 * 
 * @param bounds - Visible canvas bounds (minX, minY, maxX, maxY)
 * @param spacing - Grid line spacing in pixels
 * @returns Array of positions where grid lines should be drawn
 */
export function calculateVisibleGridLines(
  bounds: CanvasBounds,
  spacing: number
): { vertical: number[]; horizontal: number[] } {
  const vertical: number[] = [];
  const horizontal: number[] = [];

  // Calculate vertical lines (parallel to Y axis)
  const startX = Math.floor(bounds.minX / spacing) * spacing;
  for (let x = startX; x <= bounds.maxX; x += spacing) {
    vertical.push(x);
  }

  // Calculate horizontal lines (parallel to X axis)
  const startY = Math.floor(bounds.minY / spacing) * spacing;
  for (let y = startY; y <= bounds.maxY; y += spacing) {
    horizontal.push(y);
  }

  return { vertical, horizontal };
}

/**
 * Determine if a grid line is a secondary (accent) line
 * 
 * @param position - Grid line position
 * @param spacing - Primary grid spacing
 * @param accentEvery - Draw accent line every Nth line
 * @returns True if this is an accent line
 */
export function isAccentLine(
  position: number,
  spacing: number,
  accentEvery: number
): boolean {
  // Check if position is a multiple of (spacing * accentEvery)
  const accentSpacing = spacing * accentEvery;
  return Math.abs(position % accentSpacing) < 0.01; // Use small epsilon for floating point comparison
}

/**
 * Get visible canvas bounds from viewport state
 * 
 * @param viewportX - Viewport X position
 * @param viewportY - Viewport Y position
 * @param viewportWidth - Viewport width in pixels
 * @param viewportHeight - Viewport height in pixels
 * @param scale - Current zoom scale
 * @returns Canvas bounds visible in viewport
 */
export function getVisibleCanvasBounds(
  viewportX: number,
  viewportY: number,
  viewportWidth: number,
  viewportHeight: number,
  scale: number
): CanvasBounds {
  // Convert screen coordinates to canvas coordinates
  // Account for negative viewport position (panned right/down)
  const minX = -viewportX / scale;
  const minY = -viewportY / scale;
  const maxX = minX + viewportWidth / scale;
  const maxY = minY + viewportHeight / scale;

  return {
    minX: Math.max(0, minX), // Clamp to canvas bounds
    minY: Math.max(0, minY),
    maxX: Math.min(10000, maxX),
    maxY: Math.min(10000, maxY),
  };
}

