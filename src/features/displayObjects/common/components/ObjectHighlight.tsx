/**
 * Object Highlight Component
 * 
 * Renders an oriented bounding box (OBB) around a selected object
 * Displayed as a solid blue outline that rotates with the object
 */

import { Line } from 'react-konva';
import type { Point } from '../types';

/**
 * Object Highlight Props
 */
export interface ObjectHighlightProps {
  corners: Point[]; // 4 corner points defining the OBB [TL, TR, BR, BL]
}

/**
 * ObjectHighlight Component
 * 
 * Renders a solid rectangle showing the OBB around a selected object
 * The OBB rotates with the object and provides accurate visual feedback
 * for the object's actual bounds
 * 
 * Visual Style:
 * - Color: #4A90E2 (blue)
 * - Opacity: 1.0 (fully opaque)
 * - Stroke: Solid
 * - Width: 2px
 * 
 * @param corners - Array of 4 corner points [TL, TR, BR, BL]
 */
export function ObjectHighlight({ corners }: ObjectHighlightProps) {
  // Ensure we have exactly 4 corners
  if (corners.length !== 4) {
    console.warn('[ObjectHighlight] Expected 4 corners, got', corners.length);
    return null;
  }
  
  // Convert corners to flat array of coordinates for Konva Line
  // Line needs [x1, y1, x2, y2, ...] format
  const points = [
    corners[0].x, corners[0].y, // Top-left
    corners[1].x, corners[1].y, // Top-right
    corners[2].x, corners[2].y, // Bottom-right
    corners[3].x, corners[3].y, // Bottom-left
  ];
  
  return (
    <Line
      // Points defining the rectangle
      points={points}
      closed={true}              // Close the path (connect last to first)
      
      // Visual properties
      stroke="#4A90E2"           // Blue stroke
      strokeWidth={2}            // 2px stroke
      opacity={1.0}              // Fully opaque
      
      // Interaction
      listening={false}          // Don't capture mouse events
      
      // Performance
      perfectDrawEnabled={false}
    />
  );
}

