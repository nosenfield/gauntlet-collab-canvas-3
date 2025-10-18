/**
 * useLocking Hook
 * 
 * Manages collaborative locking for selected display objects.
 * Automatically acquires locks on selection and releases on deselection.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSelection } from '../store/selectionStore';
import { useAuth } from '@/features/auth/store/authStore';
import {
  lockCollection,
  releaseCollection,
  startLockHeartbeat,
  checkLockAvailability
} from '../services/lockService';

/**
 * useLocking Hook
 * 
 * Integrates locking with selection system.
 * Automatically handles lock acquisition, heartbeat, and release.
 * 
 * @returns Lock management functions
 */
export function useLocking() {
  const { selectedIds } = useSelection();
  const { user } = useAuth();
  const heartbeatCleanupRef = useRef<(() => void) | null>(null);
  const lockedIdsRef = useRef<string[]>([]);

  /**
   * Attempt to lock objects before selecting them
   * Returns true if locks acquired, false if conflicts
   * 
   * @param objectIds - IDs of objects to lock
   * @param skipPreCheck - Skip availability check (for performance with many objects)
   */
  const tryLockAndSelect = useCallback(async (
    objectIds: string[],
    skipPreCheck = false
  ): Promise<boolean> => {
    if (!user) {
      console.warn('[useLocking] No user - cannot acquire locks');
      return false;
    }

    if (objectIds.length === 0) {
      return true;
    }

    try {
      // Pre-check optimization (skip for large selections to avoid double reads)
      if (!skipPreCheck) {
        const availability = await checkLockAvailability(objectIds, user.userId);
        
        if (!availability.available) {
          // Log conflicts for user feedback
          availability.conflicts.forEach(conflict => {
            console.warn(
              `[useLocking] Cannot select object ${conflict.objectId}: ` +
              `locked by user ${conflict.lockedBy}`
            );
            // TODO: Show user-friendly notification
          });
          return false;
        }
      }

      // Attempt to acquire locks (transaction will catch conflicts)
      const success = await lockCollection(objectIds, user.userId);
      
      if (!success) {
        console.warn('[useLocking] Failed to acquire locks');
        return false;
      }

      // Track locked IDs
      lockedIdsRef.current = objectIds;

      // Start heartbeat to keep locks alive
      if (heartbeatCleanupRef.current) {
        heartbeatCleanupRef.current();
      }
      heartbeatCleanupRef.current = startLockHeartbeat(objectIds, user.userId);

      console.log(`[useLocking] Acquired locks on ${objectIds.length} objects`);
      return true;
    } catch (error) {
      console.error('[useLocking] Error acquiring locks:', error);
      return false;
    }
  }, [user]);

  /**
   * Release all current locks
   */
  const releaseLocks = useCallback(async () => {
    if (!user || lockedIdsRef.current.length === 0) {
      return;
    }

    try {
      // Stop heartbeat
      if (heartbeatCleanupRef.current) {
        heartbeatCleanupRef.current();
        heartbeatCleanupRef.current = null;
      }

      // Release locks
      await releaseCollection(lockedIdsRef.current, user.userId);
      console.log(`[useLocking] Released locks on ${lockedIdsRef.current.length} objects`);
      
      lockedIdsRef.current = [];
    } catch (error) {
      console.error('[useLocking] Error releasing locks:', error);
    }
  }, [user]);

  /**
   * Check if specific objects can be selected (not locked by others)
   */
  const canSelect = useCallback(async (objectIds: string[]): Promise<boolean> => {
    if (!user) return false;
    if (objectIds.length === 0) return true;

    try {
      const availability = await checkLockAvailability(objectIds, user.userId);
      return availability.available;
    } catch (error) {
      console.error('[useLocking] Error checking availability:', error);
      return false;
    }
  }, [user]);

  /**
   * Release locks when selection changes
   * This effect monitors selectedIds and releases locks when selection is cleared
   */
  useEffect(() => {
    // If selection is cleared, release all locks
    if (selectedIds.length === 0 && lockedIdsRef.current.length > 0) {
      console.log('[useLocking] Selection cleared, releasing locks');
      releaseLocks();
    }
  }, [selectedIds, releaseLocks]);

  /**
   * Cleanup: release locks on unmount
   */
  useEffect(() => {
    return () => {
      console.log('[useLocking] Component unmounting, releasing locks');
      if (heartbeatCleanupRef.current) {
        heartbeatCleanupRef.current();
      }
      if (lockedIdsRef.current.length > 0 && user) {
        // Fire-and-forget release (component is unmounting)
        releaseCollection(lockedIdsRef.current, user.userId).catch(error => {
          console.error('[useLocking] Error releasing locks on unmount:', error);
        });
      }
    };
  }, [user]);

  return {
    tryLockAndSelect,
    releaseLocks,
    canSelect,
    lockedIds: lockedIdsRef.current,
  };
}

