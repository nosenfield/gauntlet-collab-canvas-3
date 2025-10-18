/**
 * Collection Bounding Box Component
 * 
 * Renders an oriented bounding box (OBB) around a collection of selected objects
 * Displayed as a dashed blue rectangle
 */

import { Line } from 'react-konva';
import type { Point } from '../types';

/**
 * Collection Bounding Box Props
 */
export interface CollectionBoundingBoxProps {
  corners: Point[]; // 4 corner points defining the OBB [TL, TR, BR, BL]
  scale?: number; // Viewport scale for zoom-independent sizing
}

/**
 * CollectionBoundingBox Component
 * 
 * Renders a dashed rectangle showing the OBB around all selected objects
 * The OBB can be rotated to match the collection's orientation
 * 
 * Visual Style:
 * - Color: #4A90E2 (blue)
 * - Opacity: 0.5
 * - Stroke: Dashed (5px dash, 5px gap) - zoom-independent
 * - Width: 2px - zoom-independent
 * 
 * @param corners - Array of 4 corner points [TL, TR, BR, BL]
 * @param scale - Viewport scale (for zoom-independent sizing)
 */
export function CollectionBoundingBox({ corners, scale = 1 }: CollectionBoundingBoxProps) {
  // Ensure we have exactly 4 corners
  if (corners.length !== 4) {
    console.warn('[CollectionBoundingBox] Expected 4 corners, got', corners.length);
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
  
  // Scale stroke width and dash pattern inversely with zoom
  // This keeps visual appearance constant regardless of zoom level
  const strokeWidth = 2 / scale;
  const dashPattern = [5 / scale, 5 / scale];
  
  return (
    <Line
      // Points defining the rectangle
      points={points}
      closed={true}                // Close the path (connect last to first)
      
      // Visual properties (zoom-independent)
      stroke="#4A90E2"             // Blue stroke
      strokeWidth={strokeWidth}    // 2px visual stroke (scaled)
      dash={dashPattern}           // Dashed pattern (scaled)
      opacity={0.5}                // Semi-transparent
      
      // Interaction
      listening={false}            // Don't capture mouse events
      
      // Performance
      perfectDrawEnabled={false}
    />
  );
}

