/**
 * TextLayer Component
 * 
 * Renders all text objects on the canvas.
 * Maps over texts array and renders individual TextObject components.
 */

import React from 'react';
import { Layer } from 'react-konva';
import { useTexts } from '../store/textsStore';
import { TextObject } from './TextObject';
import { useAuth } from '@/features/auth/store/authStore';
import { updateText } from '../services/textService';
import type { TextDisplayObject } from '../types';

/**
 * TextLayer Props
 */
export interface TextLayerProps {
  selectedIds: string[];
  onTextClick: (textId: string, isShiftClick: boolean) => void;
  
  // Collection drag props (from useCanvasInteractions)
  isCollectionDragging: boolean;
  driverTextId: string;
  dragOptimisticTexts: TextDisplayObject[] | null;
  startCollectionDrag: (driverTextId: string) => void;
  moveCollectionDrag: (driverTextId: string, x: number, y: number) => void;
  endCollectionDrag: () => void;
}

/**
 * TextLayer Component
 * 
 * Konva Layer containing all text objects.
 * Handles rendering and selection state for texts.
 * Handles collection dragging when multiple objects are selected.
 */
export function TextLayer({
  selectedIds,
  onTextClick,
  isCollectionDragging,
  driverTextId,
  dragOptimisticTexts,
  startCollectionDrag,
  moveCollectionDrag,
  endCollectionDrag,
}: TextLayerProps): React.ReactElement {
  const { texts } = useTexts();
  const { user } = useAuth();
  
  // Check if multiple objects are selected (could be texts + shapes)
  const hasMultipleSelected = selectedIds.length > 1;
  
  // Handle text drag end
  const handleTextDragEnd = async (textId: string, x: number, y: number) => {
    if (!user) return;
    
    // If this was a collection drag, end it
    if (hasMultipleSelected && isCollectionDragging) {
      await endCollectionDrag();
      return;
    }
    
    // Otherwise, it's a single text drag
    try {
      console.log('[TextLayer] Updating single text position:', textId, { x, y });
      await updateText(textId, user.userId, { x, y });
    } catch (error) {
      console.error('[TextLayer] Error updating text position:', error);
    }
  };
  
  // Handle collection drag start (when multiple objects selected)
  const handleCollectionDragStart = (textId: string) => {
    if (!hasMultipleSelected) return;
    startCollectionDrag(textId);
  };
  
  // Handle collection drag move (when multiple objects selected)
  const handleCollectionDragMove = (textId: string, x: number, y: number) => {
    if (!hasMultipleSelected || !isCollectionDragging) return;
    moveCollectionDrag(textId, x, y);
  };
  
  // Merge optimistic texts with regular texts during collection dragging
  // Optimistic texts only contain the selected/dragging texts, we need to include non-selected texts too
  const textsToRender = React.useMemo(() => {
    if (isCollectionDragging && dragOptimisticTexts) {
      // Create a map of optimistic texts by ID for fast lookup
      const optimisticMap = new Map(dragOptimisticTexts.map(t => [t.id, t]));
      
      // Replace selected texts with optimistic versions, keep non-selected texts as-is
      return texts.map(text => optimisticMap.get(text.id) || text);
    }
    return texts;
  }, [isCollectionDragging, dragOptimisticTexts, texts]);
  
  return (
    <Layer name="text-layer">
      {textsToRender.map((text) => {
        const isSelected = selectedIds.includes(text.id);
        const isDriver = isCollectionDragging && driverTextId === text.id;
        
        return (
          <TextObject
            key={text.id}
            text={text}
            isSelected={isSelected}
            onClick={onTextClick}
            onDragEnd={handleTextDragEnd}
            // Keep draggable for all selected texts (use Konva's draggable)
            draggable={isSelected}
            // Collection drag handlers (only when multiple objects selected)
            onCollectionDragStart={hasMultipleSelected ? handleCollectionDragStart : undefined}
            onCollectionDragMove={hasMultipleSelected ? handleCollectionDragMove : undefined}
            // During collection drag, only the driver text is controlled by Konva
            // Non-driver texts get their positions from optimistic updates
            listening={!isCollectionDragging || isDriver}
          />
        );
      })}
    </Layer>
  );
}

