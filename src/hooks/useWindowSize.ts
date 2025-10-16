/**
 * useWindowSize Hook
 * 
 * Custom hook for tracking window size with debouncing to prevent
 * excessive resize calculations during window resizing.
 */

import { useState, useEffect } from 'react';

/**
 * Window size data structure
 */
export interface UseWindowSizeReturn {
  width: number;
  height: number;
}

/**
 * Custom hook for tracking window size with debouncing.
 * 
 * @param debounceMs - Debounce delay in milliseconds (default: 100ms)
 * @returns Current window dimensions
 * 
 * @example
 * ```tsx
 * const { width, height } = useWindowSize(150);
 * 
 * // Use in responsive calculations
 * const canvasWidth = width - TOOLBAR_HEIGHT;
 * ```
 */
export const useWindowSize = (debounceMs: number = 100): UseWindowSizeReturn => {
  const [windowSize, setWindowSize] = useState<UseWindowSizeReturn>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    let timeoutId: number;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, debounceMs);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [debounceMs]);

  return windowSize;
};
