/**
 * Lock Service
 * 
 * Manages collaborative locking for display objects to prevent editing conflicts.
 * Implements atomic collection locking, heartbeat, and stale lock cleanup.
 */

import { 
  runTransaction, 
  serverTimestamp, 
  Timestamp,
  collection,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { firestore } from '@/api/firebase';
import { DISPLAY_OBJECT_CONSTANTS } from '../types';

const { LOCK_TIMEOUT_MS, LOCK_HEARTBEAT_MS } = DISPLAY_OBJECT_CONSTANTS;

/**
 * Lock Availability Result
 */
export interface LockAvailability {
  available: boolean;
  lockedBy: Map<string, string>; // objectId -> userId
  conflicts: Array<{
    objectId: string;
    lockedBy: string;
    lockedAt: Timestamp;
  }>;
}

/**
 * Check if objects are available for locking
 * 
 * @param objectIds - IDs of objects to check
 * @param currentUserId - ID of user wanting to acquire locks
 * @returns Lock availability status with conflict details
 */
export const checkLockAvailability = async (
  objectIds: string[],
  currentUserId: string
): Promise<LockAvailability> => {
  const result: LockAvailability = {
    available: true,
    lockedBy: new Map(),
    conflicts: [],
  };

  try {
    // Get all shapes (for now, hardcoded to shapes collection)
    // TODO: Make this work for all display object types
    const shapesCollectionPath = 'documents/main/shapes';
    
    // Get documents directly
    const batch = [];
    for (const objectId of objectIds) {
      const docRef = doc(firestore, shapesCollectionPath, objectId);
      batch.push(getDoc(docRef));
    }

    const snapshots = await Promise.all(batch);
    
    const now = Date.now();
    const timeoutMs = LOCK_TIMEOUT_MS;

    for (let i = 0; i < snapshots.length; i++) {
      const snapshot = snapshots[i];
      const objectId = objectIds[i];

      if (!snapshot.exists()) {
        console.warn(`[LockService] Object ${objectId} not found`);
        continue;
      }

      const data = snapshot.data();
      const lockedBy = data.lockedBy as string | null;
      const lockedAt = data.lockedAt as Timestamp | null;

      // Check if locked by someone else
      if (lockedBy && lockedBy !== currentUserId) {
        // Check if lock is stale
        if (lockedAt) {
          const lockAge = now - lockedAt.toMillis();
          if (lockAge > timeoutMs) {
            // Lock is stale, consider it available
            console.log(`[LockService] Stale lock detected on ${objectId}, age: ${lockAge}ms`);
            continue;
          }
        }

        // Active lock by someone else - conflict
        result.available = false;
        result.lockedBy.set(objectId, lockedBy);
        result.conflicts.push({
          objectId,
          lockedBy,
          lockedAt: lockedAt || Timestamp.now(),
        });
      }
    }

    return result;
  } catch (error) {
    console.error('[LockService] Error checking lock availability:', error);
    throw error;
  }
};

/**
 * Lock a collection of objects atomically
 * 
 * All objects are locked or none are locked (transaction).
 * Returns true if successful, false if any object is already locked.
 * 
 * @param objectIds - IDs of objects to lock
 * @param userId - ID of user acquiring locks
 * @returns true if all locks acquired, false if any conflicts
 */
export const lockCollection = async (
  objectIds: string[],
  userId: string
): Promise<boolean> => {
  if (objectIds.length === 0) {
    console.log('[LockService] No objects to lock');
    return true;
  }

  try {
    // First check availability (optimization to avoid transaction if conflicts exist)
    const availability = await checkLockAvailability(objectIds, userId);
    
    if (!availability.available) {
      // Log conflicts
      for (const conflict of availability.conflicts) {
        console.warn(
          `[LockService] Cannot lock object ${conflict.objectId}: ` +
          `locked by user ${conflict.lockedBy}`
        );
      }
      return false;
    }

    // Use transaction for atomic locking
    const shapesCollectionPath = 'documents/main/shapes';
    
    await runTransaction(firestore, async (transaction) => {
      const now = Date.now();
      const timeoutMs = LOCK_TIMEOUT_MS;

      // Read all objects first
      const docRefs = objectIds.map(id => doc(firestore, shapesCollectionPath, id));
      const docs = await Promise.all(
        docRefs.map(docRef => transaction.get(docRef))
      );

      // Check all locks again (double-check in transaction)
      for (let i = 0; i < objectIds.length; i++) {
        const objectId = objectIds[i];
        const docSnapshot = docs[i];

        if (!docSnapshot.exists()) {
          throw new Error(`Object ${objectId} not found`);
        }

        const data = docSnapshot.data();
        const lockedBy = data.lockedBy as string | null;
        const lockedAt = data.lockedAt as Timestamp | null;

        // Check if locked by someone else
        if (lockedBy && lockedBy !== userId) {
          // Check if lock is stale
          if (lockedAt) {
            const lockAge = now - lockedAt.toMillis();
            if (lockAge <= timeoutMs) {
              // Active lock - abort transaction
              throw new Error(
                `Object ${objectId} is locked by user ${lockedBy}`
              );
            }
          }
        }

        // Lock the object
        transaction.update(docRefs[i], {
          lockedBy: userId,
          lockedAt: serverTimestamp(),
        });
      }
    });

    console.log(`[LockService] Locked ${objectIds.length} objects for user ${userId}`);
    return true;
  } catch (error: any) {
    if (error.message?.includes('is locked by')) {
      console.warn('[LockService] Lock acquisition failed:', error.message);
      return false;
    }
    console.error('[LockService] Error locking collection:', error);
    throw error;
  }
};

/**
 * Release locks on a collection of objects
 * 
 * @param objectIds - IDs of objects to unlock
 * @param userId - ID of user releasing locks (for verification)
 */
export const releaseCollection = async (
  objectIds: string[],
  userId: string
): Promise<void> => {
  if (objectIds.length === 0) {
    console.log('[LockService] No objects to unlock');
    return;
  }

  try {
    // Use batch writes for efficiency
    const batch = writeBatch(firestore);
    const shapesCollectionPath = 'documents/main/shapes';

    for (const objectId of objectIds) {
      const docRef = doc(firestore, shapesCollectionPath, objectId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        console.warn(`[LockService] Object ${objectId} not found for unlock`);
        continue;
      }

      const data = snapshot.data();

      // Only unlock if locked by this user
      if (data.lockedBy === userId) {
        batch.update(docRef, {
          lockedBy: null,
          lockedAt: null,
        });
      } else {
        console.warn(
          `[LockService] User ${userId} attempted to unlock object ${objectId} ` +
          `locked by ${data.lockedBy}`
        );
      }
    }

    await batch.commit();
    console.log(`[LockService] Released ${objectIds.length} objects for user ${userId}`);
  } catch (error) {
    console.error('[LockService] Error releasing collection:', error);
    throw error;
  }
};

/**
 * Refresh locks on objects (update lockedAt timestamp)
 * 
 * Used for heartbeat to keep locks alive.
 * 
 * @param objectIds - IDs of objects to refresh
 * @param userId - ID of user owning the locks
 */
export const refreshLocks = async (
  objectIds: string[],
  userId: string
): Promise<void> => {
  if (objectIds.length === 0) {
    return;
  }

  try {
    const batch = writeBatch(firestore);
    const shapesCollectionPath = 'documents/main/shapes';

    for (const objectId of objectIds) {
      const docRef = doc(firestore, shapesCollectionPath, objectId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        console.warn(`[LockService] Object ${objectId} not found for refresh`);
        continue;
      }

      const data = snapshot.data();

      // Only refresh if locked by this user
      if (data.lockedBy === userId) {
        batch.update(docRef, {
          lockedAt: serverTimestamp(),
        });
      }
    }

    await batch.commit();
    console.log(`[LockService] Refreshed locks on ${objectIds.length} objects`);
  } catch (error) {
    console.error('[LockService] Error refreshing locks:', error);
    // Don't throw - heartbeat failures shouldn't crash the app
  }
};

/**
 * Release expired locks across all objects
 * 
 * Background cleanup service to remove stale locks.
 * Should be called periodically (e.g., every 30 seconds).
 */
export const releaseExpiredLocks = async (): Promise<number> => {
  try {
    const shapesRef = collection(firestore, 'documents/main/shapes');
    
    // Query for locked objects
    const q = query(shapesRef, where('lockedBy', '!=', null));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return 0;
    }

    const now = Date.now();
    const timeoutMs = LOCK_TIMEOUT_MS;
    const batch = writeBatch(firestore);
    let expiredCount = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const lockedAt = data.lockedAt as Timestamp | null;

      if (lockedAt) {
        const lockAge = now - lockedAt.toMillis();
        if (lockAge > timeoutMs) {
          // Lock is expired
          batch.update(doc.ref, {
            lockedBy: null,
            lockedAt: null,
          });
          expiredCount++;
          console.log(
            `[LockService] Releasing expired lock on ${doc.id}, ` +
            `age: ${lockAge}ms`
          );
        }
      }
    });

    if (expiredCount > 0) {
      await batch.commit();
      console.log(`[LockService] Released ${expiredCount} expired locks`);
    }

    return expiredCount;
  } catch (error) {
    console.error('[LockService] Error releasing expired locks:', error);
    return 0;
  }
};

/**
 * Start lock heartbeat interval
 * 
 * Automatically refreshes locks at regular intervals.
 * Returns cleanup function to stop the heartbeat.
 * 
 * @param objectIds - IDs of objects to keep locked
 * @param userId - ID of user owning the locks
 * @returns Cleanup function to stop heartbeat
 */
export const startLockHeartbeat = (
  objectIds: string[],
  userId: string
): (() => void) => {
  console.log(`[LockService] Starting heartbeat for ${objectIds.length} objects`);
  
  const intervalId = setInterval(() => {
    refreshLocks(objectIds, userId);
  }, LOCK_HEARTBEAT_MS);

  // Return cleanup function
  return () => {
    console.log('[LockService] Stopping heartbeat');
    clearInterval(intervalId);
  };
};

/**
 * Start background cleanup service
 * 
 * Periodically removes expired locks.
 * Returns cleanup function to stop the service.
 * 
 * @returns Cleanup function to stop cleanup service
 */
export const startLockCleanupService = (): (() => void) => {
  console.log('[LockService] Starting cleanup service');
  
  // Run cleanup every 30 seconds
  const intervalId = setInterval(() => {
    releaseExpiredLocks();
  }, 30000);

  // Run once immediately
  releaseExpiredLocks();

  // Return cleanup function
  return () => {
    console.log('[LockService] Stopping cleanup service');
    clearInterval(intervalId);
  };
};

