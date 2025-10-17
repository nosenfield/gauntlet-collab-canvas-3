/**
 * useShapes Hook
 * 
 * Main hook for interacting with shapes.
 * Provides CRUD operations and access to shapes state.
 */

import { useCallback } from 'react';
import type { Shape } from '../../../types/firebase';
import { useAuth } from '../../auth/store/authStore';
import {
  createShape as createShapeService,
  updateShape as updateShapeService,
  deleteShape as deleteShapeService,
  lockShape as lockShapeService,
  unlockShape as unlockShapeService,
  getMaxZIndex,
} from '../services/shapeService';
import {
  useShapesContext,
  useShapesArray,
  useShapesLoading,
  useShapesError,
} from '../store/shapesStore';

/**
 * useShapes Hook Return Type
 */
interface UseShapesReturn {
  // State
  shapes: Shape[];
  loading: boolean;
  error: string | null;

  // CRUD Operations
  createShape: (
    shapeData: Omit<Shape, 'id' | 'createdAt' | 'createdBy' | 'lastModifiedAt' | 'lastModifiedBy' | 'lockedBy' | 'lockedAt'>
  ) => Promise<Shape>;
  updateShape: (shapeId: string, updates: Partial<Omit<Shape, 'id' | 'createdAt' | 'createdBy'>>) => Promise<void>;
  deleteShape: (shapeId: string) => Promise<void>;

  // Locking Operations
  lockShape: (shapeId: string) => Promise<boolean>;
  unlockShape: (shapeId: string) => Promise<void>;

  // Utility
  getNextZIndex: () => Promise<number>;
}

/**
 * Main hook for shape operations
 * 
 * @returns Shape state and operations
 */
export function useShapes(documentId: string = 'main'): UseShapesReturn {
  const { user } = useAuth();
  const { dispatch } = useShapesContext();
  const shapes = useShapesArray();
  const loading = useShapesLoading();
  const error = useShapesError();

  const currentUserId = user?.userId;

  /**
   * Create a new shape
   */
  const createShape = useCallback(
    async (
      shapeData: Omit<Shape, 'id' | 'createdAt' | 'createdBy' | 'lastModifiedAt' | 'lastModifiedBy' | 'lockedBy' | 'lockedAt'>
    ): Promise<Shape> => {
      if (!currentUserId) {
        throw new Error('Cannot create shape: User not authenticated');
      }

      try {
        const shape = await createShapeService(shapeData, currentUserId, documentId);

        // Optimistically add to local state
        dispatch({ type: 'ADD_SHAPE', payload: shape });

        return shape;
      } catch (error) {
        console.error('Error creating shape:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to create shape' });
        throw error;
      }
    },
    [currentUserId, documentId, dispatch]
  );

  /**
   * Update an existing shape
   */
  const updateShape = useCallback(
    async (
      shapeId: string,
      updates: Partial<Omit<Shape, 'id' | 'createdAt' | 'createdBy'>>
    ): Promise<void> => {
      if (!currentUserId) {
        throw new Error('Cannot update shape: User not authenticated');
      }

      try {
        // Optimistically update local state
        dispatch({ type: 'UPDATE_SHAPE', payload: { shapeId, updates } });

        // Update in Firestore
        await updateShapeService(shapeId, updates, currentUserId, documentId);
      } catch (error) {
        console.error('Error updating shape:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to update shape' });
        throw error;
      }
    },
    [currentUserId, documentId, dispatch]
  );

  /**
   * Delete a shape
   */
  const deleteShape = useCallback(
    async (shapeId: string): Promise<void> => {
      try {
        // Optimistically remove from local state
        dispatch({ type: 'DELETE_SHAPE', payload: shapeId });

        // Delete from Firestore
        await deleteShapeService(shapeId, documentId);
      } catch (error) {
        console.error('Error deleting shape:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to delete shape' });
        throw error;
      }
    },
    [documentId, dispatch]
  );

  /**
   * Lock a shape for editing
   */
  const lockShape = useCallback(
    async (shapeId: string): Promise<boolean> => {
      if (!currentUserId) {
        console.warn('Cannot lock shape: User not authenticated');
        return false;
      }

      try {
        const locked = await lockShapeService(shapeId, currentUserId, documentId);

        if (!locked) {
          console.log('Shape is already locked by another user');
        }

        return locked;
      } catch (error) {
        console.error('Error locking shape:', error);
        return false;
      }
    },
    [currentUserId, documentId]
  );

  /**
   * Unlock a shape
   */
  const unlockShape = useCallback(
    async (shapeId: string): Promise<void> => {
      if (!currentUserId) {
        console.warn('Cannot unlock shape: User not authenticated');
        return;
      }

      try {
        await unlockShapeService(shapeId, currentUserId, documentId);
      } catch (error) {
        console.error('Error unlocking shape:', error);
      }
    },
    [currentUserId, documentId]
  );

  /**
   * Get next available z-index (for new shapes on top)
   */
  const getNextZIndex = useCallback(async (): Promise<number> => {
    try {
      const maxZIndex = await getMaxZIndex(documentId);
      return maxZIndex + 1;
    } catch (error) {
      console.error('Error getting max z-index:', error);
      // Fallback to current shapes length
      return shapes.length;
    }
  }, [documentId, shapes.length]);

  return {
    // State
    shapes,
    loading,
    error,

    // Operations
    createShape,
    updateShape,
    deleteShape,
    lockShape,
    unlockShape,

    // Utility
    getNextZIndex,
  };
}

