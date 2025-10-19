/**
 * PreviewCircle Component
 * 
 * Renders a temporary preview circle/ellipse during interactive drawing.
 * Shows the user what the final shape will look like as they drag.
 * 
 * Visual style matches DEFAULT_SHAPE_PROPERTIES.circle with reduced opacity
 * - Non-interactive (listening: false)
 */

import { Ellipse } from 'react-konva';
import { DEFAULT_SHAPE_PROPERTIES } from '../types';

export interface PreviewCircleProps {
  x: number;       // Center X
  y: number;       // Center Y
  radiusX: number; // Horizontal radius
  radiusY: number; // Vertical radius
}

const PREVIEW_OPACITY = 0.7;

/**
 * PreviewCircle Component
 * 
 * Temporary visual feedback during circle/ellipse drawing.
 * Styling matches final circle appearance.
 * 
 * @param x - Center X coordinate in canvas space
 * @param y - Center Y coordinate in canvas space
 * @param radiusX - Horizontal radius
 * @param radiusY - Vertical radius
 */
export function PreviewCircle({ x, y, radiusX, radiusY }: PreviewCircleProps) {
  const defaults = DEFAULT_SHAPE_PROPERTIES.circle;
  
  return (
    <Ellipse
      x={x}
      y={y}
      radiusX={radiusX}
      radiusY={radiusY}
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

