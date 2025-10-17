/**
 * Selection Handles Component
 * 
 * Displays visual handles around selected shapes.
 * Shows corners for future resize functionality (STAGE3-5).
 * Handles are zoom-independent (constant visual size).
 */

import { Group, Rect, Circle } from 'react-konva';
import type { Shape } from '../../../types/firebase';
import { useViewport } from '../../canvas/store/viewportStore';

/**
 * Selection Handles Props
 */
interface SelectionHandlesProps {
  shape: Shape;
}

/**
 * Handle size in pixels
 */
const HANDLE_SIZE = 8;
const HANDLE_COLOR = '#4A9EFF';
const SELECTION_STROKE = '#4A9EFF';
const SELECTION_STROKE_WIDTH = 2;

/**
 * Selection Handles Component
 * 
 * Renders a selection box with corner handles around a shape.
 * Currently visual only - drag/resize functionality comes in STAGE3-5.
 */
export function SelectionHandles({ shape }: SelectionHandlesProps) {
  const { viewport } = useViewport();
  
  // Calculate zoom-independent sizes
  const handleRadius = (HANDLE_SIZE / 2) / viewport.scale;
  const strokeWidth = SELECTION_STROKE_WIDTH / viewport.scale;
  const handleStrokeWidth = 2 / viewport.scale;
  const dashPattern = [5 / viewport.scale, 5 / viewport.scale];
  
  // Calculate bounds based on shape type
  let x = shape.x;
  let y = shape.y;
  let width = 0;
  let height = 0;

  if (shape.type === 'rectangle') {
    width = shape.width || 0;
    height = shape.height || 0;
  } else if (shape.type === 'circle') {
    const radius = shape.radius || 0;
    x = shape.x - radius;
    y = shape.y - radius;
    width = radius * 2;
    height = radius * 2;
  } else if (shape.type === 'line' && shape.points && shape.points.length >= 4) {
    const [x1, y1, x2, y2] = shape.points;
    x = Math.min(x1, x2);
    y = Math.min(y1, y2);
    width = Math.abs(x2 - x1);
    height = Math.abs(y2 - y1);
  }

  return (
    <Group>
      {/* Selection Box */}
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        stroke={SELECTION_STROKE}
        strokeWidth={strokeWidth}
        dash={dashPattern}
        listening={false}
        perfectDrawEnabled={false}
      />

      {/* Corner Handles */}
      {/* Top-Left */}
      <Circle
        x={x}
        y={y}
        radius={handleRadius}
        fill="white"
        stroke={HANDLE_COLOR}
        strokeWidth={handleStrokeWidth}
        listening={false}
        perfectDrawEnabled={false}
      />

      {/* Top-Right */}
      <Circle
        x={x + width}
        y={y}
        radius={handleRadius}
        fill="white"
        stroke={HANDLE_COLOR}
        strokeWidth={handleStrokeWidth}
        listening={false}
        perfectDrawEnabled={false}
      />

      {/* Bottom-Left */}
      <Circle
        x={x}
        y={y + height}
        radius={handleRadius}
        fill="white"
        stroke={HANDLE_COLOR}
        strokeWidth={handleStrokeWidth}
        listening={false}
        perfectDrawEnabled={false}
      />

      {/* Bottom-Right */}
      <Circle
        x={x + width}
        y={y + height}
        radius={handleRadius}
        fill="white"
        stroke={HANDLE_COLOR}
        strokeWidth={handleStrokeWidth}
        listening={false}
        perfectDrawEnabled={false}
      />

      {/* Rotation Handle (top-center) - for future use */}
      <Circle
        x={x + width / 2}
        y={y - 20 / viewport.scale}
        radius={handleRadius}
        fill="white"
        stroke={HANDLE_COLOR}
        strokeWidth={handleStrokeWidth}
        listening={false}
        perfectDrawEnabled={false}
      />
    </Group>
  );
}

