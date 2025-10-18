/**
 * Selection Store
 * 
 * Global state management for shape selection
 * Manages which shapes are currently selected
 */

import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';

/**
 * Selection State
 */
export interface SelectionState {
  selectedIds: string[];
}

/**
 * Selection Actions
 */
type SelectionAction =
  | { type: 'SELECT'; payload: string }
  | { type: 'TOGGLE_SELECT'; payload: string }
  | { type: 'DESELECT'; payload: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_SELECTION'; payload: string[] };

/**
 * Initial selection state
 */
const initialSelectionState: SelectionState = {
  selectedIds: [],
};

/**
 * Selection Reducer
 * Pure function that handles selection state transitions
 */
function selectionReducer(state: SelectionState, action: SelectionAction): SelectionState {
  switch (action.type) {
    case 'SELECT':
      // Single select - replace selection
      return {
        ...state,
        selectedIds: [action.payload],
      };
    
    case 'TOGGLE_SELECT':
      // Shift-click: toggle selection
      if (state.selectedIds.includes(action.payload)) {
        // Already selected - remove from selection
        return {
          ...state,
          selectedIds: state.selectedIds.filter(id => id !== action.payload),
        };
      } else {
        // Not selected - add to selection
        return {
          ...state,
          selectedIds: [...state.selectedIds, action.payload],
        };
      }
    
    case 'DESELECT':
      return {
        ...state,
        selectedIds: state.selectedIds.filter(id => id !== action.payload),
      };
    
    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedIds: [],
      };
    
    case 'SET_SELECTION':
      // Set selection to provided IDs (no limit)
      return {
        ...state,
        selectedIds: action.payload,
      };
    
    default:
      return state;
  }
}

/**
 * Selection Context
 */
interface SelectionContextValue {
  state: SelectionState;
  dispatch: React.Dispatch<SelectionAction>;
}

const SelectionContext = createContext<SelectionContextValue | undefined>(undefined);

/**
 * Selection Provider Props
 */
interface SelectionProviderProps {
  children: ReactNode;
}

/**
 * Selection Provider Component
 * Wraps app to provide selection state
 */
export function SelectionProvider({ children }: SelectionProviderProps) {
  const [state, dispatch] = useReducer(selectionReducer, initialSelectionState);

  const value: SelectionContextValue = {
    state,
    dispatch,
  };

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

/**
 * useSelection Hook
 * 
 * Custom hook to access selection state and actions
 * Must be used within SelectionProvider
 * 
 * @returns Selection state and helper functions
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { selectedIds, selectShape, clearSelection } = useSelection();
 *   
 *   return (
 *     <button onClick={() => selectShape('shape-id')}>
 *       Select Shape
 *     </button>
 *   );
 * }
 * ```
 */
export function useSelection() {
  const context = useContext(SelectionContext);

  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }

  const { state, dispatch } = context;

  /**
   * Select a single shape (replaces current selection)
   */
  const selectShape = useCallback((shapeId: string) => {
    console.log('[Selection] Selecting shape:', shapeId);
    dispatch({ type: 'SELECT', payload: shapeId });
  }, [dispatch]);

  /**
   * Toggle shape selection (for shift-click multi-select)
   */
  const toggleSelectShape = useCallback((shapeId: string) => {
    console.log('[Selection] Toggling shape:', shapeId);
    dispatch({ type: 'TOGGLE_SELECT', payload: shapeId });
  }, [dispatch]);

  /**
   * Set selection to multiple shapes (for marquee select)
   */
  const setSelection = useCallback((shapeIds: string[]) => {
    console.log('[Selection] Setting selection to', shapeIds.length, 'shapes');
    dispatch({ type: 'SET_SELECTION', payload: shapeIds });
  }, [dispatch]);

  /**
   * Deselect a specific shape
   */
  const deselectShape = useCallback((shapeId: string) => {
    console.log('[Selection] Deselecting shape:', shapeId);
    dispatch({ type: 'DESELECT', payload: shapeId });
  }, [dispatch]);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    console.log('[Selection] Clearing selection');
    dispatch({ type: 'CLEAR_SELECTION' });
  }, [dispatch]);

  /**
   * Check if a shape is selected
   */
  const isSelected = useCallback((shapeId: string): boolean => {
    return state.selectedIds.includes(shapeId);
  }, [state.selectedIds]);

  /**
   * Get the first selected shape ID (single selection)
   */
  const getSelectedShapeId = useCallback((): string | null => {
    return state.selectedIds.length > 0 ? state.selectedIds[0] : null;
  }, [state.selectedIds]);

  /**
   * Check if any shapes are selected
   */
  const hasSelection = useCallback((): boolean => {
    return state.selectedIds.length > 0;
  }, [state.selectedIds]);

  return {
    // State
    selectedIds: state.selectedIds,
    
    // Actions
    selectShape,
    toggleSelectShape,
    setSelection,
    deselectShape,
    clearSelection,
    
    // Helpers
    isSelected,
    getSelectedShapeId,
    hasSelection,
  };
}

