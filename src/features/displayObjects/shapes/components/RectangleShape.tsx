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
    if (onCollectionDragMove && isSelected) {
      const node = e.target;
      onCollectionDragMove(shape.id, node.x(), node.y());
    }
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    if (onDragEnd) {
      const node = e.target;
      onDragEnd(shape.id, node.x(), node.y());
    }
  };

  // Constrain dragging to canvas boundaries (10,000 x 10,000px)
  // Note: Position is top-left corner, so constrain to keep shape within bounds
  const dragBoundFunc = (pos: { x: number; y: number }) => {
    const CANVAS_SIZE = 10000;
    const scaledWidth = shape.width * shape.scaleX;
    const scaledHeight = shape.height * shape.scaleY;
    
    return {
      x: Math.max(0, Math.min(pos.x, CANVAS_SIZE - scaledWidth)),
      y: Math.max(0, Math.min(pos.y, CANVAS_SIZE - scaledHeight)),
    };
  };

  // Determine if shape should be draggable
  const isDraggable = draggable !== undefined ? draggable : isSelected;
  
  // Determine if shape should listen to events (can be disabled for non-driver shapes during collection drag)
  const isListening = listening !== undefined ? listening : true;
  
  return (
    <Rect
      // Identity
      id={shape.id}
      name="shape"
      
      // Position and dimensions
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      
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
      dragBoundFunc={isDraggable ? dragBoundFunc : undefined}
      
      // Performance
      perfectDrawEnabled={false}
      listening={isListening}
      
      // Cursor
      cursor={isSelected ? 'move' : 'pointer'}
    />
  );
}

