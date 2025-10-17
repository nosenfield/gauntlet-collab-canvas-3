/**
 * Presence Service
 * 
 * Manages user presence in Firebase Realtime Database:
 * - Creates presence on connect
 * - Updates presence with heartbeat (every 5s)
 * - Removes presence on disconnect
 * - Uses onDisconnect() for automatic cleanup
 */

import {
  ref,
  set,
  update,
  onDisconnect,
  serverTimestamp,
  onValue,
  off,
} from 'firebase/database';
import { database, DOCUMENT_ID } from '@/api/firebase';
import type { UserPresence } from '@/types/firebase';
import type { User } from '@/types/firebase';

/**
 * Create or update user presence in Realtime Database
 * Path: /presence/{documentId}/{userId}
 */
export async function createPresence(user: User): Promise<void> {
  const presenceRef = ref(database, `presence/${DOCUMENT_ID}/${user.userId}`);

  const presence: Omit<UserPresence, 'connectedAt' | 'lastUpdate'> & {
    connectedAt: ReturnType<typeof serverTimestamp>;
    lastUpdate: ReturnType<typeof serverTimestamp>;
  } = {
    userId: user.userId,
    displayName: user.displayName,
    color: user.color,
    cursorX: 0, // Initial cursor position
    cursorY: 0,
    connectedAt: serverTimestamp(),
    lastUpdate: serverTimestamp(),
  };

  try {
    console.log('📝 Creating presence in Realtime Database...');
    console.log('Path:', `presence/${DOCUMENT_ID}/${user.userId}`);
    
    // Set presence data
    await set(presenceRef, presence);

    // Set up automatic cleanup on disconnect
    await onDisconnect(presenceRef).remove();

    console.log('✅ Presence created:', user.displayName);
  } catch (error) {
    console.error('❌ Error creating presence:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

/**
 * Update presence heartbeat
 * Should be called every 5 seconds
 */
export async function updatePresenceHeartbeat(userId: string): Promise<void> {
  const presenceRef = ref(database, `presence/${DOCUMENT_ID}/${userId}`);

  try {
    await update(presenceRef, {
      lastUpdate: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating presence heartbeat:', error);
    // Don't throw - heartbeat failures shouldn't break the app
  }
}

/**
 * Update cursor position in presence
 * Should be throttled to ~50ms
 */
export async function updateCursorPosition(
  userId: string,
  x: number,
  y: number
): Promise<void> {
  const presenceRef = ref(database, `presence/${DOCUMENT_ID}/${userId}`);

  try {
    await update(presenceRef, {
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
 * Remove user presence
 * Called on sign-out or component unmount
 */
export async function removePresence(userId: string): Promise<void> {
  const presenceRef = ref(database, `presence/${DOCUMENT_ID}/${userId}`);

  try {
    await set(presenceRef, null);
    console.log('Presence removed:', userId);
  } catch (error) {
    console.error('Error removing presence:', error);
    // Don't throw - best effort cleanup
  }
}

/**
 * Listen to all active users in presence
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

      snapshot.forEach((childSnapshot) => {
        const presence = childSnapshot.val() as UserPresence;
        
        // Filter out stale presences (no update in 30 seconds)
        if (presence && presence.lastUpdate) {
          const lastUpdate = typeof presence.lastUpdate === 'number' 
            ? presence.lastUpdate 
            : now; // Fallback if serverTimestamp hasn't resolved yet
          
          if (now - lastUpdate < TIMEOUT_MS) {
            presences[presence.userId] = presence;
          }
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

/**
 * Session management
 * Prevents duplicate presence documents per user across tabs
 */
const SESSION_KEY_PREFIX = 'canvas-session-';

export function getSessionId(userId: string): string | null {
  return sessionStorage.getItem(SESSION_KEY_PREFIX + userId);
}

export function setSessionId(userId: string, sessionId: string): void {
  sessionStorage.setItem(SESSION_KEY_PREFIX + userId, sessionId);
}

export function clearSessionId(userId: string): void {
  sessionStorage.removeItem(SESSION_KEY_PREFIX + userId);
}

/**
 * Check if user has an active session in this tab
 */
export function hasActiveSession(userId: string): boolean {
  return getSessionId(userId) !== null;
}

