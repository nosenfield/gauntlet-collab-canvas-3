/**
 * Marquee Box Component
 * 
 * Visual feedback for drag-to-select (marquee selection)
 * Renders a dashed rectangle showing the selection area
 */

import { Rect } from 'react-konva';

/**
 * Marquee Box Props
 */
export interface MarqueeBoxProps {
  x: number;
  y: number;
  width: number;
  height: number;
  scale?: number; // Viewport scale for zoom-independent sizing
}

/**
 * MarqueeBox Component
 * 
 * Renders a semi-transparent dashed rectangle for marquee selection
 * 
 * @param x - Top-left x position (canvas coordinates)
 * @param y - Top-left y position (canvas coordinates)
 * @param width - Width of marquee box
 * @param height - Height of marquee box
 * @param scale - Viewport scale (for zoom-independent sizing)
 */
export function MarqueeBox({ x, y, width, height, scale = 1 }: MarqueeBoxProps) {
  // Scale stroke width and dash pattern inversely with zoom
  const strokeWidth = 1 / scale;
  const dashPattern = [5 / scale, 5 / scale];
  
  return (
    <Rect
      // Position and dimensions
      x={x}
      y={y}
      width={width}
      height={height}
      
      // Visual properties (zoom-independent)
      fill="rgba(74, 144, 226, 0.1)" // Light blue with low opacity
      stroke="#4A90E2"                // Blue stroke
      strokeWidth={strokeWidth}       // 1px visual stroke (scaled)
      dash={dashPattern}              // Dashed line pattern (scaled)
      
      // Interaction
      listening={false} // Don't capture mouse events
      
      // Performance
      perfectDrawEnabled={false}
    />
  );
}

