/**
 * Shape Layer Component
 * 
 * Renders all shapes on the canvas
 * Handles shape rendering and click events
 */

import { Layer } from 'react-konva';
import { useShapes } from '../store/shapesStore';
import { useAuth } from '@/features/auth/store/authStore';
import { updateShape } from '../services/shapeService';
import { RectangleShape } from './RectangleShape';

/**
 * Shape Layer Props
 */
interface ShapeLayerProps {
  selectedIds?: string[];
  onShapeClick?: (shapeId: string, isShiftClick: boolean) => void;
}

/**
 * ShapeLayer Component
 * 
 * Renders all shapes in order of z-index
 * Delegates to specific shape components based on type
 */
export function ShapeLayer({ selectedIds = [], onShapeClick }: ShapeLayerProps) {
  const { shapes, isLoading } = useShapes();
  const { user } = useAuth();

  // Handle drag end - update shape position in Firestore
  const handleDragEnd = async (shapeId: string, x: number, y: number) => {
    if (!user) return;
    
    try {
      console.log('[ShapeLayer] Updating shape position:', shapeId, { x, y });
      await updateShape(shapeId, user.userId, { x, y });
    } catch (error) {
      console.error('[ShapeLayer] Error updating shape position:', error);
    }
  };

  if (isLoading) {
    return <Layer />;
  }

  return (
    <Layer name="shapes-layer">
      {shapes.map((shape) => {
        const isSelected = selectedIds.includes(shape.id);

        // Render based on shape type
        switch (shape.type) {
          case 'rectangle':
            return (
              <RectangleShape
                key={shape.id}
                shape={shape}
                isSelected={isSelected}
                onClick={onShapeClick}
                onDragEnd={handleDragEnd}
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

