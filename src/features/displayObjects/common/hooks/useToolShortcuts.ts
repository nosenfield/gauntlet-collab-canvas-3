/**
 * useToolShortcuts Hook
 * 
 * Handles keyboard shortcuts for tool selection
 * V = Select, R = Rectangle, C = Circle, L = Line, T = Text
 */

import { useEffect } from 'react';
import { useTool, type ToolType } from '../store/toolStore';

/**
 * Tool keyboard shortcuts mapping
 */
const TOOL_SHORTCUTS: Record<string, ToolType> = {
  'v': 'select',
  'r': 'rectangle',
  'c': 'circle',
  'l': 'line',
  't': 'text',
};

/**
 * useToolShortcuts
 * 
 * Listens for keyboard shortcuts and switches tools accordingly.
 * Shortcuts work when user is not typing in an input field.
 */
export function useToolShortcuts() {
  const { setTool } = useTool();

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Ignore if modifier keys are pressed (Cmd, Ctrl, Alt)
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      // Check if the key matches a tool shortcut
      const key = event.key.toLowerCase();
      const tool = TOOL_SHORTCUTS[key];

      if (tool) {
        event.preventDefault();
        console.log(`[ToolShortcuts] Switching to ${tool} tool (key: ${key.toUpperCase()})`);
        setTool(tool);
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyPress);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [setTool]);
}

