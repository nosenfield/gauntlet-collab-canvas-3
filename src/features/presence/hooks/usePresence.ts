/**
 * usePresence Hook
 * 
 * Manages current user's presence:
 * - Creates presence on mount
 * - Heartbeat every 5 seconds
 * - Removes presence on unmount
 * - Re-establishes presence on reconnection after network drops
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/features/auth/store/authStore';
import {
  createTabPresence,
  updatePresenceHeartbeat,
  removeTabPresence,
  getCurrentTabId,
  onConnectionStateChange,
} from '../services/presenceService';

const HEARTBEAT_INTERVAL = 5000; // 5 seconds

/**
 * usePresence Hook
 * Automatically manages user presence for authenticated user
 * Each tab creates its own presence entry with automatic onDisconnect cleanup
 * Handles network drops by re-establishing presence on reconnection
 */
export function usePresence(): void {
  const { user } = useAuth();
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInitializedRef = useRef(false);
  const userIdRef = useRef<string | null>(null);
  const tabIdRef = useRef<string | null>(null);
  const wasDisconnectedRef = useRef(false);

  /**
   * Initialize or re-initialize presence
   * Used both on mount and on reconnection
   */
  const initializePresence = useCallback(async () => {
    if (!user) return;

    try {
      // Get or generate tab ID (persisted in sessionStorage)
      const tabId = getCurrentTabId();

      console.log('📝 Creating tab presence:', tabId);
      
      // Store for cleanup
      userIdRef.current = user.userId;
      tabIdRef.current = tabId;
      
      // Create tab-specific presence with automatic cleanup
      await createTabPresence(user, tabId);

      isInitializedRef.current = true;

      // Clear existing heartbeat if any
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      // Start heartbeat
      heartbeatIntervalRef.current = setInterval(() => {
        updatePresenceHeartbeat(user.userId, tabId).catch((error) => {
          console.error('❌ Heartbeat failed:', error);
        });
      }, HEARTBEAT_INTERVAL);

      console.log('✅ Presence initialized - onDisconnect will auto-cleanup');
    } catch (error) {
      console.error('❌ Failed to initialize presence:', error);
      // Reset initialization flag so we can try again
      isInitializedRef.current = false;
    }
  }, [user]);

  // Initial presence setup
  useEffect(() => {
    if (!user || isInitializedRef.current) {
      return;
    }

    initializePresence();
  }, [user, initializePresence]);

  // Monitor connection state and re-establish presence on reconnection
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onConnectionStateChange((isConnected) => {
      if (!isConnected) {
        // Connection lost
        wasDisconnectedRef.current = true;
        console.log('🔴 [usePresence] Connection lost - presence will be auto-removed by onDisconnect');
        
        // Stop heartbeat to save resources
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
        
        // Mark as not initialized so we can re-establish on reconnect
        isInitializedRef.current = false;
      } else if (wasDisconnectedRef.current) {
        // Connection restored after being disconnected
        console.log('🟢 [usePresence] Connection restored - re-establishing presence');
        wasDisconnectedRef.current = false;
        
        // Re-initialize presence
        initializePresence();
      }
    });

    return unsubscribe;
  }, [user, initializePresence]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
      wasDisconnectedRef.current = false;
    };
  }, []);
}
