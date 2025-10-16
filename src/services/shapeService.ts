/**
 * Shape Service
 * 
 * Manages shape CRUD operations, real-time synchronization,
 * and object locking for collaborative editing.
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  runTransaction,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import type { Shape, CreateShapeData, UpdateShapeData } from '@/types';

/**
 * Listen to shapes collection for real-time updates
 */
export const listenToShapes = (
  callback: (shapes: Shape[]) => void,
  onError?: (error: Error) => void
) => {
  const shapesRef = collection(db, 'shapes');
  const q = query(shapesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const shapes: Shape[] = [];
      snapshot.forEach((doc) => {
        const shapeData = { id: doc.id, ...doc.data() } as Shape;
        shapes.push(shapeData);
      });
      callback(shapes);
    },
    (error) => {
      console.error('Error listening to shapes:', error);
      onError?.(error);
    }
  );
};

/**
 * Create a new shape
 */
export const createShape = async (shapeData: CreateShapeData): Promise<Shape> => {
  try {
    const shapesRef = collection(db, 'shapes');
    const docRef = await addDoc(shapesRef, {
      ...shapeData,
      createdAt: serverTimestamp()
    });

    const newShape: Shape = {
      id: docRef.id,
      ...shapeData,
      createdAt: new Date() as any, // Will be replaced by server timestamp
    };

    return newShape;
  } catch (error) {
    console.error('Error creating shape:', error);
    throw new Error('Failed to create shape');
  }
};

/**
 * Update shape position or properties
 */
export const updateShape = async (
  shapeId: string, 
  updates: UpdateShapeData
): Promise<void> => {
  try {
    const shapeRef = doc(db, 'shapes', shapeId);
    await updateDoc(shapeRef, updates as any);
  } catch (error) {
    console.error('Error updating shape:', error);
    throw new Error('Failed to update shape');
  }
};

/**
 * Lock a shape for exclusive editing
 */
export const lockShape = async (
  shapeId: string, 
  userId: string
): Promise<boolean> => {
  try {
    const shapeRef = doc(db, 'shapes', shapeId);
    
    return await runTransaction(db, async (transaction) => {
      const shapeDoc = await transaction.get(shapeRef);
      
      if (!shapeDoc.exists()) {
        throw new Error('Shape not found');
      }

      const shapeData = shapeDoc.data() as Shape;
      
      // Check if shape is already locked by another user
      if (shapeData.lockedBy && shapeData.lockedBy !== userId) {
        return false; // Shape is locked by another user
      }

      // Lock the shape
      transaction.update(shapeRef, {
        lockedBy: userId,
        lockedAt: serverTimestamp()
      });

      // Set up disconnect handler to release lock
      // Note: onDisconnect is not available in client SDK
      // This would typically be handled by Cloud Functions
      console.log('Shape lock cleanup would be handled by Cloud Functions');

      return true; // Successfully locked
    });
  } catch (error) {
    console.error('Error locking shape:', error);
    throw new Error('Failed to lock shape');
  }
};

/**
 * Unlock a shape
 */
export const unlockShape = async (
  shapeId: string, 
  userId: string
): Promise<void> => {
  try {
    const shapeRef = doc(db, 'shapes', shapeId);
    
    await runTransaction(db, async (transaction) => {
      const shapeDoc = await transaction.get(shapeRef);
      
      if (!shapeDoc.exists()) {
        throw new Error('Shape not found');
      }

      const shapeData = shapeDoc.data() as Shape;
      
      // Only unlock if user owns the lock
      if (shapeData.lockedBy === userId) {
        transaction.update(shapeRef, {
          lockedBy: null,
          lockedAt: null
        });
      }
    });
  } catch (error) {
    console.error('Error unlocking shape:', error);
    throw new Error('Failed to unlock shape');
  }
};

/**
 * Release all locks owned by a user (cleanup on disconnect)
 */
export const releaseUserLocks = async (userId: string): Promise<void> => {
  try {
    // Note: This would typically be done in a Cloud Function
    // For MVP, we'll rely on client-side cleanup
    console.log(`Would release locks for user: ${userId}`);
  } catch (error) {
    console.error('Error releasing user locks:', error);
  }
};

/**
 * Delete a shape
 */
export const deleteShape = async (shapeId: string): Promise<void> => {
  try {
    const shapeRef = doc(db, 'shapes', shapeId);
    await deleteDoc(shapeRef);
  } catch (error) {
    console.error('Error deleting shape:', error);
    throw new Error('Failed to delete shape');
  }
};

/**
 * Move a shape to a new position
 */
export const moveShape = async (
  shapeId: string, 
  userId: string, 
  newPosition: { x: number; y: number }
): Promise<void> => {
  try {
    // First, try to lock the shape
    const locked = await lockShape(shapeId, userId);
    
    if (!locked) {
      throw new Error('Shape is locked by another user');
    }

    // Update the position
    await updateShape(shapeId, { x: newPosition.x, y: newPosition.y });

    // Unlock the shape
    await unlockShape(shapeId, userId);
  } catch (error) {
    console.error('Error moving shape:', error);
    throw new Error('Failed to move shape');
  }
};

/**
 * Check if a shape is locked
 */
export const isShapeLocked = async (shapeId: string): Promise<boolean> => {
  try {
    const shapeRef = doc(db, 'shapes', shapeId);
    const shapeDoc = await getDoc(shapeRef);
    
    if (!shapeDoc.exists()) {
      return false;
    }

    const shapeData = shapeDoc.data() as Shape;
    return !!shapeData.lockedBy;
  } catch (error) {
    console.error('Error checking shape lock status:', error);
    return false;
  }
};
