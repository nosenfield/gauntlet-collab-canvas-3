/**
 * usePresence Hook
 * 
 * Manages user presence tracking and cursor synchronization.
 * Provides real-time updates of active users and their cursor positions.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  listenToActiveUsers, 
  updateCursorPosition, 
  joinCanvasSession, 
  leaveCanvasSession,
  listenToCanvasSession
} from '@/services/presenceService';
import { User, PresenceState, CanvasSession } from '@/types';

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
  const cursorUpdateRef = useRef<NodeJS.Timeout | null>(null);

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
      await joinCanvasSession(userId);
    } catch (error) {
      console.error('Failed to join canvas session:', error);
      setPresenceState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to join session'
      }));
    }
  }, []);

  /**
   * Leave canvas session
   */
  const leaveSession = useCallback(async (userId: string): Promise<void> => {
    try {
      await leaveCanvasSession(userId);
    } catch (error) {
      console.error('Failed to leave canvas session:', error);
    }
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
        console.error('Error in active users listener:', error);
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
   * Set up canvas session listener
   */
  useEffect(() => {
    const unsubscribe = listenToCanvasSession(
      (session: CanvasSession | null) => {
        setCanvasSession(session);
      },
      (error: Error) => {
        console.error('Error in canvas session listener:', error);
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
    getUserById,
    isUserActive
  };
};
