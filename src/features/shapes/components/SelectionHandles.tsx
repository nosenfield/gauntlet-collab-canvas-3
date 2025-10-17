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

  // Store resize data
  const resizeDataRef = useRef<{ 
    stage: Konva.Stage; 
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

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Store resize data with absolute starting positions
    resizeDataRef.current = {
      stage,
      handleType,
      startMousePos: pointerPos,
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
      const { stage, handleType, startMousePos, startX, startY, startWidth, startHeight } = resizeDataRef.current;
      
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      // Calculate delta from start position (in screen coordinates)
      const screenDx = pointerPos.x - startMousePos.x;
      const screenDy = pointerPos.y - startMousePos.y;
      
      // Convert to canvas coordinates by dividing by zoom scale
      const dx = screenDx / viewport.scale;
      const dy = screenDy / viewport.scale;

      let newWidth: number;
      let newHeight: number;
      let newX: number | undefined;
      let newY: number | undefined;

      // Calculate new dimensions based on which handle and mouse delta
      // Key: anchor point (opposite corner) stays fixed
      // Allow negative dimensions to support flipping
      switch (handleType) {
        case 'top-left':
          // Anchor: bottom-right stays at (startX + startWidth, startY + startHeight)
          newWidth = startWidth - dx;
          newHeight = startHeight - dy;
          // Handle flipping: adjust position when dimensions go negative
          if (newWidth < 0) {
            newX = startX + startWidth;  // Anchor becomes new origin
          } else {
            newX = startX + dx;
          }
          if (newHeight < 0) {
            newY = startY + startHeight;
          } else {
            newY = startY + dy;
          }
          break;

        case 'top-right':
          // Anchor: bottom-left stays at (startX, startY + startHeight)
          newWidth = startWidth + dx;
          newHeight = startHeight - dy;
          // Handle horizontal flipping (same logic as bottom-right)
          if (newWidth < 0) {
            newX = startX + newWidth;  // Move origin left from anchor
          } else {
            newX = startX;  // Normal: X doesn't change
          }
          // Handle vertical flipping (same logic as top-left)
          if (newHeight < 0) {
            newY = startY + startHeight;
          } else {
            newY = startY + dy;
          }
          break;

        case 'bottom-left':
          // Anchor: top-right stays at (startX + startWidth, startY)
          newWidth = startWidth - dx;
          newHeight = startHeight + dy;
          // Handle horizontal flipping (same logic as top-left)
          if (newWidth < 0) {
            newX = startX + startWidth;  // Anchor becomes new origin
          } else {
            newX = startX + dx;
          }
          // Handle vertical flipping (same logic as bottom-right)
          if (newHeight < 0) {
            newY = startY + newHeight;  // Move origin up from anchor
          } else {
            newY = startY;  // Normal: Y doesn't change
          }
          break;

        case 'bottom-right':
          // Anchor: top-left stays at (startX, startY)
          newWidth = startWidth + dx;
          newHeight = startHeight + dy;
          // Handle horizontal flipping (dragged left past anchor)
          if (newWidth < 0) {
            newX = startX + newWidth;  // Move origin left from anchor
          } else {
            newX = startX;  // Normal: X doesn't change
          }
          // Handle vertical flipping (dragged up past anchor)
          if (newHeight < 0) {
            newY = startY + newHeight;  // Move origin up from anchor
          } else {
            newY = startY;  // Normal: Y doesn't change
          }
          break;
      }

      // Apply resize with stage reference for optimistic updates
      // Pass absolute values for dimensions, handle flipping in the rendering
      handleResize(shape.id, Math.abs(newWidth), Math.abs(newHeight), newX, newY, { current: stage });
    };

    const handleGlobalMouseUp = () => {
      if (!resizeDataRef.current) return;
      const { stage, handleType, startMousePos, startX, startY, startWidth, startHeight } = resizeDataRef.current;
      
      const pointerPos = stage.getPointerPosition();
      if (pointerPos) {
        // Calculate final delta (in screen coordinates)
        const screenDx = pointerPos.x - startMousePos.x;
        const screenDy = pointerPos.y - startMousePos.y;
        
        // Convert to canvas coordinates by dividing by zoom scale
        const dx = screenDx / viewport.scale;
        const dy = screenDy / viewport.scale;

        let newWidth: number;
        let newHeight: number;
        let newX: number | undefined;
        let newY: number | undefined;

        // Calculate final dimensions with proper anchor points
        // Allow negative dimensions to support flipping
        switch (handleType) {
          case 'top-left':
            // Anchor: bottom-right stays fixed
            newWidth = startWidth - dx;
            newHeight = startHeight - dy;
            // Handle flipping
            if (newWidth < 0) {
              newX = startX + startWidth;
            } else {
              newX = startX + dx;
            }
            if (newHeight < 0) {
              newY = startY + startHeight;
            } else {
              newY = startY + dy;
            }
            break;

          case 'top-right':
            // Anchor: bottom-left stays fixed
            newWidth = startWidth + dx;
            newHeight = startHeight - dy;
            // Handle horizontal flipping (same logic as bottom-right)
            if (newWidth < 0) {
              newX = startX + newWidth;
            } else {
              newX = startX;
            }
            // Handle vertical flipping (same logic as top-left)
            if (newHeight < 0) {
              newY = startY + startHeight;
            } else {
              newY = startY + dy;
            }
            break;

          case 'bottom-left':
            // Anchor: top-right stays fixed
            newWidth = startWidth - dx;
            newHeight = startHeight + dy;
            // Handle horizontal flipping (same logic as top-left)
            if (newWidth < 0) {
              newX = startX + startWidth;
            } else {
              newX = startX + dx;
            }
            // Handle vertical flipping (same logic as bottom-right)
            if (newHeight < 0) {
              newY = startY + newHeight;
            } else {
              newY = startY;
            }
            break;

          case 'bottom-right':
            // Anchor: top-left stays fixed
            newWidth = startWidth + dx;
            newHeight = startHeight + dy;
            // Handle horizontal flipping
            if (newWidth < 0) {
              newX = startX + newWidth;
            } else {
              newX = startX;
            }
            // Handle vertical flipping
            if (newHeight < 0) {
              newY = startY + newHeight;
            } else {
              newY = startY;
            }
            break;
        }

        // Finalize resize with absolute dimensions
        handleResizeEnd(shape.id, Math.abs(newWidth), Math.abs(newHeight), newX, newY);
      }

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
