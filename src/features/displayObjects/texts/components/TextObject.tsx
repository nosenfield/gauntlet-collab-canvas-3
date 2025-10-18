/**
 * TextObject Component
 * 
 * Renders a single text object on the Konva canvas.
 * Handles text display with wrapping, alignment, and styling.
 */

import { Text } from 'react-konva';
import type { TextDisplayObject } from '../types';

/**
 * TextObject Props
 */
export interface TextObjectProps {
  text: TextDisplayObject;
  isSelected?: boolean;
  onClick?: (e: any) => void;
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
}: TextObjectProps): React.ReactElement {
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
      
      // Selection visual feedback
      shadowColor={isSelected ? '#4A9EFF' : undefined}
      shadowBlur={isSelected ? 6 : 0}
      shadowOpacity={isSelected ? 0.6 : 0}
      
      // Interaction
      onClick={onClick}
      onTap={onClick}
      
      // Performance
      perfectDrawEnabled={false}
      listening={true}
      
      // Cursor
      cursor={isSelected ? 'move' : 'pointer'}
    />
  );
}

