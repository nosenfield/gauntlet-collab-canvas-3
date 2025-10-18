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
  onSnapshot,
  query,
  serverTimestamp,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { firestore } from '@/api/firebase';
import type { TextDisplayObject, CreateTextData, UpdateTextData } from '../types';
import { DEFAULT_TEXT_PROPERTIES } from '../types';

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
      type: 'text',
      category: 'text',
      x: textData.x,
      y: textData.y,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
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
      fontWeight: textData.fontWeight ?? DEFAULT_TEXT_PROPERTIES.fontWeight,
      textAlign: textData.textAlign ?? DEFAULT_TEXT_PROPERTIES.textAlign,
      lineHeight: textData.lineHeight ?? DEFAULT_TEXT_PROPERTIES.lineHeight,
      color: textData.color ?? DEFAULT_TEXT_PROPERTIES.color,
      opacity: textData.opacity ?? DEFAULT_TEXT_PROPERTIES.opacity,
    };
    
    const docRef = await addDoc(textsCol, newText);
    
    console.log('[TextService] Text created:', docRef.id);
    
    return {
      ...newText,
      id: docRef.id,
      createdAt: new Date(),
      lastModifiedAt: new Date(),
    } as TextDisplayObject;
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
    const texts: TextDisplayObject[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      texts.push({
        id: doc.id,
        type: 'text',
        category: 'text',
        x: data.x,
        y: data.y,
        rotation: data.rotation ?? 0,
        scaleX: data.scaleX ?? 1,
        scaleY: data.scaleY ?? 1,
        content: data.content,
        width: data.width,
        height: data.height,
        fontFamily: data.fontFamily,
        fontSize: data.fontSize,
        fontWeight: data.fontWeight,
        textAlign: data.textAlign,
        lineHeight: data.lineHeight,
        color: data.color,
        opacity: data.opacity,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() ?? new Date(),
        lastModifiedBy: data.lastModifiedBy,
        lastModifiedAt: data.lastModifiedAt?.toDate() ?? new Date(),
      });
    });
    
    console.log('[TextService] Real-time update:', texts.length, 'texts');
    callback(texts);
  }, (error) => {
    console.error('[TextService] Error in real-time listener:', error);
  });
};

