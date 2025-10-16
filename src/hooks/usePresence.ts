/**
 * usePresence Hook
 * 
 * Manages user presence tracking and cursor synchronization.
 * Provides real-time updates of active users and their cursor positions.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  listenToActiveUsers, 
  updateCursorPosition, 
  joinCanvasSession, 
  leaveCanvasSession,
  listenToCanvasSession,
  setupPageUnloadCleanup,
  setupStaleUserCleanup
} from '@/services/presenceService';
import type { User, PresenceState, CanvasSession } from '@/types';

/**
 * Custom hook for presence management
 */
export const usePresence = () => {
  const [presenceState, setPresenceState] = useState<PresenceState>({
    activeUsers: new Map(),
    isLoading: true,
    error: null
  });

  const [canvasSession, setCanvasSession] = useState<CanvasSession | null>(null);

  /**
   * Update cursor position with debouncing
   */
  const updateCursor = useCallback((
    userId: string, 
    position: { x: number; y: number },
    debounceMs: number = 50
  ): void => {
    updateCursorPosition(userId, position, debounceMs);
  }, []);

  /**
   * Join canvas session
   */
  const joinSession = useCallback(async (userId: string): Promise<void> => {
    try {
      await joinCanvasSession(userId, (error) => {
        setPresenceState(prev => ({
          ...prev,
          error: error.message
        }));
      });
    } catch (error) {
      setPresenceState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to join session'
      }));
    }
  }, []);

  /**
   * Leave canvas session
   */
  const leaveSession = useCallback(async (userId?: string): Promise<void> => {
    try {
      await leaveCanvasSession(userId);
    } catch (error) {
      // Silent fail for leave operations
    }
  }, []);

  /**
   * Set up cleanup on page unload
   */
  const setupCleanup = useCallback((userId: string): void => {
    setupPageUnloadCleanup(userId);
  }, []);

  /**
   * Set up active users listener
   */
  useEffect(() => {
    const unsubscribe = listenToActiveUsers(
      (users: User[]) => {
        const usersMap = new Map<string, User>();
        users.forEach(user => {
          usersMap.set(user.id, user);
        });

        setPresenceState(prev => ({
          ...prev,
          activeUsers: usersMap,
          isLoading: false,
          error: null
        }));
      },
      (error: Error) => {
        setPresenceState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message
        }));
      }
    );

    return () => unsubscribe();
  }, []);

  /**
   * Set up stale user cleanup
   */
  useEffect(() => {
    setupStaleUserCleanup();
  }, []);

  /**
   * Set up canvas session listener
   */
  useEffect(() => {
    const unsubscribe = listenToCanvasSession(
      (session: CanvasSession | null) => {
        setCanvasSession(session);
      },
      (_error: Error) => {
        // Silent fail for session listener errors
      }
    );

    return () => unsubscribe();
  }, []);

  /**
   * Get active users as array
   */
  const getActiveUsers = useCallback((): User[] => {
    return Array.from(presenceState.activeUsers.values());
  }, [presenceState.activeUsers]);

  /**
   * Get user by ID
   */
  const getUserById = useCallback((userId: string): User | undefined => {
    return presenceState.activeUsers.get(userId);
  }, [presenceState.activeUsers]);

  /**
   * Check if user is active
   */
  const isUserActive = useCallback((userId: string): boolean => {
    return presenceState.activeUsers.has(userId);
  }, [presenceState.activeUsers]);

  /**
   * Get active user count
   */
  const getActiveUserCount = useCallback((): number => {
    return presenceState.activeUsers.size;
  }, [presenceState.activeUsers]);

  return {
    // State
    activeUsers: getActiveUsers(),
    activeUsersMap: presenceState.activeUsers,
    canvasSession,
    isLoading: presenceState.isLoading,
    error: presenceState.error,
    activeUserCount: getActiveUserCount(),
    
    // Actions
    updateCursor,
    joinSession,
    leaveSession,
    setupCleanup,
    getUserById,
    isUserActive
  };
};
