/**
 * Circle Shape Component
 * 
 * Renders a circle shape on the Konva canvas.
 * Supports ellipse transformation via scaleX/scaleY.
 * 
 * COORDINATE SYSTEM:
 * - Data model stores (x, y) as the CENTER of the circle
 * - Konva Circle/Ellipse renders from center by default
 * - No offset needed (unlike rectangles)
 */

import { Ellipse } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { CircleShape as CircleShapeType } from '../types';

/**
 * Circle Shape Props
 */
interface CircleShapeProps {
  shape: CircleShapeType;
  isSelected?: boolean;
  onClick?: (shapeId: string, isShiftClick: boolean) => void;
  onDragEnd?: (shapeId: string, x: number, y: number) => void;
  draggable?: boolean;
  onCollectionDragStart?: (shapeId: string) => void;
  onCollectionDragMove?: (shapeId: string, x: number, y: number) => void;
  listening?: boolean;
}

/**
 * CircleShape Component
 * 
 * Renders a circle/ellipse with Konva.js
 * Supports selection, transformation, and styling
 * Supports both individual and collection dragging
 * 
 * Circle can become an ellipse via scaleX/scaleY transforms
 */
export function CircleShape({ 
  shape, 
  isSelected = false,
  onClick,
  onDragEnd,
  draggable,
  onCollectionDragStart,
  onCollectionDragMove,
  listening,
}: CircleShapeProps) {
  
  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    if (onClick) {
      const isShiftClick = e.evt.shiftKey;
      onClick(shape.id, isShiftClick);
    }
  };

  const handleDragStart = (_e: KonvaEventObject<DragEvent>) => {
    // If this is part of a collection, notify the collection drag system
    if (onCollectionDragStart && isSelected) {
      onCollectionDragStart(shape.id);
    }
  };

  const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
    // If this is part of a collection, notify the collection drag system
    // Circle position is already at center, so just pass through
    if (onCollectionDragMove && isSelected) {
      const node = e.target;
      const centerX = node.x();
      const centerY = node.y();
      onCollectionDragMove(shape.id, centerX, centerY);
    }
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    // Circle position is at center, pass through directly
    if (onDragEnd) {
      const node = e.target;
      const centerX = node.x();
      const centerY = node.y();
      onDragEnd(shape.id, centerX, centerY);
    }
  };

  // Determine if shape should be draggable
  const isDraggable = draggable !== undefined ? draggable : isSelected;
  
  // Determine if shape should listen to events
  const isListening = listening !== undefined ? listening : true;
  
  // Calculate radii from width/height (supports ellipses)
  // Width and height represent the full dimensions, so divide by 2 for radii
  const radiusX = shape.width / 2;
  const radiusY = shape.height / 2;

  return (
    <Ellipse
      // Identity
      id={shape.id}
      name="shape"
      
      // Position - center point (circle's natural origin)
      x={shape.x}
      y={shape.y}
      
      // Radius (base size before scale) - supports ellipses via width/height
      radiusX={radiusX}
      radiusY={radiusY}
      
      // Transform
      rotation={shape.rotation}
      scaleX={shape.scaleX}
      scaleY={shape.scaleY}
      
      // Visual properties
      fill={shape.fillColor}
      stroke={shape.strokeColor}
      strokeWidth={shape.strokeWidth}
      opacity={shape.opacity}
      
      // Interaction
      onClick={handleClick}
      onTap={handleClick}
      
      // Dragging
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      
      // Performance
      perfectDrawEnabled={false}
      listening={isListening}
      
      // Cursor
      cursor={isSelected ? 'move' : 'pointer'}
    />
  );
}

