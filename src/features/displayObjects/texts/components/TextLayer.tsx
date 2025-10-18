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
 * TextLayer Component
 * 
 * Konva Layer containing all text objects.
 * Handles rendering and selection state for texts.
 */
export function TextLayer(): React.ReactElement {
  const { texts } = useTexts();
  const { selectedIds, toggleSelection } = useSelection();
  
  const handleTextClick = (textId: string) => {
    toggleSelection(textId);
  };
  
  return (
    <Layer name="text-layer">
      {texts.map((text) => (
        <TextObject
          key={text.id}
          text={text}
          isSelected={selectedIds.includes(text.id)}
          onClick={() => handleTextClick(text.id)}
        />
      ))}
    </Layer>
  );
}

