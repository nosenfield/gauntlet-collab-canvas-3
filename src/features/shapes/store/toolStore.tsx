/**
 * Tool Store
 * 
 * Global state management for the currently selected canvas tool.
 * Simpler than other stores - uses Context + useState (not useReducer)
 * because state is just a single string value.
 */

import { createContext, useContext, useState, type ReactNode } from 'react';

/**
 * Available Canvas Tools
 */
export type CanvasTool = 'select' | 'rectangle' | 'circle' | 'line';

/**
 * Tool Context Value
 */
interface ToolContextValue {
  currentTool: CanvasTool;
  setTool: (tool: CanvasTool) => void;
}

/**
 * Tool Context
 */
const ToolContext = createContext<ToolContextValue | undefined>(undefined);

/**
 * Tool Provider Props
 */
interface ToolProviderProps {
  children: ReactNode;
  defaultTool?: CanvasTool;
}

/**
 * Tool Provider
 * 
 * Wraps components that need access to tool selection state.
 */
export function ToolProvider({ children, defaultTool = 'select' }: ToolProviderProps) {
  const [currentTool, setCurrentTool] = useState<CanvasTool>(defaultTool);

  const setTool = (tool: CanvasTool) => {
    console.log('🛠️ Tool selected:', tool);
    setCurrentTool(tool);
  };

  return (
    <ToolContext.Provider value={{ currentTool, setTool }}>
      {children}
    </ToolContext.Provider>
  );
}

/**
 * Hook to access tool context
 * 
 * @throws Error if used outside ToolProvider
 */
export function useToolContext(): ToolContextValue {
  const context = useContext(ToolContext);

  if (!context) {
    throw new Error('useToolContext must be used within ToolProvider');
  }

  return context;
}

