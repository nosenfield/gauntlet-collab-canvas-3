/**
 * Shape Layer Component
 * 
 * Renders all shapes on the canvas
 * Handles shape rendering, click events, and collection dragging
 */

import { Layer } from 'react-konva';
import { useShapes } from '../store/shapesStore';
import { useAuth } from '@/features/auth/store/authStore';
import { updateShape } from '../services/shapeService';
import { RectangleShape } from './RectangleShape';
import { useCollectionDrag } from '@/features/displayObjects/common/hooks/useCollectionDrag';
import { useTool } from '@/features/displayObjects/common/store/toolStore';

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
 * Handles collection dragging when multiple shapes are selected
 */
export function ShapeLayer({ selectedIds = [], onShapeClick }: ShapeLayerProps) {
  const { shapes, isLoading } = useShapes();
  const { user } = useAuth();
  const { isSelectMode } = useTool();
  
  // Get selected shapes for collection dragging
  const selectedShapes = shapes.filter(shape => selectedIds.includes(shape.id));
  const hasMultipleSelected = selectedShapes.length > 1;
  
  // Collection drag hook
  const {
    isDragging: isCollectionDragging,
    optimisticShapes,
    handleDragStart: startCollectionDrag,
    handleDragMove: moveCollectionDrag,
    handleDragEnd: endCollectionDrag,
  } = useCollectionDrag(selectedShapes, user?.userId, isSelectMode());

  // Handle single shape drag end (when only one shape selected)
  const handleSingleShapeDragEnd = async (shapeId: string, x: number, y: number) => {
    if (!user || hasMultipleSelected) return;
    
    try {
      console.log('[ShapeLayer] Updating single shape position:', shapeId, { x, y });
      await updateShape(shapeId, user.userId, { x, y });
    } catch (error) {
      console.error('[ShapeLayer] Error updating shape position:', error);
    }
  };
  
  // Handle collection drag start
  const handleCollectionDragStart = (e: any, _shapeId: string) => {
    if (!hasMultipleSelected || !isSelectMode()) return;
    
    // Get mouse position in canvas coordinates
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;
    
    // Convert to canvas coordinates
    const transform = stage.getAbsoluteTransform().copy().invert();
    const canvasPos = transform.point(pointerPos);
    
    startCollectionDrag(canvasPos.x, canvasPos.y);
  };

  if (isLoading) {
    return <Layer />;
  }
  
  // Use optimistic shapes during collection dragging, otherwise use regular shapes
  const shapesToRender = isCollectionDragging ? optimisticShapes : shapes;

  return (
    <Layer 
      name="shapes-layer"
      onMouseMove={(e) => {
        if (isCollectionDragging) {
          const stage = e.target.getStage();
          if (!stage) return;
          
          const pointerPos = stage.getPointerPosition();
          if (!pointerPos) return;
          
          const transform = stage.getAbsoluteTransform().copy().invert();
          const canvasPos = transform.point(pointerPos);
          
          moveCollectionDrag(canvasPos.x, canvasPos.y);
        }
      }}
      onMouseUp={() => {
        if (isCollectionDragging) {
          endCollectionDrag();
        }
      }}
      onMouseLeave={() => {
        if (isCollectionDragging) {
          endCollectionDrag();
        }
      }}
    >
      {shapesToRender.map((shape) => {
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
                onDragEnd={handleSingleShapeDragEnd}
                // Disable individual dragging when in collection mode
                draggable={isSelected && !hasMultipleSelected}
                // Collection drag handlers
                onCollectionDragStart={hasMultipleSelected ? handleCollectionDragStart : undefined}
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

