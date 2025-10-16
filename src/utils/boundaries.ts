/**
 * Boundary utilities for canvas constraints and shape validation
 */

/**
 * Canvas boundary configuration
 */
export const CANVAS_BOUNDS = {
  width: 10000,
  height: 10000,
  centerX: 0,
  centerY: 0,
  minX: -5000,
  maxX: 5000,
  minY: -5000,
  maxY: 5000
} as const;

/**
 * Clamp a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Clamp coordinates to canvas boundaries
 */
export const clampToCanvasBounds = (x: number, y: number): { x: number; y: number } => {
  return {
    x: clamp(x, CANVAS_BOUNDS.minX, CANVAS_BOUNDS.maxX),
    y: clamp(y, CANVAS_BOUNDS.minY, CANVAS_BOUNDS.maxY)
  };
};

/**
 * Check if coordinates are within canvas bounds
 */
export const isWithinCanvasBounds = (x: number, y: number): boolean => {
  return x >= CANVAS_BOUNDS.minX && 
         x <= CANVAS_BOUNDS.maxX && 
         y >= CANVAS_BOUNDS.minY && 
         y <= CANVAS_BOUNDS.maxY;
};

/**
 * Clamp a rectangle to canvas boundaries
 */
export const clampRectangleToBounds = (
  x: number, 
  y: number, 
  width: number, 
  height: number
): { x: number; y: number; width: number; height: number } => {
  // Ensure minimum size
  const minSize = 10;
  const clampedWidth = Math.max(minSize, width);
  const clampedHeight = Math.max(minSize, height);

  // Calculate bounds
  const halfWidth = clampedWidth / 2;
  const halfHeight = clampedHeight / 2;

  // Clamp position to keep rectangle within bounds
  const clampedX = clamp(x, CANVAS_BOUNDS.minX + halfWidth, CANVAS_BOUNDS.maxX - halfWidth);
  const clampedY = clamp(y, CANVAS_BOUNDS.minY + halfHeight, CANVAS_BOUNDS.maxY - halfHeight);

  return {
    x: clampedX,
    y: clampedY,
    width: clampedWidth,
    height: clampedHeight
  };
};

/**
 * Check if a rectangle is completely within canvas bounds
 */
export const isRectangleWithinBounds = (
  x: number, 
  y: number, 
  width: number, 
  height: number
): boolean => {
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  return (x - halfWidth >= CANVAS_BOUNDS.minX) &&
         (x + halfWidth <= CANVAS_BOUNDS.maxX) &&
         (y - halfHeight >= CANVAS_BOUNDS.minY) &&
         (y + halfHeight <= CANVAS_BOUNDS.maxY);
};

/**
 * Calculate viewport boundaries for a given scale and position
 */
export const calculateViewportBounds = (
  scale: number, 
  x: number, 
  y: number,
  screenWidth: number = window.innerWidth,
  screenHeight: number = window.innerHeight
): { minX: number; maxX: number; minY: number; maxY: number } => {
  const viewportWidth = screenWidth / scale;
  const viewportHeight = screenHeight / scale;
  const halfViewportWidth = viewportWidth / 2;
  const halfViewportHeight = viewportHeight / 2;

  return {
    minX: x - halfViewportWidth,
    maxX: x + halfViewportWidth,
    minY: y - halfViewportHeight,
    maxY: y + halfViewportHeight
  };
};

/**
 * Clamp viewport position to keep canvas visible
 */
export const clampViewportToCanvas = (
  scale: number, 
  x: number, 
  y: number,
  screenWidth: number = window.innerWidth,
  screenHeight: number = window.innerHeight
): { x: number; y: number } => {
  const viewportBounds = calculateViewportBounds(scale, x, y, screenWidth, screenHeight);
  
  let clampedX = x;
  let clampedY = y;

  // Clamp X position
  if (viewportBounds.minX < CANVAS_BOUNDS.minX) {
    clampedX = CANVAS_BOUNDS.minX + (screenWidth / scale) / 2;
  } else if (viewportBounds.maxX > CANVAS_BOUNDS.maxX) {
    clampedX = CANVAS_BOUNDS.maxX - (screenWidth / scale) / 2;
  }

  // Clamp Y position
  if (viewportBounds.minY < CANVAS_BOUNDS.minY) {
    clampedY = CANVAS_BOUNDS.minY + (screenHeight / scale) / 2;
  } else if (viewportBounds.maxY > CANVAS_BOUNDS.maxY) {
    clampedY = CANVAS_BOUNDS.maxY - (screenHeight / scale) / 2;
  }

  return { x: clampedX, y: clampedY };
};

/**
 * Calculate distance between two points
 */
export const calculateDistance = (
  x1: number, 
  y1: number, 
  x2: number, 
  y2: number
): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Check if a point is inside a rectangle
 */
export const isPointInRectangle = (
  pointX: number, 
  pointY: number,
  rectX: number, 
  rectY: number, 
  rectWidth: number, 
  rectHeight: number
): boolean => {
  const halfWidth = rectWidth / 2;
  const halfHeight = rectHeight / 2;

  return pointX >= rectX - halfWidth &&
         pointX <= rectX + halfWidth &&
         pointY >= rectY - halfHeight &&
         pointY <= rectY + halfHeight;
};
