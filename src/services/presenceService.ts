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
  limit,
  deleteDoc,
  getDocs
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
        const userData = { id: doc.id, ...doc.data() } as User;
        users.push(userData);
      });
      
      console.log('Active users updated:', users.map(u => ({ 
        id: u.id, 
        name: u.displayName, 
        cursor: u.cursorPosition,
        lastActive: u.lastActive 
      })));
      
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
  // Validate userId before proceeding
  if (!userId || typeof userId !== 'string') {
    console.error('Invalid userId provided to updateCursorPosition:', userId);
    return;
  }

  // Validate position
  if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
    console.error('Invalid position provided to updateCursorPosition:', position);
    return;
  }

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
      
      console.log('Updated cursor position:', { userId, position });
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
    // Validate userId before proceeding
    if (!userId || typeof userId !== 'string') {
      console.error('Invalid userId provided to joinCanvasSession:', userId);
      return;
    }

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
export const leaveCanvasSession = async (userId?: string): Promise<void> => {
  try {
    if (!userId) {
      console.log('No userId provided for leaveCanvasSession');
      return;
    }

    // Remove user document to mark them as offline
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    
    console.log('User removed from session:', userId);
  } catch (error) {
    console.error('Error leaving canvas session:', error);
  }
};

/**
 * Set up cleanup on page unload
 */
export const setupPageUnloadCleanup = (userId: string): void => {
  const cleanup = async () => {
    try {
      await leaveCanvasSession(userId);
    } catch (error) {
      console.error('Error during page unload cleanup:', error);
    }
  };

  // Use sendBeacon for reliable cleanup on page unload
  window.addEventListener('beforeunload', () => {
    // Use sendBeacon for reliable cleanup
    if (navigator.sendBeacon) {
      const data = new FormData();
      data.append('userId', userId);
      navigator.sendBeacon('/api/cleanup', data);
    }
    
    // Fallback: synchronous cleanup
    cleanup();
  });

  // Also handle page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      cleanup();
    }
  });
};

/**
 * Clean up stale users (users who haven't been active for more than 2 minutes)
 */
export const cleanupStaleUsers = async (): Promise<void> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('lastActive', 'desc'), limit(100));
    
    const snapshot = await getDocs(q);
    const now = new Date();
    const staleThreshold = 2 * 60 * 1000; // 2 minutes in milliseconds
    
    const staleUserPromises: Promise<void>[] = [];
    
    snapshot.forEach((docSnapshot) => {
      const userData = docSnapshot.data();
      const lastActive = userData.lastActive?.toDate();
      
      if (lastActive && (now.getTime() - lastActive.getTime()) > staleThreshold) {
        console.log('Removing stale user:', docSnapshot.id);
        staleUserPromises.push(deleteDoc(doc(db, 'users', docSnapshot.id)));
      }
    });
    
    await Promise.all(staleUserPromises);
    
    if (staleUserPromises.length > 0) {
      console.log(`Cleaned up ${staleUserPromises.length} stale users`);
    }
  } catch (error) {
    console.error('Error cleaning up stale users:', error);
  }
};

/**
 * Set up periodic cleanup of stale users
 */
export const setupStaleUserCleanup = (): void => {
  // Run cleanup every 30 seconds
  setInterval(cleanupStaleUsers, 30000);
  
  // Also run cleanup immediately
  cleanupStaleUsers();
};
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

