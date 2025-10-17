/**
 * Transform Service
 * 
 * Service for transforming collections of display objects
 * Handles translation, rotation, and scaling operations
 */

import type { ShapeDisplayObject } from '@/features/displayObjects/shapes/types';

/**
 * Canvas boundaries configuration
 */
const CANVAS_CONFIG = {
  MIN_X: 0,
  MIN_Y: 0,
  MAX_X: 10000,
  MAX_Y: 10000,
} as const;

/**
 * Translate a collection of objects by a delta
 * 
 * @param objects - Array of objects to translate
 * @param deltaX - Horizontal translation
 * @param deltaY - Vertical translation
 * @returns Array of translated objects with updated positions
 */
export function translateCollection(
  objects: ShapeDisplayObject[],
  deltaX: number,
  deltaY: number
): ShapeDisplayObject[] {
  return objects.map(obj => ({
    ...obj,
    x: obj.x + deltaX,
    y: obj.y + deltaY,
  }));
}

/**
 * Get the dimensions of a shape (accounting for scale)
 */
function getShapeDimensions(shape: ShapeDisplayObject): { width: number; height: number } {
  if (shape.type === 'rectangle') {
    return {
      width: shape.width * shape.scaleX,
      height: shape.height * shape.scaleY,
    };
  } else if (shape.type === 'circle') {
    const diameter = shape.radius * 2 * Math.max(shape.scaleX, shape.scaleY);
    return {
      width: diameter,
      height: diameter,
    };
  } else if (shape.type === 'line') {
    return { width: 10, height: 10 }; // Fallback
  }
  return { width: 10, height: 10 };
}

/**
 * Calculate the bounding box of a collection
 * Returns the min/max coordinates considering shape positions and dimensions
 */
function getCollectionBounds(objects: ShapeDisplayObject[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  if (objects.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }
  
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  
  for (const obj of objects) {
    const dims = getShapeDimensions(obj);
    
    // Shape position is top-left corner
    const left = obj.x;
    const right = obj.x + dims.width;
    const top = obj.y;
    const bottom = obj.y + dims.height;
    
    minX = Math.min(minX, left);
    maxX = Math.max(maxX, right);
    minY = Math.min(minY, top);
    maxY = Math.max(maxY, bottom);
  }
  
  return { minX, maxX, minY, maxY };
}

/**
 * Constrain a collection of objects to canvas boundaries
 * 
 * Calculates the collection's bounding box and adjusts all objects
 * if the collection extends beyond canvas boundaries
 * 
 * @param objects - Array of objects to constrain
 * @returns Array of objects with positions adjusted to fit canvas
 */
export function constrainToCanvas(
  objects: ShapeDisplayObject[]
): ShapeDisplayObject[] {
  if (objects.length === 0) {
    return objects;
  }
  
  // Get collection bounds
  const bounds = getCollectionBounds(objects);
  
  // Calculate how much we need to adjust
  let adjustX = 0;
  let adjustY = 0;
  
  // Check left boundary
  if (bounds.minX < CANVAS_CONFIG.MIN_X) {
    adjustX = CANVAS_CONFIG.MIN_X - bounds.minX;
  }
  // Check right boundary
  else if (bounds.maxX > CANVAS_CONFIG.MAX_X) {
    adjustX = CANVAS_CONFIG.MAX_X - bounds.maxX;
  }
  
  // Check top boundary
  if (bounds.minY < CANVAS_CONFIG.MIN_Y) {
    adjustY = CANVAS_CONFIG.MIN_Y - bounds.minY;
  }
  // Check bottom boundary
  else if (bounds.maxY > CANVAS_CONFIG.MAX_Y) {
    adjustY = CANVAS_CONFIG.MAX_Y - bounds.maxY;
  }
  
  // If no adjustment needed, return original objects
  if (adjustX === 0 && adjustY === 0) {
    return objects;
  }
  
  // Apply adjustment to all objects
  return objects.map(obj => ({
    ...obj,
    x: obj.x + adjustX,
    y: obj.y + adjustY,
  }));
}

/**
 * Translate and constrain a collection in one operation
 * 
 * @param objects - Array of objects to transform
 * @param deltaX - Horizontal translation
 * @param deltaY - Vertical translation
 * @returns Array of transformed and constrained objects
 */
export function translateAndConstrain(
  objects: ShapeDisplayObject[],
  deltaX: number,
  deltaY: number
): ShapeDisplayObject[] {
  // First translate
  const translated = translateCollection(objects, deltaX, deltaY);
  
  // Then constrain to canvas
  return constrainToCanvas(translated);
}

