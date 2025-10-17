/**
 * Selection Handles Layer
 * 
 * Renders selection handles for all selected shapes in a separate layer on top.
 * This ensures handles are always visible above all shapes regardless of z-index.
 */

import { Layer } from 'react-konva';
import type { Shape } from '../../../types/firebase';
import { SelectionHandlesTop } from './SelectionHandlesTop';

/**
 * Selection Handles Layer Props
 */
interface SelectionHandlesLayerProps {
  shapes: Shape[];
}

/**
 * Selection Handles Layer Component
 * 
 * Renders a layer containing selection handles for all selected shapes.
 * This layer renders after the shapes layer, ensuring handles are on top.
 */
export function SelectionHandlesLayer({ shapes }: SelectionHandlesLayerProps) {
  if (shapes.length === 0) {
    return null;
  }

  return (
    <Layer>
      {shapes.map((shape) => (
        <SelectionHandlesTop key={`handles-${shape.id}`} shape={shape} />
      ))}
    </Layer>
  );
}

