/**
 * Shapes Store
 * 
 * Global state management for shapes using Context API + useReducer.
 * Maintains real-time synchronization with Firestore.
 */

import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { Shape } from '../../../types/firebase';
import { subscribeToShapes } from '../services/shapeService';

/**
 * Shapes State
 */
interface ShapesState {
  shapes: Map<string, Shape>;  // Map of shapeId → Shape for O(1) lookups
  loading: boolean;
  error: string | null;
}

/**
 * Shapes Actions
 */
type ShapesAction =
  | { type: 'SET_SHAPES'; payload: Shape[] }
  | { type: 'ADD_SHAPE'; payload: Shape }
  | { type: 'UPDATE_SHAPE'; payload: { shapeId: string; updates: Partial<Shape> } }
  | { type: 'DELETE_SHAPE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

/**
 * Initial state
 */
const initialState: ShapesState = {
  shapes: new Map(),
  loading: true,
  error: null,
};

/**
 * Shapes Reducer
 */
function shapesReducer(state: ShapesState, action: ShapesAction): ShapesState {
  switch (action.type) {
    case 'SET_SHAPES': {
      const shapesMap = new Map<string, Shape>();
      action.payload.forEach((shape) => {
        shapesMap.set(shape.id, shape);
      });
      return {
        ...state,
        shapes: shapesMap,
        loading: false,
        error: null,
      };
    }

    case 'ADD_SHAPE': {
      const newShapes = new Map(state.shapes);
      newShapes.set(action.payload.id, action.payload);
      return {
        ...state,
        shapes: newShapes,
      };
    }

    case 'UPDATE_SHAPE': {
      const { shapeId, updates } = action.payload;
      const existingShape = state.shapes.get(shapeId);

      if (!existingShape) {
        console.warn('Cannot update non-existent shape:', shapeId);
        return state;
      }

      const updatedShape = { ...existingShape, ...updates };
      const newShapes = new Map(state.shapes);
      newShapes.set(shapeId, updatedShape);

      return {
        ...state,
        shapes: newShapes,
      };
    }

    case 'DELETE_SHAPE': {
      const newShapes = new Map(state.shapes);
      newShapes.delete(action.payload);
      return {
        ...state,
        shapes: newShapes,
      };
    }

    case 'SET_LOADING': {
      return {
        ...state,
        loading: action.payload,
      };
    }

    case 'SET_ERROR': {
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    }

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
  documentId?: string;
}

/**
 * Shapes Provider
 * 
 * Wraps components that need access to shapes state.
 * Sets up real-time Firestore subscription.
 */
export function ShapesProvider({ children, documentId = 'main' }: ShapesProviderProps) {
  const [state, dispatch] = useReducer(shapesReducer, initialState);

  useEffect(() => {
    console.log('🔄 Setting up shapes subscription for document:', documentId);

    // Subscribe to real-time shape updates
    const unsubscribe = subscribeToShapes(
      (shapes) => {
        dispatch({ type: 'SET_SHAPES', payload: shapes });
      },
      documentId
    );

    // Cleanup subscription on unmount
    return () => {
      console.log('🔴 Cleaning up shapes subscription');
      unsubscribe();
    };
  }, [documentId]);

  return (
    <ShapesContext.Provider value={{ state, dispatch }}>
      {children}
    </ShapesContext.Provider>
  );
}

/**
 * Hook to access shapes context
 * 
 * @throws Error if used outside ShapesProvider
 */
export function useShapesContext() {
  const context = useContext(ShapesContext);

  if (!context) {
    throw new Error('useShapesContext must be used within ShapesProvider');
  }

  return context;
}

/**
 * Selector Hooks (for convenience)
 */

/**
 * Get all shapes as an array
 */
export function useShapesArray(): Shape[] {
  const { state } = useShapesContext();
  return Array.from(state.shapes.values());
}

/**
 * Get all shapes as a Map
 */
export function useShapesMap(): Map<string, Shape> {
  const { state } = useShapesContext();
  return state.shapes;
}

/**
 * Get a specific shape by ID
 */
export function useShape(shapeId: string): Shape | undefined {
  const { state } = useShapesContext();
  return state.shapes.get(shapeId);
}

/**
 * Get shapes sorted by z-index (bottom to top)
 */
export function useShapesSortedByZIndex(): Shape[] {
  const shapes = useShapesArray();
  return [...shapes].sort((a, b) => a.zIndex - b.zIndex);
}

/**
 * Get loading state
 */
export function useShapesLoading(): boolean {
  const { state } = useShapesContext();
  return state.loading;
}

/**
 * Get error state
 */
export function useShapesError(): string | null {
  const { state } = useShapesContext();
  return state.error;
}

