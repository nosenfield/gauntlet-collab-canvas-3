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

interface UseModalResizeOptions {
  initialHeight: number;
  storageKey?: string; // Kept for backwards compatibility, but not used
  minHeight?: number;
  maxHeight?: number;
}

const DEFAULT_MIN_HEIGHT = 200;
const DEFAULT_MAX_HEIGHT_OFFSET = 40; // 40px from top/bottom of viewport

export function useModalResize(
  initialHeightOrOptions: number | UseModalResizeOptions
): UseModalResizeReturn {
  // Support both old and new API
  const options: UseModalResizeOptions = typeof initialHeightOrOptions === 'number'
    ? { initialHeight: initialHeightOrOptions }
    : initialHeightOrOptions;
  
  const minHeight = options.minHeight || DEFAULT_MIN_HEIGHT;
  const maxHeightOffset = options.maxHeight ? 0 : DEFAULT_MAX_HEIGHT_OFFSET;
  const maxHeight = options.maxHeight || (window.innerHeight - maxHeightOffset);
  
  // Always use initial height (no localStorage persistence)
  const [height, setHeight] = useState<number>(options.initialHeight);
  
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
      const constrainedHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
      
      setHeight(constrainedHeight);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
      // Height not persisted - resets on page reload
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

