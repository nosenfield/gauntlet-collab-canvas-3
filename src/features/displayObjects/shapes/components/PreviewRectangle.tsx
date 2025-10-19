/**
 * PreviewRectangle Component
 * 
 * Renders a temporary preview rectangle during interactive drawing.
 * Shows the user what the final rectangle will look like as they drag.
 * 
 * Visual style matches DEFAULT_SHAPE_PROPERTIES.rectangle with reduced opacity
 * - Non-interactive (listening: false)
 */

import { Rect } from 'react-konva';
import { DEFAULT_SHAPE_PROPERTIES } from '../types';

export interface PreviewRectangleProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

const PREVIEW_OPACITY = 0.7;

/**
 * PreviewRectangle Component
 * 
 * Temporary visual feedback during rectangle drawing.
 * Styling matches final rectangle appearance.
 * 
 * @param x - Top-left X coordinate in canvas space
 * @param y - Top-left Y coordinate in canvas space
 * @param width - Rectangle width
 * @param height - Rectangle height
 */
export function PreviewRectangle({ x, y, width, height }: PreviewRectangleProps) {
  const defaults = DEFAULT_SHAPE_PROPERTIES.rectangle;
  
  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={defaults.fillColor}
      stroke={defaults.strokeColor}
      strokeWidth={defaults.strokeWidth}
      opacity={PREVIEW_OPACITY}
      listening={false}
      perfectDrawEnabled={false}
      name="preview-rectangle"
    />
  );
}

