/**
 * Shape Service
 * 
 * Service layer for shape display object CRUD operations and real-time sync
 * All Firestore interactions for shapes go through this service
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { firestore } from '@/api/firebase';
import type { ShapeDisplayObject, CreateShapeData, UpdateShapeData } from '../types';
import { DEFAULT_SHAPE_PROPERTIES } from '../types';
import { roundPosition, roundNumericProperty } from '@/features/displayObjects/common/utils/transformMath';
import { validateShapeData, validateShapeBatch } from '../../common/utils/dataValidation';

/**
 * Get reference to shapes collection
 */
const getShapesCollection = () => {
  return collection(firestore, 'documents', 'main', 'shapes');
};

/**
 * Get reference to a specific shape document
 */
const getShapeDoc = (shapeId: string) => {
  return doc(firestore, 'documents', 'main', 'shapes', shapeId);
};

/**
 * Create a new shape
 * 
 * @param userId - ID of user creating the shape
 * @param shapeData - Shape creation data
 * @returns Promise resolving to the created shape's ID
 */
export const createShape = async (
  userId: string,
  shapeData: CreateShapeData
): Promise<string> => {
  try {
    const defaults = DEFAULT_SHAPE_PROPERTIES[shapeData.type];
    
    // Build shape document with defaults (round numeric values to 2 decimal places)
    const shapeDoc = {
      category: 'shape',
      type: shapeData.type,
      
      // Position
      x: roundPosition(shapeData.x),
      y: roundPosition(shapeData.y),
      
      // Transform
      rotation: roundNumericProperty(shapeData.rotation ?? defaults.rotation),
      scaleX: roundNumericProperty(shapeData.scaleX ?? defaults.scaleX),
      scaleY: roundNumericProperty(shapeData.scaleY ?? defaults.scaleY),
      
      // Visual properties
      fillColor: shapeData.fillColor ?? defaults.fillColor,
      strokeColor: shapeData.strokeColor ?? defaults.strokeColor,
      strokeWidth: roundNumericProperty(shapeData.strokeWidth ?? defaults.strokeWidth),
      opacity: roundNumericProperty(shapeData.opacity ?? defaults.opacity),
      
      // Dimensions (type-specific)
      ...(shapeData.type === 'rectangle' && {
        width: roundNumericProperty(shapeData.width ?? (defaults as typeof DEFAULT_SHAPE_PROPERTIES.rectangle).width),
        height: roundNumericProperty(shapeData.height ?? (defaults as typeof DEFAULT_SHAPE_PROPERTIES.rectangle).height),
        borderRadius: roundNumericProperty(shapeData.borderRadius ?? (defaults as typeof DEFAULT_SHAPE_PROPERTIES.rectangle).borderRadius),
      }),
      ...(shapeData.type === 'circle' && {
        radius: roundNumericProperty(shapeData.radius ?? (defaults as typeof DEFAULT_SHAPE_PROPERTIES.circle).radius),
        width: roundNumericProperty(shapeData.width ?? (shapeData.radius ?? (defaults as typeof DEFAULT_SHAPE_PROPERTIES.circle).radius) * 2),
        height: roundNumericProperty(shapeData.height ?? (shapeData.radius ?? (defaults as typeof DEFAULT_SHAPE_PROPERTIES.circle).radius) * 2),
      }),
      ...(shapeData.type === 'line' && {
        points: shapeData.points ?? (defaults as typeof DEFAULT_SHAPE_PROPERTIES.line).points,
      }),
      
      // Z-index
      zIndex: shapeData.zIndex ?? 0,
      
      // Metadata
      createdBy: userId,
      createdAt: serverTimestamp(),
      lastModifiedBy: userId,
      lastModifiedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(getShapesCollection(), shapeDoc);
    console.log('[ShapeService] Shape created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[ShapeService] Error creating shape:', error);
    throw error;
  }
};

/**
 * Update an existing shape
 * 
 * @param shapeId - ID of shape to update
 * @param userId - ID of user making the update
 * @param updates - Partial shape data to update
 */
export const updateShape = async (
  shapeId: string,
  userId: string,
  updates: UpdateShapeData
): Promise<void> => {
  try {
    const updateData = {
      ...updates,
      lastModifiedBy: userId,
      lastModifiedAt: serverTimestamp(),
    };
    
    await updateDoc(getShapeDoc(shapeId), updateData);
    // console.log('[ShapeService] Shape updated:', shapeId); // Commented to reduce console noise
  } catch (error) {
    console.error('[ShapeService] Error updating shape:', error);
    throw error;
  }
};

/**
 * Delete a shape
 * 
 * @param shapeId - ID of shape to delete
 */
export const deleteShape = async (shapeId: string): Promise<void> => {
  try {
    await deleteDoc(getShapeDoc(shapeId));
    console.log('[ShapeService] Shape deleted:', shapeId);
  } catch (error) {
    console.error('[ShapeService] Error deleting shape:', error);
    throw error;
  }
};

/**
 * Delete multiple shapes in a single batch operation
 * 
 * More efficient than calling deleteShape() multiple times
 * Uses Firestore batch writes (max 500 operations per batch)
 * 
 * @param shapeIds - Array of shape IDs to delete
 * @returns Promise resolving to the number of shapes deleted
 */
export const deleteShapes = async (shapeIds: string[]): Promise<number> => {
  try {
    if (shapeIds.length === 0) {
      console.log('[ShapeService] No shapes to delete');
      return 0;
    }

    console.log(`[ShapeService] Batch deleting ${shapeIds.length} shapes...`);

    // Firestore batches support max 500 operations
    const BATCH_SIZE = 500;
    let totalDeleted = 0;

    // Process in chunks of 500
    for (let i = 0; i < shapeIds.length; i += BATCH_SIZE) {
      const batch = writeBatch(firestore);
      const chunk = shapeIds.slice(i, i + BATCH_SIZE);

      chunk.forEach((shapeId) => {
        const shapeRef = getShapeDoc(shapeId);
        batch.delete(shapeRef);
      });

      await batch.commit();
      totalDeleted += chunk.length;
    }

    console.log(`[ShapeService] Successfully batch deleted ${totalDeleted} shapes`);
    return totalDeleted;
  } catch (error) {
    console.error('[ShapeService] Error batch deleting shapes:', error);
    throw error;
  }
};

/**
 * Delete all shapes
 * 
 * Uses batch delete for efficiency
 * 
 * @returns Promise resolving to the number of shapes deleted
 */
export const deleteAllShapes = async (): Promise<number> => {
  try {
    console.log('[ShapeService] Deleting all shapes...');
    
    // Get all shapes
    const shapesSnapshot = await getDocs(getShapesCollection());
    
    if (shapesSnapshot.empty) {
      console.log('[ShapeService] No shapes to delete');
      return 0;
    }
    
    // Use batch delete for efficiency (max 500 operations per batch)
    const batch = writeBatch(firestore);
    let count = 0;
    
    shapesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });
    
    await batch.commit();
    console.log(`[ShapeService] Successfully deleted ${count} shapes`);
    
    return count;
  } catch (error) {
    console.error('[ShapeService] Error deleting all shapes:', error);
    throw error;
  }
};

/**
 * Get a single shape by ID
 * 
 * @param shapeId - ID of shape to fetch
 * @returns Promise resolving to shape data or null if not found
 */
export const getShape = async (shapeId: string): Promise<ShapeDisplayObject | null> => {
  try {
    const docSnap = await getDoc(getShapeDoc(shapeId));
    
    if (!docSnap.exists()) {
      return null;
    }
    
    // Validate data before returning
    const result = validateShapeData(docSnap.id, docSnap.data());
    
    if (!result.valid) {
      console.error('[ShapeService] Invalid shape data:', result.errors);
      return null; // Return null for invalid data instead of crashing
    }
    
    return result.data;
  } catch (error) {
    console.error('[ShapeService] Error getting shape:', error);
    throw error;
  }
};

/**
 * Get all shapes
 * 
 * @returns Promise resolving to array of all shapes
 */
export const getAllShapes = async (): Promise<ShapeDisplayObject[]> => {
  try {
    const q = query(getShapesCollection(), orderBy('zIndex', 'asc'));
    const querySnapshot = await getDocs(q);
    
    // Collect raw data for batch validation
    const rawShapes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data(),
    }));
    
    // Validate all shapes (logs errors, returns only valid)
    const shapes = validateShapeBatch(rawShapes);
    
    console.log('[ShapeService] Fetched shapes:', shapes.length);
    if (rawShapes.length !== shapes.length) {
      console.warn(
        `[ShapeService] Skipped ${rawShapes.length - shapes.length} invalid shapes`
      );
    }
    
    return shapes;
  } catch (error) {
    console.error('[ShapeService] Error getting all shapes:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time shape updates
 * 
 * @param callback - Called with updated shapes array on each change
 * @returns Unsubscribe function
 */
export const subscribeToShapes = (
  callback: (shapes: ShapeDisplayObject[]) => void
): (() => void) => {
  const q = query(getShapesCollection(), orderBy('zIndex', 'asc'));
  
  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      // Collect raw data for batch validation
      const rawShapes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data(),
      }));
      
      // Validate all shapes (logs errors, returns only valid)
      const shapes = validateShapeBatch(rawShapes);
      
      // Warn if any shapes were invalid
      if (rawShapes.length !== shapes.length) {
        console.warn(
          `[ShapeService] Real-time update: Skipped ${rawShapes.length - shapes.length} invalid shapes`
        );
      }
      
      // console.log('[ShapeService] Real-time update:', shapes.length, 'shapes'); // Commented to reduce console noise
      callback(shapes);
    },
    (error) => {
      console.error('[ShapeService] Real-time subscription error:', error);
    }
  );
  
  return unsubscribe;
};

/**
 * Update multiple shapes atomically using batch write
 * 
 * Batch writes trigger only ONE real-time update event instead of N events.
 * Use this for transform operations (rotation, scale, drag) that affect multiple shapes.
 * 
 * @param userId - ID of user making the updates
 * @param updates - Array of {shapeId, updates} pairs
 */
export const updateShapesBatch = async (
  userId: string,
  updates: Array<{ shapeId: string; updates: UpdateShapeData }>
): Promise<void> => {
  try {
    const batch = writeBatch(firestore);
    
    updates.forEach(({ shapeId, updates: shapeUpdates }) => {
      const updateData = {
        ...shapeUpdates,
        lastModifiedBy: userId,
        lastModifiedAt: serverTimestamp(),
      };
      batch.update(getShapeDoc(shapeId), updateData);
    });
    
    await batch.commit();
    console.log('[ShapeService] Batch updated', updates.length, 'shapes');
  } catch (error) {
    console.error('[ShapeService] Error batch updating shapes:', error);
    throw error;
  }
};

/**
 * Update Z-index for multiple shapes (reordering)
 * 
 * Uses batch writes for atomic updates and reduced network overhead.
 * Triggers only ONE real-time update event instead of N events.
 * 
 * @param updates - Array of {shapeId, zIndex} pairs
 */
export const updateZIndexes = async (
  updates: Array<{ shapeId: string; zIndex: number }>
): Promise<void> => {
  try {
    if (updates.length === 0) {
      return;
    }

    const batch = writeBatch(firestore);
    
    updates.forEach(({ shapeId, zIndex }) => {
      batch.update(getShapeDoc(shapeId), { zIndex });
    });
    
    await batch.commit();
    console.log('[ShapeService] Z-indexes updated for', updates.length, 'shapes');
  } catch (error) {
    console.error('[ShapeService] Error updating z-indexes:', error);
    throw error;
  }
};

