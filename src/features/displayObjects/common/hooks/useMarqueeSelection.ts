/**
 * Marquee Selection Hook
 * 
 * Handles drag-to-select (marquee) functionality for selecting multiple display objects
 */

import { useState, useCallback, useRef } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { ShapeDisplayObject } from '@/features/displayObjects/shapes/types';

/**
 * Marquee state
 */
interface MarqueeState {
  isActive: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

/**
 * Calculate marquee box dimensions from start and current positions
 */
function calculateMarqueeBox(startX: number, startY: number, currentX: number, currentY: number) {
  const x = Math.min(startX, currentX);
  const y = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  
  return { x, y, width, height };
}

/**
 * Get bounding box dimensions for any shape type
 */
function getShapeBounds(shape: ShapeDisplayObject) {
  let shapeWidth: number;
  let shapeHeight: number;
  
  if (shape.type === 'rectangle') {
    shapeWidth = shape.width;
    shapeHeight = shape.height;
  } else if (shape.type === 'circle') {
    shapeWidth = shape.radius * 2;
    shapeHeight = shape.radius * 2;
  } else if (shape.type === 'line') {
    // For lines, create a small bounding box
    shapeWidth = 10;
    shapeHeight = 10;
  } else {
    // Fallback for unknown types
    shapeWidth = 10;
    shapeHeight = 10;
  }
  
  return { width: shapeWidth, height: shapeHeight };
}

/**
 * Check if a shape intersects with the marquee box
 * Simple AABB (Axis-Aligned Bounding Box) intersection test
 * 
 * Note: Shape position is top-left corner (Konva default)
 */
function shapeIntersectsMarquee(
  shape: ShapeDisplayObject,
  marqueeX: number,
  marqueeY: number,
  marqueeWidth: number,
  marqueeHeight: number
): boolean {
  // Get shape bounds (simplified - doesn't account for rotation yet)
  const { width, height } = getShapeBounds(shape);
  
  // Shape bounds (position is top-left corner)
  const shapeLeft = shape.x;
  const shapeRight = shape.x + width;
  const shapeTop = shape.y;
  const shapeBottom = shape.y + height;
  
  const marqueeLeft = marqueeX;
  const marqueeRight = marqueeX + marqueeWidth;
  const marqueeTop = marqueeY;
  const marqueeBottom = marqueeY + marqueeHeight;
  
  // AABB intersection test
  return !(
    shapeRight < marqueeLeft ||
    shapeLeft > marqueeRight ||
    shapeBottom < marqueeTop ||
    shapeTop > marqueeBottom
  );
}

/**
 * useMarqueeSelection Hook
 * 
 * Provides marquee selection functionality
 * 
 * @param shapes - Array of all shapes on the canvas
 * @param stageRef - Reference to the Konva Stage
 * @param enabled - Whether marquee selection is enabled (e.g., only in select mode)
 * @returns Marquee state, box dimensions, and event handlers
 */
export function useMarqueeSelection(
  shapes: ShapeDisplayObject[],
  stageRef: React.RefObject<any>,
  enabled: boolean
) {
  const [marquee, setMarquee] = useState<MarqueeState>({
    isActive: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });
  
  const isDraggingRef = useRef(false);

  /**
   * Start marquee selection
   */
  const handleMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (!enabled) return;
    
    // Only start marquee if clicking on empty canvas (not a shape)
    const clickedOnEmpty = e.target === e.currentTarget;
    if (!clickedOnEmpty) return;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;
    
    // Convert screen coordinates to canvas coordinates
    const transform = stage.getAbsoluteTransform().copy().invert();
    const canvasPos = transform.point(pointerPos);
    
    isDraggingRef.current = true;
    setMarquee({
      isActive: true,
      startX: canvasPos.x,
      startY: canvasPos.y,
      currentX: canvasPos.x,
      currentY: canvasPos.y,
    });
  }, [enabled, stageRef]);

  /**
   * Update marquee selection
   */
  const handleMouseMove = useCallback((_e: KonvaEventObject<MouseEvent>) => {
    if (!enabled || !isDraggingRef.current) return;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;
    
    // Convert screen coordinates to canvas coordinates
    const transform = stage.getAbsoluteTransform().copy().invert();
    const canvasPos = transform.point(pointerPos);
    
    setMarquee(prev => ({
      ...prev,
      currentX: canvasPos.x,
      currentY: canvasPos.y,
    }));
  }, [enabled, stageRef]);

  /**
   * End marquee selection and calculate selected shapes
   */
  const handleMouseUp = useCallback(() => {
    if (!enabled || !isDraggingRef.current) return;
    
    isDraggingRef.current = false;
    
    // Calculate final marquee box
    const { x, y, width, height } = calculateMarqueeBox(
      marquee.startX,
      marquee.startY,
      marquee.currentX,
      marquee.currentY
    );
    
    // Find intersecting shapes
    const selectedShapeIds = shapes
      .filter(shape => shapeIntersectsMarquee(shape, x, y, width, height))
      .map(shape => shape.id);
    
    // Reset marquee
    setMarquee({
      isActive: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    });
    
    return selectedShapeIds;
  }, [enabled, marquee, shapes]);

  /**
   * Get marquee box dimensions for rendering
   */
  const getMarqueeBox = useCallback(() => {
    if (!marquee.isActive) return null;
    
    return calculateMarqueeBox(
      marquee.startX,
      marquee.startY,
      marquee.currentX,
      marquee.currentY
    );
  }, [marquee]);

  return {
    isMarqueeActive: marquee.isActive,
    getMarqueeBox,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}

