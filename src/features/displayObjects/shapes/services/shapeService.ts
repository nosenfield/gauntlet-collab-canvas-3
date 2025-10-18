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
    
    // Build shape document with defaults
    const shapeDoc = {
      category: 'shape',
      type: shapeData.type,
      
      // Position
      x: shapeData.x,
      y: shapeData.y,
      
      // Transform
      rotation: shapeData.rotation ?? defaults.rotation,
      scaleX: shapeData.scaleX ?? defaults.scaleX,
      scaleY: shapeData.scaleY ?? defaults.scaleY,
      
      // Visual properties
      fillColor: shapeData.fillColor ?? defaults.fillColor,
      strokeColor: shapeData.strokeColor ?? defaults.strokeColor,
      strokeWidth: shapeData.strokeWidth ?? defaults.strokeWidth,
      opacity: shapeData.opacity ?? defaults.opacity,
      
      // Dimensions (type-specific)
      ...(shapeData.type === 'rectangle' && {
        width: shapeData.width ?? (defaults as typeof DEFAULT_SHAPE_PROPERTIES.rectangle).width,
        height: shapeData.height ?? (defaults as typeof DEFAULT_SHAPE_PROPERTIES.rectangle).height,
        borderRadius: shapeData.borderRadius ?? (defaults as typeof DEFAULT_SHAPE_PROPERTIES.rectangle).borderRadius,
      }),
      ...(shapeData.type === 'circle' && {
        radius: shapeData.radius ?? (defaults as typeof DEFAULT_SHAPE_PROPERTIES.circle).radius,
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
    console.log('[ShapeService] Shape updated:', shapeId);
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
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as ShapeDisplayObject;
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
    
    const shapes: ShapeDisplayObject[] = [];
    querySnapshot.forEach((doc) => {
      shapes.push({
        id: doc.id,
        ...doc.data(),
      } as ShapeDisplayObject);
    });
    
    console.log('[ShapeService] Fetched shapes:', shapes.length);
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
      const shapes: ShapeDisplayObject[] = [];
      querySnapshot.forEach((doc) => {
        shapes.push({
          id: doc.id,
          ...doc.data(),
        } as ShapeDisplayObject);
      });
      
      console.log('[ShapeService] Real-time update:', shapes.length, 'shapes');
      callback(shapes);
    },
    (error) => {
      console.error('[ShapeService] Real-time subscription error:', error);
    }
  );
  
  return unsubscribe;
};

/**
 * Update Z-index for multiple shapes (reordering)
 * 
 * @param updates - Array of {shapeId, zIndex} pairs
 */
export const updateZIndexes = async (
  updates: Array<{ shapeId: string; zIndex: number }>
): Promise<void> => {
  try {
    // Note: In a production app, use batch writes for atomic updates
    await Promise.all(
      updates.map(({ shapeId, zIndex }) =>
        updateDoc(getShapeDoc(shapeId), { zIndex })
      )
    );
    console.log('[ShapeService] Z-indexes updated for', updates.length, 'shapes');
  } catch (error) {
    console.error('[ShapeService] Error updating z-indexes:', error);
    throw error;
  }
};

