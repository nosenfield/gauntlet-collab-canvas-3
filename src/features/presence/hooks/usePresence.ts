/**
 * usePresence Hook
 * 
 * Manages current user's presence:
 * - Creates presence on mount
 * - Heartbeat every 5 seconds
 * - Removes presence on unmount
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth/store/authStore';
import {
  createPresence,
  updatePresenceHeartbeat,
  removePresence,
  setSessionId,
  clearSessionId,
  hasActiveSession,
} from '../services/presenceService';

const HEARTBEAT_INTERVAL = 5000; // 5 seconds

/**
 * usePresence Hook
 * Automatically manages user presence for authenticated user
 */
export function usePresence(): void {
  const { user } = useAuth();
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      // Clear any existing presence if user signs out
      return;
    }

    // Prevent multiple initializations
    if (isInitializedRef.current) {
      return;
    }

    // Check if this tab already has an active session
    if (hasActiveSession(user.userId)) {
      console.log('✓ Presence already active in this tab');
      return;
    }

    let isMounted = true;

    // Initialize presence
    const initializePresence = async () => {
      try {
        console.log('🔄 Initializing presence for user:', user.displayName);
        
        // Create presence in Realtime Database
        await createPresence(user);

        // Mark this tab as having an active session
        const sessionId = `${user.userId}-${Date.now()}`;
        setSessionId(user.userId, sessionId);
        isInitializedRef.current = true;

        if (!isMounted) return;

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          updatePresenceHeartbeat(user.userId).catch((error) => {
            console.error('❌ Heartbeat failed:', error);
          });
        }, HEARTBEAT_INTERVAL);

        console.log('✅ Presence initialized with heartbeat');
      } catch (error) {
        console.error('❌ Failed to initialize presence:', error);
        console.error('This usually means:');
        console.error('1. Missing VITE_FIREBASE_DATABASE_URL in .env.local');
        console.error('2. Realtime Database not enabled in Firebase Console');
        console.error('3. Realtime Database security rules blocking writes');
      }
    };

    initializePresence();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      isInitializedRef.current = false;

      // Clear heartbeat interval
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      // Remove presence
      if (user) {
        removePresence(user.userId).catch((error) => {
          console.error('Failed to remove presence:', error);
        });
        clearSessionId(user.userId);
      }
    };
  }, [user]);
}

