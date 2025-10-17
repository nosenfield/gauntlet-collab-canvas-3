/**
 * Bounding Box Hook
 * 
 * Custom hook to calculate and memoize bounding boxes for selected objects
 * Provides both collection AABB and individual OBBs
 */

import { useMemo } from 'react';
import type { ShapeDisplayObject } from '@/features/displayObjects/shapes/types';
import type { AxisAlignedBoundingBox, Point } from '../types';
import { 
  calculateCollectionAABB, 
  getObjectCorners,
  getAABBCenter 
} from '../utils/boundingBoxUtils';

/**
 * Bounding box data for a collection
 */
export interface BoundingBoxData {
  // Collection bounds (AABB around all objects)
  collectionBounds: AxisAlignedBoundingBox | null;
  collectionCenter: Point | null;
  
  // Individual object bounds (OBB corners for each)
  objectCorners: Map<string, Point[]>; // shapeId -> corners
}

/**
 * useBoundingBox Hook
 * 
 * Calculates bounding boxes for a collection of selected shapes
 * Results are memoized based on shape IDs and their properties
 * 
 * @param selectedShapes - Array of selected shape objects
 * @returns Bounding box data for rendering
 * 
 * @example
 * ```tsx
 * const { collectionBounds, objectCorners } = useBoundingBox(selectedShapes);
 * 
 * if (collectionBounds) {
 *   return <CollectionBoundingBox bounds={collectionBounds} />;
 * }
 * ```
 */
export function useBoundingBox(selectedShapes: ShapeDisplayObject[]): BoundingBoxData {
  // Create a stable dependency key from all shape properties
  // This ensures useMemo recalculates when any relevant property changes
  const shapesKey = useMemo(() => {
    return selectedShapes.map(s => {
      const dimensions = s.type === 'rectangle' 
        ? `${s.width},${s.height}` 
        : s.type === 'circle' 
        ? `r${s.radius}` 
        : 'other';
      
      return `${s.id}:${s.x},${s.y},${s.rotation},${s.scaleX},${s.scaleY},${dimensions}`;
    }).join('|');
  }, [selectedShapes]);
  
  // Calculate bounding boxes when selection or shape properties change
  const boundingBoxData = useMemo(() => {
    // No selection - return empty data
    if (selectedShapes.length === 0) {
      return {
        collectionBounds: null,
        collectionCenter: null,
        objectCorners: new Map<string, Point[]>(),
      };
    }
    
    // Calculate collection AABB
    const collectionBounds = calculateCollectionAABB(selectedShapes);
    const collectionCenter = collectionBounds ? getAABBCenter(collectionBounds) : null;
    
    // Calculate OBB corners for each object
    const objectCorners = new Map<string, Point[]>();
    for (const shape of selectedShapes) {
      const corners = getObjectCorners(shape);
      objectCorners.set(shape.id, corners);
    }
    
    return {
      collectionBounds,
      collectionCenter,
      objectCorners,
    };
  }, [selectedShapes, shapesKey]);
  
  return boundingBoxData;
}

