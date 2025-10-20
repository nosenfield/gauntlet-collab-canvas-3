/**
 * useGridToggle Hook
 * 
 * Manages grid visibility state and keyboard shortcut (G key)
 */

import { useState, useEffect, useCallback } from 'react';

interface UseGridToggleReturn {
  isGridVisible: boolean;
  toggleGrid: () => void;
}

/**
 * Custom hook for toggling grid visibility with G key
 */
export function useGridToggle(): UseGridToggleReturn {
  const [isGridVisible, setIsGridVisible] = useState(true);

  const toggleGrid = useCallback(() => {
    setIsGridVisible(prev => {
      const newValue = !prev;
      console.log(`[GridToggle] Grid ${newValue ? 'shown' : 'hidden'}`);
      return newValue;
    });
  }, []);

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

      // Ignore if modifier keys are pressed
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
        return;
      }

      // Check for G key
      if (event.key.toLowerCase() === 'g') {
        event.preventDefault();
        toggleGrid();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [toggleGrid]);

  return {
    isGridVisible,
    toggleGrid,
  };
}

