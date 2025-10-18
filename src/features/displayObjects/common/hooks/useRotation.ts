/**
 * useRotation Hook
 * 
 * Manages rotation transformation for selected collections.
 * Handles mouse tracking, angle calculation, optimistic updates, and Firestore sync.
 */

import { useCallback, useRef, useState } from 'react';
import { useSelection } from '../store/selectionStore';
import { useShapes } from '@/features/displayObjects/shapes/store/shapesStore';
import { useAuth } from '@/features/auth/store/authStore';
import { updateShapesBatch } from '@/features/displayObjects/shapes/services/shapeService';
import { rotateCollection, rotatePointAroundCenter } from '../utils/transformMath';
import { calculateCollectionOBB } from '../utils/boundingBoxUtils';
import { constrainToCanvas } from '../services/transformService';
import type { Point } from '../types';
import type { ShapeDisplayObject } from '@/features/displayObjects/shapes/types';

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
  
  // Store original object states (for calculating deltas)
  const originalObjectsRef = useRef<ShapeDisplayObject[]>([]);
  
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
    
    // Store original object states
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
    originalObjectsRef.current = selectedShapes;
    
    // Calculate and store initial collection OBB corners
    const collectionOBB = calculateCollectionOBB(selectedShapes);
    initialCollectionCornersRef.current = collectionOBB?.corners || null;
    setRotatedCollectionCorners(collectionOBB?.corners || null);
    
    // Reset pending write flag
    hasPendingWriteRef.current = false;
    
    setIsRotating(true);
    setCurrentAngle(0);
    
    console.log('[useRotation] Started rotation at', e.clientX, e.clientY, 'pivot:', initialCenterRef.current);
  }, [collectionCenter, selectedIds, shapes]);
  
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
    if (Math.abs(angleDelta) > 0 && originalObjectsRef.current.length > 0) {
      const rotatedObjects = rotateCollection(
        originalObjectsRef.current,
        cumulativeAngleRef.current,
        initialCenterRef.current
      );
      
      // Constrain rotated objects to canvas boundaries
      const constrainedObjects = constrainToCanvas(rotatedObjects);
      
      // Update local state immediately (optimistic)
      constrainedObjects.forEach(obj => {
        updateShapeLocal(obj.id, {
          x: obj.x,
          y: obj.y,
          rotation: obj.rotation,
        });
      });
      
      // Mark that we have uncommitted changes
      hasPendingWriteRef.current = true;
      
      // Debounce Firestore write (300ms)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(() => {
        // Write to Firestore using batch update (1 snapshot event instead of N)
        if (user) {
          const batchUpdates = constrainedObjects.map(obj => ({
            shapeId: obj.id,
            updates: {
              x: obj.x,
              y: obj.y,
              rotation: obj.rotation,
            },
          }));
          
          updateShapesBatch(user.userId, batchUpdates).catch(error => {
            console.error('[useRotation] Failed to batch update shapes:', error);
          });
          
          // Clear pending write flag after successful write
          hasPendingWriteRef.current = false;
        }
      }, 300);
    }
    
    // Update last mouse position
    lastMousePosRef.current = currentMousePos;
  }, [isRotating, updateShapeLocal, user]);
  
  /**
   * End rotation and finalize changes
   * Called on mouse up
   */
  const endRotation = useCallback(() => {
    if (!isRotating || !initialCenterRef.current) return;
    
    console.log('[useRotation] Ended rotation at angle:', cumulativeAngleRef.current);
    
    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    // Final write to Firestore ONLY if there are uncommitted changes
    // (i.e., the debounce timer hasn't fired yet)
    if (hasPendingWriteRef.current && originalObjectsRef.current.length > 0 && user) {
      const rotatedObjects = rotateCollection(
        originalObjectsRef.current,
        cumulativeAngleRef.current,
        initialCenterRef.current
      );
      
      // Constrain to canvas boundaries
      const constrainedObjects = constrainToCanvas(rotatedObjects);
      
      const batchUpdates = constrainedObjects.map(obj => ({
        shapeId: obj.id,
        updates: {
          x: obj.x,
          y: obj.y,
          rotation: obj.rotation,
        },
      }));
      
      updateShapesBatch(user.userId, batchUpdates).catch(error => {
        console.error('[useRotation] Failed to batch update shapes:', error);
      });
      
      hasPendingWriteRef.current = false;
    } else if (!hasPendingWriteRef.current) {
      console.log('[useRotation] No uncommitted changes, skipping final write');
    }
    
    // Reset state
    setIsRotating(false);
    startMousePosRef.current = null;
    lastMousePosRef.current = null;
    initialCenterRef.current = null;
    originalObjectsRef.current = [];
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
  
  return {
    startRotation,
    updateRotation,
    endRotation,
    handleGlobalMouseUp,
    isRotating,
    currentAngle,
    rotatedCollectionCorners, // Rotated OBB corners during rotation (null when not rotating)
  };
}

