/**
 * BoundingBoxLayer Component
 * 
 * Renders selection highlights for shapes:
 * - Individual OBBs (Oriented Bounding Boxes) - solid blue outlines
 * - Collection OBB (Oriented Bounding Box) - dashed blue box
 * 
 * OBBs account for rotation and show exact shape bounds.
 * Collection OBB always shown for any selection (1 or more objects).
 * Unified behavior: single object treated as collection of 1.
 */

import React from 'react';
import { Layer } from 'react-konva';
import { ObjectHighlight } from '@/features/displayObjects/common/components/ObjectHighlight';
import { CollectionBoundingBox } from '@/features/displayObjects/common/components/CollectionBoundingBox';
import type { TransformableObject } from '@/features/displayObjects/common/types';
import type { Point } from '@/features/displayObjects/common/types';

interface BoundingBoxLayerProps {
  selectedObjects: TransformableObject[];
  objectCorners: Map<string, Point[]>;
  collectionCorners: Point[] | null;
  scale: number;
}

/**
 * BoundingBoxLayer
 * 
 * Non-interactive layer that renders selection highlights.
 * Updates automatically when selection changes.
 * 
 * Performance: Memoized to prevent unnecessary re-renders.
 * Only updates when selection, corners, or scale actually change.
 */
export const BoundingBoxLayer = React.memo(
  function BoundingBoxLayer({ 
    selectedObjects, 
    objectCorners, 
    collectionCorners,
    scale 
  }: BoundingBoxLayerProps): React.ReactElement {
    return (
      <Layer listening={false}>
        {/* Individual object highlights (solid OBB) */}
        {selectedObjects.map(obj => {
          const corners = objectCorners.get(obj.id);
          if (!corners) return null;
          
          return (
            <ObjectHighlight 
              key={`highlight-${obj.id}`} 
              corners={corners}
              scale={scale}
            />
          );
        })}
        
        {/* Collection bounding box (dashed OBB) - always shown when selection exists */}
        {collectionCorners && (
          <CollectionBoundingBox 
            corners={collectionCorners}
            scale={scale}
          />
        )}
      </Layer>
    );
  },
  // Custom comparison function for optimal performance
  (prevProps, nextProps) => {
    // Check scale (primitive)
    if (prevProps.scale !== nextProps.scale) return false;
    
    // Check collectionCorners reference
    if (prevProps.collectionCorners !== nextProps.collectionCorners) return false;
    
    // Check objectCorners reference (Map comparison)
    if (prevProps.objectCorners !== nextProps.objectCorners) return false;
    
    // Check selectedObjects array length
    if (prevProps.selectedObjects.length !== nextProps.selectedObjects.length) return false;
    
    // Check selectedObjects IDs (shallow comparison)
    for (let i = 0; i < prevProps.selectedObjects.length; i++) {
      if (prevProps.selectedObjects[i].id !== nextProps.selectedObjects[i].id) {
        return false;
      }
    }
    
    // All checks passed - props are equal, skip re-render
    return true;
  }
);

