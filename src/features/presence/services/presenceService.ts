/**
 * Presence Service
 * 
 * Manages user presence in Firebase Realtime Database:
 * - Creates tab-specific presence entries (path: /presence/{doc}/{userId}/{tabId})
 * - Each tab sets onDisconnect() for automatic cleanup
 * - Updates presence with heartbeat (every 5s)
 * - Aggregates tabs per user when reading presence
 * - Stale presence cleanup via 30s timeout
 */

import {
  ref,
  set,
  update,
  serverTimestamp,
  onValue,
  off,
  onDisconnect,
} from 'firebase/database';
import { database, DOCUMENT_ID } from '@/api/firebase';
import type { UserPresence } from '@/types/firebase';
import type { User } from '@/types/firebase';

/**
 * Create tab-specific presence entry
 * Path: /presence/{documentId}/{userId}/{tabId}
 * Each tab gets its own entry, onDisconnect() removes it automatically
 */
export async function createTabPresence(user: User, tabId: string): Promise<void> {
  const tabPresenceRef = ref(database, `presence/${DOCUMENT_ID}/${user.userId}/${tabId}`);

  const presence: Omit<UserPresence, 'connectedAt' | 'lastUpdate'> & {
    connectedAt: ReturnType<typeof serverTimestamp>;
    lastUpdate: ReturnType<typeof serverTimestamp>;
  } = {
    userId: user.userId,
    displayName: user.displayName,
    color: user.color,
    cursorX: 0,
    cursorY: 0,
    connectedAt: serverTimestamp(),
    lastUpdate: serverTimestamp(),
  };

  try {
    console.log('📝 Creating tab presence:', tabId);
    
    // Create presence for this tab
    await set(tabPresenceRef, presence);

    // Set onDisconnect to remove this tab's presence
    await onDisconnect(tabPresenceRef).remove();

    console.log('✅ Tab presence created with auto-cleanup');
  } catch (error) {
    console.error('❌ Error creating tab presence:', error);
    throw error;
  }
}

/**
 * Update presence heartbeat for a specific tab
 * Should be called every 5 seconds
 */
export async function updatePresenceHeartbeat(userId: string, tabId: string): Promise<void> {
  const tabPresenceRef = ref(database, `presence/${DOCUMENT_ID}/${userId}/${tabId}`);

  try {
    await update(tabPresenceRef, {
      lastUpdate: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating presence heartbeat:', error);
    // Don't throw - heartbeat failures shouldn't break the app
  }
}

/**
 * Update cursor position for a specific tab's presence
 * Should be throttled to ~50ms
 */
export async function updateCursorPosition(
  userId: string,
  tabId: string,
  x: number,
  y: number
): Promise<void> {
  const tabPresenceRef = ref(database, `presence/${DOCUMENT_ID}/${userId}/${tabId}`);

  try {
    await update(tabPresenceRef, {
      cursorX: x,
      cursorY: y,
      lastUpdate: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating cursor position:', error);
    // Don't throw - cursor update failures shouldn't break the app
  }
}

/**
 * Remove tab presence manually (e.g., on sign-out)
 * onDisconnect() handles automatic cleanup, but this is for explicit removal
 */
export async function removeTabPresence(userId: string, tabId: string): Promise<void> {
  const tabPresenceRef = ref(database, `presence/${DOCUMENT_ID}/${userId}/${tabId}`);

  try {
    await set(tabPresenceRef, null);
    console.log('✅ Tab presence manually removed:', tabId);
  } catch (error) {
    console.error('❌ Error removing tab presence:', error);
    // Don't throw - best effort cleanup
  }
}

/**
 * Generate a unique tab ID
 */
export function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get or create the current tab's ID (stored in sessionStorage)
 */
export function getCurrentTabId(): string {
  const stored = sessionStorage.getItem('canvas-current-tab-id');
  if (stored) return stored;
  
  const tabId = generateTabId();
  sessionStorage.setItem('canvas-current-tab-id', tabId);
  return tabId;
}

/**
 * Listen to all active users in presence
 * Aggregates all tab entries per user into a single presence
 * Returns unsubscribe function
 */
export function onPresenceChange(
  callback: (presences: Record<string, UserPresence>) => void
): () => void {
  const presenceRef = ref(database, `presence/${DOCUMENT_ID}`);

  const listener = onValue(
    presenceRef,
    (snapshot) => {
      const presences: Record<string, UserPresence> = {};
      const now = Date.now();
      const TIMEOUT_MS = 30000; // 30 seconds

      // Iterate through users
      snapshot.forEach((userSnapshot) => {
        const userId = userSnapshot.key;
        if (!userId) return;

        // Aggregate all tabs for this user
        const tabData: UserPresence[] = [];
        userSnapshot.forEach((tabSnapshot) => {
          const presence = tabSnapshot.val() as UserPresence;
          if (presence && presence.lastUpdate) {
            const lastUpdate = typeof presence.lastUpdate === 'number' 
              ? presence.lastUpdate 
              : now;
            
            // Only include tabs with recent activity
            if (now - lastUpdate < TIMEOUT_MS) {
              tabData.push(presence);
            }
          }
        });

        // If user has at least one active tab, add to presences
        // Use the most recently updated tab's data
        if (tabData.length > 0) {
          const mostRecent = tabData.reduce((prev, current) => 
            (current.lastUpdate > prev.lastUpdate) ? current : prev
          );
          presences[userId] = mostRecent;
        }
      });

      callback(presences);
    },
    (error) => {
      console.error('Error listening to presence:', error);
    }
  );

  // Return unsubscribe function
  return () => {
    off(presenceRef, 'value', listener);
  };
}
