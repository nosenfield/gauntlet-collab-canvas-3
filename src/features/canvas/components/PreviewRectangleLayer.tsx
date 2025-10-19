/**
 * PreviewRectangleLayer Component
 * 
 * Renders the preview rectangle during interactive drawing (drag-to-create).
 * Only visible when user is actively dragging to draw a rectangle.
 * 
 * Visual: White fill with 1px black border and semi-transparent
 */

import { Layer } from 'react-konva';
import { PreviewRectangle } from '@/features/displayObjects/shapes/components/PreviewRectangle';

interface PreviewRectangleLayerProps {
  isDrawing: boolean;
  previewRect: { x: number; y: number; width: number; height: number } | null;
}

/**
 * PreviewRectangleLayer
 * 
 * Renders a non-interactive layer with the rectangle drawing preview.
 * Conditionally renders based on drawing active state.
 */
export function PreviewRectangleLayer({ 
  isDrawing, 
  previewRect,
}: PreviewRectangleLayerProps): React.ReactElement {
  return (
    <Layer listening={false}>
      {isDrawing && previewRect && (
        <PreviewRectangle {...previewRect} />
      )}
    </Layer>
  );
}

