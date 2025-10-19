/**
 * PreviewLine Component
 * 
 * Renders a temporary preview line during interactive drawing.
 * Shows the user what the final line will look like as they drag.
 * 
 * Visual style matches DEFAULT_SHAPE_PROPERTIES.line with reduced opacity
 * - Non-interactive (listening: false)
 */

import { Line } from 'react-konva';
import { DEFAULT_SHAPE_PROPERTIES } from '../types';

export interface PreviewLineProps {
  x: number;        // Position X (start point)
  y: number;        // Position Y (start point)
  points: number[]; // [0, 0, x2, y2] - relative to (x, y)
}

const PREVIEW_OPACITY = 0.7;

/**
 * PreviewLine Component
 * 
 * Temporary visual feedback during line drawing.
 * Styling matches final line appearance.
 * 
 * @param x - Position X coordinate in canvas space (start point)
 * @param y - Position Y coordinate in canvas space (start point)
 * @param points - Line points [0, 0, x2, y2] relative to position
 */
export function PreviewLine({ x, y, points }: PreviewLineProps) {
  const defaults = DEFAULT_SHAPE_PROPERTIES.line;
  
  return (
    <Line
      x={x}
      y={y}
      points={points}
      stroke={defaults.strokeColor}
      strokeWidth={defaults.strokeWidth}
      opacity={PREVIEW_OPACITY}
      listening={false}
      perfectDrawEnabled={false}
      lineCap="round"
      lineJoin="round"
      name="preview-line"
    />
  );
}

