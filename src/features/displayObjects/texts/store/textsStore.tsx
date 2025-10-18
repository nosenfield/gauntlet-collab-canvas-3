/**
 * Texts Store
 * 
 * Global state management for text display objects
 * Manages text data and real-time synchronization with Firestore
 */

import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type { TextDisplayObject } from '../types';
import { subscribeToTexts } from '../services/textService';

/**
 * Texts State
 */
export interface TextsState {
  texts: TextDisplayObject[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Texts Actions
 */
type TextsAction =
  | { type: 'SET_TEXTS'; payload: TextDisplayObject[] }
  | { type: 'ADD_TEXT'; payload: TextDisplayObject }
  | { type: 'UPDATE_TEXT'; payload: { id: string; updates: Partial<TextDisplayObject> } }
  | { type: 'REMOVE_TEXT'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_TEXTS' };

/**
 * Initial texts state
 */
const initialTextsState: TextsState = {
  texts: [],
  isLoading: false,
  error: null,
};

/**
 * Texts Reducer
 * Pure function that handles text state transitions
 */
function textsReducer(state: TextsState, action: TextsAction): TextsState {
  switch (action.type) {
    case 'SET_TEXTS':
      return {
        ...state,
        texts: action.payload,
        isLoading: false,
        error: null,
      };
    
    case 'ADD_TEXT':
      // Check if text already exists (prevent duplicates from real-time updates)
      if (state.texts.some(t => t.id === action.payload.id)) {
        return state;
      }
      return {
        ...state,
        texts: [...state.texts, action.payload],
      };
    
    case 'UPDATE_TEXT':
      return {
        ...state,
        texts: state.texts.map(text =>
          text.id === action.payload.id
            ? { ...text, ...action.payload.updates } as TextDisplayObject
            : text
        ),
      };
    
    case 'REMOVE_TEXT':
      return {
        ...state,
        texts: state.texts.filter(text => text.id !== action.payload),
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    
    case 'CLEAR_TEXTS':
      return initialTextsState;
    
    default:
      return state;
  }
}

/**
 * Texts Context
 */
interface TextsContextValue {
  texts: TextDisplayObject[];
  isLoading: boolean;
  error: string | null;
  addText: (text: TextDisplayObject) => void;
  updateTextLocal: (id: string, updates: Partial<TextDisplayObject>) => void;
  removeText: (id: string) => void;
  clearTexts: () => void;
}

const TextsContext = createContext<TextsContextValue | undefined>(undefined);

/**
 * Texts Provider Props
 */
interface TextsProviderProps {
  children: ReactNode;
}

/**
 * Texts Provider Component
 * Manages text objects state and Firestore synchronization
 */
export function TextsProvider({ children }: TextsProviderProps): React.ReactElement {
  const [state, dispatch] = useReducer(textsReducer, initialTextsState);
  
  // Subscribe to Firestore texts collection
  useEffect(() => {
    console.log('[TextsStore] Subscribing to texts collection...');
    dispatch({ type: 'SET_LOADING', payload: true });
    
    const unsubscribe = subscribeToTexts((texts) => {
      console.log('[TextsStore] Received text update:', texts.length, 'texts');
      dispatch({ type: 'SET_TEXTS', payload: texts });
    });
    
    return () => {
      console.log('[TextsStore] Unsubscribing from texts collection');
      unsubscribe();
    };
  }, []);
  
  /**
   * Add a text to local state
   * Note: Does NOT write to Firestore (real-time listener will sync)
   */
  const addText = useCallback((text: TextDisplayObject) => {
    dispatch({ type: 'ADD_TEXT', payload: text });
  }, []);
  
  /**
   * Update a text in local state (optimistic update)
   * Note: Does NOT write to Firestore - caller must handle Firestore write
   */
  const updateTextLocal = useCallback((id: string, updates: Partial<TextDisplayObject>) => {
    dispatch({ type: 'UPDATE_TEXT', payload: { id, updates } });
  }, []);
  
  /**
   * Remove a text from local state
   * Note: Does NOT write to Firestore (real-time listener will sync)
   */
  const removeText = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TEXT', payload: id });
  }, []);
  
  /**
   * Clear all texts from local state
   */
  const clearTexts = useCallback(() => {
    dispatch({ type: 'CLEAR_TEXTS' });
  }, []);
  
  const value: TextsContextValue = {
    texts: state.texts,
    isLoading: state.isLoading,
    error: state.error,
    addText,
    updateTextLocal,
    removeText,
    clearTexts,
  };
  
  return (
    <TextsContext.Provider value={value}>
      {children}
    </TextsContext.Provider>
  );
}

/**
 * useTexts Hook
 * Access texts state and actions
 * 
 * @example
 * ```tsx
 * const { texts, updateTextLocal } = useTexts();
 * ```
 */
export function useTexts(): TextsContextValue {
  const context = useContext(TextsContext);
  
  if (context === undefined) {
    throw new Error('useTexts must be used within a TextsProvider');
  }
  
  return context;
}

