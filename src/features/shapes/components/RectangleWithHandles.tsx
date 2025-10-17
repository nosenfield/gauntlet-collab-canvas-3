/**
 * Rectangle With Handles Component
 * 
 * Wrapper that renders a rectangle with its selection handles.
 * Groups them together so they move in sync during transformations.
 */

import { Group, Rect } from 'react-konva';
import type Konva from 'konva';
import type { Shape } from '../../../types/firebase';
import { useSelection } from '../hooks/useSelection';
import { useTool } from '../hooks/useTool';
import { useViewport } from '../../canvas/store/viewportStore';
import { useShapeTransform } from '../hooks/useShapeTransform';
import { SelectionHandles } from './SelectionHandles';

/**
 * Rectangle With Handles Props
 */
interface RectangleWithHandlesProps {
  shape: Shape;
  renderHandles?: boolean; // Whether to render handles (default: true for backward compatibility)
}

/**
 * Rectangle With Handles Component
 * 
 * Wraps Rectangle and SelectionHandles in a Group for synchronized movement.
 */
export function RectangleWithHandles({ shape, renderHandles = true }: RectangleWithHandlesProps) {
  const { selectShape, isSelected } = useSelection();
  const { currentTool } = useTool();
  const { viewport } = useViewport();
  const { handleDragStart, handleDragMove, handleDragEnd } = useShapeTransform();
  const selected = isSelected(shape.id);
  
  // Calculate zoom-independent stroke width for selection
  const selectionStrokeWidth = 3 / viewport.scale;
  
  // Shape is draggable only when selected and select tool is active
  const isDraggable = selected && currentTool === 'select';

  // Validate shape type
  if (shape.type !== 'rectangle') {
    console.warn('RectangleWithHandles received non-rectangle shape:', shape.type);
    return null;
  }

  // Ensure required properties exist
  if (shape.width === undefined || shape.height === undefined) {
    console.warn('Rectangle missing width or height:', shape.id);
    return null;
  }

  // Calculate center position for group
  const centerX = shape.x + shape.width / 2;
  const centerY = shape.y + shape.height / 2;

  /**
   * Handle shape click
   */
  const handleClick = async (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only handle clicks when select tool is active
    if (currentTool !== 'select') return;

    // Stop event propagation to prevent canvas click handler
    e.cancelBubble = true;

    // If clicking an already-selected shape without shift, do nothing
    if (selected && !e.evt.shiftKey) {
      return;
    }

    // Check for shift key (multi-select)
    const addToSelection = e.evt.shiftKey;

    // Attempt to select shape
    await selectShape(shape.id, addToSelection);
  };

  return (
    <Group
      // ID for finding this node from other components
      id={`shape-${shape.id}`}
      // Position at center
      x={centerX}
      y={centerY}
      // Rotation
      rotation={shape.rotation}
      // Drag
      draggable={isDraggable}
      onDragStart={() => handleDragStart(shape.id)}
      onDragMove={(e) => handleDragMove(shape.id, e)}
      onDragEnd={(e) => handleDragEnd(shape.id, e)}
    >
      {/* Rectangle - positioned relative to center */}
      <Rect
        // Position relative to group center
        x={-shape.width / 2}
        y={-shape.height / 2}
        
        // Dimensions
        width={shape.width}
        height={shape.height}
        
        // Visual properties
        fill={shape.fillColor}
        stroke={selected ? '#4A9EFF' : shape.strokeColor}
        strokeWidth={selected ? selectionStrokeWidth : shape.strokeWidth}
        opacity={shape.opacity}
        cornerRadius={shape.borderRadius || 0}
        
        // Performance
        perfectDrawEnabled={false}
        shadowForStrokeEnabled={false}
        
        // Interaction
        listening={true}
        onClick={handleClick}
        onTap={handleClick}
        
        // Cursor
        cursor={isDraggable ? 'move' : currentTool === 'select' ? 'pointer' : 'default'}
      />

      {/* Selection Handles - only render when selected and renderHandles is true */}
      {selected && renderHandles && (
        <SelectionHandles shape={shape} />
      )}
    </Group>
  );
}

