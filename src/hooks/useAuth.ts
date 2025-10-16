/**
 * useAuth Hook
 * 
 * Manages anonymous authentication state and user creation.
 * Provides authentication status and user data to components.
 */

import { useState, useEffect, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  signInAnonymouslyAndCreateUser, 
  signOutUser, 
  onAuthStateChange,
  updateUserLastActive,
  updateUserCursorPosition
} from '@/services/authService';
import { User, UserState } from '@/types';

/**
 * Custom hook for authentication management
 */
export const useAuth = () => {
  const [userState, setUserState] = useState<UserState>({
    currentUser: null,
    isLoading: true,
    error: null
  });

  /**
   * Sign in anonymously and create user document
   */
  const signIn = useCallback(async (): Promise<void> => {
    try {
      setUserState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const user = await signInAnonymouslyAndCreateUser();
      
      setUserState({
        currentUser: user,
        isLoading: false,
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setUserState({
        currentUser: null,
        isLoading: false,
        error: errorMessage
      });
    }
  }, []);

  /**
   * Sign out current user
   */
  const signOut = useCallback(async (): Promise<void> => {
    try {
      await signOutUser();
      setUserState({
        currentUser: null,
        isLoading: false,
        error: null
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      setUserState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, []);

  /**
   * Update user's last active timestamp
   */
  const updateLastActive = useCallback(async (): Promise<void> => {
    if (!userState.currentUser) return;
    
    try {
      await updateUserLastActive(userState.currentUser.id);
    } catch (error) {
      console.error('Failed to update last active:', error);
    }
  }, [userState.currentUser]);

  /**
   * Update user's cursor position
   */
  const updateCursor = useCallback(async (
    position: { x: number; y: number }
  ): Promise<void> => {
    if (!userState.currentUser) return;
    
    try {
      await updateUserCursorPosition(userState.currentUser.id, position);
    } catch (error) {
      console.error('Failed to update cursor position:', error);
    }
  }, [userState.currentUser]);

  /**
   * Set up authentication state listener
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChange((firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is signed in - we'll get user data from Firestore
        setUserState(prev => ({
          ...prev,
          isLoading: false,
          error: null
        }));
      } else {
        // User is signed out
        setUserState({
          currentUser: null,
          isLoading: false,
          error: null
        });
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * Set up heartbeat to keep user active
   */
  useEffect(() => {
    if (!userState.currentUser) return;

    const heartbeatInterval = setInterval(() => {
      updateLastActive();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(heartbeatInterval);
  }, [userState.currentUser, updateLastActive]);

  return {
    // State
    currentUser: userState.currentUser,
    isLoading: userState.isLoading,
    error: userState.error,
    isAuthenticated: !!userState.currentUser,
    
    // Actions
    signIn,
    signOut,
    updateLastActive,
    updateCursor
  };
};
