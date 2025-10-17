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
  removeTabPresence,
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
  const userIdRef = useRef<string | null>(null);
  const tabIdRef = useRef<string | null>(null);

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
        
        // Store for cleanup
        userIdRef.current = user.userId;
        tabIdRef.current = tabId;
        
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

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      // Manually remove presence
      // This handles both sign-out (component unmount) and tab close
      if (userIdRef.current && tabIdRef.current) {
        console.log('🔴 Cleaning up presence on unmount');
        removeTabPresence(userIdRef.current, tabIdRef.current).catch((error) => {
          console.error('Failed to remove presence on unmount:', error);
        });
      }
      
      // Reset state
      isInitializedRef.current = false;
      userIdRef.current = null;
      tabIdRef.current = null;
    };
  }, [user]);
}
