/**
 * useShapes Hook
 * 
 * Manages shape CRUD operations and real-time synchronization.
 * Provides shape state management and collaborative editing capabilities.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  listenToShapes, 
  createShape, 
  updateShape, 
  deleteShape, 
  lockShape, 
  unlockShape,
  moveShape,
  isShapeLocked
} from '@/services/shapeService';
import type { Shape, ShapeState, CreateShapeData, UpdateShapeData } from '@/types';

/**
 * Custom hook for shape management
 */
export const useShapes = () => {
  const [shapeState, setShapeState] = useState<ShapeState>({
    shapes: new Map(),
    selectedShapeId: null,
    isLoading: true,
    error: null
  });

  /**
   * Create a new shape
   */
  const addShape = useCallback(async (shapeData: CreateShapeData): Promise<Shape> => {
    try {
      const newShape = await createShape(shapeData);
      
      setShapeState(prev => ({
        ...prev,
        shapes: new Map(prev.shapes).set(newShape.id, newShape),
        error: null
      }));

      return newShape;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create shape';
      setShapeState(prev => ({
        ...prev,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  /**
   * Update an existing shape
   */
  const updateShapeById = useCallback(async (
    shapeId: string, 
    updates: UpdateShapeData
  ): Promise<void> => {
    try {
      await updateShape(shapeId, updates);
      
      setShapeState(prev => {
        const updatedShapes = new Map(prev.shapes);
        const existingShape = updatedShapes.get(shapeId);
        
        if (existingShape) {
          updatedShapes.set(shapeId, { ...existingShape, ...updates });
        }
        
        return {
          ...prev,
          shapes: updatedShapes,
          error: null
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update shape';
      setShapeState(prev => ({
        ...prev,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  /**
   * Delete a shape
   */
  const removeShape = useCallback(async (shapeId: string): Promise<void> => {
    try {
      await deleteShape(shapeId);
      
      setShapeState(prev => {
        const updatedShapes = new Map(prev.shapes);
        updatedShapes.delete(shapeId);
        
        return {
          ...prev,
          shapes: updatedShapes,
          selectedShapeId: prev.selectedShapeId === shapeId ? null : prev.selectedShapeId,
          error: null
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete shape';
      setShapeState(prev => ({
        ...prev,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  /**
   * Lock a shape for editing
   */
  const lockShapeById = useCallback(async (
    shapeId: string, 
    userId: string
  ): Promise<boolean> => {
    try {
      const locked = await lockShape(shapeId, userId);
      
      if (locked) {
        setShapeState(prev => {
          const updatedShapes = new Map(prev.shapes);
          const existingShape = updatedShapes.get(shapeId);
          
          if (existingShape) {
            updatedShapes.set(shapeId, {
              ...existingShape,
              lockedBy: userId,
              lockedAt: new Date() as any
            });
          }
          
          return {
            ...prev,
            shapes: updatedShapes
          };
        });
      }
      
      return locked;
    } catch (error) {
      console.error('Failed to lock shape:', error);
      return false;
    }
  }, []);

  /**
   * Unlock a shape
   */
  const unlockShapeById = useCallback(async (
    shapeId: string, 
    userId: string
  ): Promise<void> => {
    try {
      await unlockShape(shapeId, userId);
      
      setShapeState(prev => {
        const updatedShapes = new Map(prev.shapes);
        const existingShape = updatedShapes.get(shapeId);
        
        if (existingShape) {
          updatedShapes.set(shapeId, {
            ...existingShape,
            lockedBy: undefined,
            lockedAt: undefined
          });
        }
        
        return {
          ...prev,
          shapes: updatedShapes
        };
      });
    } catch (error) {
      console.error('Failed to unlock shape:', error);
    }
  }, []);

  /**
   * Move a shape to a new position
   */
  const moveShapeById = useCallback(async (
    shapeId: string, 
    userId: string, 
    newPosition: { x: number; y: number }
  ): Promise<void> => {
    try {
      await moveShape(shapeId, userId, newPosition);
      
      setShapeState(prev => {
        const updatedShapes = new Map(prev.shapes);
        const existingShape = updatedShapes.get(shapeId);
        
        if (existingShape) {
          updatedShapes.set(shapeId, {
            ...existingShape,
            x: newPosition.x,
            y: newPosition.y
          });
        }
        
        return {
          ...prev,
          shapes: updatedShapes
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to move shape';
      setShapeState(prev => ({
        ...prev,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  /**
   * Select a shape
   */
  const selectShape = useCallback((shapeId: string | null): void => {
    setShapeState(prev => ({
      ...prev,
      selectedShapeId: shapeId
    }));
  }, []);

  /**
   * Check if a shape is locked
   */
  const checkShapeLock = useCallback(async (shapeId: string): Promise<boolean> => {
    try {
      return await isShapeLocked(shapeId);
    } catch (error) {
      console.error('Failed to check shape lock:', error);
      return false;
    }
  }, []);

  /**
   * Set up shapes listener
   */
  useEffect(() => {
    const unsubscribe = listenToShapes(
      (shapes: Shape[]) => {
        const shapesMap = new Map<string, Shape>();
        shapes.forEach(shape => {
          shapesMap.set(shape.id, shape);
        });

        setShapeState(prev => ({
          ...prev,
          shapes: shapesMap,
          isLoading: false,
          error: null
        }));
      },
      (error: Error) => {
        console.error('Error in shapes listener:', error);
        setShapeState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message
        }));
      }
    );

    return () => unsubscribe();
  }, []);

  /**
   * Get shapes as array
   */
  const getShapes = useCallback((): Shape[] => {
    return Array.from(shapeState.shapes.values());
  }, [shapeState.shapes]);

  /**
   * Get shape by ID
   */
  const getShapeById = useCallback((shapeId: string): Shape | undefined => {
    return shapeState.shapes.get(shapeId);
  }, [shapeState.shapes]);

  /**
   * Get selected shape
   */
  const getSelectedShape = useCallback((): Shape | undefined => {
    if (!shapeState.selectedShapeId) return undefined;
    return shapeState.shapes.get(shapeState.selectedShapeId);
  }, [shapeState.selectedShapeId, shapeState.shapes]);

  return {
    // State
    shapes: getShapes(),
    shapesMap: shapeState.shapes,
    selectedShapeId: shapeState.selectedShapeId,
    selectedShape: getSelectedShape(),
    isLoading: shapeState.isLoading,
    error: shapeState.error,
    
    // Actions
    addShape,
    updateShapeById,
    removeShape,
    lockShapeById,
    unlockShapeById,
    moveShapeById,
    selectShape,
    checkShapeLock,
    getShapeById
  };
};
