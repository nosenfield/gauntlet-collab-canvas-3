/**
 * BoundingBoxLayer Component
 * 
 * Renders selection highlights for shapes:
 * - Individual OBBs (Oriented Bounding Boxes) - solid blue outlines
 * - Collection AABB (Axis-Aligned Bounding Box) - dashed blue box
 * 
 * OBBs account for rotation and show exact shape bounds.
 * AABB only shows when 2+ shapes selected, encompasses all shapes.
 */

import { Layer } from 'react-konva';
import { ObjectHighlight } from '@/features/displayObjects/common/components/ObjectHighlight';
import { CollectionBoundingBox } from '@/features/displayObjects/common/components/CollectionBoundingBox';
import type { ShapeDisplayObject } from '@/features/displayObjects/shapes/types';
import type { Point, AxisAlignedBoundingBox } from '@/features/displayObjects/common/types';

interface BoundingBoxLayerProps {
  selectedShapes: ShapeDisplayObject[];
  objectCorners: Map<string, Point[]>;
  collectionBounds: AxisAlignedBoundingBox | null;
  scale: number;
}

/**
 * BoundingBoxLayer
 * 
 * Non-interactive layer that renders selection highlights.
 * Updates automatically when selection changes.
 */
export function BoundingBoxLayer({ 
  selectedShapes, 
  objectCorners, 
  collectionBounds,
  scale 
}: BoundingBoxLayerProps): React.ReactElement {
  return (
    <Layer listening={false}>
      {/* Individual object highlights (solid OBB) */}
      {selectedShapes.map(shape => {
        const corners = objectCorners.get(shape.id);
        if (!corners) return null;
        
        return (
          <ObjectHighlight 
            key={`highlight-${shape.id}`} 
            corners={corners}
            scale={scale}
          />
        );
      })}
      
      {/* Collection bounding box (dashed AABB) - only for 2+ shapes */}
      {collectionBounds && selectedShapes.length > 1 && (
        <CollectionBoundingBox 
          bounds={collectionBounds}
          scale={scale}
        />
      )}
    </Layer>
  );
}

