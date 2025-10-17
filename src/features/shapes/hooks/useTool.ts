/**
 * useTool Hook
 * 
 * Convenience hook for accessing and setting the current canvas tool.
 * 
 * @example
 * const { currentTool, setTool } = useTool();
 * 
 * // Check current tool
 * if (currentTool === 'rectangle') { ... }
 * 
 * // Set tool
 * setTool('circle');
 */

import { useToolContext, type CanvasTool } from '../store/toolStore';

/**
 * useTool Hook Return Type
 */
interface UseToolReturn {
  currentTool: CanvasTool;
  setTool: (tool: CanvasTool) => void;
  isToolSelected: (tool: CanvasTool) => boolean;
}

/**
 * Hook to access and manipulate canvas tool selection
 * 
 * @returns Current tool, setter, and utility functions
 */
export function useTool(): UseToolReturn {
  const { currentTool, setTool } = useToolContext();

  /**
   * Check if a specific tool is currently selected
   */
  const isToolSelected = (tool: CanvasTool): boolean => {
    return currentTool === tool;
  };

  return {
    currentTool,
    setTool,
    isToolSelected,
  };
}

