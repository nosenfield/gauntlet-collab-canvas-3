/**
 * Rectangle Shape Component
 * 
 * Renders a rectangle shape on the Konva canvas
 */

import { Rect } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { RectangleShape as RectangleShapeType } from '../types';

/**
 * Rectangle Shape Props
 */
interface RectangleShapeProps {
  shape: RectangleShapeType;
  isSelected?: boolean;
  onClick?: (shapeId: string, isShiftClick: boolean) => void;
  onDragEnd?: (shapeId: string, x: number, y: number) => void;
  draggable?: boolean; // Override draggable state
  onCollectionDragStart?: (shapeId: string) => void; // For collection dragging start
  onCollectionDragMove?: (shapeId: string, x: number, y: number) => void; // For collection dragging move
  listening?: boolean; // Override listening state (disable events on non-driver shapes during collection drag)
}

/**
 * RectangleShape Component
 * 
 * Renders a rectangle with Konva.js
 * Supports selection, transformation, and styling
 * Supports both individual and collection dragging using Konva's draggable
 */
export function RectangleShape({ 
  shape, 
  isSelected = false,
  onClick,
  onDragEnd,
  draggable,
  onCollectionDragStart,
  onCollectionDragMove,
  listening,
}: RectangleShapeProps) {
  
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
    // Note: Konva reports CENTER position (due to our offset), convert to top-left
    if (onCollectionDragMove && isSelected) {
      const node = e.target;
      const centerX = node.x();
      const centerY = node.y();
      const halfWidth = (shape.width * shape.scaleX) / 2;
      const halfHeight = (shape.height * shape.scaleY) / 2;
      const topLeftX = centerX - halfWidth;
      const topLeftY = centerY - halfHeight;
      onCollectionDragMove(shape.id, topLeftX, topLeftY);
    }
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    // Convert from center position to top-left for our data model
    if (onDragEnd) {
      const node = e.target;
      const centerX = node.x();
      const centerY = node.y();
      const halfWidth = (shape.width * shape.scaleX) / 2;
      const halfHeight = (shape.height * shape.scaleY) / 2;
      const topLeftX = centerX - halfWidth;
      const topLeftY = centerY - halfHeight;
      onDragEnd(shape.id, topLeftX, topLeftY);
    }
  };

  // Determine if shape should be draggable
  const isDraggable = draggable !== undefined ? draggable : isSelected;
  
  // Determine if shape should listen to events (can be disabled for non-driver shapes during collection drag)
  const isListening = listening !== undefined ? listening : true;
  
  // Calculate center position for rendering
  // Our data model stores x,y as top-left, but we want rotation around center
  // The offset is in the shape's local coordinate system (before scale)
  const centerX = shape.x + (shape.width * shape.scaleX) / 2;
  const centerY = shape.y + (shape.height * shape.scaleY) / 2;
  
  return (
    <Rect
      // Identity
      id={shape.id}
      name="shape"
      
      // Position - center point (rotation pivot)
      x={centerX}
      y={centerY}
      width={shape.width}
      height={shape.height}
      
      // Offset - in local coordinates (before scale), makes rotation happen around center
      offsetX={shape.width / 2}
      offsetY={shape.height / 2}
      
      // Transform
      rotation={shape.rotation}
      scaleX={shape.scaleX}
      scaleY={shape.scaleY}
      
      // Visual properties
      fill={shape.fillColor}
      stroke={shape.strokeColor}
      strokeWidth={shape.strokeWidth}
      opacity={shape.opacity}
      cornerRadius={shape.borderRadius || 0}
      
      // Selection state
      shadowEnabled={isSelected}
      shadowColor="#4A90E2"
      shadowBlur={isSelected ? 10 : 0}
      shadowOpacity={isSelected ? 0.6 : 0}
      
      // Interaction
      onClick={handleClick}
      onTap={handleClick}
      
      // Dragging - use Konva's built-in draggable with collection support
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

