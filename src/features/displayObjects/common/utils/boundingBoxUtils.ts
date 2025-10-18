/**
 * Bounding Box Utilities
 * 
 * Functions for calculating axis-aligned (AABB) and oriented (OBB) bounding boxes
 * for display objects and collections
 */

import type { Point, AxisAlignedBoundingBox, OrientedBoundingBox } from '../types';
import type { ShapeDisplayObject } from '@/features/displayObjects/shapes/types';
import { rotatePoint } from './geometryUtils';

/**
 * Calculate the Oriented Bounding Box (OBB) for a single shape
 * 
 * OBB accounts for rotation and returns the 4 corners of the rotated rectangle
 * 
 * Note: Our data model stores x,y as top-left corner.
 * Konva rendering uses offset to rotate around center.
 * This calculation matches that behavior.
 * 
 * @param shape - The shape to calculate OBB for
 * @returns Oriented bounding box with 4 corner points
 */
export function calculateObjectOBB(shape: ShapeDisplayObject): OrientedBoundingBox {
  // Calculate shape dimensions
  let width: number;
  let height: number;
  
  if (shape.type === 'rectangle') {
    width = shape.width * shape.scaleX;
    height = shape.height * shape.scaleY;
  } else if (shape.type === 'circle') {
    const scaledRadius = shape.radius * Math.max(shape.scaleX, shape.scaleY);
    width = scaledRadius * 2;
    height = scaledRadius * 2;
  } else {
    width = 10;
    height = 10;
  }
  
  // Data model: x,y is top-left corner
  // Center is at top-left + half dimensions
  const center: Point = {
    x: shape.x + width / 2,
    y: shape.y + height / 2,
  };
  
  // Calculate local corners relative to center
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  const localCorners: Point[] = [
    { x: -halfWidth, y: -halfHeight },  // Top-left (relative to center)
    { x: halfWidth, y: -halfHeight },   // Top-right
    { x: halfWidth, y: halfHeight },    // Bottom-right
    { x: -halfWidth, y: halfHeight },   // Bottom-left
  ];
  
  // If no rotation, corners are simply center + local corners
  if (shape.rotation === 0) {
    const worldCorners = localCorners.map(corner => ({
      x: center.x + corner.x,
      y: center.y + corner.y,
    }));
    
    return {
      corners: worldCorners,
      center,
      rotation: 0,
    };
  }
  
  // If rotated, rotate local corners around center
  const worldCorners = localCorners.map(corner => {
    const worldPoint: Point = {
      x: center.x + corner.x,
      y: center.y + corner.y,
    };
    return rotatePoint(worldPoint, shape.rotation, center);
  });
  
  return {
    corners: worldCorners,
    center,
    rotation: shape.rotation,
  };
}

/**
 * Get the 4 corners of an OBB for rendering
 * 
 * @param shape - The shape to get corners for
 * @returns Array of 4 corner points in world space
 */
export function getObjectCorners(shape: ShapeDisplayObject): Point[] {
  const obb = calculateObjectOBB(shape);
  return obb.corners;
}

/**
 * Calculate the Axis-Aligned Bounding Box (AABB) for a single shape
 * 
 * AABB is always axis-aligned (no rotation) and represents the smallest
 * rectangle that contains the shape's OBB
 * 
 * @param shape - The shape to calculate AABB for
 * @returns Axis-aligned bounding box
 */
export function calculateObjectAABB(shape: ShapeDisplayObject): AxisAlignedBoundingBox {
  // Get the OBB corners
  const corners = getObjectCorners(shape);
  
  // Find min/max coordinates
  const xs = corners.map(c => c.x);
  const ys = corners.map(c => c.y);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Calculate the AABB for a collection of shapes
 * 
 * The collection AABB is the smallest axis-aligned rectangle that contains
 * all shapes in the collection, accounting for their rotation
 * 
 * @param shapes - Array of shapes in the collection
 * @returns Axis-aligned bounding box containing all shapes
 */
export function calculateCollectionAABB(shapes: ShapeDisplayObject[]): AxisAlignedBoundingBox | null {
  if (shapes.length === 0) {
    return null;
  }
  
  // Get all corners from all shapes
  const allCorners = shapes.flatMap(shape => getObjectCorners(shape));
  
  // Find min/max coordinates
  const xs = allCorners.map(c => c.x);
  const ys = allCorners.map(c => c.y);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Calculate the center point of an AABB
 * 
 * @param aabb - The bounding box
 * @returns Center point
 */
export function getAABBCenter(aabb: AxisAlignedBoundingBox): Point {
  return {
    x: aabb.x + aabb.width / 2,
    y: aabb.y + aabb.height / 2,
  };
}

/**
 * Calculate the Oriented Bounding Box (OBB) for a collection of shapes
 * 
 * This creates a rotated bounding box around all selected objects.
 * The OBB is oriented to match the collection's average orientation.
 * 
 * @param shapes - Array of shapes in the collection
 * @returns Oriented bounding box with 4 corners, or null if no shapes
 */
export function calculateCollectionOBB(shapes: ShapeDisplayObject[]): OrientedBoundingBox | null {
  if (shapes.length === 0) {
    return null;
  }
  
  // Get all corners from all shapes
  const allCorners = shapes.flatMap(shape => getObjectCorners(shape));
  
  // Calculate the center of all corners
  const sumX = allCorners.reduce((sum, c) => sum + c.x, 0);
  const sumY = allCorners.reduce((sum, c) => sum + c.y, 0);
  const center: Point = {
    x: sumX / allCorners.length,
    y: sumY / allCorners.length,
  };
  
  // For collection OBB, we'll use axis-aligned bounds for simplicity
  // but return as corners for consistent rendering
  const xs = allCorners.map(c => c.x);
  const ys = allCorners.map(c => c.y);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  // Create corners for the bounding rectangle
  const corners: Point[] = [
    { x: minX, y: minY },  // Top-left
    { x: maxX, y: minY },  // Top-right
    { x: maxX, y: maxY },  // Bottom-right
    { x: minX, y: maxY },  // Bottom-left
  ];
  
  return {
    corners,
    center,
    rotation: 0,  // Collection OBB is axis-aligned
  };
}

/**
 * Recalculate bounds after a transform
 * 
 * Convenience function to recalculate both AABB and center for a collection
 * 
 * @param shapes - Array of shapes in the collection
 * @returns Bounding box and center point, or null if no shapes
 */
export function recalculateBoundsAfterTransform(
  shapes: ShapeDisplayObject[]
): { bounds: AxisAlignedBoundingBox; center: Point } | null {
  const bounds = calculateCollectionAABB(shapes);
  
  if (!bounds) {
    return null;
  }
  
  const center = getAABBCenter(bounds);
  
  return { bounds, center };
}

