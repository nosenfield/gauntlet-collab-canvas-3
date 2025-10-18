/**
 * TextLayer Component
 * 
 * Renders all text objects on the canvas.
 * Maps over texts array and renders individual TextObject components.
 */

import React from 'react';
import { Layer } from 'react-konva';
import { useTexts } from '../store/textsStore';
import { useSelection } from '@/features/displayObjects/common/store/selectionStore';
import { TextObject } from './TextObject';
import type { TextDisplayObject } from '../types';

/**
 * TextLayer Props
 */
export interface TextLayerProps {
  selectedIds: string[];
  onTextClick: (textId: string, isShiftClick: boolean) => void;
  onCollectionDragStart?: (textId: string) => void;
  onCollectionDragMove?: (textId: string, x: number, y: number) => void;
  onDragEnd?: (textId: string, x: number, y: number) => void;
  isCollectionDragging?: boolean;
  driverTextId?: string;
  dragOptimisticTexts?: TextDisplayObject[] | null;
}

/**
 * TextLayer Component
 * 
 * Konva Layer containing all text objects.
 * Handles rendering and selection state for texts.
 */
export function TextLayer({
  selectedIds,
  onTextClick,
  onCollectionDragStart,
  onCollectionDragMove,
  onDragEnd,
  isCollectionDragging = false,
  driverTextId = '',
  dragOptimisticTexts = null,
}: TextLayerProps): React.ReactElement {
  const { texts } = useTexts();
  
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
        const isDriver = text.id === driverTextId;
        
        return (
          <TextObject
            key={text.id}
            text={text}
            isSelected={isSelected}
            onClick={onTextClick}
            onCollectionDragStart={onCollectionDragStart}
            onCollectionDragMove={onCollectionDragMove}
            onDragEnd={onDragEnd}
            draggable={isSelected}
            listening={!isCollectionDragging || isDriver}
          />
        );
      })}
    </Layer>
  );
}

