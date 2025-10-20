/**
 * Text Service
 * 
 * Service layer for text display objects.
 * Handles CRUD operations with Firestore for text objects.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  writeBatch,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '@/api/firebase';
import type { TextDisplayObject, CreateTextData, UpdateTextData } from '../types';
import { DEFAULT_TEXT_PROPERTIES } from '../types';
import { validateTextBatch } from '../../common/utils/dataValidation';

// Firestore collection paths
const DOCUMENT_ID = 'main';
const getTextsCollection = () => collection(firestore, 'documents', DOCUMENT_ID, 'texts');
const getTextDoc = (textId: string) => doc(firestore, 'documents', DOCUMENT_ID, 'texts', textId);

/**
 * Create a new text object in Firestore
 * 
 * @param userId - ID of the user creating the text
 * @param textData - Text object data
 * @returns Promise with the created text object
 */
export const createText = async (
  userId: string,
  textData: CreateTextData
): Promise<TextDisplayObject> => {
  try {
    const textsCol = getTextsCollection();
    
    const newText = {
      // BaseDisplayObject fields
      category: 'text' as const,
      x: textData.x,
      y: textData.y,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      zIndex: 0,
      createdBy: userId,
      createdAt: serverTimestamp(),
      lastModifiedBy: userId,
      lastModifiedAt: serverTimestamp(),
      
      // TextDisplayObject specific fields
      content: textData.content ?? DEFAULT_TEXT_PROPERTIES.content,
      width: textData.width ?? DEFAULT_TEXT_PROPERTIES.width,
      height: textData.height ?? DEFAULT_TEXT_PROPERTIES.height,
      fontFamily: textData.fontFamily ?? DEFAULT_TEXT_PROPERTIES.fontFamily,
      fontSize: textData.fontSize ?? DEFAULT_TEXT_PROPERTIES.fontSize,
      fontWeight: (textData.fontWeight ?? DEFAULT_TEXT_PROPERTIES.fontWeight) as 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900,
      textAlign: textData.textAlign ?? DEFAULT_TEXT_PROPERTIES.textAlign,
      lineHeight: textData.lineHeight ?? DEFAULT_TEXT_PROPERTIES.lineHeight,
      color: textData.color ?? DEFAULT_TEXT_PROPERTIES.color,
      opacity: textData.opacity ?? DEFAULT_TEXT_PROPERTIES.opacity,
    };
    
    const docRef = await addDoc(textsCol, newText);
    
    console.log('[TextService] Text created:', docRef.id);
    
    // Construct properly typed return value
    // Note: createdAt/lastModifiedAt are placeholder timestamps since serverTimestamp() 
    // doesn't return the actual timestamp until Firestore processes it
    const now = Timestamp.fromDate(new Date());
    const createdText: TextDisplayObject = {
      ...newText,
      id: docRef.id,
      createdAt: now,
      lastModifiedAt: now,
    };
    
    return createdText;
  } catch (error) {
    console.error('[TextService] Error creating text:', error);
    throw error;
  }
};

/**
 * Update an existing text object in Firestore
 * 
 * @param userId - ID of the user updating the text
 * @param textId - ID of the text to update
 * @param updates - Partial text data to update
 * @returns Promise that resolves when update is complete
 */
export const updateText = async (
  userId: string,
  textId: string,
  updates: UpdateTextData
): Promise<void> => {
  try {
    const textDoc = getTextDoc(textId);
    
    const updateData = {
      ...updates,
      lastModifiedBy: userId,
      lastModifiedAt: serverTimestamp(),
    };
    
    await updateDoc(textDoc, updateData);
    
    console.log('[TextService] Text updated:', textId);
  } catch (error) {
    console.error('[TextService] Error updating text:', error);
    throw error;
  }
};

/**
 * Batch update multiple text objects
 * 
 * @param userId - ID of the user performing the update
 * @param updates - Array of text updates
 * @returns Promise that resolves when all updates are complete
 */
export const updateTextsBatch = async (
  userId: string,
  updates: Array<{ textId: string; updates: UpdateTextData }>
): Promise<void> => {
  try {
    const batch = writeBatch(firestore);
    
    updates.forEach(({ textId, updates: textUpdates }) => {
      const updateData = {
        ...textUpdates,
        lastModifiedBy: userId,
        lastModifiedAt: serverTimestamp(),
      };
      batch.update(getTextDoc(textId), updateData);
    });
    
    await batch.commit();
    console.log('[TextService] Batch updated', updates.length, 'texts');
  } catch (error) {
    console.error('[TextService] Error batch updating texts:', error);
    throw error;
  }
};

/**
 * Delete a text object from Firestore
 * 
 * @param textId - ID of the text to delete
 * @returns Promise that resolves when delete is complete
 */
export const deleteText = async (textId: string): Promise<void> => {
  try {
    const textDoc = getTextDoc(textId);
    await deleteDoc(textDoc);
    
    console.log('[TextService] Text deleted:', textId);
  } catch (error) {
    console.error('[TextService] Error deleting text:', error);
    throw error;
  }
};

/**
 * Delete multiple text objects in a single batch operation
 * 
 * More efficient than calling deleteText() multiple times
 * Uses Firestore batch writes (max 500 operations per batch)
 * 
 * @param textIds - Array of text IDs to delete
 * @returns Promise resolving to the number of texts deleted
 */
export const deleteTexts = async (textIds: string[]): Promise<number> => {
  try {
    if (textIds.length === 0) {
      console.log('[TextService] No texts to delete');
      return 0;
    }

    console.log(`[TextService] Batch deleting ${textIds.length} texts...`);

    // Firestore batches support max 500 operations
    const BATCH_SIZE = 500;
    let totalDeleted = 0;

    // Process in chunks of 500
    for (let i = 0; i < textIds.length; i += BATCH_SIZE) {
      const batch = writeBatch(firestore);
      const chunk = textIds.slice(i, i + BATCH_SIZE);

      chunk.forEach((textId) => {
        const textRef = getTextDoc(textId);
        batch.delete(textRef);
      });

      await batch.commit();
      totalDeleted += chunk.length;
    }

    console.log(`[TextService] Successfully batch deleted ${totalDeleted} texts`);
    return totalDeleted;
  } catch (error) {
    console.error('[TextService] Error batch deleting texts:', error);
    throw error;
  }
};

/**
 * Delete all text objects
 * 
 * Uses batch delete for efficiency
 * 
 * @returns Promise resolving to the number of texts deleted
 */
export const deleteAllTexts = async (): Promise<number> => {
  try {
    console.log('[TextService] Deleting all texts...');
    
    // Get all texts
    const textsSnapshot = await getDocs(getTextsCollection());
    
    if (textsSnapshot.empty) {
      console.log('[TextService] No texts to delete');
      return 0;
    }
    
    // Use batch delete for efficiency (max 500 operations per batch)
    const batch = writeBatch(firestore);
    let count = 0;
    
    textsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });
    
    await batch.commit();
    console.log(`[TextService] Successfully deleted ${count} texts`);
    
    return count;
  } catch (error) {
    console.error('[TextService] Error deleting all texts:', error);
    throw error;
  }
};

/**
 * Update Z-index for multiple texts (reordering)
 * 
 * Uses batch writes for atomic updates and reduced network overhead.
 * Triggers only ONE real-time update event instead of N events.
 * 
 * @param updates - Array of {textId, zIndex} pairs
 */
export const updateZIndexes = async (
  updates: Array<{ textId: string; zIndex: number }>
): Promise<void> => {
  try {
    if (updates.length === 0) {
      return;
    }

    const batch = writeBatch(firestore);
    
    updates.forEach(({ textId, zIndex }) => {
      batch.update(getTextDoc(textId), { zIndex });
    });
    
    await batch.commit();
    console.log('[TextService] Z-indexes updated for', updates.length, 'texts');
  } catch (error) {
    console.error('[TextService] Error updating z-indexes:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for all text objects
 * 
 * @param callback - Callback function called with updated texts array
 * @returns Unsubscribe function to stop listening
 */
export const subscribeToTexts = (
  callback: (texts: TextDisplayObject[]) => void
): Unsubscribe => {
  const textsCol = getTextsCollection();
  const q = query(textsCol);
  
  return onSnapshot(q, (snapshot) => {
    // Collect raw data for batch validation
    const rawTexts = snapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data(),
    }));
    
    // Validate all texts (logs errors, returns only valid)
    const texts = validateTextBatch(rawTexts);
    
    // Warn if any texts were invalid
    if (rawTexts.length !== texts.length) {
      console.warn(
        `[TextService] Real-time update: Skipped ${rawTexts.length - texts.length} invalid texts`
      );
    }
    
    console.log('[TextService] Real-time update:', texts.length, 'texts');
    callback(texts);
  }, (error) => {
    console.error('[TextService] Error in real-time listener:', error);
  });
};

