/**
 * Shape Layer Component
 * 
 * Renders all shapes on the canvas
 * Handles shape rendering and click events
 */

import { Layer } from 'react-konva';
import { useShapes } from '../store/shapesStore';
import { RectangleShape } from './RectangleShape';

/**
 * Shape Layer Props
 */
interface ShapeLayerProps {
  selectedShapeId?: string | null;
  onShapeClick?: (shapeId: string) => void;
}

/**
 * ShapeLayer Component
 * 
 * Renders all shapes in order of z-index
 * Delegates to specific shape components based on type
 */
export function ShapeLayer({ selectedShapeId, onShapeClick }: ShapeLayerProps) {
  const { shapes, isLoading } = useShapes();

  if (isLoading) {
    return <Layer />;
  }

  return (
    <Layer name="shapes-layer">
      {shapes.map((shape) => {
        const isSelected = selectedShapeId === shape.id;

        // Render based on shape type
        switch (shape.type) {
          case 'rectangle':
            return (
              <RectangleShape
                key={shape.id}
                shape={shape}
                isSelected={isSelected}
                onClick={onShapeClick}
              />
            );
          
          case 'circle':
          case 'line':
            // Not implemented yet (rectangles only for now)
            return null;
          
          default:
            console.warn('[ShapeLayer] Unknown shape type:', shape);
            return null;
        }
      })}
    </Layer>
  );
}

