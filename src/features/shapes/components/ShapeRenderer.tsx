/**
 * Shape Renderer Component
 * 
 * Renders all shapes on the canvas in two layers:
 * - Layer 1: Shapes (in z-index order)
 * - Layer 2: Selection handles (always on top)
 * 
 * This ensures selection handles are always visible above all shapes.
 */

import { Layer } from 'react-konva';
import { useShapesSortedByZIndex } from '../store/shapesStore';
import { useSelectionContext } from '../store/selectionStore';
import { RectangleWithHandles } from './RectangleWithHandles';
import { SelectionHandlesLayer } from './SelectionHandlesLayer';

/**
 * Shape Renderer Component
 * 
 * Renders all shapes in the correct z-index order.
 * Currently supports:
 * - Rectangle (implemented)
 * - Circle (coming in STAGE3-7)
 * - Line (coming in STAGE3-8)
 */
export function ShapeRenderer() {
  const shapes = useShapesSortedByZIndex();
  const { selectedShapeIds } = useSelectionContext();

  // Get selected shapes
  const selectedShapes = shapes.filter((shape) => selectedShapeIds.has(shape.id));

  return (
    <>
      {/* Layer 1: All shapes */}
      <Layer>
        {shapes.map((shape) => {
          // Render based on shape type
          switch (shape.type) {
            case 'rectangle':
              return <RectangleWithHandles key={shape.id} shape={shape} renderHandles={false} />;
            
            case 'circle':
              // TODO: Implement in STAGE3-7
              console.warn('Circle rendering not yet implemented');
              return null;
            
            case 'line':
              // TODO: Implement in STAGE3-8
              console.warn('Line rendering not yet implemented');
              return null;
            
            default:
              console.warn('Unknown shape type:', shape);
              return null;
          }
        })}
      </Layer>

      {/* Layer 2: Selection handles (always on top) */}
      <SelectionHandlesLayer shapes={selectedShapes} />
    </>
  );
}
