/**
 * PreviewCircle Component
 * 
 * Renders a temporary preview circle during interactive drawing.
 * Shows the user what the final circle will look like as they drag.
 * 
 * Visual style matches DEFAULT_SHAPE_PROPERTIES.circle with reduced opacity
 * - Non-interactive (listening: false)
 */

import { Circle } from 'react-konva';
import { DEFAULT_SHAPE_PROPERTIES } from '../types';

export interface PreviewCircleProps {
  x: number;      // Center X
  y: number;      // Center Y
  radius: number; // Radius
}

const PREVIEW_OPACITY = 0.7;

/**
 * PreviewCircle Component
 * 
 * Temporary visual feedback during circle drawing.
 * Styling matches final circle appearance.
 * 
 * @param x - Center X coordinate in canvas space
 * @param y - Center Y coordinate in canvas space
 * @param radius - Circle radius
 */
export function PreviewCircle({ x, y, radius }: PreviewCircleProps) {
  const defaults = DEFAULT_SHAPE_PROPERTIES.circle;
  
  return (
    <Circle
      x={x}
      y={y}
      radius={radius}
      fill={defaults.fillColor}
      stroke={defaults.strokeColor}
      strokeWidth={defaults.strokeWidth}
      opacity={PREVIEW_OPACITY}
      listening={false}
      perfectDrawEnabled={false}
      name="preview-circle"
    />
  );
}

