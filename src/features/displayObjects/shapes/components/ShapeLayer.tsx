/**
 * Shape Layer Component
 * 
 * Renders all shapes on the canvas using the generic DisplayObjectLayer.
 * Delegates to specific shape components based on type.
 */

import React from 'react';
import { useShapes } from '../store/shapesStore';
import { updateShape } from '../services/shapeService';
import { RectangleShape } from './RectangleShape';
import { CircleShape } from './CircleShape';
import { LineShape } from './LineShape';
import { DisplayObjectLayer, type ObjectRenderProps } from '../../common/components/DisplayObjectLayer';
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
 * Thin wrapper around DisplayObjectLayer that provides shape-specific rendering.
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

  /**
   * Render function for individual shapes
   * Delegates to specific shape components based on type
   */
  const renderShape = React.useCallback((
    shape: ShapeDisplayObject,
    props: ObjectRenderProps
  ): React.ReactNode => {
    switch (shape.type) {
      case 'rectangle':
        return (
          <RectangleShape
            key={shape.id}
            shape={shape}
            {...props}
          />
        );
      
      case 'circle':
        return (
          <CircleShape
            key={shape.id}
            shape={shape}
            {...props}
          />
        );
      
      case 'line':
        return (
          <LineShape
            key={shape.id}
            shape={shape}
            {...props}
          />
        );
      
      default:
        console.warn('[ShapeLayer] Unknown shape type:', shape);
        return null;
    }
  }, []);

  return (
    <DisplayObjectLayer
      objects={shapes}
      selectedIds={selectedIds}
      isLoading={isLoading}
      onClick={onShapeClick}
      renderObject={renderShape}
      updateObject={updateShape}
      isCollectionDragging={isCollectionDragging}
      driverObjectId={driverShapeId}
      dragOptimisticObjects={dragOptimisticShapes}
      startCollectionDrag={startCollectionDrag}
      moveCollectionDrag={moveCollectionDrag}
      endCollectionDrag={endCollectionDrag}
      layerName="shapes-layer"
    />
  );
}

