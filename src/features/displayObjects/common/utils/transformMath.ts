/**
 * Transform Math Utilities
 * 
 * Mathematical functions for rotating and scaling collections of display objects.
 * All angles are in degrees for user-friendly 1px = 1° sensitivity.
 */

import type { Point, TransformableObject } from '../types';

/**
 * Convert degrees to radians
 */
function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get dimensions and center for any transformable object
 * Handles different object types (rectangles, circles, lines) correctly
 */
function getObjectDimensionsAndCenter(obj: TransformableObject): {
  width: number;
  height: number;
  center: Point;
} {
  const isLine = 'category' in obj && obj.category === 'shape' && 'type' in obj && (obj as any).type === 'line';
  const isCircle = 'category' in obj && obj.category === 'shape' && 'type' in obj && (obj as any).type === 'circle';
  
  let width: number;
  let height: number;
  let center: Point;
  
  if (isLine && 'points' in obj) {
    // Line: calculate dimensions from points array
    const points = (obj as any).points as number[];
    const x1 = points[0] * (obj.scaleX ?? 1);
    const y1 = points[1] * (obj.scaleY ?? 1);
    const x2 = points[2] * (obj.scaleX ?? 1);
    const y2 = points[3] * (obj.scaleY ?? 1);
    
    width = Math.abs(x2 - x1);
    height = Math.abs(y2 - y1);
    
    // Line center is midpoint
    center = {
      x: (obj.x ?? 0) + x2 / 2,
      y: (obj.y ?? 0) + y2 / 2,
    };
  } else {
    // Rectangle/Circle/Text: use width/height
    width = (obj.width ?? 0) * (obj.scaleX ?? 1);
    height = (obj.height ?? 0) * (obj.scaleY ?? 1);
    
    if (isCircle) {
      // Circle: x,y is already center
      center = {
        x: obj.x ?? 0,
        y: obj.y ?? 0,
      };
    } else {
      // Rectangle/Text: x,y is top-left, calculate center
      center = {
        x: (obj.x ?? 0) + width / 2,
        y: (obj.y ?? 0) + height / 2,
      };
    }
  }
  
  return { width, height, center };
}

/**
 * Rotate a point around a center point by a given angle
 * 
 * @param point - Point to rotate
 * @param angleDegrees - Rotation angle in degrees (positive = clockwise)
 * @param center - Center point of rotation
 * @returns Rotated point
 * 
 * @example
 * ```typescript
 * const rotated = rotatePointAroundCenter(
 *   { x: 100, y: 100 },
 *   45,
 *   { x: 50, y: 50 }
 * );
 * ```
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
export function rotateCollection<T extends TransformableObject>(
  objects: T[],
  angleDegrees: number,
  center: Point
): T[] {
  return objects.map(obj => {
    // Get dimensions and center for this object type
    const { width, height, center: objectCenter } = getObjectDimensionsAndCenter(obj);
    
    // Rotate object's CENTER around collection center
    const newCenter = rotatePointAroundCenter(
      objectCenter,
      angleDegrees,
      center
    );
    
    // Calculate new position from rotated center
    // For circles, new position IS the center
    // For lines, need to calculate start point
    // For rectangles, reverse: topLeft = center - half dimensions
    const isCircle = 'category' in obj && obj.category === 'shape' && 'type' in obj && (obj as any).type === 'circle';
    const isLine = 'category' in obj && obj.category === 'shape' && 'type' in obj && (obj as any).type === 'line';
    
    let newX: number;
    let newY: number;
    
    if (isCircle) {
      newX = newCenter.x;
      newY = newCenter.y;
    } else if (isLine && 'points' in obj) {
      const points = (obj as any).points as number[];
      const x2 = (points[2] ?? 0) * (obj.scaleX ?? 1);
      const y2 = (points[3] ?? 0) * (obj.scaleY ?? 1);
      newX = newCenter.x - x2 / 2;
      newY = newCenter.y - y2 / 2;
    } else {
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      newX = newCenter.x - halfWidth;
      newY = newCenter.y - halfHeight;
    }
    
    // Update object's rotation property (accumulated)
    const newRotation = obj.rotation + angleDegrees;
    
    return {
      ...obj,
      x: newX,
      y: newY,
      rotation: newRotation,
    };
  });
}

/**
 * Scale a collection of display objects from a center point
 * 
 * This function:
 * 1. Converts each object's top-left to its center point
 * 2. Scales each object's center position relative to collection center
 * 3. Converts back to top-left coordinates
 * 4. Updates each object's scale properties with constraints (0.1 to 10.0)
 * 
 * @param objects - Array of display objects to scale
 * @param scaleFactor - Scale multiplier relative to original (1.0 = original, 2.0 = double, 0.5 = half)
 * @param center - Center point of scaling (usually collection center)
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
export function scaleCollection<T extends TransformableObject>(
  objects: T[],
  scaleFactor: number,
  center: Point
): T[] {
  // Prevent zero or negative scaling
  if (scaleFactor <= 0) {
    console.warn('[transformMath] Invalid scale factor:', scaleFactor);
    return objects;
  }
  
  return objects.map(obj => {
    // Get center for this object type
    const { center: objectCenter } = getObjectDimensionsAndCenter(obj);
    
    // Scale object's CENTER position relative to collection center
    const deltaX = objectCenter.x - center.x;
    const deltaY = objectCenter.y - center.y;
    
    const newCenterX = center.x + (deltaX * scaleFactor);
    const newCenterY = center.y + (deltaY * scaleFactor);
    
    // Apply scale factor to object's scale properties
    const newScaleX = obj.scaleX * scaleFactor;
    const newScaleY = obj.scaleY * scaleFactor;
    
    // Apply constraints (0.1 to 100.0)
    const constrainedScaleX = Math.max(0.1, Math.min(100.0, newScaleX));
    const constrainedScaleY = Math.max(0.1, Math.min(100.0, newScaleY));
    
    // Calculate new position from scaled center
    // For circles, new position IS the center
    // For lines, need to calculate start point
    // For rectangles, reverse: topLeft = center - half dimensions
    const isCircle = 'category' in obj && obj.category === 'shape' && 'type' in obj && (obj as any).type === 'circle';
    const isLine = 'category' in obj && obj.category === 'shape' && 'type' in obj && (obj as any).type === 'line';
    
    let newX: number;
    let newY: number;
    
    if (isCircle) {
      newX = newCenterX;
      newY = newCenterY;
    } else if (isLine && 'points' in obj) {
      // Line: calculate start point from midpoint
      const points = (obj as any).points as number[];
      const scaledX2 = (points[2] ?? 0) * constrainedScaleX;
      const scaledY2 = (points[3] ?? 0) * constrainedScaleY;
      newX = newCenterX - scaledX2 / 2;
      newY = newCenterY - scaledY2 / 2;
    } else {
      // Rectangle/Text: calculate top-left from center
      const newWidth = (obj.width ?? 0) * constrainedScaleX;
      const newHeight = (obj.height ?? 0) * constrainedScaleY;
      newX = newCenterX - newWidth / 2;
      newY = newCenterY - newHeight / 2;
    }
    
    return {
      ...obj,
      x: newX,
      y: newY,
      scaleX: constrainedScaleX,
      scaleY: constrainedScaleY,
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

/**
 * Round position to 2 decimal places
 * Prevents floating point precision artifacts and ensures consistent positioning
 * 
 * @param value - Position value to round
 * @returns Position rounded to 2 decimal places
 * 
 * @example
 * ```typescript
 * roundPosition(123.456789) // returns 123.46
 * roundPosition(99.9999999) // returns 100.00
 * ```
 */
export function roundPosition(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Round numeric property to 2 decimal places
 * Use for scale, rotation, opacity, dimensions, and other numeric properties
 * 
 * @param value - Numeric value to round
 * @returns Value rounded to 2 decimal places
 * 
 * @example
 * ```typescript
 * roundNumericProperty(1.456789) // returns 1.46
 * roundNumericProperty(45.9999) // returns 46.00
 * roundNumericProperty(0.33333) // returns 0.33
 * ```
 */
export function roundNumericProperty(value: number): number {
  return Math.round(value * 100) / 100;
}

