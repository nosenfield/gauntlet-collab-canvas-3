/**
 * Shapes Store
 * 
 * Global state management for shape display objects
 * Manages shape data and real-time synchronization with Firestore
 */

import { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from 'react';
import type { ShapeDisplayObject } from '../types';
import { subscribeToShapes } from '../services/shapeService';

/**
 * Shapes State
 */
export interface ShapesState {
  shapes: ShapeDisplayObject[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Shapes Actions
 */
type ShapesAction =
  | { type: 'SET_SHAPES'; payload: ShapeDisplayObject[] }
  | { type: 'ADD_SHAPE'; payload: ShapeDisplayObject }
  | { type: 'UPDATE_SHAPE'; payload: { id: string; updates: Partial<ShapeDisplayObject> } }
  | { type: 'REMOVE_SHAPE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_SHAPES' };

/**
 * Initial shapes state
 */
const initialShapesState: ShapesState = {
  shapes: [],
  isLoading: false,
  error: null,
};

/**
 * Shapes Reducer
 * Pure function that handles shape state transitions
 */
function shapesReducer(state: ShapesState, action: ShapesAction): ShapesState {
  switch (action.type) {
    case 'SET_SHAPES':
      return {
        ...state,
        shapes: action.payload,
        isLoading: false,
        error: null,
      };
    
    case 'ADD_SHAPE':
      // Check if shape already exists (prevent duplicates from real-time updates)
      if (state.shapes.some(s => s.id === action.payload.id)) {
        return state;
      }
      return {
        ...state,
        shapes: [...state.shapes, action.payload],
      };
    
    case 'UPDATE_SHAPE':
      return {
        ...state,
        shapes: state.shapes.map(shape =>
          shape.id === action.payload.id
            ? { ...shape, ...action.payload.updates } as ShapeDisplayObject
            : shape
        ),
      };
    
    case 'REMOVE_SHAPE':
      return {
        ...state,
        shapes: state.shapes.filter(shape => shape.id !== action.payload),
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
    
    case 'CLEAR_SHAPES':
      return initialShapesState;
    
    default:
      return state;
  }
}

/**
 * Shapes Context
 */
interface ShapesContextValue {
  state: ShapesState;
  dispatch: React.Dispatch<ShapesAction>;
}

const ShapesContext = createContext<ShapesContextValue | undefined>(undefined);

/**
 * Shapes Provider Props
 */
interface ShapesProviderProps {
  children: ReactNode;
}

/**
 * Shapes Provider Component
 * Wraps app to provide shapes state and real-time sync
 */
export function ShapesProvider({ children }: ShapesProviderProps) {
  const [state, dispatch] = useReducer(shapesReducer, initialShapesState);

  // Subscribe to real-time shape updates from Firestore
  useEffect(() => {
    console.log('[ShapesStore] Setting up real-time subscription');
    dispatch({ type: 'SET_LOADING', payload: true });

    const unsubscribe = subscribeToShapes((shapes: ShapeDisplayObject[]) => {
      console.log('[ShapesStore] Received shape update:', shapes.length, 'shapes');
      dispatch({ type: 'SET_SHAPES', payload: shapes });
    });

    return () => {
      console.log('[ShapesStore] Cleaning up real-time subscription');
      unsubscribe();
    };
  }, []);

  const value: ShapesContextValue = {
    state,
    dispatch,
  };

  return (
    <ShapesContext.Provider value={value}>
      {children}
    </ShapesContext.Provider>
  );
}

/**
 * useShapes Hook
 * 
 * Custom hook to access shapes state and actions
 * Must be used within ShapesProvider
 * 
 * @returns Shapes state and helper functions
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { shapes, isLoading } = useShapes();
 *   
 *   return shapes.map(shape => <RectangleShape key={shape.id} shape={shape} />);
 * }
 * ```
 */
export function useShapes() {
  const context = useContext(ShapesContext);

  if (!context) {
    throw new Error('useShapes must be used within a ShapesProvider');
  }

  const { state, dispatch } = context;

  /**
   * Get all shapes
   */
  const getAllShapes = useCallback((): ShapeDisplayObject[] => {
    return state.shapes;
  }, [state.shapes]);

  /**
   * Get shape by ID
   */
  const getShapeById = useCallback((id: string): ShapeDisplayObject | undefined => {
    return state.shapes.find(shape => shape.id === id);
  }, [state.shapes]);

  /**
   * Get shapes count
   */
  const getShapesCount = useCallback((): number => {
    return state.shapes.length;
  }, [state.shapes]);

  /**
   * Get rectangles only
   */
  const getRectangles = useCallback(() => {
    return state.shapes.filter(shape => shape.type === 'rectangle');
  }, [state.shapes]);
  
  /**
   * Update shape locally (optimistic update)
   * Use this for immediate UI feedback before Firestore sync
   */
  const updateShapeLocal = useCallback((id: string, updates: Partial<ShapeDisplayObject>) => {
    dispatch({ type: 'UPDATE_SHAPE', payload: { id, updates } });
  }, [dispatch]);

  return {
    // State
    shapes: state.shapes,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions (dispatch exposed for advanced use)
    dispatch,
    
    // Helpers
    getAllShapes,
    getShapeById,
    getShapesCount,
    getRectangles,
    updateShapeLocal,
  };
}

