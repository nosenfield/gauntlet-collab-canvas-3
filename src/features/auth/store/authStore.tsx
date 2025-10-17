/**
 * Authentication Store
 * 
 * Global state management for authentication using Context API + useReducer.
 * Provides current user state and authentication actions.
 */

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/types/firebase';
import {
  signInAnonymous as signInAnonymousService,
  signInWithGoogle as signInWithGoogleService,
  signOut as signOutService,
  onAuthStateChange,
} from '../services/authService';

/**
 * Authentication State
 * Co-located with store implementation (not in shared types)
 */
interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

/**
 * Authentication Actions
 */
type AuthAction =
  | { type: 'SET_USER'; user: User | null }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'CLEAR_ERROR' };

/**
 * Authentication Context Value
 */
interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInAnonymous: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

/**
 * Initial State
 */
const initialState: AuthState = {
  user: null,
  loading: true, // Start as loading (checking auth state)
  error: null,
};

/**
 * Authentication Reducer
 */
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.user,
        loading: false,
        error: null,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.loading,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
        loading: false,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    default:
      return state;
  }
}

/**
 * Authentication Context
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Authentication Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 * Wraps app and provides auth state to all children
 */
export function AuthProvider({ children }: AuthProviderProps): React.ReactElement {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      dispatch({ type: 'SET_USER', user });
    });

    return () => unsubscribe();
  }, []);

  // Sign in anonymously
  const signInAnonymous = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', loading: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const user = await signInAnonymousService();
      dispatch({ type: 'SET_USER', user });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      dispatch({ type: 'SET_ERROR', error: errorMessage });
    }
  }, []);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', loading: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const user = await signInWithGoogleService();
      dispatch({ type: 'SET_USER', user });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      dispatch({ type: 'SET_ERROR', error: errorMessage });
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', loading: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      await signOutService();
      dispatch({ type: 'SET_USER', user: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      dispatch({ type: 'SET_ERROR', error: errorMessage });
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value: AuthContextValue = {
    user: state.user,
    loading: state.loading,
    error: state.error,
    signInAnonymous,
    signInWithGoogle,
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 * Access authentication state and actions from any component
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

