/**
 * Modal Resize Hook
 * 
 * Provides vertical resizing functionality for the modal
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseModalResizeReturn {
  height: number;
  isResizing: boolean;
  handleResizeStart: (e: React.MouseEvent) => void;
}

const STORAGE_KEY = 'properties-modal-height';
const MIN_HEIGHT = 200;
const MAX_HEIGHT_OFFSET = 40; // 40px from top/bottom of viewport

/**
 * Load height from localStorage
 */
function loadHeight(): number | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return parseInt(stored, 10);
    }
  } catch (error) {
    console.error('[useModalResize] Error loading height:', error);
  }
  return null;
}

/**
 * Save height to localStorage
 */
function saveHeight(height: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, height.toString());
  } catch (error) {
    console.error('[useModalResize] Error saving height:', error);
  }
}

export function useModalResize(initialHeight: number): UseModalResizeReturn {
  // Load saved height or use initial
  const [height, setHeight] = useState<number>(() => {
    return loadHeight() || initialHeight;
  });
  
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{ y: number; initialHeight: number } | null>(null);
  
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      y: e.clientY,
      initialHeight: height,
    };
  }, [height]);
  
  useEffect(() => {
    if (!isResizing) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeStartRef.current) return;
      
      const deltaY = e.clientY - resizeStartRef.current.y;
      const newHeight = resizeStartRef.current.initialHeight + deltaY;
      
      // Constrain height
      const maxHeight = window.innerHeight - MAX_HEIGHT_OFFSET;
      const constrainedHeight = Math.max(MIN_HEIGHT, Math.min(newHeight, maxHeight));
      
      setHeight(constrainedHeight);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
      // Save height when resizing ends
      saveHeight(height);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, height]);
  
  return {
    height,
    isResizing,
    handleResizeStart,
  };
}

