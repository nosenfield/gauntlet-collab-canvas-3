/**
 * Collection Drag Hook
 * 
 * Handles dragging multiple selected objects as a collection
 * Provides optimistic updates with debounced Firestore writes
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ShapeDisplayObject } from '@/features/displayObjects/shapes/types';
import { translateAndConstrain } from '../services/transformService';
import { updateShape } from '@/features/displayObjects/shapes/services/shapeService';

/**
 * Drag state for collection
 */
interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  initialPositions: Map<string, { x: number; y: number }>;
}

/**
 * useCollectionDrag Hook
 * 
 * Manages dragging state for a collection of shapes
 * 
 * @param selectedShapes - Currently selected shapes
 * @param userId - Current user ID
 * @param isSelectMode - Whether select tool is active
 * @returns Drag handlers and state
 */
export function useCollectionDrag(
  selectedShapes: ShapeDisplayObject[],
  userId: string | undefined,
  isSelectMode: boolean
) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialPositions: new Map(),
  });
  
  const [optimisticShapes, setOptimisticShapes] = useState<ShapeDisplayObject[] | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPendingUpdateRef = useRef(false);

  /**
   * Start dragging a collection
   */
  const handleDragStart = useCallback((startX: number, startY: number) => {
    if (!isSelectMode || selectedShapes.length === 0) {
      return;
    }

    // Store initial positions of all selected shapes
    const initialPositions = new Map<string, { x: number; y: number }>();
    for (const shape of selectedShapes) {
      initialPositions.set(shape.id, { x: shape.x, y: shape.y });
    }

    setDragState({
      isDragging: true,
      startX,
      startY,
      initialPositions,
    });

    console.log('[CollectionDrag] Drag started with', selectedShapes.length, 'shapes');
  }, [isSelectMode, selectedShapes]);

  /**
   * Update drag position (mouse move)
   */
  const handleDragMove = useCallback((currentX: number, currentY: number) => {
    if (!dragState.isDragging || !userId) {
      return;
    }

    // Calculate delta from start position
    const deltaX = currentX - dragState.startX;
    const deltaY = currentY - dragState.startY;

    // Apply translation to all shapes using initial positions
    const translatedShapes = selectedShapes.map(shape => {
      const initial = dragState.initialPositions.get(shape.id);
      if (!initial) return shape;

      return {
        ...shape,
        x: initial.x + deltaX,
        y: initial.y + deltaY,
      };
    });

    // Constrain to canvas boundaries
    const constrainedShapes = translateAndConstrain(translatedShapes, 0, 0);

    // Update optimistic state for immediate visual feedback
    setOptimisticShapes(constrainedShapes);

    // Debounce Firestore updates (300ms)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    hasPendingUpdateRef.current = true;
    debounceTimerRef.current = setTimeout(() => {
      // Update all shapes in Firestore
      Promise.all(
        constrainedShapes.map(shape =>
          updateShape(shape.id, userId, { x: shape.x, y: shape.y })
        )
      ).catch(error => {
        console.error('[CollectionDrag] Error updating shapes during drag:', error);
      });
      hasPendingUpdateRef.current = false;
    }, 300);
  }, [dragState, selectedShapes, userId]);

  /**
   * End dragging
   */
  const handleDragEnd = useCallback(async () => {
    if (!dragState.isDragging || !userId) {
      return;
    }

    console.log('[CollectionDrag] Drag ended');

    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // If there's a pending update or we have optimistic shapes, do final update
    if (hasPendingUpdateRef.current || optimisticShapes) {
      try {
        const shapesToUpdate = optimisticShapes || selectedShapes;
        await Promise.all(
          shapesToUpdate.map(shape =>
            updateShape(shape.id, userId, { x: shape.x, y: shape.y })
          )
        );
        console.log('[CollectionDrag] Final positions updated in Firestore');
      } catch (error) {
        console.error('[CollectionDrag] Error updating final positions:', error);
      }
    }

    // Reset drag state
    setDragState({
      isDragging: false,
      startX: 0,
      startY: 0,
      initialPositions: new Map(),
    });
    setOptimisticShapes(null); // Clear optimistic shapes
    hasPendingUpdateRef.current = false;
  }, [dragState, userId, optimisticShapes, selectedShapes]);

  /**
   * Cancel dragging (e.g., on escape key)
   */
  const cancelDrag = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    setDragState({
      isDragging: false,
      startX: 0,
      startY: 0,
      initialPositions: new Map(),
    });
    setOptimisticShapes(null); // Clear optimistic shapes
    hasPendingUpdateRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    isDragging: dragState.isDragging,
    // Return optimistic shapes if dragging, otherwise return selectedShapes
    optimisticShapes: optimisticShapes || selectedShapes,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    cancelDrag,
  };
}

