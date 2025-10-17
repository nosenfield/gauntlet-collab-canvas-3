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
  createTabPresence,
  updatePresenceHeartbeat,
  getCurrentTabId,
} from '../services/presenceService';

const HEARTBEAT_INTERVAL = 5000; // 5 seconds

/**
 * usePresence Hook
 * Automatically manages user presence for authenticated user
 * Each tab creates its own presence entry with automatic onDisconnect cleanup
 */
export function usePresence(): void {
  const { user } = useAuth();
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    // Prevent multiple initializations
    if (isInitializedRef.current) {
      return;
    }

    let isMounted = true;

    const initializePresence = async () => {
      try {
        // Get or generate tab ID (persisted in sessionStorage)
        const tabId = getCurrentTabId();

        console.log('📝 Creating tab presence:', tabId);
        
        // Create tab-specific presence with automatic cleanup
        await createTabPresence(user, tabId);

        if (!isMounted) return;

        isInitializedRef.current = true;

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          updatePresenceHeartbeat(user.userId, tabId).catch((error) => {
            console.error('❌ Heartbeat failed:', error);
          });
        }, HEARTBEAT_INTERVAL);

        console.log('✅ Presence initialized - onDisconnect will auto-cleanup');
      } catch (error) {
        console.error('❌ Failed to initialize presence:', error);
      }
    };

    initializePresence();

    // Cleanup on unmount
    return () => {
      isMounted = false;
      isInitializedRef.current = false;

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      // onDisconnect() will automatically remove this tab's presence
      console.log('🔴 Tab closing - onDisconnect will handle cleanup');
    };
  }, [user]);
}
