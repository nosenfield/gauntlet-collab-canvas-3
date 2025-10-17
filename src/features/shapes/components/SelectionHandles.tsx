/**
 * Selection Handles Component
 * 
 * Displays interactive handles around selected shapes for resize and rotate operations.
 * Handles are zoom-independent (constant visual size).
 */

import { useRef } from 'react';
import { Group, Rect, Circle } from 'react-konva';
import type Konva from 'konva';
import type { Shape } from '../../../types/firebase';
import { useViewport } from '../../canvas/store/viewportStore';
import { useShapeTransform } from '../hooks/useShapeTransform';
import { useShapes } from '../hooks/useShapes';

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
const ROTATION_HANDLE_DISTANCE = 20; // Distance above shape in pixels

/**
 * Handle types for resize
 */
type ResizeHandle = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * Selection Handles Component
 * 
 * Renders a selection box with interactive corner handles for resize
 * and a top handle for rotation.
 */
export function SelectionHandles({ shape }: SelectionHandlesProps) {
  const { viewport } = useViewport();
  const { handleResize, handleResizeEnd, handleRotate, handleRotateEnd } = useShapeTransform();
  const { shapes } = useShapes();
  
  // Store initial state for resize/rotate operations
  const dragStartRef = useRef<{
    width: number;
    height: number;
    x: number;
    y: number;
    rotation: number;
  } | null>(null);

  // Calculate zoom-independent sizes
  const handleRadius = (HANDLE_SIZE / 2) / viewport.scale;
  const strokeWidth = SELECTION_STROKE_WIDTH / viewport.scale;
  const handleStrokeWidth = 2 / viewport.scale;
  const dashPattern = [5 / viewport.scale, 5 / viewport.scale];
  const rotationDistance = ROTATION_HANDLE_DISTANCE / viewport.scale;

  /**
   * Handle resize drag start
   */
  const handleResizeDragStart = (handleType: ResizeHandle) => {
    dragStartRef.current = {
      width: shape.width || 0,
      height: shape.height || 0,
      x: shape.x,
      y: shape.y,
      rotation: shape.rotation || 0,
    };
    console.log('🎯 Resize start:', handleType);
  };

  /**
   * Handle resize drag move
   */
  const handleResizeDragMove = (
    handleType: ResizeHandle,
    e: Konva.KonvaEventObject<DragEvent>
  ) => {
    if (!dragStartRef.current) return;

    const node = e.target;
    const newHandleX = node.x();
    const newHandleY = node.y();

    const { width: originalWidth, height: originalHeight, x: originalX, y: originalY } = dragStartRef.current;

    let newWidth = originalWidth;
    let newHeight = originalHeight;
    let newX = originalX;
    let newY = originalY;

    // Calculate new dimensions based on which handle is being dragged
    switch (handleType) {
      case 'top-left':
        newWidth = originalX + originalWidth - newHandleX;
        newHeight = originalY + originalHeight - newHandleY;
        newX = newHandleX;
        newY = newHandleY;
        break;

      case 'top-right':
        newWidth = newHandleX - originalX;
        newHeight = originalY + originalHeight - newHandleY;
        newY = newHandleY;
        break;

      case 'bottom-left':
        newWidth = originalX + originalWidth - newHandleX;
        newHeight = newHandleY - originalY;
        newX = newHandleX;
        break;

      case 'bottom-right':
        newWidth = newHandleX - originalX;
        newHeight = newHandleY - originalY;
        break;
    }

    // Apply resize
    handleResize(shape.id, newWidth, newHeight, newX, newY);
  };

  /**
   * Handle resize drag end
   */
  const handleResizeDragEnd = (
    handleType: ResizeHandle,
    e: Konva.KonvaEventObject<DragEvent>
  ) => {
    if (!dragStartRef.current) return;

    const node = e.target;
    const newHandleX = node.x();
    const newHandleY = node.y();

    const { width: originalWidth, height: originalHeight, x: originalX, y: originalY } = dragStartRef.current;

    let newWidth = originalWidth;
    let newHeight = originalHeight;
    let newX = originalX;
    let newY = originalY;

    // Calculate final dimensions
    switch (handleType) {
      case 'top-left':
        newWidth = originalX + originalWidth - newHandleX;
        newHeight = originalY + originalHeight - newHandleY;
        newX = newHandleX;
        newY = newHandleY;
        break;

      case 'top-right':
        newWidth = newHandleX - originalX;
        newHeight = originalY + originalHeight - newHandleY;
        newY = newHandleY;
        break;

      case 'bottom-left':
        newWidth = originalX + originalWidth - newHandleX;
        newHeight = newHandleY - originalY;
        newX = newHandleX;
        break;

      case 'bottom-right':
        newWidth = newHandleX - originalX;
        newHeight = newHandleY - originalY;
        break;
    }

    // Finalize resize
    handleResizeEnd(shape.id, newWidth, newHeight, newX, newY);
    dragStartRef.current = null;
    console.log('✅ Resize end:', handleType);
  };

  /**
   * Handle rotation drag start
   */
  const handleRotateDragStart = () => {
    dragStartRef.current = {
      width: shape.width || 0,
      height: shape.height || 0,
      x: shape.x,
      y: shape.y,
      rotation: shape.rotation || 0,
    };
    console.log('🎯 Rotate start');
  };

  /**
   * Handle rotation drag move
   */
  const handleRotateDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!dragStartRef.current) return;

    const node = e.target;
    const handleX = node.x();
    const handleY = node.y();

    // Calculate center of shape
    const centerX = shape.x + (shape.width || 0) / 2;
    const centerY = shape.y + (shape.height || 0) / 2;

    // Calculate angle from center to handle
    const dx = handleX - centerX;
    const dy = handleY - centerY;
    const angleRadians = Math.atan2(dy, dx);
    const angleDegrees = (angleRadians * 180) / Math.PI + 90; // +90 to align with top

    // Apply rotation
    handleRotate(shape.id, angleDegrees);
  };

  /**
   * Handle rotation drag end
   */
  const handleRotateDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (!dragStartRef.current) return;

    const node = e.target;
    const handleX = node.x();
    const handleY = node.y();

    // Calculate final rotation
    const centerX = shape.x + (shape.width || 0) / 2;
    const centerY = shape.y + (shape.height || 0) / 2;
    const dx = handleX - centerX;
    const dy = handleY - centerY;
    const angleRadians = Math.atan2(dy, dx);
    const angleDegrees = (angleRadians * 180) / Math.PI + 90;

    // Finalize rotation
    handleRotateEnd(shape.id, angleDegrees);
    dragStartRef.current = null;
    console.log('✅ Rotate end');
  };

  // Get current shape data (may be updated during drag)
  const currentShape = shapes.find((s) => s.id === shape.id) || shape;
  const currentX = currentShape.x;
  const currentY = currentShape.y;
  const currentWidth = currentShape.width || 0;
  const currentHeight = currentShape.height || 0;

  return (
    <Group>
      {/* Selection Box */}
      <Rect
        x={currentX}
        y={currentY}
        width={currentWidth}
        height={currentHeight}
        stroke={SELECTION_STROKE}
        strokeWidth={strokeWidth}
        dash={dashPattern}
        listening={false}
        perfectDrawEnabled={false}
      />

      {/* Corner Handles - Resize */}
      {/* Top-Left */}
      <Circle
        x={currentX}
        y={currentY}
        radius={handleRadius}
        fill="white"
        stroke={HANDLE_COLOR}
        strokeWidth={handleStrokeWidth}
        draggable={true}
        onDragStart={() => handleResizeDragStart('top-left')}
        onDragMove={(e) => handleResizeDragMove('top-left', e)}
        onDragEnd={(e) => handleResizeDragEnd('top-left', e)}
        cursor="nwse-resize"
        perfectDrawEnabled={false}
      />

      {/* Top-Right */}
      <Circle
        x={currentX + currentWidth}
        y={currentY}
        radius={handleRadius}
        fill="white"
        stroke={HANDLE_COLOR}
        strokeWidth={handleStrokeWidth}
        draggable={true}
        onDragStart={() => handleResizeDragStart('top-right')}
        onDragMove={(e) => handleResizeDragMove('top-right', e)}
        onDragEnd={(e) => handleResizeDragEnd('top-right', e)}
        cursor="nesw-resize"
        perfectDrawEnabled={false}
      />

      {/* Bottom-Left */}
      <Circle
        x={currentX}
        y={currentY + currentHeight}
        radius={handleRadius}
        fill="white"
        stroke={HANDLE_COLOR}
        strokeWidth={handleStrokeWidth}
        draggable={true}
        onDragStart={() => handleResizeDragStart('bottom-left')}
        onDragMove={(e) => handleResizeDragMove('bottom-left', e)}
        onDragEnd={(e) => handleResizeDragEnd('bottom-left', e)}
        cursor="nesw-resize"
        perfectDrawEnabled={false}
      />

      {/* Bottom-Right */}
      <Circle
        x={currentX + currentWidth}
        y={currentY + currentHeight}
        radius={handleRadius}
        fill="white"
        stroke={HANDLE_COLOR}
        strokeWidth={handleStrokeWidth}
        draggable={true}
        onDragStart={() => handleResizeDragStart('bottom-right')}
        onDragMove={(e) => handleResizeDragMove('bottom-right', e)}
        onDragEnd={(e) => handleResizeDragEnd('bottom-right', e)}
        cursor="nwse-resize"
        perfectDrawEnabled={false}
      />

      {/* Rotation Handle (top-center) */}
      <Circle
        x={currentX + currentWidth / 2}
        y={currentY - rotationDistance}
        radius={handleRadius}
        fill="white"
        stroke={HANDLE_COLOR}
        strokeWidth={handleStrokeWidth}
        draggable={true}
        onDragStart={handleRotateDragStart}
        onDragMove={handleRotateDragMove}
        onDragEnd={handleRotateDragEnd}
        cursor="crosshair"
        perfectDrawEnabled={false}
      />
    </Group>
  );
}
