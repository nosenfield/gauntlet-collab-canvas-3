/**
 * Default Shape Properties
 * 
 * Default values for new shapes created on the canvas.
 * Ensures consistent styling across all shapes.
 */

/**
 * Default properties for rectangles
 */
export const DEFAULT_RECTANGLE_PROPS = {
  fillColor: '#FFFFFF',
  strokeColor: '#000000',
  strokeWidth: 2,
  opacity: 1,
  borderRadius: 0,
  rotation: 0,
} as const;

/**
 * Default properties for circles
 */
export const DEFAULT_CIRCLE_PROPS = {
  fillColor: '#FFFFFF',
  strokeColor: '#000000',
  strokeWidth: 2,
  opacity: 1,
  rotation: 0,
} as const;

/**
 * Default properties for lines
 */
export const DEFAULT_LINE_PROPS = {
  fillColor: '', // Lines don't have fill
  strokeColor: '#000000',
  strokeWidth: 2,
  opacity: 1,
  rotation: 0,
} as const;

/**
 * Minimum shape dimensions (in pixels)
 */
export const MIN_SHAPE_SIZE = 10;

/**
 * Default shape dimensions for quick creation
 */
export const DEFAULT_SHAPE_SIZE = {
  width: 100,
  height: 100,
  radius: 50,
} as const;

