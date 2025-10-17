/**
 * Shape Service
 * 
 * Handles all Firestore operations for shapes:
 * - CRUD operations (create, read, update, delete)
 * - Shape locking for collaborative editing
 * - Real-time synchronization
 * 
 * Path: /documents/{documentId}/shapes/{shapeId}
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  runTransaction,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore, DOCUMENT_ID } from '../../../api/firebase';
import type { Shape } from '../../../types/firebase';

/**
 * Get reference to shapes collection
 */
function getShapesCollection(documentId: string = DOCUMENT_ID) {
  return collection(firestore, 'documents', documentId, 'shapes');
}

/**
 * Get reference to specific shape document
 */
function getShapeDoc(shapeId: string, documentId: string = DOCUMENT_ID) {
  return doc(firestore, 'documents', documentId, 'shapes', shapeId);
}

/**
 * Create a new shape
 * 
 * @param shapeData - Partial shape data (id, timestamps, and metadata will be added)
 * @param userId - ID of user creating the shape
 * @returns Promise resolving to created shape
 */
export async function createShape(
  shapeData: Omit<Shape, 'id' | 'createdAt' | 'createdBy' | 'lastModifiedAt' | 'lastModifiedBy' | 'lockedBy' | 'lockedAt'>,
  userId: string,
  documentId: string = DOCUMENT_ID
): Promise<Shape> {
  const shapeId = crypto.randomUUID();
  const now = Timestamp.now();

  const shape: Shape = {
    ...shapeData,
    id: shapeId,
    createdBy: userId,
    createdAt: now,
    lastModifiedBy: userId,
    lastModifiedAt: now,
    lockedBy: null,
    lockedAt: null,
  };

  const shapeRef = getShapeDoc(shapeId, documentId);
  await setDoc(shapeRef, shape);

  console.log('✅ Shape created:', shapeId, shape.type);
  return shape;
}

/**
 * Update an existing shape
 * 
 * @param shapeId - ID of shape to update
 * @param updates - Partial shape data to update
 * @param userId - ID of user making the update
 * @returns Promise resolving when update is complete
 */
export async function updateShape(
  shapeId: string,
  updates: Partial<Omit<Shape, 'id' | 'createdAt' | 'createdBy'>>,
  userId: string,
  documentId: string = DOCUMENT_ID
): Promise<void> {
  const shapeRef = getShapeDoc(shapeId, documentId);

  const updateData = {
    ...updates,
    lastModifiedBy: userId,
    lastModifiedAt: Timestamp.now(),
  };

  await updateDoc(shapeRef, updateData);
  console.log('✅ Shape updated:', shapeId);
}

/**
 * Delete a shape
 * 
 * @param shapeId - ID of shape to delete
 * @returns Promise resolving when deletion is complete
 */
export async function deleteShape(
  shapeId: string,
  documentId: string = DOCUMENT_ID
): Promise<void> {
  const shapeRef = getShapeDoc(shapeId, documentId);
  await deleteDoc(shapeRef);
  console.log('✅ Shape deleted:', shapeId);
}

/**
 * Get a single shape by ID
 * 
 * @param shapeId - ID of shape to fetch
 * @returns Promise resolving to shape or null if not found
 */
export async function getShape(
  shapeId: string,
  documentId: string = DOCUMENT_ID
): Promise<Shape | null> {
  const shapeRef = getShapeDoc(shapeId, documentId);
  const shapeSnap = await getDoc(shapeRef);

  if (shapeSnap.exists()) {
    return shapeSnap.data() as Shape;
  }

  return null;
}

/**
 * Get all shapes for a document
 * 
 * @returns Promise resolving to array of shapes
 */
export async function getAllShapes(
  documentId: string = DOCUMENT_ID
): Promise<Shape[]> {
  const shapesRef = getShapesCollection(documentId);
  const q = query(shapesRef, orderBy('zIndex', 'asc'));
  const querySnapshot = await getDocs(q);

  const shapes: Shape[] = [];
  querySnapshot.forEach((doc) => {
    shapes.push(doc.data() as Shape);
  });

  console.log(`✅ Loaded ${shapes.length} shapes`);
  return shapes;
}

/**
 * Subscribe to real-time shape updates
 * 
 * @param callback - Function called when shapes change
 * @returns Unsubscribe function to stop listening
 */
export function subscribeToShapes(
  callback: (shapes: Shape[]) => void,
  documentId: string = DOCUMENT_ID
): Unsubscribe {
  const shapesRef = getShapesCollection(documentId);
  const q = query(shapesRef, orderBy('zIndex', 'asc'));

  console.log('👂 Subscribing to shape updates...');

  return onSnapshot(
    q,
    (snapshot) => {
      const shapes: Shape[] = [];
      snapshot.forEach((doc) => {
        shapes.push(doc.data() as Shape);
      });

      console.log(`🔄 Shape update: ${shapes.length} shapes`);
      callback(shapes);
    },
    (error) => {
      console.error('❌ Error in shape subscription:', error);
    }
  );
}

/**
 * Lock a shape for editing
 * 
 * Uses Firestore transaction to ensure only one user can lock at a time.
 * 
 * @param shapeId - ID of shape to lock
 * @param userId - ID of user requesting lock
 * @returns Promise resolving to true if lock acquired, false if already locked
 */
export async function lockShape(
  shapeId: string,
  userId: string,
  documentId: string = DOCUMENT_ID
): Promise<boolean> {
  const shapeRef = getShapeDoc(shapeId, documentId);

  try {
    const result = await runTransaction(firestore, async (transaction) => {
      const shapeDoc = await transaction.get(shapeRef);

      if (!shapeDoc.exists()) {
        console.warn('⚠️ Shape does not exist:', shapeId);
        return false;
      }

      const shape = shapeDoc.data() as Shape;

      // Check if shape is already locked by another user
      if (shape.lockedBy && shape.lockedBy !== userId) {
        // Check if lock is stale (older than 60 seconds)
        const now = Timestamp.now();
        const lockAge = shape.lockedAt
          ? now.toMillis() - shape.lockedAt.toMillis()
          : Infinity;

        if (lockAge < 60000) {
          // Lock is fresh, cannot acquire
          console.log('🔒 Shape locked by another user:', shapeId, shape.lockedBy);
          return false;
        }

        // Lock is stale, we can take it
        console.log('♻️ Taking over stale lock:', shapeId);
      }

      // Acquire lock
      transaction.update(shapeRef, {
        lockedBy: userId,
        lockedAt: Timestamp.now(),
        lastModifiedBy: userId,
        lastModifiedAt: Timestamp.now(),
      });

      console.log('✅ Shape locked:', shapeId, 'by', userId);
      return true;
    });

    return result;
  } catch (error) {
    console.error('❌ Error locking shape:', error);
    return false;
  }
}

/**
 * Unlock a shape
 * 
 * Only the user who locked the shape can unlock it (or any user if lock is stale).
 * 
 * @param shapeId - ID of shape to unlock
 * @param userId - ID of user requesting unlock (optional, for validation)
 * @returns Promise resolving when unlock is complete
 */
export async function unlockShape(
  shapeId: string,
  userId?: string,
  documentId: string = DOCUMENT_ID
): Promise<void> {
  const shapeRef = getShapeDoc(shapeId, documentId);

  try {
    await runTransaction(firestore, async (transaction) => {
      const shapeDoc = await transaction.get(shapeRef);

      if (!shapeDoc.exists()) {
        console.warn('⚠️ Shape does not exist:', shapeId);
        return;
      }

      const shape = shapeDoc.data() as Shape;

      // If userId provided, verify lock ownership
      if (userId && shape.lockedBy && shape.lockedBy !== userId) {
        console.warn('⚠️ Cannot unlock shape locked by another user:', shapeId);
        return;
      }

      // Release lock
      transaction.update(shapeRef, {
        lockedBy: null,
        lockedAt: null,
        lastModifiedBy: userId || shape.lastModifiedBy,
        lastModifiedAt: Timestamp.now(),
      });

      console.log('🔓 Shape unlocked:', shapeId);
    });
  } catch (error) {
    console.error('❌ Error unlocking shape:', error);
  }
}

/**
 * Check if a shape is locked
 * 
 * @param shapeId - ID of shape to check
 * @returns Promise resolving to lock info
 */
export async function isShapeLocked(
  shapeId: string,
  documentId: string = DOCUMENT_ID
): Promise<{ locked: boolean; lockedBy: string | null }> {
  const shape = await getShape(shapeId, documentId);

  if (!shape) {
    return { locked: false, lockedBy: null };
  }

  // Check if lock is stale
  if (shape.lockedBy && shape.lockedAt) {
    const now = Timestamp.now();
    const lockAge = now.toMillis() - shape.lockedAt.toMillis();

    if (lockAge >= 60000) {
      // Lock is stale
      return { locked: false, lockedBy: null };
    }
  }

  return {
    locked: shape.lockedBy !== null,
    lockedBy: shape.lockedBy,
  };
}

/**
 * Get the highest z-index in the document
 * Useful for adding new shapes on top
 * 
 * @returns Promise resolving to highest z-index (or 0 if no shapes)
 */
export async function getMaxZIndex(
  documentId: string = DOCUMENT_ID
): Promise<number> {
  const shapes = await getAllShapes(documentId);

  if (shapes.length === 0) {
    return 0;
  }

  return Math.max(...shapes.map((shape) => shape.zIndex));
}

