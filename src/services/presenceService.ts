/**
 * Presence Service
 * 
 * Manages user presence tracking, cursor synchronization,
 * and active user monitoring in real-time.
 */

import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc,
  serverTimestamp,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import type { User, CanvasSession } from '@/types';

/**
 * Listen to active users collection for real-time presence updates
 */
export const listenToActiveUsers = (
  callback: (users: User[]) => void,
  onError?: (error: Error) => void
) => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('lastActive', 'desc'), limit(50));

  return onSnapshot(
    q,
    (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((doc) => {
        const userData = doc.data() as User;
        users.push(userData);
      });
      callback(users);
    },
    (error) => {
      console.error('Error listening to active users:', error);
      onError?.(error);
    }
  );
};

/**
 * Update user's cursor position with debouncing
 */
let cursorUpdateTimeout: ReturnType<typeof setTimeout> | null = null;

export const updateCursorPosition = (
  userId: string, 
  position: { x: number; y: number },
  debounceMs: number = 50
): void => {
  if (cursorUpdateTimeout) {
    clearTimeout(cursorUpdateTimeout);
  }

  cursorUpdateTimeout = setTimeout(async () => {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        cursorPosition: position,
        lastActive: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating cursor position:', error);
    }
  }, debounceMs);
};

/**
 * Update user's last active timestamp (heartbeat)
 */
export const updateUserHeartbeat = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { lastActive: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.error('Error updating user heartbeat:', error);
  }
};

/**
 * Set up user presence in canvas session
 */
export const joinCanvasSession = async (userId: string): Promise<void> => {
  try {
    const sessionRef = doc(db, 'canvasSession', 'default');
    
    // Add user to active users array
    await setDoc(sessionRef, {
      activeUsers: [userId],
      lastModified: serverTimestamp()
    }, { merge: true });

    // Set up disconnect handler to remove user from session
    // Note: onDisconnect is not available in client SDK
    // This would typically be handled by Cloud Functions
    console.log('Session disconnect cleanup would be handled by Cloud Functions');
  } catch (error) {
    console.error('Error joining canvas session:', error);
  }
};

/**
 * Remove user from canvas session
 */
export const leaveCanvasSession = async (): Promise<void> => {
  try {
    const sessionRef = doc(db, 'canvasSession', 'default');
    await setDoc(sessionRef, {
      activeUsers: [],
      lastModified: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error leaving canvas session:', error);
  }
};

/**
 * Listen to canvas session for active users
 */
export const listenToCanvasSession = (
  callback: (session: CanvasSession | null) => void,
  onError?: (error: Error) => void
) => {
  const sessionRef = doc(db, 'canvasSession', 'default');

  return onSnapshot(
    sessionRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const sessionData = snapshot.data() as CanvasSession;
        callback(sessionData);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error listening to canvas session:', error);
      onError?.(error);
    }
  );
};

/**
 * Clean up stale users (users inactive for more than 5 minutes)
 */
export const cleanupStaleUsers = async (): Promise<void> => {
  try {
    // Note: This would typically be done in a Cloud Function
    // For MVP, we'll rely on client-side cleanup
    console.log('Stale user cleanup would be implemented here');
  } catch (error) {
    console.error('Error cleaning up stale users:', error);
  }
};
