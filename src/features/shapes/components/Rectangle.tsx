/**
 * Rectangle Component
 * 
 * Renders an individual rectangle shape on the canvas using Konva.
 * Handles visual representation only - interaction will be added in later tasks.
 */

import { Rect } from 'react-konva';
import type { Shape } from '../../../types/firebase';

/**
 * Rectangle Props
 */
interface RectangleProps {
  shape: Shape;
}

/**
 * Rectangle Component
 * 
 * Renders a Konva rectangle with the shape's properties.
 */
export function Rectangle({ shape }: RectangleProps) {
  // Validate shape type
  if (shape.type !== 'rectangle') {
    console.warn('Rectangle component received non-rectangle shape:', shape.type);
    return null;
  }

  // Ensure required properties exist
  if (shape.width === undefined || shape.height === undefined) {
    console.warn('Rectangle missing width or height:', shape.id);
    return null;
  }

  return (
    <Rect
      // Position
      x={shape.x}
      y={shape.y}
      
      // Dimensions
      width={shape.width}
      height={shape.height}
      
      // Visual properties
      fill={shape.fillColor}
      stroke={shape.strokeColor}
      strokeWidth={shape.strokeWidth}
      opacity={shape.opacity}
      cornerRadius={shape.borderRadius || 0}
      
      // Transform
      rotation={shape.rotation}
      
      // Performance
      perfectDrawEnabled={false}
      shadowForStrokeEnabled={false}
      
      // Interaction (disabled for now - will be added in STAGE3-4)
      listening={false}
    />
  );
}

