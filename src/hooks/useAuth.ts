/**
 * useAuth Hook
 * 
 * Manages anonymous authentication state and user creation.
 * Provides authentication status and user data to components.
 */

import { useState, useEffect, useCallback } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { 
  signInAnonymouslyAndCreateUser, 
  signOutUser, 
  onAuthStateChange,
  updateUserLastActive,
  updateUserCursorPosition
} from '@/services/authService';
import type { UserState } from '@/types';

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
    const unsubscribe = onAuthStateChange(async (firebaseUser: FirebaseUser | null) => {
      console.log('Auth state changed:', firebaseUser ? 'User signed in' : 'User signed out');
      
      if (firebaseUser) {
        try {
          console.log('Creating user document for:', firebaseUser.uid);
          // Import the createUserDocument function directly to avoid re-signing in
          const { createUserDocument } = await import('@/services/authService');
          const user = await createUserDocument(firebaseUser);
          console.log('User created successfully:', user);
          setUserState({
            currentUser: user,
            isLoading: false,
            error: null
          });
        } catch (error) {
          console.error('Error creating user:', error);
          setUserState({
            currentUser: null,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to create user'
          });
        }
      } else {
        console.log('No user detected, attempting automatic sign-in...');
        // If no user is detected, automatically sign in anonymously
        try {
          const user = await signInAnonymouslyAndCreateUser();
          console.log('Automatic sign-in successful:', user);
          setUserState({
            currentUser: user,
            isLoading: false,
            error: null
          });
        } catch (error) {
          console.error('Error with automatic sign-in:', error);
          setUserState({
            currentUser: null,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to sign in automatically'
          });
        }
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
