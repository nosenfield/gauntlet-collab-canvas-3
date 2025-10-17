/**
 * useCanvasSize Hook
 * 
 * Tracks browser window dimensions for responsive canvas sizing.
 * Updates on window resize events.
 */

import { useState, useEffect } from 'react';

export interface CanvasSize {
  width: number;
  height: number;
}

/**
 * Custom hook to track window dimensions
 * Returns current window width and height, updates on resize
 */
export function useCanvasSize(): CanvasSize {
  const [size, setSize] = useState<CanvasSize>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    // Handler to update size state
    const handleResize = (): void => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Call handler immediately to set initial size
    handleResize();

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return size;
}

