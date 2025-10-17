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
 * - Stroke: Dashed (5px dash, 5px gap)
 * - Width: 2px
 * 
 * @param bounds - The AABB to render
 */
export function CollectionBoundingBox({ bounds }: CollectionBoundingBoxProps) {
  return (
    <Rect
      // Position and dimensions
      x={bounds.x}
      y={bounds.y}
      width={bounds.width}
      height={bounds.height}
      
      // Visual properties
      fill="transparent"          // No fill
      stroke="#4A90E2"            // Blue stroke
      strokeWidth={2}             // 2px stroke
      dash={[5, 5]}               // Dashed pattern (5px dash, 5px gap)
      opacity={0.5}               // Semi-transparent
      
      // Interaction
      listening={false}           // Don't capture mouse events
      
      // Performance
      perfectDrawEnabled={false}
    />
  );
}

