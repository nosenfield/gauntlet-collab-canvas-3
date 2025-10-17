/**
 * Selection Handles Component
 * 
 * Displays interactive handles around selected shapes for resize and rotate operations.
 * Handles are zoom-independent (constant visual size).
 * Works with center-based rotation system.
 */

import { useRef, useState } from 'react';
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
  
  // Track live dimensions during resize for real-time visual feedback
  const [liveDimensions, setLiveDimensions] = useState<{ width: number; height: number } | null>(null);
  
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

  // Store resize data
  const resizeDataRef = useRef<{ 
    stage: Konva.Stage;
    parentGroup: Konva.Group;
    handleType: ResizeHandle;
    startMousePos: { x: number; y: number };
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  /**
   * Handle resize mouse down
   */
  const handleResizeMouseDown = (handleType: ResizeHandle) => (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    
    const stage = e.target.getStage();
    if (!stage) return;

    // Get the parent Group (which is rotated)
    const parentGroup = e.target.getParent() as Konva.Group;
    if (!parentGroup) return;

    // Get pointer position relative to the rotated group's local coordinate system
    const localPos = parentGroup.getRelativePointerPosition();
    if (!localPos) return;

    // Store resize data with starting positions in local (rotated) space
    resizeDataRef.current = {
      stage,
      parentGroup,
      handleType,
      startMousePos: localPos,  // Local coordinates
      startX: shape.x,
      startY: shape.y,
      startWidth: shape.width || 0,
      startHeight: shape.height || 0,
    };

    dragStartRef.current = {
      width: shape.width || 0,
      height: shape.height || 0,
      x: shape.x,
      y: shape.y,
      rotation: shape.rotation || 0,
    };

    // Add global mouse listeners
    const handleGlobalMouseMove = () => {
      if (!resizeDataRef.current) return;
      const { stage, parentGroup, handleType, startMousePos, startX, startY, startWidth, startHeight } = resizeDataRef.current;
      
      // Get current pointer position in the rotated group's local coordinate system
      const localPos = parentGroup.getRelativePointerPosition();
      if (!localPos) return;

      // Calculate delta in local (rotated) space
      const dx = localPos.x - startMousePos.x;
      const dy = localPos.y - startMousePos.y;

      let newWidth: number;
      let newHeight: number;
      let anchorLocalX: number;
      let anchorLocalY: number;

      // Calculate new dimensions and anchor point in LOCAL space
      switch (handleType) {
        case 'top-left':
          newWidth = startWidth - dx;
          newHeight = startHeight - dy;
          // Anchor is bottom-right in local space
          anchorLocalX = startWidth / 2;
          anchorLocalY = startHeight / 2;
          break;

        case 'top-right':
          newWidth = startWidth + dx;
          newHeight = startHeight - dy;
          // Anchor is bottom-left in local space
          anchorLocalX = -startWidth / 2;
          anchorLocalY = startHeight / 2;
          break;

        case 'bottom-left':
          newWidth = startWidth - dx;
          newHeight = startHeight + dy;
          // Anchor is top-right in local space
          anchorLocalX = startWidth / 2;
          anchorLocalY = -startHeight / 2;
          break;

        case 'bottom-right':
          newWidth = startWidth + dx;
          newHeight = startHeight + dy;
          // Anchor is top-left in local space
          anchorLocalX = -startWidth / 2;
          anchorLocalY = -startHeight / 2;
          break;
      }

      // Calculate anchor point in GLOBAL space
      const rotation = shape.rotation || 0;
      const angleRad = (rotation * Math.PI) / 180;
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);
      
      const centerX = startX + startWidth / 2;
      const centerY = startY + startHeight / 2;
      
      const anchorGlobalX = centerX + (anchorLocalX * cos - anchorLocalY * sin);
      const anchorGlobalY = centerY + (anchorLocalX * sin + anchorLocalY * cos);

      // Calculate new center to keep anchor fixed
      const absWidth = Math.abs(newWidth);
      const absHeight = Math.abs(newHeight);
      const newAnchorLocalX = (newWidth > 0 ? anchorLocalX : -anchorLocalX) * (absWidth / startWidth);
      const newAnchorLocalY = (newHeight > 0 ? anchorLocalY : -anchorLocalY) * (absHeight / startHeight);
      
      const newCenterX = anchorGlobalX - (newAnchorLocalX * cos - newAnchorLocalY * sin);
      const newCenterY = anchorGlobalY - (newAnchorLocalX * sin + newAnchorLocalY * cos);
      
      // Convert center back to top-left
      const newX = newCenterX - absWidth / 2;
      const newY = newCenterY - absHeight / 2;

      // Update live dimensions for real-time visual feedback
      setLiveDimensions({ width: absWidth, height: absHeight });

      // Apply resize with new position and dimensions
      handleResize(shape.id, absWidth, absHeight, newX, newY, { current: stage });
    };

    const handleGlobalMouseUp = () => {
      if (!resizeDataRef.current) return;
      const { stage, parentGroup, handleType, startMousePos, startX, startY, startWidth, startHeight } = resizeDataRef.current;
      
      // Get final pointer position in local (rotated) space
      const localPos = parentGroup.getRelativePointerPosition();
      if (localPos) {
        // Calculate final delta in local (rotated) space
        const dx = localPos.x - startMousePos.x;
        const dy = localPos.y - startMousePos.y;

        let newWidth: number;
        let newHeight: number;
        let anchorLocalX: number;
        let anchorLocalY: number;

        // Calculate final dimensions and anchor point in LOCAL space
        switch (handleType) {
          case 'top-left':
            newWidth = startWidth - dx;
            newHeight = startHeight - dy;
            anchorLocalX = startWidth / 2;
            anchorLocalY = startHeight / 2;
            break;

          case 'top-right':
            newWidth = startWidth + dx;
            newHeight = startHeight - dy;
            anchorLocalX = -startWidth / 2;
            anchorLocalY = startHeight / 2;
            break;

          case 'bottom-left':
            newWidth = startWidth - dx;
            newHeight = startHeight + dy;
            anchorLocalX = startWidth / 2;
            anchorLocalY = -startHeight / 2;
            break;

          case 'bottom-right':
            newWidth = startWidth + dx;
            newHeight = startHeight + dy;
            anchorLocalX = -startWidth / 2;
            anchorLocalY = -startHeight / 2;
            break;
        }

        // Calculate anchor point in GLOBAL space
        const rotation = shape.rotation || 0;
        const angleRad = (rotation * Math.PI) / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        
        const centerX = startX + startWidth / 2;
        const centerY = startY + startHeight / 2;
        
        const anchorGlobalX = centerX + (anchorLocalX * cos - anchorLocalY * sin);
        const anchorGlobalY = centerY + (anchorLocalX * sin + anchorLocalY * cos);

        // Calculate new center to keep anchor fixed
        const absWidth = Math.abs(newWidth);
        const absHeight = Math.abs(newHeight);
        const newAnchorLocalX = (newWidth > 0 ? anchorLocalX : -anchorLocalX) * (absWidth / startWidth);
        const newAnchorLocalY = (newHeight > 0 ? anchorLocalY : -anchorLocalY) * (absHeight / startHeight);
        
        const newCenterX = anchorGlobalX - (newAnchorLocalX * cos - newAnchorLocalY * sin);
        const newCenterY = anchorGlobalY - (newAnchorLocalX * sin + newAnchorLocalY * cos);
        
        // Convert center back to top-left
        const newX = newCenterX - absWidth / 2;
        const newY = newCenterY - absHeight / 2;

        // Finalize resize with new position and dimensions
        handleResizeEnd(shape.id, absWidth, absHeight, newX, newY);
      }

      // Reset live dimensions
      setLiveDimensions(null);
      dragStartRef.current = null;
      
      // Remove event listeners
      stage.off('mousemove', handleGlobalMouseMove);
      stage.off('mouseup', handleGlobalMouseUp);
      
      resizeDataRef.current = null;
      
      console.log('✅ Resize end:', handleType);
    };

    // Add event listeners to stage
    stage.on('mousemove', handleGlobalMouseMove);
    stage.on('mouseup', handleGlobalMouseUp);
    
    console.log('🎯 Resize start:', handleType);
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
  
  // Use live dimensions during resize for real-time feedback, otherwise use shape dimensions
  const currentWidth = liveDimensions?.width ?? (currentShape.width || 0);
  const currentHeight = liveDimensions?.height ?? (currentShape.height || 0);

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
        draggable={false}
        onMouseDown={handleResizeMouseDown('top-left')}
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
        draggable={false}
        onMouseDown={handleResizeMouseDown('top-right')}
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
        draggable={false}
        onMouseDown={handleResizeMouseDown('bottom-left')}
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
        draggable={false}
        onMouseDown={handleResizeMouseDown('bottom-right')}
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
