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

import { Layer } from 'react-konva';
import { ObjectHighlight } from '@/features/displayObjects/common/components/ObjectHighlight';
import { CollectionBoundingBox } from '@/features/displayObjects/common/components/CollectionBoundingBox';
import type { ShapeDisplayObject } from '@/features/displayObjects/shapes/types';
import type { Point } from '@/features/displayObjects/common/types';

interface BoundingBoxLayerProps {
  selectedShapes: ShapeDisplayObject[];
  objectCorners: Map<string, Point[]>;
  collectionCorners: Point[] | null;
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
  collectionCorners,
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
      
      {/* Collection bounding box (dashed OBB) - always shown when selection exists */}
      {collectionCorners && (
        <CollectionBoundingBox 
          corners={collectionCorners}
          scale={scale}
        />
      )}
    </Layer>
  );
}

