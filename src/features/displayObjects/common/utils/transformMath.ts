/**
 * Transform Math Utilities
 * 
 * Mathematical functions for rotating and scaling collections of display objects.
 * All angles are in degrees for user-friendly 1px = 1° sensitivity.
 */

import type { Point } from '../types';
import type { ShapeDisplayObject } from '@/features/displayObjects/shapes/types';

/**
 * Convert degrees to radians
 */
function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Rotate a point around a center point by a given angle
 * 
 * @param point - Point to rotate
 * @param angleDegrees - Rotation angle in degrees (positive = clockwise)
 * @param center - Center point of rotation
 * @returns Rotated point
 */
export function rotatePointAroundCenter(
  point: Point,
  angleDegrees: number,
  center: Point
): Point {
  const angleRadians = degreesToRadians(angleDegrees);
  
  // Translate point to origin (relative to center)
  const translatedX = point.x - center.x;
  const translatedY = point.y - center.y;
  
  // Apply rotation matrix
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);
  
  const rotatedX = translatedX * cos - translatedY * sin;
  const rotatedY = translatedX * sin + translatedY * cos;
  
  // Translate back to world coordinates
  return {
    x: rotatedX + center.x,
    y: rotatedY + center.y,
  };
}

/**
 * Rotate a collection of display objects around a center point
 * 
 * This function:
 * 1. Converts each object's top-left to its center point
 * 2. Rotates each object's center around the collection center
 * 3. Converts back to top-left coordinates
 * 4. Updates each object's rotation property
 * 
 * @param objects - Array of display objects to rotate
 * @param angleDegrees - Rotation angle in degrees (positive = clockwise)
 * @param center - Center point of rotation (usually collection center)
 * @returns Updated objects with new positions and rotations
 * 
 * @example
 * ```typescript
 * const rotatedObjects = rotateCollection(
 *   selectedShapes,
 *   45,  // Rotate 45° clockwise
 *   { x: 5000, y: 5000 }  // Around canvas center
 * );
 * ```
 */
export function rotateCollection(
  objects: ShapeDisplayObject[],
  angleDegrees: number,
  center: Point
): ShapeDisplayObject[] {
  return objects.map(obj => {
    // Calculate object's center point (accounting for scale)
    // Handle different shape types - MVP currently only has rectangles
    let halfWidth: number;
    let halfHeight: number;
    
    if (obj.type === 'rectangle') {
      halfWidth = (obj.width * obj.scaleX) / 2;
      halfHeight = (obj.height * obj.scaleY) / 2;
    } else if (obj.type === 'circle') {
      // Circle: treat as square bounding box
      const diameter = obj.radius * 2;
      halfWidth = (diameter * obj.scaleX) / 2;
      halfHeight = (diameter * obj.scaleY) / 2;
    } else {
      // Line: use bounding box of points (not yet implemented in MVP)
      halfWidth = 0;
      halfHeight = 0;
    }
    
    const objectCenter = {
      x: obj.x + halfWidth,
      y: obj.y + halfHeight,
    };
    
    // Rotate object's CENTER around collection center
    const newCenter = rotatePointAroundCenter(
      objectCenter,
      angleDegrees,
      center
    );
    
    // Convert back to top-left coordinates
    const newTopLeft = {
      x: newCenter.x - halfWidth,
      y: newCenter.y - halfHeight,
    };
    
    // Update object's rotation property (accumulated)
    const newRotation = obj.rotation + angleDegrees;
    
    return {
      ...obj,
      x: newTopLeft.x,
      y: newTopLeft.y,
      rotation: newRotation,
    };
  });
}

/**
 * Scale a collection of display objects from a center point
 * 
 * This function:
 * 1. Scales each object's position relative to center
 * 2. Updates each object's scale properties
 * 
 * @param objects - Array of display objects to scale
 * @param scaleFactor - Scale multiplier (1.0 = no change, 2.0 = double size, 0.5 = half size)
 * @param center - Center point of scaling (usually collection AABB center)
 * @returns Updated objects with new positions and scales
 * 
 * @example
 * ```typescript
 * const scaledObjects = scaleCollection(
 *   selectedShapes,
 *   1.5,  // Scale to 150% of original size
 *   { x: 5000, y: 5000 }
 * );
 * ```
 */
export function scaleCollection(
  objects: ShapeDisplayObject[],
  scaleFactor: number,
  center: Point
): ShapeDisplayObject[] {
  // Prevent zero or negative scaling
  if (scaleFactor <= 0) {
    console.warn('[transformMath] Invalid scale factor:', scaleFactor);
    return objects;
  }
  
  return objects.map(obj => {
    // Scale position relative to center
    const deltaX = obj.x - center.x;
    const deltaY = obj.y - center.y;
    
    const newX = center.x + (deltaX * scaleFactor);
    const newY = center.y + (deltaY * scaleFactor);
    
    // Scale the object itself
    const newScaleX = obj.scaleX * scaleFactor;
    const newScaleY = obj.scaleY * scaleFactor;
    
    return {
      ...obj,
      x: newX,
      y: newY,
      scaleX: newScaleX,
      scaleY: newScaleY,
    };
  });
}

/**
 * Calculate the cumulative drag distance considering direction
 * Used for knob rotation to determine clockwise vs counter-clockwise
 * 
 * @param startPos - Initial mouse position
 * @param currentPos - Current mouse position
 * @returns Signed distance (positive = clockwise, negative = counter-clockwise)
 */
export function calculateDragDistance(
  startPos: { x: number; y: number },
  currentPos: { x: number; y: number }
): number {
  const deltaX = currentPos.x - startPos.x;
  const deltaY = currentPos.y - startPos.y;
  
  // Calculate total distance considering both axes
  // Right/Down = positive (clockwise), Left/Up = negative (counter-clockwise)
  return deltaX + deltaY;
}

/**
 * Normalize angle to 0-360 range
 */
export function normalizeAngle(angle: number): number {
  let normalized = angle % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  return normalized;
}

