/**
 * DrawingPreview Component
 * 
 * Renders preview shapes while drawing.
 * Shows temporary shapes during drag operations.
 */

import React from 'react';
import { Rect } from 'react-konva';
import type { Point, DrawingTool } from '@/types';

/**
 * DrawingPreview component props
 */
interface DrawingPreviewProps {
  isDrawing: boolean;
  drawStart: Point | null;
  drawCurrent: Point | null;
  tool: DrawingTool;
  userColor: string;
}

/**
 * DrawingPreview component
 */
export const DrawingPreview: React.FC<DrawingPreviewProps> = ({
  isDrawing,
  drawStart,
  drawCurrent,
  tool,
  userColor
}) => {
  // Only render preview for rectangle tool
  if (!isDrawing || !drawStart || !drawCurrent || tool.activeTool !== 'rectangle') {
    return null;
  }

  const x = Math.min(drawStart.x, drawCurrent.x);
  const y = Math.min(drawStart.y, drawCurrent.y);
  const width = Math.abs(drawCurrent.x - drawStart.x);
  const height = Math.abs(drawCurrent.y - drawStart.y);

  return (
    <Rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={userColor}
      stroke="#000000"
      strokeWidth={1}
      opacity={0.7}
      listening={false}
    />
  );
};
