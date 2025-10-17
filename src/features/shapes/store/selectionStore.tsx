/**
 * Selection Store
 * 
 * Global state management for selected shapes.
 * Tracks which shapes are currently selected for editing.
 */

import { createContext, useContext, useState, type ReactNode } from 'react';

/**
 * Selection Context Value
 */
interface SelectionContextValue {
  selectedShapeIds: Set<string>;
  selectShape: (shapeId: string) => void;
  deselectShape: (shapeId: string) => void;
  clearSelection: () => void;
  selectMultiple: (shapeIds: string[]) => void;
  isSelected: (shapeId: string) => boolean;
}

/**
 * Selection Context
 */
const SelectionContext = createContext<SelectionContextValue | undefined>(undefined);

/**
 * Selection Provider Props
 */
interface SelectionProviderProps {
  children: ReactNode;
}

/**
 * Selection Provider
 * 
 * Manages selected shapes state.
 */
export function SelectionProvider({ children }: SelectionProviderProps) {
  const [selectedShapeIds, setSelectedShapeIds] = useState<Set<string>>(new Set());

  /**
   * Select a single shape (adds to selection)
   */
  const selectShape = (shapeId: string) => {
    // Check before calling setState to avoid unnecessary calls
    if (selectedShapeIds.has(shapeId)) {
      return;
    }
    
    setSelectedShapeIds((prev) => {
      // Double-check inside setState for safety
      if (prev.has(shapeId)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(shapeId);
      console.log('✅ Shape selected:', shapeId);
      return next;
    });
  };

  /**
   * Deselect a single shape (removes from selection)
   */
  const deselectShape = (shapeId: string) => {
    setSelectedShapeIds((prev) => {
      const next = new Set(prev);
      next.delete(shapeId);
      console.log('❌ Shape deselected:', shapeId);
      return next;
    });
  };

  /**
   * Clear all selections
   */
  const clearSelection = () => {
    if (selectedShapeIds.size > 0) {
      console.log('🔄 Cleared selection');
      setSelectedShapeIds(new Set());
    }
  };

  /**
   * Select multiple shapes at once
   */
  const selectMultiple = (shapeIds: string[]) => {
    setSelectedShapeIds(new Set(shapeIds));
    console.log('✅ Multiple shapes selected:', shapeIds.length);
  };

  /**
   * Check if a shape is selected
   */
  const isSelected = (shapeId: string): boolean => {
    return selectedShapeIds.has(shapeId);
  };

  return (
    <SelectionContext.Provider
      value={{
        selectedShapeIds,
        selectShape,
        deselectShape,
        clearSelection,
        selectMultiple,
        isSelected,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
}

/**
 * Hook to access selection context
 * 
 * @throws Error if used outside SelectionProvider
 */
export function useSelectionContext(): SelectionContextValue {
  const context = useContext(SelectionContext);

  if (!context) {
    throw new Error('useSelectionContext must be used within SelectionProvider');
  }

  return context;
}

