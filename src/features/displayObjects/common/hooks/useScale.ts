/**
 * useScale Hook
 * 
 * Manages scale transformation for selected collections.
 * Handles mouse tracking, scale calculation, optimistic updates, and Firestore sync.
 */

import { useCallback, useRef, useState } from 'react';
import { useSelection } from '../store/selectionStore';
import { useShapes } from '@/features/displayObjects/shapes/store/shapesStore';
import { useAuth } from '@/features/auth/store/authStore';
import { updateShapesBatch } from '@/features/displayObjects/shapes/services/shapeService';
import { scaleCollection } from '../utils/transformMath';
import { constrainToCanvas } from '../services/transformService';
import type { Point } from '../types';
import type { ShapeDisplayObject } from '@/features/displayObjects/shapes/types';

/**
 * useScale Hook
 * 
 * Provides scale functionality for selected display objects.
 * 
 * Features:
 * - 1px drag = 0.01 scale delta sensitivity
 * - Optimistic local updates
 * - Debounced Firestore writes (300ms)
 * - Visual feedback (angle tracking for knob rotation)
 * - Scale constraints (0.1 to 10.0 per object)
 * 
 * @returns Scale control functions and state
 */
export function useScale(collectionCenter: Point | null) {
  const { selectedIds } = useSelection();
  const { shapes, updateShapeLocal } = useShapes();
  const { user } = useAuth();
  
  // Scale state
  const [isScaling, setIsScaling] = useState(false);
  const [currentScale, setCurrentScale] = useState(1.0);
  
  // Track mouse position and cumulative scale
  const startMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const cumulativeScaleRef = useRef(1.0);
  
  // Store initial collection center (fixed pivot point during scaling)
  const initialCenterRef = useRef<Point | null>(null);
  
  // Debounce timer for Firestore writes
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Track if there are uncommitted changes that need to be written
  const hasPendingWriteRef = useRef(false);
  
  // Store original object states (for calculating deltas)
  const originalObjectsRef = useRef<ShapeDisplayObject[]>([]);
  
  /**
   * Start scale tracking
   * Called on mouse down on scale knob
   */
  const startScale = useCallback((e: React.MouseEvent) => {
    if (!collectionCenter || selectedIds.length === 0) return;
    
    // Prevent default and stop propagation to avoid text selection
    e.preventDefault();
    e.stopPropagation();
    
    // Store initial mouse position
    startMousePosRef.current = { x: e.clientX, y: e.clientY };
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    cumulativeScaleRef.current = 1.0;
    
    // Store initial collection center (fixed pivot point)
    initialCenterRef.current = { ...collectionCenter };
    
    // Store original object states
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
    originalObjectsRef.current = selectedShapes;
    
    // Reset pending write flag
    hasPendingWriteRef.current = false;
    
    setIsScaling(true);
    setCurrentScale(1.0);
    
    console.log('[useScale] Started scaling at', e.clientX, e.clientY, 'pivot:', initialCenterRef.current);
  }, [collectionCenter, selectedIds, shapes]);
  
  /**
   * Update scale based on mouse movement
   * Called on mouse move while scaling
   */
  const updateScale = useCallback((e: React.MouseEvent) => {
    if (!isScaling || !lastMousePosRef.current || !initialCenterRef.current) return;
    
    const currentMousePos = { x: e.clientX, y: e.clientY };
    
    // Calculate delta since last update
    const deltaX = currentMousePos.x - lastMousePosRef.current.x;
    const deltaY = currentMousePos.y - lastMousePosRef.current.y;
    
    // 1px = 0.002 scale delta: Right/Up = grow (+), Left/Down = shrink (-)
    // Note: Y-axis is inverted in screen coords (down = positive), so we subtract deltaY
    const scaleDelta = (deltaX - deltaY) * 0.002;
    
    // Update cumulative scale
    cumulativeScaleRef.current += scaleDelta;
    
    // Clamp cumulative scale to reasonable bounds (0.1 to 100.0)
    cumulativeScaleRef.current = Math.max(0.1, Math.min(100.0, cumulativeScaleRef.current));
    
    setCurrentScale(cumulativeScaleRef.current);
    
    // Apply scale to selected objects (optimistic update)
    // Use INITIAL center as fixed pivot point
    if (Math.abs(scaleDelta) > 0 && originalObjectsRef.current.length > 0) {
      const scaledObjects = scaleCollection(
        originalObjectsRef.current,
        cumulativeScaleRef.current,
        initialCenterRef.current
      );
      
      // Constrain scaled objects to canvas boundaries
      const constrainedObjects = constrainToCanvas(scaledObjects);
      
      // Update local state immediately (optimistic)
      constrainedObjects.forEach(obj => {
        updateShapeLocal(obj.id, {
          x: obj.x,
          y: obj.y,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
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
              scaleX: obj.scaleX,
              scaleY: obj.scaleY,
            },
          }));
          
          updateShapesBatch(user.userId, batchUpdates).catch(error => {
            console.error('[useScale] Failed to batch update shapes:', error);
          });
          
          // Clear pending write flag after successful write
          hasPendingWriteRef.current = false;
        }
      }, 300);
    }
    
    // Update last mouse position
    lastMousePosRef.current = currentMousePos;
  }, [isScaling, updateShapeLocal, user]);
  
  /**
   * End scale and finalize changes
   * Called on mouse up
   */
  const endScale = useCallback(() => {
    if (!isScaling || !initialCenterRef.current) return;
    
    console.log('[useScale] Ended scaling at scale:', cumulativeScaleRef.current);
    
    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    // Final write to Firestore ONLY if there are uncommitted changes
    // (i.e., the debounce timer hasn't fired yet)
    if (hasPendingWriteRef.current && originalObjectsRef.current.length > 0 && user) {
      const scaledObjects = scaleCollection(
        originalObjectsRef.current,
        cumulativeScaleRef.current,
        initialCenterRef.current
      );
      
      // Constrain to canvas boundaries
      const constrainedObjects = constrainToCanvas(scaledObjects);
      
      const batchUpdates = constrainedObjects.map(obj => ({
        shapeId: obj.id,
        updates: {
          x: obj.x,
          y: obj.y,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
        },
      }));
      
      updateShapesBatch(user.userId, batchUpdates).catch(error => {
        console.error('[useScale] Failed to batch update shapes:', error);
      });
      
      hasPendingWriteRef.current = false;
    } else if (!hasPendingWriteRef.current) {
      console.log('[useScale] No uncommitted changes, skipping final write');
    }
    
    // Reset state
    setIsScaling(false);
    startMousePosRef.current = null;
    lastMousePosRef.current = null;
    initialCenterRef.current = null;
    originalObjectsRef.current = [];
    
    // Don't reset currentScale immediately - let CSS animation finish
    setTimeout(() => setCurrentScale(1.0), 200);
  }, [isScaling, user]);
  
  /**
   * Handle global mouse up (user releases mouse outside knob)
   */
  const handleGlobalMouseUp = useCallback(() => {
    if (isScaling) {
      endScale();
    }
  }, [isScaling, endScale]);
  
  return {
    startScale,
    updateScale,
    endScale,
    handleGlobalMouseUp,
    isScaling,
    currentScale,
  };
}

