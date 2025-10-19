/**
 * TextLayer Component
 * 
 * Renders all text objects on the canvas using the generic DisplayObjectLayer.
 */

import React from 'react';
import { useTexts } from '../store/textsStore';
import { TextObject } from './TextObject';
import { updateText } from '../services/textService';
import { DisplayObjectLayer, type ObjectRenderProps } from '../../common/components/DisplayObjectLayer';
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
 * Thin wrapper around DisplayObjectLayer that provides text-specific rendering.
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
  
  /**
   * Render function for individual text objects
   */
  const renderText = React.useCallback((
    text: TextDisplayObject,
    props: ObjectRenderProps
  ): React.ReactNode => {
    return (
      <TextObject
        key={text.id}
        text={text}
        {...props}
      />
    );
  }, []);
  
  return (
    <DisplayObjectLayer
      objects={texts}
      selectedIds={selectedIds}
      onClick={onTextClick}
      renderObject={renderText}
      updateObject={updateText}
      isCollectionDragging={isCollectionDragging}
      driverObjectId={driverTextId}
      dragOptimisticObjects={dragOptimisticTexts}
      startCollectionDrag={startCollectionDrag}
      moveCollectionDrag={moveCollectionDrag}
      endCollectionDrag={endCollectionDrag}
      layerName="text-layer"
    />
  );
}

