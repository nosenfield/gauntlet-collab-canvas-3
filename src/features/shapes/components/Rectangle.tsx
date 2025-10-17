/**
 * Rectangle Component
 * 
 * Renders an individual rectangle shape on the canvas using Konva.
 * Handles click selection and visual feedback for selected state.
 * Selected stroke is zoom-independent (constant visual size).
 */

import { Rect } from 'react-konva';
import type Konva from 'konva';
import type { Shape } from '../../../types/firebase';
import { useSelection } from '../hooks/useSelection';
import { useTool } from '../hooks/useTool';
import { useViewport } from '../../canvas/store/viewportStore';

/**
 * Rectangle Props
 */
interface RectangleProps {
  shape: Shape;
}

/**
 * Rectangle Component
 * 
 * Renders a Konva rectangle with the shape's properties.
 */
export function Rectangle({ shape }: RectangleProps) {
  const { selectShape, isSelected } = useSelection();
  const { currentTool } = useTool();
  const { viewport } = useViewport();
  const selected = isSelected(shape.id);
  
  // Calculate zoom-independent stroke width for selection
  const selectionStrokeWidth = 3 / viewport.scale;

  // Validate shape type
  if (shape.type !== 'rectangle') {
    console.warn('Rectangle component received non-rectangle shape:', shape.type);
    return null;
  }

  // Ensure required properties exist
  if (shape.width === undefined || shape.height === undefined) {
    console.warn('Rectangle missing width or height:', shape.id);
    return null;
  }

  /**
   * Handle shape click
   */
  const handleClick = async (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only handle clicks when select tool is active
    if (currentTool !== 'select') return;

    // Stop event propagation to prevent canvas click handler
    e.cancelBubble = true;

    // If clicking an already-selected shape without shift, do nothing
    // (User likely wants to keep it selected or will start dragging)
    if (selected && !e.evt.shiftKey) {
      return;
    }

    // Check for shift key (multi-select)
    const addToSelection = e.evt.shiftKey;

    // Attempt to select shape
    await selectShape(shape.id, addToSelection);
  };

  return (
    <Rect
      // Position
      x={shape.x}
      y={shape.y}
      
      // Dimensions
      width={shape.width}
      height={shape.height}
      
      // Visual properties
      fill={shape.fillColor}
      stroke={selected ? '#4A9EFF' : shape.strokeColor}
      strokeWidth={selected ? selectionStrokeWidth : shape.strokeWidth}
      opacity={shape.opacity}
      cornerRadius={shape.borderRadius || 0}
      
      // Transform
      rotation={shape.rotation}
      
      // Performance
      perfectDrawEnabled={false}
      shadowForStrokeEnabled={false}
      
      // Interaction
      listening={true}
      onClick={handleClick}
      onTap={handleClick}  // For touch devices
      
      // Cursor
      cursor={currentTool === 'select' ? 'pointer' : 'default'}
    />
  );
}

