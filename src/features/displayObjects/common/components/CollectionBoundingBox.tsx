/**
 * Collection Bounding Box Component
 * 
 * Renders an axis-aligned bounding box (AABB) around a collection of selected objects
 * Displayed as a dashed blue rectangle
 */

import { Rect } from 'react-konva';
import type { AxisAlignedBoundingBox } from '../types';

/**
 * Collection Bounding Box Props
 */
export interface CollectionBoundingBoxProps {
  bounds: AxisAlignedBoundingBox;
  scale?: number; // Viewport scale for zoom-independent sizing
}

/**
 * CollectionBoundingBox Component
 * 
 * Renders a dashed rectangle showing the AABB around all selected objects
 * The AABB is always axis-aligned (doesn't rotate) and represents the smallest
 * rectangle that contains all selected objects
 * 
 * Visual Style:
 * - Color: #4A90E2 (blue)
 * - Opacity: 0.5
 * - Stroke: Dashed (5px dash, 5px gap) - zoom-independent
 * - Width: 2px - zoom-independent
 * 
 * @param bounds - The AABB to render
 * @param scale - Viewport scale (for zoom-independent sizing)
 */
export function CollectionBoundingBox({ bounds, scale = 1 }: CollectionBoundingBoxProps) {
  // Scale stroke width and dash pattern inversely with zoom
  // This keeps visual appearance constant regardless of zoom level
  const strokeWidth = 2 / scale;
  const dashPattern = [5 / scale, 5 / scale];
  
  return (
    <Rect
      // Position and dimensions
      x={bounds.x}
      y={bounds.y}
      width={bounds.width}
      height={bounds.height}
      
      // Visual properties (zoom-independent)
      fill="transparent"          // No fill
      stroke="#4A90E2"            // Blue stroke
      strokeWidth={strokeWidth}   // 2px visual stroke (scaled)
      dash={dashPattern}          // Dashed pattern (scaled)
      opacity={0.5}               // Semi-transparent
      
      // Interaction
      listening={false}           // Don't capture mouse events
      
      // Performance
      perfectDrawEnabled={false}
    />
  );
}

