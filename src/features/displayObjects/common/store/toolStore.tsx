/**
 * Tool Store
 * 
 * Global state management for display object tool selection
 * Manages which tool is currently active (select, rectangle, circle, line)
 */

import { createContext, useContext, useReducer, type ReactNode } from 'react';

/**
 * Tool Type
 * Available tools for display object creation and manipulation
 */
export type ToolType = 'select' | 'rectangle' | 'circle' | 'line';

/**
 * Tool State
 */
export interface ToolState {
  currentTool: ToolType;
}

/**
 * Tool Actions
 */
type ToolAction =
  | { type: 'SET_TOOL'; payload: ToolType }
  | { type: 'RESET_TO_SELECT' };

/**
 * Initial tool state
 * Default to 'select' tool on app load
 */
const initialToolState: ToolState = {
  currentTool: 'select',
};

/**
 * Tool Reducer
 * Pure function that handles tool state transitions
 */
function toolReducer(state: ToolState, action: ToolAction): ToolState {
  switch (action.type) {
    case 'SET_TOOL':
      console.log('[ToolStore] Tool changed:', state.currentTool, '->', action.payload);
      return {
        ...state,
        currentTool: action.payload,
      };
    
    case 'RESET_TO_SELECT':
      console.log('[ToolStore] Reset to select tool');
      return {
        ...state,
        currentTool: 'select',
      };
    
    default:
      return state;
  }
}

/**
 * Tool Context
 * Provides tool state and dispatch to components
 */
interface ToolContextValue {
  state: ToolState;
  dispatch: React.Dispatch<ToolAction>;
}

const ToolContext = createContext<ToolContextValue | undefined>(undefined);

/**
 * Tool Provider Props
 */
interface ToolProviderProps {
  children: ReactNode;
}

/**
 * Tool Provider Component
 * Wraps app to provide tool state throughout component tree
 */
export function ToolProvider({ children }: ToolProviderProps) {
  const [state, dispatch] = useReducer(toolReducer, initialToolState);

  const value: ToolContextValue = {
    state,
    dispatch,
  };

  return (
    <ToolContext.Provider value={value}>
      {children}
    </ToolContext.Provider>
  );
}

/**
 * useTool Hook
 * 
 * Custom hook to access tool state and actions
 * Must be used within ToolProvider
 * 
 * @returns Tool state and helper functions
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { currentTool, setTool, resetToSelect } = useTool();
 *   
 *   return (
 *     <button onClick={() => setTool('rectangle')}>
 *       Rectangle {currentTool === 'rectangle' && '✓'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useTool() {
  const context = useContext(ToolContext);

  if (!context) {
    throw new Error('useTool must be used within a ToolProvider');
  }

  const { state, dispatch } = context;

  /**
   * Set the current tool
   */
  const setTool = (tool: ToolType) => {
    dispatch({ type: 'SET_TOOL', payload: tool });
  };

  /**
   * Reset to select tool
   * Commonly used after creating a shape
   */
  const resetToSelect = () => {
    dispatch({ type: 'RESET_TO_SELECT' });
  };

  /**
   * Check if a specific tool is currently active
   */
  const isToolActive = (tool: ToolType): boolean => {
    return state.currentTool === tool;
  };

  /**
   * Check if select tool is active
   */
  const isSelectMode = (): boolean => {
    return state.currentTool === 'select';
  };

  /**
   * Check if a creation tool is active (not select)
   */
  const isCreationMode = (): boolean => {
    return state.currentTool !== 'select';
  };

  return {
    // State
    currentTool: state.currentTool,
    
    // Actions
    setTool,
    resetToSelect,
    
    // Helpers
    isToolActive,
    isSelectMode,
    isCreationMode,
  };
}

/**
 * Tool display names for UI
 */
export const TOOL_LABELS: Record<ToolType, string> = {
  select: 'Select',
  rectangle: 'Rectangle',
  circle: 'Circle',
  line: 'Line',
};

/**
 * Tool keyboard shortcuts (future enhancement)
 */
export const TOOL_SHORTCUTS: Record<ToolType, string> = {
  select: 'V',
  rectangle: 'R',
  circle: 'C',
  line: 'L',
};

