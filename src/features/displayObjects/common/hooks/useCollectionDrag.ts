/**
 * Collection Drag Hook
 * 
 * Handles dragging multiple selected objects as a collection using Konva's draggable
 * Provides optimistic updates with debounced Firestore writes
 * Broadcasts real-time position updates via Realtime Database for smooth multiplayer sync
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { TransformableObject } from '../types';
import { updateShapesBatch } from '@/features/displayObjects/shapes/services/shapeService';
import { updateTextsBatch } from '@/features/displayObjects/texts/services/textService';
import { roundPosition } from '../utils/transformMath';
import { updateDragPositions, clearDragPositions } from '@/features/presence/services/dragPositionService';
import { throttle } from '@/utils/performanceMonitor';

/**
 * Drag state for collection
 */
interface DragState {
  isDragging: boolean;
  driverShapeId: string; // The shape being actively dragged
  initialPositions: Map<string, { x: number; y: number }>;
  // Store the objects at drag start to avoid using stale props during drag
  draggedObjects: TransformableObject[];
}

/**
 * useCollectionDrag Hook
 * 
 * Manages dragging state for a collection of objects (shapes or texts)
 * Uses Konva's built-in draggable property for robust event handling
 * 
 * @param selectedObjects - Currently selected objects (shapes, texts, etc.)
 * @param userId - Current user ID
 * @param isSelectMode - Whether select tool is active
 * @returns Drag handlers and state
 */
export function useCollectionDrag(
  selectedObjects: TransformableObject[],
  userId: string | undefined,
  isSelectMode: boolean
) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    driverShapeId: '',
    initialPositions: new Map(),
    draggedObjects: [],
  });
  
  const [optimisticShapes, setOptimisticShapes] = useState<TransformableObject[] | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPendingUpdateRef = useRef(false);
  
  // Throttled real-time position broadcast (50ms = 20 updates/sec)
  const throttledBroadcastRef = useRef<((positions: Map<string, { x: number; y: number }>) => void) | null>(null);

  /**
   * Start dragging a collection
   * Called when any selected shape starts dragging
   */
  const handleDragStart = useCallback((driverShapeId: string) => {
    if (!isSelectMode || selectedObjects.length === 0) {
      return;
    }

    // Store initial positions of all selected objects
    const initialPositions = new Map<string, { x: number; y: number }>();
    for (const obj of selectedObjects) {
      initialPositions.set(obj.id, { x: obj.x ?? 0, y: obj.y ?? 0 });
    }

    // Capture the objects at drag start to avoid using stale props during drag
    const draggedObjects = [...selectedObjects];

    setDragState({
      isDragging: true,
      driverShapeId,
      initialPositions,
      draggedObjects,
    });
    
    // Initialize optimistic objects with current positions
    // This ensures the bounding box updates immediately when drag starts
    setOptimisticShapes([...selectedObjects]);

    console.log('[CollectionDrag] Drag started with', selectedObjects.length, 'objects (driver:', driverShapeId, ')');
  }, [isSelectMode, selectedObjects]);

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

    // Apply delta to all objects using their initial positions
    // Use draggedObjects from drag state, not selectedObjects prop (which may have changed)
    const translatedObjects = dragState.draggedObjects.map(obj => {
      const initial = dragState.initialPositions.get(obj.id);
      if (!initial) return obj;

      return {
        ...obj,
        x: initial.x + deltaX,
        y: initial.y + deltaY,
      };
    });

    // Update optimistic state for immediate visual feedback
    setOptimisticShapes(translatedObjects);
    
    // Broadcast positions to Realtime Database for smooth multiplayer sync (50ms throttled)
    if (throttledBroadcastRef.current) {
      const positions = new Map<string, { x: number; y: number }>();
      translatedObjects.forEach(obj => {
        positions.set(obj.id, { x: obj.x, y: obj.y });
      });
      throttledBroadcastRef.current(positions);
    }

    // Debounce Firestore updates (300ms)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    hasPendingUpdateRef.current = true;
    debounceTimerRef.current = setTimeout(() => {
      // Separate shapes and texts for batch updates
      const shapes = translatedObjects.filter(obj => obj.category === 'shape');
      const texts = translatedObjects.filter(obj => obj.category === 'text');
      
      const promises: Promise<void>[] = [];
      
      if (shapes.length > 0) {
        const shapeBatchUpdates = shapes.map(shape => ({
          shapeId: shape.id,
          updates: { x: roundPosition(shape.x), y: roundPosition(shape.y) },
        }));
        promises.push(updateShapesBatch(userId, shapeBatchUpdates));
      }
      
      if (texts.length > 0) {
        const textBatchUpdates = texts.map(text => ({
          textId: text.id,
          updates: { x: roundPosition(text.x), y: roundPosition(text.y) },
        }));
        promises.push(updateTextsBatch(userId, textBatchUpdates));
      }
      
      Promise.all(promises)
        .then(() => {
          hasPendingUpdateRef.current = false;
        })
        .catch(error => {
          console.error('[CollectionDrag] Error updating objects during drag:', error);
        });
    }, 300);
  }, [dragState, userId]);

  /**
   * End dragging
   */
  const handleDragEnd = useCallback(async () => {
    if (!dragState.isDragging || !userId) {
      return;
    }

    console.log('[CollectionDrag] Drag ended');
    
    // Clear real-time drag positions from Realtime Database
    await clearDragPositions(userId);

    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Final write ONLY if there are uncommitted changes (debounce timer hasn't fired)
    if (hasPendingUpdateRef.current && optimisticShapes) {
      try {
        // Separate shapes and texts for batch updates
        const shapes = optimisticShapes.filter(obj => obj.category === 'shape');
        const texts = optimisticShapes.filter(obj => obj.category === 'text');
        
        const promises: Promise<void>[] = [];
        
        if (shapes.length > 0) {
          const shapeBatchUpdates = shapes.map(shape => ({
            shapeId: shape.id,
            updates: { x: roundPosition(shape.x), y: roundPosition(shape.y) },
          }));
          promises.push(updateShapesBatch(userId, shapeBatchUpdates));
        }
        
        if (texts.length > 0) {
          const textBatchUpdates = texts.map(text => ({
            textId: text.id,
            updates: { x: roundPosition(text.x), y: roundPosition(text.y) },
          }));
          promises.push(updateTextsBatch(userId, textBatchUpdates));
        }
        
        await Promise.all(promises);
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
      draggedObjects: [],
    });
    setOptimisticShapes(null); // Clear optimistic shapes
    hasPendingUpdateRef.current = false;
  }, [dragState, userId, optimisticShapes]);

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
      draggedObjects: [],
    });
    setOptimisticShapes(null); // Clear optimistic shapes
    hasPendingUpdateRef.current = false;
  }, []);

  // Initialize throttled broadcast function
  useEffect(() => {
    if (!userId) {
      throttledBroadcastRef.current = null;
      return;
    }
    
    // Create throttled function (50ms = 20 updates/second, same as cursor tracking)
    const throttledFn = throttle((...args: unknown[]) => {
      const [positions] = args as [Map<string, { x: number; y: number }>];
      updateDragPositions(userId, positions).catch((error) => {
        // Silent failure - drag position updates shouldn't break the app
        console.debug('[CollectionDrag] Drag position update failed:', error);
      });
    }, 50);
    
    throttledBroadcastRef.current = (positions: Map<string, { x: number; y: number }>) => {
      throttledFn(positions);
    };
    
    return () => {
      // Clear drag positions on unmount
      clearDragPositions(userId).catch(() => {
        // Silent cleanup failure
      });
    };
  }, [userId]);
  
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

