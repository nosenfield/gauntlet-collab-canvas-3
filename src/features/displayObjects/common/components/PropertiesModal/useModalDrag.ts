/**
 * Modal Drag Hook
 * 
 * Provides dragging functionality for modal repositioning
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseModalDragReturn {
  position: Position;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
}

interface UseModalDragOptions {
  initialPosition: Position;
  storageKey?: string;
}

const DEFAULT_STORAGE_KEY = 'modal-position';

/**
 * Load position from localStorage
 */
function loadPosition(storageKey: string): Position | null {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[useModalDrag] Error loading position:', error);
  }
  return null;
}

/**
 * Save position to localStorage
 */
function savePosition(position: Position, storageKey: string): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(position));
  } catch (error) {
    console.error('[useModalDrag] Error saving position:', error);
  }
}

export function useModalDrag(
  initialPositionOrOptions: Position | UseModalDragOptions
): UseModalDragReturn {
  // Support both old and new API
  const options: UseModalDragOptions = 'x' in initialPositionOrOptions && 'y' in initialPositionOrOptions
    ? { initialPosition: initialPositionOrOptions }
    : initialPositionOrOptions as UseModalDragOptions;
  
  const storageKey = options.storageKey || DEFAULT_STORAGE_KEY;
  
  // Load saved position or use initial
  const [position, setPosition] = useState<Position>(() => {
    return loadPosition(storageKey) || options.initialPosition;
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; modalX: number; modalY: number } | null>(null);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag from header area
    if ((e.target as HTMLElement).closest('.properties-modal__header')) {
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        modalX: position.x,
        modalY: position.y,
      };
    }
  }, [position]);
  
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      
      const newX = dragStartRef.current.modalX + deltaX;
      const newY = dragStartRef.current.modalY + deltaY;
      
      // Constrain to viewport
      const maxX = window.innerWidth - 320; // Modal width
      const maxY = window.innerHeight - 100; // Minimum visible height
      
      const constrainedX = Math.max(0, Math.min(newX, maxX));
      const constrainedY = Math.max(0, Math.min(newY, maxY));
      
      setPosition({ x: constrainedX, y: constrainedY });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      // Save position when dragging ends
      savePosition(position, storageKey);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position]);
  
  return {
    position,
    isDragging,
    handleMouseDown,
  };
}

