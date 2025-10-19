/**
 * Line Shape Component
 * 
 * Renders a line shape on the Konva canvas.
 * Supports rotation around midpoint and scaling.
 * 
 * COORDINATE SYSTEM:
 * - Data model stores (x, y) as the START POINT of the line
 * - points array is [0, 0, x2, y2] relative to (x, y)
 * - Rotation happens around the MIDPOINT of the line
 * - To achieve this, we offset the line and position at midpoint
 */

import { Line } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { LineShape as LineShapeType } from '../types';

/**
 * Line Shape Props
 */
interface LineShapeProps {
  shape: LineShapeType;
  isSelected?: boolean;
  onClick?: (shapeId: string, isShiftClick: boolean) => void;
  onDragEnd?: (shapeId: string, x: number, y: number) => void;
  draggable?: boolean;
  onCollectionDragStart?: (shapeId: string) => void;
  onCollectionDragMove?: (shapeId: string, x: number, y: number) => void;
  listening?: boolean;
}

/**
 * LineShape Component
 * 
 * Renders a line with Konva.js
 * Supports selection, transformation, and styling
 * Supports both individual and collection dragging
 * 
 * Rotation occurs around the line's midpoint
 * Scale stretches the line length
 */
export function LineShape({ 
  shape, 
  isSelected = false,
  onClick,
  onDragEnd,
  draggable,
  onCollectionDragStart,
  onCollectionDragMove,
  listening,
}: LineShapeProps) {
  
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
    // Konva reports position at midpoint (due to our offset), convert back to start point
    if (onCollectionDragMove && isSelected) {
      const node = e.target;
      const midpointX = node.x();
      const midpointY = node.y();
      
      // Calculate offset to start point (in world space, accounting for rotation and scale)
      const points = shape.points;
      const offsetX = (points[2] * shape.scaleX) / 2;
      const offsetY = (points[3] * shape.scaleY) / 2;
      
      // Convert rotation to radians
      const rotationRad = (shape.rotation * Math.PI) / 180;
      
      // Rotate offset vector
      const cos = Math.cos(rotationRad);
      const sin = Math.sin(rotationRad);
      const rotatedOffsetX = offsetX * cos - offsetY * sin;
      const rotatedOffsetY = offsetX * sin + offsetY * cos;
      
      // Start point = midpoint - rotated offset
      const startX = midpointX - rotatedOffsetX;
      const startY = midpointY - rotatedOffsetY;
      
      onCollectionDragMove(shape.id, startX, startY);
    }
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    // Convert from midpoint position to start point for our data model
    if (onDragEnd) {
      const node = e.target;
      const midpointX = node.x();
      const midpointY = node.y();
      
      // Calculate offset to start point (in world space, accounting for rotation and scale)
      const points = shape.points;
      const offsetX = (points[2] * shape.scaleX) / 2;
      const offsetY = (points[3] * shape.scaleY) / 2;
      
      // Convert rotation to radians
      const rotationRad = (shape.rotation * Math.PI) / 180;
      
      // Rotate offset vector
      const cos = Math.cos(rotationRad);
      const sin = Math.sin(rotationRad);
      const rotatedOffsetX = offsetX * cos - offsetY * sin;
      const rotatedOffsetY = offsetX * sin + offsetY * cos;
      
      // Start point = midpoint - rotated offset
      const startX = midpointX - rotatedOffsetX;
      const startY = midpointY - rotatedOffsetY;
      
      onDragEnd(shape.id, startX, startY);
    }
  };

  // Determine if shape should be draggable
  const isDraggable = draggable !== undefined ? draggable : isSelected;
  
  // Determine if shape should listen to events
  const isListening = listening !== undefined ? listening : true;
  
  // Calculate midpoint position for rendering
  // Our data model stores x,y as start point, but we want rotation around midpoint
  const points = shape.points;
  
  // Midpoint offset in local coordinates (before scale)
  const localOffsetX = points[2] / 2;
  const localOffsetY = points[3] / 2;
  
  // Midpoint in world coordinates (after scale and rotation)
  // Note: rotation is applied after we position at midpoint, so just apply scale here
  const midpointX = shape.x + localOffsetX * shape.scaleX;
  const midpointY = shape.y + localOffsetY * shape.scaleY;

  return (
    <Line
      // Identity
      id={shape.id}
      name="shape"
      
      // Position - midpoint (rotation pivot)
      x={midpointX}
      y={midpointY}
      
      // Points - in local coordinates
      points={points}
      
      // Offset - makes rotation happen around midpoint
      offsetX={localOffsetX}
      offsetY={localOffsetY}
      
      // Transform
      rotation={shape.rotation}
      scaleX={shape.scaleX}
      scaleY={shape.scaleY}
      
      // Visual properties
      stroke={shape.strokeColor}
      strokeWidth={shape.strokeWidth}
      opacity={shape.opacity}
      lineCap="round"
      lineJoin="round"
      
      // Interaction
      onClick={handleClick}
      onTap={handleClick}
      
      // Dragging
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      
      // Hit detection - make it easier to click thin lines
      hitStrokeWidth={Math.max(shape.strokeWidth, 10)}
      
      // Performance
      perfectDrawEnabled={false}
      listening={isListening}
      
      // Cursor
      cursor={isSelected ? 'move' : 'pointer'}
    />
  );
}

