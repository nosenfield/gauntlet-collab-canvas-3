/**
 * Transform State Service
 * 
 * Manages real-time transform updates (position, rotation, scale) via Firebase Realtime Database.
 * Enables smooth 50ms updates for objects being transformed by other users.
 * 
 * Architecture:
 * - Transform states stored at: transformStates/{documentId}/{userId}
 * - Throttled to 50ms (same as cursor tracking)
 * - Auto-cleanup via onDisconnect
 * - Faster than Firestore for real-time updates
 * 
 * Supports:
 * - Position (x, y) - drag operations
 * - Rotation (rotation) - rotation operations
 * - Scale (scaleX, scaleY) - scale operations
 */

import { 
  ref, 
  set, 
  remove,
  onValue,
  off,
  onDisconnect,
  type Unsubscribe
} from 'firebase/database';
import { database } from '@/api/firebase';

/**
 * Document ID for drag positions path
 * MVP uses single "main" document
 */
const DOCUMENT_ID = 'main';

/**
 * Transform State Data Structure
 * Map of objectId -> transform properties
 */
export interface TransformStates {
  [objectId: string]: {
    x?: number;
    y?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
  };
}

/**
 * Transform Update from RTDB
 */
export interface TransformUpdate {
  userId: string;
  objectId: string;
  x?: number;
  y?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
}

/**
 * Get reference to user's transform states
 */
function getTransformStatesRef(userId: string) {
  return ref(database, `transformStates/${DOCUMENT_ID}/${userId}`);
}

/**
 * Update transform states for multiple objects
 * Should be throttled to ~50ms
 * 
 * @param userId - ID of user transforming objects
 * @param transforms - Map of objectId to transform properties
 */
export async function updateTransformStates(
  userId: string,
  transforms: Map<string, { x?: number; y?: number; rotation?: number; scaleX?: number; scaleY?: number }>
): Promise<void> {
  if (transforms.size === 0) {
    // No objects being transformed, clear the data
    await clearTransformStates(userId);
    return;
  }

  const transformRef = getTransformStatesRef(userId);

  try {
    // Convert Map to plain object for Firebase
    const transformsObject: TransformStates = {};
    transforms.forEach((transform, objectId) => {
      transformsObject[objectId] = {};
      
      // Only include properties that are defined
      if (transform.x !== undefined) {
        transformsObject[objectId].x = Math.round(transform.x * 100) / 100;
      }
      if (transform.y !== undefined) {
        transformsObject[objectId].y = Math.round(transform.y * 100) / 100;
      }
      if (transform.rotation !== undefined) {
        transformsObject[objectId].rotation = Math.round(transform.rotation * 100) / 100;
      }
      if (transform.scaleX !== undefined) {
        transformsObject[objectId].scaleX = Math.round(transform.scaleX * 100) / 100;
      }
      if (transform.scaleY !== undefined) {
        transformsObject[objectId].scaleY = Math.round(transform.scaleY * 100) / 100;
      }
    });

    await set(transformRef, transformsObject);

    // Setup auto-cleanup on disconnect
    await onDisconnect(transformRef).remove();
  } catch (error) {
    console.error('[TransformStateService] Error updating transform states:', error);
    // Don't throw - transform updates shouldn't break the app
  }
}

/**
 * Clear transform states for a user
 * Called when transform operation ends
 * 
 * @param userId - ID of user who finished transforming
 */
export async function clearTransformStates(userId: string): Promise<void> {
  const transformRef = getTransformStatesRef(userId);

  try {
    await remove(transformRef);
  } catch (error) {
    console.error('[TransformStateService] Error clearing transform states:', error);
    // Don't throw - cleanup failures shouldn't break the app
  }
}

// Backwards compatibility aliases for drag-only operations
export const updateDragPositions = updateTransformStates;
export const clearDragPositions = clearTransformStates;

/**
 * Subscribe to all transform state updates
 * Calls callback whenever any user updates their transform states
 * 
 * @param callback - Function called with array of transform updates
 * @returns Unsubscribe function
 */
export function subscribeToTransformStates(
  callback: (updates: TransformUpdate[]) => void
): Unsubscribe {
  const allTransformStatesRef = ref(database, `transformStates/${DOCUMENT_ID}`);

  const handleValue = (snapshot: any) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const allUserTransforms = snapshot.val();
    const updates: TransformUpdate[] = [];

    // Parse structure: { userId: { objectId: { x?, y?, rotation?, scaleX?, scaleY? } } }
    Object.entries(allUserTransforms).forEach(([userId, userTransforms]) => {
      if (userTransforms && typeof userTransforms === 'object') {
        Object.entries(userTransforms as TransformStates).forEach(([objectId, transform]) => {
          updates.push({
            userId,
            objectId,
            ...transform, // Spread all transform properties
          });
        });
      }
    });

    callback(updates);
  };

  onValue(allTransformStatesRef, handleValue);

  // Return unsubscribe function
  return () => {
    off(allTransformStatesRef, 'value', handleValue);
  };
}

// Backwards compatibility alias
export const subscribeToDragPositions = subscribeToTransformStates;

/**
 * Get current tab ID for this browser tab
 * Used for multi-tab support
 */
export function getCurrentTabId(): string {
  // Check if tab ID already exists in sessionStorage
  let tabId = sessionStorage.getItem('tabId');
  
  if (!tabId) {
    // Generate new tab ID
    tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('tabId', tabId);
  }
  
  return tabId;
}

