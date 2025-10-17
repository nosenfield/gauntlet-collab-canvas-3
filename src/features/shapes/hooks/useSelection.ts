/**
 * useSelection Hook
 * 
 * Handles shape selection with collaborative locking.
 * Prevents selecting shapes locked by other users.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useSelectionContext } from '../store/selectionStore';
import { useShapes } from './useShapes';
import { useAuth } from '../../auth/store/authStore';

/**
 * useSelection Hook Return Type
 */
interface UseSelectionReturn {
  selectedShapeIds: Set<string>;
  selectShape: (shapeId: string, addToSelection?: boolean) => Promise<boolean>;
  deselectShape: (shapeId: string) => Promise<void>;
  clearSelection: () => Promise<void>;
  isSelected: (shapeId: string) => boolean;
}

/**
 * Hook for shape selection with locking
 * 
 * @returns Selection operations with lock management
 */
export function useSelection(): UseSelectionReturn {
  const { user } = useAuth();
  const {
    selectedShapeIds,
    selectShape: selectShapeLocal,
    deselectShape: deselectShapeLocal,
    clearSelection: clearSelectionLocal,
    isSelected,
  } = useSelectionContext();
  const { shapes, lockShape, unlockShape } = useShapes();

  /**
   * Unlock all currently selected shapes on unmount or selection clear
   */
  const unlockSelectedShapes = useCallback(async () => {
    const unlockPromises = Array.from(selectedShapeIds).map((shapeId) =>
      unlockShape(shapeId)
    );
    await Promise.all(unlockPromises);
  }, [selectedShapeIds, unlockShape]);

  /**
   * Clean up locks when component unmounts
   * Using ref to capture current selection without re-running effect
   */
  const selectedShapeIdsRef = useRef(selectedShapeIds);
  
  useEffect(() => {
    selectedShapeIdsRef.current = selectedShapeIds;
  }, [selectedShapeIds]);

  useEffect(() => {
    return () => {
      // Unlock all selected shapes on unmount only
      Array.from(selectedShapeIdsRef.current).forEach((shapeId) => {
        unlockShape(shapeId);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only runs on mount/unmount

  /**
   * Select a shape (with lock acquisition)
   * 
   * @param shapeId - ID of shape to select
   * @param addToSelection - If true, add to existing selection (multi-select)
   * @returns true if selection successful, false if shape is locked
   */
  const selectShape = useCallback(
    async (shapeId: string, addToSelection = false): Promise<boolean> => {
      if (!user) {
        console.warn('Cannot select shape: User not authenticated');
        return false;
      }

      // Check if already selected
      if (selectedShapeIds.has(shapeId)) {
        // Already selected, nothing to do
        return true;
      }

      // Get shape data
      const shapesArray = Array.from(shapes.values());
      const shape = shapesArray.find((s) => s.id === shapeId);
      
      if (!shape) {
        console.warn('Shape not found:', shapeId);
        return false;
      }

      // Check if locked by another user
      if (shape.lockedBy && shape.lockedBy !== user.userId) {
        console.log(`🔒 Shape ${shapeId} is locked by ${shape.lockedBy}`);
        return false;
      }

      // If not adding to selection, clear existing selection first
      if (!addToSelection && selectedShapeIds.size > 0) {
        // Release locks on currently selected shapes
        await unlockSelectedShapes();
        // Clear selection
        clearSelectionLocal();
      }

      // Attempt to acquire lock
      const locked = await lockShape(shapeId);

      if (locked) {
        // Add to selection
        selectShapeLocal(shapeId);
        return true;
      } else {
        console.log(`❌ Failed to lock shape ${shapeId}`);
        return false;
      }
    },
    [user, shapes, selectedShapeIds, lockShape, selectShapeLocal, unlockSelectedShapes, clearSelectionLocal]
  );

  /**
   * Deselect a shape (releases lock)
   * 
   * @param shapeId - ID of shape to deselect
   */
  const deselectShape = useCallback(
    async (shapeId: string): Promise<void> => {
      // Remove from selection
      deselectShapeLocal(shapeId);

      // Release lock
      await unlockShape(shapeId);
    },
    [deselectShapeLocal, unlockShape]
  );

  /**
   * Clear all selections (releases all locks)
   */
  const clearSelection = useCallback(async (): Promise<void> => {
    if (selectedShapeIds.size === 0) return;

    // Release all locks
    await unlockSelectedShapes();

    // Clear selection
    clearSelectionLocal();
  }, [selectedShapeIds, unlockSelectedShapes, clearSelectionLocal]);

  return {
    selectedShapeIds,
    selectShape,
    deselectShape,
    clearSelection,
    isSelected,
  };
}

