/**
 * TextObject Component
 * 
 * Renders a single text object on the Konva canvas.
 * Handles text display with wrapping, alignment, and styling.
 */

import { Text } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { TextDisplayObject } from '../types';

/**
 * TextObject Props
 */
export interface TextObjectProps {
  text: TextDisplayObject;
  isSelected?: boolean;
  onClick?: (e: any) => void;
  onCollectionDragStart?: (textId: string) => void;
  onCollectionDragMove?: (textId: string, x: number, y: number) => void;
  onDragEnd?: (textId: string, x: number, y: number) => void;
  draggable?: boolean;
  listening?: boolean;
}

/**
 * TextObject Component
 * 
 * Renders a Konva Text node with all text properties applied.
 * Supports text wrapping, alignment, font styling, and transformations.
 */
export function TextObject({
  text,
  isSelected = false,
  onClick,
  onCollectionDragStart,
  onCollectionDragMove,
  onDragEnd,
  draggable,
  listening,
}: TextObjectProps): React.ReactElement {
  
  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    if (onClick) {
      const isShiftClick = e.evt.shiftKey;
      onClick(text.id, isShiftClick);
    }
  };

  const handleDragStart = (_e: KonvaEventObject<DragEvent>) => {
    // If this is part of a collection, notify the collection drag system
    if (onCollectionDragStart && isSelected) {
      onCollectionDragStart(text.id);
    }
  };

  const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
    // If this is part of a collection, notify the collection drag system
    // Note: Konva reports CENTER position (due to our offset), convert to top-left
    if (onCollectionDragMove && isSelected) {
      const node = e.target;
      const centerX = node.x();
      const centerY = node.y();
      const halfWidth = (text.width * text.scaleX) / 2;
      const halfHeight = (text.height * text.scaleY) / 2;
      const topLeftX = centerX - halfWidth;
      const topLeftY = centerY - halfHeight;
      onCollectionDragMove(text.id, topLeftX, topLeftY);
    }
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    // Convert from center position to top-left for our data model
    if (onDragEnd) {
      const node = e.target;
      const centerX = node.x();
      const centerY = node.y();
      const halfWidth = (text.width * text.scaleX) / 2;
      const halfHeight = (text.height * text.scaleY) / 2;
      const topLeftX = centerX - halfWidth;
      const topLeftY = centerY - halfHeight;
      onDragEnd(text.id, topLeftX, topLeftY);
    }
  };

  // Determine if text should be draggable
  const isDraggable = draggable !== undefined ? draggable : isSelected;
  
  // Determine if text should listen to events
  const isListening = listening !== undefined ? listening : true;
  
  // Calculate center position for rendering (Konva rotates around center)
  const centerX = text.x + (text.width * text.scaleX) / 2;
  const centerY = text.y + (text.height * text.scaleY) / 2;
  
  return (
    <Text
      // Identity
      id={text.id}
      name="text"
      
      // Position and transform
      // Data model: x,y is top-left, but we render at center with offset for rotation
      x={centerX}
      y={centerY}
      offsetX={text.width / 2}
      offsetY={text.height / 2}
      rotation={text.rotation}
      scaleX={text.scaleX}
      scaleY={text.scaleY}
      
      // Text content and dimensions
      text={text.content}
      width={text.width}
      height={text.height}
      
      // Font properties
      fontFamily={text.fontFamily}
      fontSize={text.fontSize}
      fontStyle={text.fontWeight >= 600 ? 'bold' : 'normal'}
      
      // Text alignment and layout
      align={text.textAlign}
      lineHeight={text.lineHeight}
      verticalAlign="top"
      wrap="word"
      ellipsis={false}
      
      // Styling
      fill={text.color}
      opacity={text.opacity}
      
      // Interaction
      onClick={handleClick}
      onTap={handleClick}
      
      // Drag events
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

