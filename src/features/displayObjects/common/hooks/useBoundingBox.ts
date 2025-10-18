/**
 * Bounding Box Hook
 * 
 * Custom hook to calculate and memoize bounding boxes for selected objects
 * Provides both collection AABB and individual OBBs
 */

import { useMemo } from 'react';
import type { AxisAlignedBoundingBox, Point, TransformableObject } from '../types';
import { 
  calculateCollectionAABB,
  calculateCollectionOBB,
  getObjectCorners,
  getAABBCenter 
} from '../utils/boundingBoxUtils';

/**
 * Bounding box data for a collection
 */
export interface BoundingBoxData {
  // Collection bounds (AABB around all objects) - deprecated, use collectionCorners
  collectionBounds: AxisAlignedBoundingBox | null;
  collectionCenter: Point | null;
  
  // Collection corners (OBB around all objects) - for rendering
  collectionCorners: Point[] | null;
  
  // Individual object bounds (OBB corners for each)
  objectCorners: Map<string, Point[]>; // shapeId -> corners
}

/**
 * useBoundingBox Hook
 * 
 * Calculates bounding boxes for a collection of selected display objects
 * Results are memoized based on object IDs and their properties
 * 
 * @param selectedObjects - Array of selected display objects (shapes, texts, etc.)
 * @returns Bounding box data for rendering
 * 
 * @example
 * ```tsx
 * const { collectionBounds, objectCorners } = useBoundingBox(selectedObjects);
 * 
 * if (collectionBounds) {
 *   return <CollectionBoundingBox bounds={collectionBounds} />;
 * }
 * ```
 */
export function useBoundingBox(selectedObjects: TransformableObject[]): BoundingBoxData {
  // Create a stable dependency key from all object properties
  // This ensures useMemo recalculates when any relevant property changes
  const objectsKey = useMemo(() => {
    return selectedObjects.map(obj => 
      `${obj.id}:${obj.x},${obj.y},${obj.rotation},${obj.scaleX},${obj.scaleY},${obj.width},${obj.height}`
    ).join('|');
  }, [selectedObjects]);
  
  // Calculate bounding boxes when selection or object properties change
  const boundingBoxData = useMemo(() => {
    // No selection - return empty data
    if (selectedObjects.length === 0) {
      return {
        collectionBounds: null,
        collectionCenter: null,
        collectionCorners: null,
        objectCorners: new Map<string, Point[]>(),
      };
    }
    
    // Calculate collection AABB (for backward compatibility)
    const collectionBounds = calculateCollectionAABB(selectedObjects);
    const collectionCenter = collectionBounds ? getAABBCenter(collectionBounds) : null;
    
    // Calculate collection OBB (for rendering)
    const collectionOBB = calculateCollectionOBB(selectedObjects);
    const collectionCorners = collectionOBB ? collectionOBB.corners : null;
    
    // Calculate OBB corners for each object
    const objectCorners = new Map<string, Point[]>();
    for (const obj of selectedObjects) {
      const corners = getObjectCorners(obj);
      objectCorners.set(obj.id, corners);
    }
    
    return {
      collectionBounds,
      collectionCenter,
      collectionCorners,
      objectCorners,
    };
  }, [selectedObjects, objectsKey]);
  
  return boundingBoxData;
}

