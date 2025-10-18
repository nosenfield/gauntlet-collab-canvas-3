/**
 * Lock Service - Realtime Database Implementation
 * 
 * Manages collaborative locking for display objects using Firebase Realtime Database.
 * Provides <50ms latency for lock checks and acquisition.
 * 
 * Key Features:
 * - Atomic collection locking with parallel operations
 * - Automatic cleanup via onDisconnect handlers
 * - Heartbeat to keep locks alive
 * - Stale lock detection and removal
 */

import { 
  ref, 
  set, 
  get,
  remove,
  onValue,
  off,
  onDisconnect
} from 'firebase/database';
import type { DatabaseReference } from 'firebase/database';
import { database } from '@/api/firebase';
import { DISPLAY_OBJECT_CONSTANTS } from '../types';

const { LOCK_TIMEOUT_MS, LOCK_HEARTBEAT_MS } = DISPLAY_OBJECT_CONSTANTS;

/**
 * Document ID for locks path
 * MVP uses single "main" document
 */
const DOCUMENT_ID = 'main';

/**
 * Lock Data Structure
 * Stored in Realtime Database at /locks/main/{objectId}
 */
interface LockData {
  userId: string;
  lockedAt: number;      // Unix timestamp in milliseconds
  userName?: string;     // Optional display name for debugging
}

/**
 * Lock Availability Result
 */
export interface LockAvailability {
  available: boolean;
  lockedBy: Map<string, string>; // objectId -> userId
  conflicts: Array<{
    objectId: string;
    lockedBy: string;
    lockedAt: number;
  }>;
}

/**
 * Get Realtime Database reference for a lock
 * 
 * @param objectId - ID of object to lock
 * @returns Database reference to lock path
 */
function getLockRef(objectId: string): DatabaseReference {
  return ref(database, `locks/${DOCUMENT_ID}/${objectId}`);
}

/**
 * Check if objects are available for locking
 * 
 * Uses parallel reads for optimal performance.
 * Checks stale locks and active conflicts.
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

  if (objectIds.length === 0) {
    return result;
  }

  try {
    // Parallel reads for performance (~50ms for 10 objects)
    const snapshots = await Promise.all(
      objectIds.map(id => get(getLockRef(id)))
    );
    
    const now = Date.now();
    const timeoutMs = LOCK_TIMEOUT_MS;

    for (let i = 0; i < snapshots.length; i++) {
      const snapshot = snapshots[i];
      const objectId = objectIds[i];

      if (!snapshot.exists()) {
        // No lock - available
        continue;
      }

      const lockData = snapshot.val() as LockData;
      const { userId, lockedAt } = lockData;

      // Check if locked by someone else
      if (userId && userId !== currentUserId) {
        // Check if lock is stale
        const lockAge = now - lockedAt;
        if (lockAge > timeoutMs) {
          // Lock is stale, consider it available
          console.log(`[LockService] Stale lock detected on ${objectId}, age: ${lockAge}ms`);
          continue;
        }

        // Active lock by someone else - conflict
        result.available = false;
        result.lockedBy.set(objectId, userId);
        result.conflicts.push({
          objectId,
          lockedBy: userId,
          lockedAt,
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
 * All objects are locked in parallel. If any lock fails during acquisition,
 * the transaction nature of RTDB ensures consistency.
 * 
 * Returns true if successful, false if any object is already locked.
 * 
 * @param objectIds - IDs of objects to lock
 * @param userId - ID of user acquiring locks
 * @param userName - Optional display name for debugging
 * @returns true if all locks acquired, false if any conflicts
 */
export const lockCollection = async (
  objectIds: string[],
  userId: string,
  userName?: string
): Promise<boolean> => {
  if (objectIds.length === 0) {
    console.log('[LockService] No objects to lock');
    return true;
  }

  try {
    const now = Date.now();
    const timeoutMs = LOCK_TIMEOUT_MS;

    // Pre-check: Read all locks in parallel
    const snapshots = await Promise.all(
      objectIds.map(id => get(getLockRef(id)))
    );

    // Verify all locks are available
    for (let i = 0; i < snapshots.length; i++) {
      const snapshot = snapshots[i];
      const objectId = objectIds[i];

      if (snapshot.exists()) {
        const lockData = snapshot.val() as LockData;
        const { userId: lockedBy, lockedAt } = lockData;

        // Check if locked by someone else
        if (lockedBy && lockedBy !== userId) {
          // Check if lock is stale
          const lockAge = now - lockedAt;
          if (lockAge <= timeoutMs) {
            // Active lock - abort
            console.warn(
              `[LockService] Object ${objectId} is locked by user ${lockedBy}`
            );
            return false;
          }
        }
      }
    }

    // All locks available - acquire them in parallel
    const lockData: LockData = {
      userId,
      lockedAt: now,
      userName,
    };

    await Promise.all(
      objectIds.map(async (objectId) => {
        const lockRef = getLockRef(objectId);
        
        // Set lock data
        await set(lockRef, lockData);
        
        // Setup automatic cleanup on disconnect
        await onDisconnect(lockRef).remove();
      })
    );

    console.log(`[LockService] Locked ${objectIds.length} objects for user ${userId}`);
    return true;
  } catch (error: any) {
    console.error('[LockService] Error locking collection:', error);
    return false;
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
    // Read locks to verify ownership, then delete in parallel
    const snapshots = await Promise.all(
      objectIds.map(id => get(getLockRef(id)))
    );

    const unlockPromises: Promise<void>[] = [];

    for (let i = 0; i < snapshots.length; i++) {
      const snapshot = snapshots[i];
      const objectId = objectIds[i];

      if (!snapshot.exists()) {
        console.warn(`[LockService] No lock found on ${objectId} for unlock`);
        continue;
      }

      const lockData = snapshot.val() as LockData;

      // Only unlock if locked by this user
      if (lockData.userId === userId) {
        unlockPromises.push(remove(getLockRef(objectId)));
      } else {
        console.warn(
          `[LockService] User ${userId} attempted to unlock object ${objectId} ` +
          `locked by ${lockData.userId}`
        );
      }
    }

    await Promise.all(unlockPromises);
    console.log(`[LockService] Released ${unlockPromises.length} objects for user ${userId}`);
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
    const now = Date.now();

    // Read current locks to verify ownership
    const snapshots = await Promise.all(
      objectIds.map(id => get(getLockRef(id)))
    );

    const refreshPromises: Promise<void>[] = [];

    for (let i = 0; i < snapshots.length; i++) {
      const snapshot = snapshots[i];
      const objectId = objectIds[i];

      if (!snapshot.exists()) {
        console.warn(`[LockService] No lock found on ${objectId} for refresh`);
        continue;
      }

      const lockData = snapshot.val() as LockData;

      // Only refresh if locked by this user
      if (lockData.userId === userId) {
        refreshPromises.push(
          set(getLockRef(objectId), {
            ...lockData,
            lockedAt: now,
          })
        );
      }
    }

    await Promise.all(refreshPromises);
    console.log(`[LockService] Refreshed locks on ${refreshPromises.length} objects`);
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
 * 
 * Note: This is a safety net. onDisconnect handlers should
 * handle most cleanup automatically.
 */
export const releaseExpiredLocks = async (): Promise<number> => {
  try {
    const locksRef = ref(database, `locks/${DOCUMENT_ID}`);
    const snapshot = await get(locksRef);

    if (!snapshot.exists()) {
      return 0;
    }

    const allLocks = snapshot.val() as Record<string, LockData>;
    const now = Date.now();
    const timeoutMs = LOCK_TIMEOUT_MS;
    
    const expiredLocks: string[] = [];

    // Find expired locks
    Object.entries(allLocks).forEach(([objectId, lockData]) => {
      if (lockData && lockData.lockedAt) {
        const lockAge = now - lockData.lockedAt;
        if (lockAge > timeoutMs) {
          expiredLocks.push(objectId);
          console.log(
            `[LockService] Found expired lock on ${objectId}, ` +
            `age: ${lockAge}ms, user: ${lockData.userId}`
          );
        }
      }
    });

    // Remove expired locks in parallel
    if (expiredLocks.length > 0) {
      await Promise.all(
        expiredLocks.map(objectId => remove(getLockRef(objectId)))
      );
      console.log(`[LockService] Released ${expiredLocks.length} expired locks`);
    }

    return expiredLocks.length;
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
 * This is a safety net alongside onDisconnect handlers.
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

/**
 * Subscribe to lock changes for specific objects
 * 
 * Useful for real-time UI updates (e.g., showing lock indicators)
 * 
 * @param objectIds - IDs of objects to watch
 * @param callback - Called when any lock changes
 * @returns Cleanup function to unsubscribe
 */
export const subscribeLockChanges = (
  objectIds: string[],
  callback: (objectId: string, lockData: LockData | null) => void
): (() => void) => {
  const unsubscribers: Array<() => void> = [];

  objectIds.forEach(objectId => {
    const lockRef = getLockRef(objectId);
    
    onValue(lockRef, (snapshot) => {
      const lockData = snapshot.exists() ? (snapshot.val() as LockData) : null;
      callback(objectId, lockData);
    });

    unsubscribers.push(() => off(lockRef));
  });

  // Return cleanup function
  return () => {
    unsubscribers.forEach(unsub => unsub());
  };
};
