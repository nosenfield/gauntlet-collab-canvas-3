/**
 * useRotation Hook
 * 
 * Manages rotation transformation for selected collections.
 * Handles mouse tracking, angle calculation, optimistic updates, and Firestore sync.
 * Broadcasts real-time rotation updates via Realtime Database for smooth multiplayer sync.
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { useSelection } from '../store/selectionStore';
import { useShapes } from '@/features/displayObjects/shapes/store/shapesStore';
import { useTexts } from '@/features/displayObjects/texts/store/textsStore';
import { useAuth } from '@/features/auth/store/authStore';
import { updateShapesBatch } from '@/features/displayObjects/shapes/services/shapeService';
import { updateTextsBatch } from '@/features/displayObjects/texts/services/textService';
import { rotateCollection, rotatePointAroundCenter, roundPosition, roundNumericProperty } from '../utils/transformMath';
import { calculateCollectionOBB } from '../utils/boundingBoxUtils';
import type { Point } from '../types';
import type { ShapeDisplayObject } from '@/features/displayObjects/shapes/types';
import type { TextDisplayObject } from '@/features/displayObjects/texts/types';
import { updateTransformStates, clearTransformStates } from '@/features/presence/services/dragPositionService';
import { throttle } from '@/utils/performanceMonitor';

/**
 * useRotation Hook
 * 
 * Provides rotation functionality for selected display objects.
 * 
 * Features:
 * - 1px drag = 1° rotation sensitivity
 * - Optimistic local updates
 * - Debounced Firestore writes (300ms)
 * - Visual feedback (angle tracking)
 * 
 * @returns Rotation control functions and state
 * 
 * @example
 * ```tsx
 * function RotationKnob() {
 *   const { startRotation, updateRotation, endRotation, currentAngle } = useRotation();
 *   
 *   return (
 *     <button
 *       onMouseDown={startRotation}
 *       onMouseMove={updateRotation}
 *       onMouseUp={endRotation}
 *       style={{ transform: `rotate(${currentAngle}deg)` }}
 *     >
 *       ⟳
 *     </button>
 *   );
 * }
 * ```
 */
export function useRotation(collectionCenter: Point | null) {
  const { selectedIds } = useSelection();
  const { shapes, updateShapeLocal } = useShapes();
  const { texts, updateTextLocal } = useTexts();
  const { user } = useAuth();
  
  // Rotation state
  const [isRotating, setIsRotating] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  
  // Track mouse position and cumulative rotation
  const startMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const cumulativeAngleRef = useRef(0);
  
  // Store initial collection center (fixed pivot point during rotation)
  const initialCenterRef = useRef<Point | null>(null);
  
  // Debounce timer for Firestore writes
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Track if there are uncommitted changes that need to be written
  const hasPendingWriteRef = useRef(false);
  
  // Throttled real-time transform broadcast (50ms = 20 updates/sec)
  const throttledBroadcastRef = useRef<((transforms: Map<string, { x: number; y: number; rotation: number }>) => void) | null>(null);
  
  // Store original object states (for calculating deltas)
  const originalShapesRef = useRef<ShapeDisplayObject[]>([]);
  const originalTextsRef = useRef<TextDisplayObject[]>([]);
  
  // Store initial collection OBB corners (for rotating the selection box)
  const initialCollectionCornersRef = useRef<Point[] | null>(null);
  
  // Track rotated collection corners during rotation
  const [rotatedCollectionCorners, setRotatedCollectionCorners] = useState<Point[] | null>(null);
  
  /**
   * Start rotation tracking
   * Called on mouse down on rotation knob
   */
  const startRotation = useCallback((e: React.MouseEvent) => {
    if (!collectionCenter || selectedIds.length === 0) return;
    
    // Prevent default and stop propagation to avoid text selection
    e.preventDefault();
    e.stopPropagation();
    
    // Store initial mouse position
    startMousePosRef.current = { x: e.clientX, y: e.clientY };
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    cumulativeAngleRef.current = 0;
    
    // Store initial collection center (fixed pivot point)
    initialCenterRef.current = { ...collectionCenter };
    
    // Store original object states (both shapes and texts)
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
    const selectedTexts = texts.filter(t => selectedIds.includes(t.id));
    originalShapesRef.current = selectedShapes;
    originalTextsRef.current = selectedTexts;
    
    // Calculate and store initial collection OBB corners (from both shapes and texts)
    const allObjects = [...selectedShapes, ...selectedTexts];
    const collectionOBB = calculateCollectionOBB(allObjects);
    initialCollectionCornersRef.current = collectionOBB?.corners || null;
    setRotatedCollectionCorners(collectionOBB?.corners || null);
    
    // Reset pending write flag
    hasPendingWriteRef.current = false;
    
    setIsRotating(true);
    setCurrentAngle(0);
    
    console.log('[useRotation] Started rotation at', e.clientX, e.clientY, 'pivot:', initialCenterRef.current);
  }, [collectionCenter, selectedIds, shapes, texts]);
  
  /**
   * Update rotation based on mouse movement
   * Called on mouse move while rotating
   */
  const updateRotation = useCallback((e: React.MouseEvent) => {
    if (!isRotating || !lastMousePosRef.current || !initialCenterRef.current) return;
    
    const currentMousePos = { x: e.clientX, y: e.clientY };
    
    // Calculate delta since last update
    const deltaX = currentMousePos.x - lastMousePosRef.current.x;
    const deltaY = currentMousePos.y - lastMousePosRef.current.y;
    
    // 1px = 1° sensitivity: Right/Up = clockwise (+), Left/Down = counter-clockwise (-)
    // Note: Y-axis is inverted in screen coords (down = positive), so we subtract deltaY
    const angleDelta = deltaX - deltaY;
    
    // Update cumulative angle
    cumulativeAngleRef.current += angleDelta;
    setCurrentAngle(cumulativeAngleRef.current);
    
    // Rotate the collection box corners
    if (initialCollectionCornersRef.current && initialCenterRef.current) {
      const rotatedCorners = initialCollectionCornersRef.current.map(corner =>
        rotatePointAroundCenter(corner, cumulativeAngleRef.current, initialCenterRef.current!)
      );
      setRotatedCollectionCorners(rotatedCorners);
    }
    
    // Apply rotation to selected objects (optimistic update)
    // Use INITIAL center as fixed pivot point
    const hasObjects = originalShapesRef.current.length > 0 || originalTextsRef.current.length > 0;
    if (Math.abs(angleDelta) > 0 && hasObjects) {
      // Rotate shapes
      const rotatedShapes = originalShapesRef.current.length > 0
        ? rotateCollection(originalShapesRef.current, cumulativeAngleRef.current, initialCenterRef.current)
        : [];
      
      // Rotate texts
      const rotatedTexts = originalTextsRef.current.length > 0
        ? rotateCollection(originalTextsRef.current, cumulativeAngleRef.current, initialCenterRef.current)
        : [];
      
      // Update local state immediately (optimistic)
      rotatedShapes.forEach(obj => {
        updateShapeLocal(obj.id, {
          x: obj.x,
          y: obj.y,
          rotation: obj.rotation,
        });
      });
      
      rotatedTexts.forEach(obj => {
        updateTextLocal(obj.id, {
          x: obj.x,
          y: obj.y,
          rotation: obj.rotation,
        });
      });
      
      // Broadcast to Realtime Database for smooth multiplayer sync (50ms throttled)
      if (throttledBroadcastRef.current) {
        const transforms = new Map<string, { x: number; y: number; rotation: number }>();
        [...rotatedShapes, ...rotatedTexts].forEach(obj => {
          transforms.set(obj.id, { x: obj.x, y: obj.y, rotation: obj.rotation });
        });
        throttledBroadcastRef.current(transforms);
      }
      
      // Mark that we have uncommitted changes
      hasPendingWriteRef.current = true;
      
      // Debounce Firestore write (300ms)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(() => {
        // Write to Firestore using batch update (1 snapshot event instead of N)
        if (user) {
          // Batch update shapes
          if (rotatedShapes.length > 0) {
            const shapeBatchUpdates = rotatedShapes.map(obj => ({
              shapeId: obj.id,
              updates: {
                x: roundPosition(obj.x),
                y: roundPosition(obj.y),
                rotation: roundNumericProperty(obj.rotation),
              },
            }));
            
            updateShapesBatch(user.userId, shapeBatchUpdates).catch(error => {
              console.error('[useRotation] Failed to batch update shapes:', error);
            });
          }
          
          // Batch update texts
          if (rotatedTexts.length > 0) {
            const textBatchUpdates = rotatedTexts.map(obj => ({
              textId: obj.id,
              updates: {
                x: roundPosition(obj.x),
                y: roundPosition(obj.y),
                rotation: roundNumericProperty(obj.rotation),
              },
            }));
            
            updateTextsBatch(user.userId, textBatchUpdates).catch(error => {
              console.error('[useRotation] Failed to batch update texts:', error);
            });
          }
          
          // Clear pending write flag after successful write
          hasPendingWriteRef.current = false;
        }
      }, 300);
    }
    
    // Update last mouse position
    lastMousePosRef.current = currentMousePos;
  }, [isRotating, updateShapeLocal, updateTextLocal, user]);
  
  /**
   * End rotation and finalize changes
   * Called on mouse up
   */
  const endRotation = useCallback(async () => {
    if (!isRotating || !initialCenterRef.current) return;
    
    console.log('[useRotation] Ended rotation at angle:', cumulativeAngleRef.current);
    
    // Clear real-time transform states from Realtime Database
    if (user) {
      await clearTransformStates(user.userId);
    }
    
    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    // Final write to Firestore ONLY if there are uncommitted changes
    // (i.e., the debounce timer hasn't fired yet)
    const hasObjects = originalShapesRef.current.length > 0 || originalTextsRef.current.length > 0;
    if (hasPendingWriteRef.current && hasObjects && user) {
      // Rotate shapes
      const rotatedShapes = originalShapesRef.current.length > 0
        ? rotateCollection(originalShapesRef.current, cumulativeAngleRef.current, initialCenterRef.current)
        : [];
      
      // Rotate texts
      const rotatedTexts = originalTextsRef.current.length > 0
        ? rotateCollection(originalTextsRef.current, cumulativeAngleRef.current, initialCenterRef.current)
        : [];
      
      // Batch update shapes
      if (rotatedShapes.length > 0) {
        const shapeBatchUpdates = rotatedShapes.map(obj => ({
          shapeId: obj.id,
          updates: {
            x: roundPosition(obj.x),
            y: roundPosition(obj.y),
            rotation: roundNumericProperty(obj.rotation),
          },
        }));
        
        updateShapesBatch(user.userId, shapeBatchUpdates).catch(error => {
          console.error('[useRotation] Failed to batch update shapes:', error);
        });
      }
      
      // Batch update texts
      if (rotatedTexts.length > 0) {
        const textBatchUpdates = rotatedTexts.map(obj => ({
          textId: obj.id,
          updates: {
            x: roundPosition(obj.x),
            y: roundPosition(obj.y),
            rotation: roundNumericProperty(obj.rotation),
          },
        }));
        
        updateTextsBatch(user.userId, textBatchUpdates).catch(error => {
          console.error('[useRotation] Failed to batch update texts:', error);
        });
      }
      
      hasPendingWriteRef.current = false;
    } else if (!hasPendingWriteRef.current) {
      console.log('[useRotation] No uncommitted changes, skipping final write');
    }
    
    // Reset state
    setIsRotating(false);
    startMousePosRef.current = null;
    lastMousePosRef.current = null;
    initialCenterRef.current = null;
    originalShapesRef.current = [];
    originalTextsRef.current = [];
    initialCollectionCornersRef.current = null;
    setRotatedCollectionCorners(null);
    
    // Don't reset currentAngle immediately - let CSS animation finish
    setTimeout(() => setCurrentAngle(0), 200);
  }, [isRotating, user]);
  
  /**
   * Handle global mouse up (user releases mouse outside knob)
   */
  const handleGlobalMouseUp = useCallback(() => {
    if (isRotating) {
      endRotation();
    }
  }, [isRotating, endRotation]);
  
  // Initialize throttled broadcast function
  useEffect(() => {
    if (!user) {
      throttledBroadcastRef.current = null;
      return;
    }
    
    // Create throttled function (50ms = 20 updates/second)
    const throttledFn = throttle((...args: unknown[]) => {
      const [transforms] = args as [Map<string, { x: number; y: number; rotation: number }>];
      updateTransformStates(user.userId, transforms).catch((error) => {
        console.debug('[useRotation] Transform update failed:', error);
      });
    }, 50);
    
    throttledBroadcastRef.current = (transforms: Map<string, { x: number; y: number; rotation: number }>) => {
      throttledFn(transforms);
    };
    
    return () => {
      // Clear transform states on unmount
      clearTransformStates(user.userId).catch(() => {
        // Silent cleanup failure
      });
    };
  }, [user]);
  
  return {
    startRotation,
    updateRotation,
    endRotation,
    handleGlobalMouseUp,
    isRotating,
    currentAngle,
    rotatedCollectionCorners, // Rotated OBB corners during rotation (null when not rotating)
    rotationPivot: initialCenterRef.current, // Fixed pivot point during rotation (null when not rotating)
  };
}

