/**
 * Collection Drag Hook
 * 
 * Handles dragging multiple selected objects as a collection using Konva's draggable
 * Provides optimistic updates with debounced Firestore writes
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ShapeDisplayObject } from '@/features/displayObjects/shapes/types';
import { translateAndConstrain } from '../services/transformService';
import { updateShapesBatch } from '@/features/displayObjects/shapes/services/shapeService';

/**
 * Drag state for collection
 */
interface DragState {
  isDragging: boolean;
  driverShapeId: string; // The shape being actively dragged
  initialPositions: Map<string, { x: number; y: number }>;
}

/**
 * useCollectionDrag Hook
 * 
 * Manages dragging state for a collection of shapes
 * Uses Konva's built-in draggable property for robust event handling
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
    driverShapeId: '',
    initialPositions: new Map(),
  });
  
  const [optimisticShapes, setOptimisticShapes] = useState<ShapeDisplayObject[] | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPendingUpdateRef = useRef(false);

  /**
   * Start dragging a collection
   * Called when any selected shape starts dragging
   */
  const handleDragStart = useCallback((driverShapeId: string) => {
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
      driverShapeId,
      initialPositions,
    });

    console.log('[CollectionDrag] Drag started with', selectedShapes.length, 'shapes (driver:', driverShapeId, ')');
  }, [isSelectMode, selectedShapes]);

  /**
   * Update drag position
   * Called during Konva drag move - calculates delta from driver shape and applies to all
   */
  const handleDragMove = useCallback((driverShapeId: string, newX: number, newY: number) => {
    if (!dragState.isDragging || !userId || dragState.driverShapeId !== driverShapeId) {
      return;
    }

    // Get the driver shape's initial position
    const driverInitial = dragState.initialPositions.get(driverShapeId);
    if (!driverInitial) return;

    // Calculate delta from driver's movement
    const deltaX = newX - driverInitial.x;
    const deltaY = newY - driverInitial.y;

    // Apply delta to all shapes using their initial positions
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
      // Update all shapes in Firestore using batch write (1 snapshot instead of N)
      const batchUpdates = constrainedShapes.map(shape => ({
        shapeId: shape.id,
        updates: { x: shape.x, y: shape.y },
      }));
      
      updateShapesBatch(userId, batchUpdates)
        .then(() => {
          hasPendingUpdateRef.current = false;
        })
        .catch(error => {
          console.error('[CollectionDrag] Error updating shapes during drag:', error);
        });
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

    // Final write ONLY if there are uncommitted changes (debounce timer hasn't fired)
    if (hasPendingUpdateRef.current && optimisticShapes) {
      try {
        const batchUpdates = optimisticShapes.map(shape => ({
          shapeId: shape.id,
          updates: { x: shape.x, y: shape.y },
        }));
        
        await updateShapesBatch(userId, batchUpdates);
        console.log('[CollectionDrag] Final positions updated in Firestore');
        hasPendingUpdateRef.current = false;
      } catch (error) {
        console.error('[CollectionDrag] Error updating final positions:', error);
      }
    } else if (!hasPendingUpdateRef.current) {
      console.log('[CollectionDrag] No uncommitted changes, skipping final write');
    }

    // Reset drag state
    setDragState({
      isDragging: false,
      driverShapeId: '',
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
      driverShapeId: '',
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
    driverShapeId: dragState.driverShapeId,
    // Return optimistic shapes if dragging, otherwise null
    optimisticShapes: dragState.isDragging ? optimisticShapes : null,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    cancelDrag,
  };
}

