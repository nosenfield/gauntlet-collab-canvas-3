/**
 * Shape Renderer Component
 * 
 * Renders all shapes on the canvas based on their type.
 * Manages shape ordering by z-index.
 * Displays selection handles for selected shapes.
 */

import { Layer } from 'react-konva';
import { useShapesSortedByZIndex } from '../store/shapesStore';
import { useSelectionContext } from '../store/selectionStore';
import { Rectangle } from './Rectangle';
import { SelectionHandles } from './SelectionHandles';

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

  return (
    <Layer>
      {/* Render all shapes */}
      {shapes.map((shape) => {
        // Render based on shape type
        switch (shape.type) {
          case 'rectangle':
            return <Rectangle key={shape.id} shape={shape} />;
          
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

      {/* Render selection handles for selected shapes */}
      {shapes
        .filter((shape) => selectedShapeIds.has(shape.id))
        .map((shape) => (
          <SelectionHandles key={`handles-${shape.id}`} shape={shape} />
        ))}
    </Layer>
  );
}

