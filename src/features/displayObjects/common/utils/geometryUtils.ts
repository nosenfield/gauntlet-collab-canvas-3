/**
 * Geometry Utilities
 * 
 * Helper functions for geometric calculations
 * Used for bounding boxes, transforms, and collision detection
 */

import type { Point, AxisAlignedBoundingBox } from '../types';

/**
 * Rotate a point around a center point by a given angle
 * 
 * @param point - The point to rotate
 * @param angle - Rotation angle in degrees
 * @param center - Center point of rotation
 * @returns Rotated point
 */
export function rotatePoint(point: Point, angle: number, center: Point): Point {
  // Convert angle to radians
  const radians = (angle * Math.PI) / 180;
  
  // Translate point to origin
  const translatedX = point.x - center.x;
  const translatedY = point.y - center.y;
  
  // Rotate
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const rotatedX = translatedX * cos - translatedY * sin;
  const rotatedY = translatedX * sin + translatedY * cos;
  
  // Translate back
  return {
    x: rotatedX + center.x,
    y: rotatedY + center.y,
  };
}

/**
 * Check if a point is inside an axis-aligned bounding box
 * 
 * @param point - The point to test
 * @param aabb - The bounding box
 * @returns True if point is inside AABB
 */
export function pointInAABB(point: Point, aabb: AxisAlignedBoundingBox): boolean {
  return (
    point.x >= aabb.x &&
    point.x <= aabb.x + aabb.width &&
    point.y >= aabb.y &&
    point.y <= aabb.y + aabb.height
  );
}

/**
 * Check if any points intersect with an AABB
 * 
 * @param points - Array of points to test
 * @param aabb - The bounding box
 * @returns True if any point intersects
 */
export function pointsIntersectAABB(points: Point[], aabb: AxisAlignedBoundingBox): boolean {
  return points.some(point => pointInAABB(point, aabb));
}

/**
 * Check if two AABBs intersect
 * 
 * @param a - First bounding box
 * @param b - Second bounding box
 * @returns True if boxes intersect
 */
export function aabbIntersectsAABB(
  a: AxisAlignedBoundingBox,
  b: AxisAlignedBoundingBox
): boolean {
  return !(
    a.x + a.width < b.x ||
    a.x > b.x + b.width ||
    a.y + a.height < b.y ||
    a.y > b.y + b.height
  );
}

/**
 * Calculate the distance between two points
 * 
 * @param a - First point
 * @param b - Second point
 * @returns Distance between points
 */
export function distance(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Clamp a value between min and max
 * 
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between two values
 * 
 * @param a - Start value
 * @param b - End value
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated value
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

