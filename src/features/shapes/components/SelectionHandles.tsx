/**
 * Selection Handles Component
 * 
 * Displays interactive handles around selected shapes for resize and rotate operations.
 * Handles are zoom-independent (constant visual size).
 * Works with center-based rotation system.
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
   * Note: Resize works best on non-rotated shapes. For rotated shapes, consider resetting rotation first.
   */
  const handleResizeDragMove = (
    handleType: ResizeHandle,
    e: Konva.KonvaEventObject<DragEvent>
  ) => {
    if (!dragStartRef.current) return;

    const node = e.target;
    
    // Get absolute position of handle in world coordinates
    const handlePos = node.getAbsolutePosition();

    const { width: originalWidth, height: originalHeight, x: originalX, y: originalY } = dragStartRef.current;

    let newWidth = originalWidth;
    let newHeight = originalHeight;
    let newX = originalX;
    let newY = originalY;

    // Calculate new dimensions based on which handle is being dragged
    // For non-rotated shapes, this works perfectly
    // For rotated shapes, dimensions will be in axis-aligned space
    switch (handleType) {
      case 'top-left':
        newWidth = originalX + originalWidth - handlePos.x;
        newHeight = originalY + originalHeight - handlePos.y;
        newX = handlePos.x;
        newY = handlePos.y;
        break;

      case 'top-right':
        newWidth = handlePos.x - originalX;
        newHeight = originalY + originalHeight - handlePos.y;
        newY = handlePos.y;
        break;

      case 'bottom-left':
        newWidth = originalX + originalWidth - handlePos.x;
        newHeight = handlePos.y - originalY;
        newX = handlePos.x;
        break;

      case 'bottom-right':
        newWidth = handlePos.x - originalX;
        newHeight = handlePos.y - originalY;
        break;
    }

    // Get stage for optimistic updates
    const stage = node.getStage();

    // Apply resize with stage reference for optimistic updates
    handleResize(shape.id, newWidth, newHeight, newX, newY, stage ? { current: stage } : undefined);
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
    
    // Get absolute position of handle in world coordinates
    const handlePos = node.getAbsolutePosition();

    const { width: originalWidth, height: originalHeight, x: originalX, y: originalY } = dragStartRef.current;

    let newWidth = originalWidth;
    let newHeight = originalHeight;
    let newX = originalX;
    let newY = originalY;

    // Calculate final dimensions
    switch (handleType) {
      case 'top-left':
        newWidth = originalX + originalWidth - handlePos.x;
        newHeight = originalY + originalHeight - handlePos.y;
        newX = handlePos.x;
        newY = handlePos.y;
        break;

      case 'top-right':
        newWidth = handlePos.x - originalX;
        newHeight = originalY + originalHeight - handlePos.y;
        newY = handlePos.y;
        break;

      case 'bottom-left':
        newWidth = originalX + originalWidth - handlePos.x;
        newHeight = handlePos.y - originalY;
        newX = handlePos.x;
        break;

      case 'bottom-right':
        newWidth = handlePos.x - originalX;
        newHeight = handlePos.y - originalY;
        break;
    }

    // Finalize resize
    handleResizeEnd(shape.id, newWidth, newHeight, newX, newY);
    dragStartRef.current = null;
    console.log('✅ Resize end:', handleType);
  };

  // Store stage and center position for rotation
  const rotationDataRef = useRef<{ stage: Konva.Stage; centerPos: { x: number; y: number } } | null>(null);

  /**
   * Handle rotation mouse down
   */
  const handleRotateMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    
    const stage = e.target.getStage();
    if (!stage) return;

    // Get absolute position of shape center
    const parentGroup = e.target.getParent()?.getParent() as Konva.Group;
    if (!parentGroup) return;
    
    const centerPos = parentGroup.getAbsolutePosition();
    
    // Store rotation data
    rotationDataRef.current = { stage, centerPos };
    
    dragStartRef.current = {
      width: shape.width || 0,
      height: shape.height || 0,
      x: shape.x,
      y: shape.y,
      rotation: shape.rotation || 0,
    };
    
    // Add stage-level event listeners for global mouse tracking
    const handleGlobalMouseMove = () => {
      if (!rotationDataRef.current) return;
      const { stage, centerPos } = rotationDataRef.current;
      
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      // Calculate angle from center to mouse
      const dx = pointerPos.x - centerPos.x;
      const dy = pointerPos.y - centerPos.y;
      const angleRadians = Math.atan2(dy, dx);
      const angleDegrees = (angleRadians * 180) / Math.PI + 90; // +90 to align with top

      // Apply rotation with stage reference for optimistic updates
      handleRotate(shape.id, angleDegrees, { current: stage });
    };

    const handleGlobalMouseUp = () => {
      if (!rotationDataRef.current) return;
      const { stage, centerPos } = rotationDataRef.current;
      
      const pointerPos = stage.getPointerPosition();
      if (pointerPos) {
        // Calculate final angle
        const dx = pointerPos.x - centerPos.x;
        const dy = pointerPos.y - centerPos.y;
        const angleRadians = Math.atan2(dy, dx);
        const angleDegrees = (angleRadians * 180) / Math.PI + 90;

        // Finalize rotation
        handleRotateEnd(shape.id, angleDegrees);
      }
      
      dragStartRef.current = null;
      
      // Remove event listeners
      stage.off('mousemove', handleGlobalMouseMove);
      stage.off('mouseup', handleGlobalMouseUp);
      
      rotationDataRef.current = null;
      
      console.log('✅ Rotate end');
    };

    // Add event listeners to stage for global tracking
    stage.on('mousemove', handleGlobalMouseMove);
    stage.on('mouseup', handleGlobalMouseUp);
    
    console.log('🎯 Rotate start');
  };

  // Get current shape data (may be updated during transformations)
  const currentShape = shapes.find((s) => s.id === shape.id) || shape;
  const currentWidth = currentShape.width || 0;
  const currentHeight = currentShape.height || 0;

  return (
    <Group>
      {/* Note: Parent Group is already positioned at center and rotated */}
      {/* Selection Box - positioned relative to center */}
      <Rect
        x={-currentWidth / 2}
        y={-currentHeight / 2}
        width={currentWidth}
        height={currentHeight}
        stroke={SELECTION_STROKE}
        strokeWidth={strokeWidth}
        dash={dashPattern}
        listening={false}
        perfectDrawEnabled={false}
      />

      {/* Corner Handles - positioned at corners relative to center */}
      {/* Top-Left */}
      <Circle
        x={-currentWidth / 2}
        y={-currentHeight / 2}
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
        x={currentWidth / 2}
        y={-currentHeight / 2}
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
        x={-currentWidth / 2}
        y={currentHeight / 2}
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
        x={currentWidth / 2}
        y={currentHeight / 2}
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

      {/* Rotation Handle (top-center, above shape) */}
      <Circle
        x={0}
        y={-currentHeight / 2 - rotationDistance}
        radius={handleRadius}
        fill="white"
        stroke={HANDLE_COLOR}
        strokeWidth={handleStrokeWidth}
        draggable={false}
        onMouseDown={handleRotateMouseDown}
        cursor="crosshair"
        perfectDrawEnabled={false}
      />
    </Group>
  );
}
