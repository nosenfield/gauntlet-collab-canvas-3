/**
 * Rectangle Shape Component
 * 
 * Renders a rectangle shape on the Konva canvas
 */

import { Rect } from 'react-konva';
import type { RectangleShape as RectangleShapeType } from '../types';

/**
 * Rectangle Shape Props
 */
interface RectangleShapeProps {
  shape: RectangleShapeType;
  isSelected?: boolean;
  onClick?: (shapeId: string) => void;
  onTransform?: (shapeId: string, updates: Partial<RectangleShapeType>) => void;
}

/**
 * RectangleShape Component
 * 
 * Renders a rectangle with Konva.js
 * Supports selection, transformation, and styling
 */
export function RectangleShape({ 
  shape, 
  isSelected = false,
  onClick,
}: RectangleShapeProps) {
  
  const handleClick = () => {
    if (onClick) {
      onClick(shape.id);
    }
  };

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
      
      // Performance
      perfectDrawEnabled={false}
      listening={true}
      
      // Cursor
      cursor="pointer"
    />
  );
}

