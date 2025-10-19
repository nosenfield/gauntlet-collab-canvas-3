/**
 * PreviewCircleLayer Component
 * 
 * Renders the preview circle during interactive drawing (drag-to-create).
 * Only visible when user is actively dragging to draw a circle.
 * 
 * Visual: Coral fill with 2px dark stroke and semi-transparent
 */

import { Layer } from 'react-konva';
import { PreviewCircle } from '@/features/displayObjects/shapes/components/PreviewCircle';

interface PreviewCircleLayerProps {
  isDrawing: boolean;
  previewCircle: { x: number; y: number; radius: number } | null;
}

/**
 * PreviewCircleLayer
 * 
 * Renders a non-interactive layer with the circle drawing preview.
 * Conditionally renders based on drawing active state.
 */
export function PreviewCircleLayer({ 
  isDrawing, 
  previewCircle,
}: PreviewCircleLayerProps): React.ReactElement {
  return (
    <Layer listening={false}>
      {isDrawing && previewCircle && (
        <PreviewCircle {...previewCircle} />
      )}
    </Layer>
  );
}

