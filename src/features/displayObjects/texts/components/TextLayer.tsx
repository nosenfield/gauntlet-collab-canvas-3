/**
 * TextLayer Component
 * 
 * Renders all text objects on the canvas.
 * Maps over texts array and renders individual TextObject components.
 */

import { Layer } from 'react-konva';
import { useTexts } from '../store/textsStore';
import { useSelection } from '@/features/displayObjects/common/store/selectionStore';
import { TextObject } from './TextObject';

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
}: TextLayerProps): React.ReactElement {
  const { texts } = useTexts();
  
  return (
    <Layer name="text-layer">
      {texts.map((text) => {
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

