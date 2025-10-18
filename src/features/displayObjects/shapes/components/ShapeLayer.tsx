/**
 * Shape Layer Component
 * 
 * Renders all shapes on the canvas
 * Handles shape rendering, click events, and collection dragging
 */

import React from 'react';
import { Layer } from 'react-konva';
import { useShapes } from '../store/shapesStore';
import { useAuth } from '@/features/auth/store/authStore';
import { updateShape } from '../services/shapeService';
import { RectangleShape } from './RectangleShape';
import type { ShapeDisplayObject } from '../types';

/**
 * Shape Layer Props
 */
interface ShapeLayerProps {
  selectedIds?: string[];
  onShapeClick?: (shapeId: string, isShiftClick: boolean) => void;
  
  // Collection drag props (from useCanvasInteractions)
  isCollectionDragging: boolean;
  driverShapeId: string;
  dragOptimisticShapes: ShapeDisplayObject[] | null;
  startCollectionDrag: (driverShapeId: string) => void;
  moveCollectionDrag: (driverShapeId: string, x: number, y: number) => void;
  endCollectionDrag: () => void;
}

/**
 * ShapeLayer Component
 * 
 * Renders all shapes in order of z-index
 * Delegates to specific shape components based on type
 * Handles collection dragging when multiple shapes are selected
 */
export function ShapeLayer({ 
  selectedIds = [], 
  onShapeClick,
  isCollectionDragging,
  driverShapeId,
  dragOptimisticShapes,
  startCollectionDrag,
  moveCollectionDrag,
  endCollectionDrag,
}: ShapeLayerProps) {
  const { shapes, isLoading } = useShapes();
  const { user } = useAuth();
  
  // Get selected shapes for multi-selection checks
  const selectedShapes = shapes.filter(shape => selectedIds.includes(shape.id));
  const hasMultipleSelected = selectedShapes.length > 1;

  // Handle shape drag end
  const handleShapeDragEnd = async (shapeId: string, x: number, y: number) => {
    if (!user) return;
    
    // If this was a collection drag, end it
    if (hasMultipleSelected && isCollectionDragging) {
      await endCollectionDrag();
      return;
    }
    
    // Otherwise, it's a single shape drag
    try {
      console.log('[ShapeLayer] Updating single shape position:', shapeId, { x, y });
      await updateShape(shapeId, user.userId, { x, y });
    } catch (error) {
      console.error('[ShapeLayer] Error updating shape position:', error);
    }
  };
  
  // Handle collection drag start (when multiple shapes selected)
  const handleCollectionDragStart = (shapeId: string) => {
    if (!hasMultipleSelected) return;
    startCollectionDrag(shapeId);
  };
  
  // Handle collection drag move (when multiple shapes selected)
  const handleCollectionDragMove = (shapeId: string, x: number, y: number) => {
    if (!hasMultipleSelected || !isCollectionDragging) return;
    moveCollectionDrag(shapeId, x, y);
  };
  
  // Merge optimistic shapes with regular shapes during collection dragging
  // Optimistic shapes only contain the selected/dragging shapes, we need to include non-selected shapes too
  // MUST be called before any conditional returns (Rules of Hooks)
  const shapesToRender = React.useMemo(() => {
    if (isCollectionDragging && dragOptimisticShapes) {
      // Create a map of optimistic shapes by ID for fast lookup
      const optimisticMap = new Map(dragOptimisticShapes.map(s => [s.id, s]));
      
      // Replace selected shapes with optimistic versions, keep non-selected shapes as-is
      return shapes.map(shape => optimisticMap.get(shape.id) || shape);
    }
    return shapes;
  }, [isCollectionDragging, dragOptimisticShapes, shapes]);

  if (isLoading) {
    return <Layer />;
  }

  return (
    <Layer name="shapes-layer">
      {shapesToRender.map((shape) => {
        const isSelected = selectedIds.includes(shape.id);
        const isDriver = isCollectionDragging && driverShapeId === shape.id;

        // Render based on shape type
        switch (shape.type) {
          case 'rectangle':
            return (
              <RectangleShape
                key={shape.id}
                shape={shape}
                isSelected={isSelected}
                onClick={onShapeClick}
                onDragEnd={handleShapeDragEnd}
                // Keep draggable for all selected shapes (use Konva's draggable)
                draggable={isSelected}
                // Collection drag handlers (only when multiple shapes selected)
                onCollectionDragStart={hasMultipleSelected ? handleCollectionDragStart : undefined}
                onCollectionDragMove={hasMultipleSelected ? handleCollectionDragMove : undefined}
                // During collection drag, only the driver shape is controlled by Konva
                // Non-driver shapes get their positions from optimistic updates
                listening={!isCollectionDragging || isDriver}
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

