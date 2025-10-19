/**
 * PreviewLineLayer Component
 * 
 * Renders the preview line during interactive drawing (drag-to-create).
 * Only visible when user is actively dragging to draw a line.
 * 
 * Visual: Dark stroke with semi-transparent
 */

import { Layer } from 'react-konva';
import { PreviewLine } from '@/features/displayObjects/shapes/components/PreviewLine';

interface PreviewLineLayerProps {
  isDrawing: boolean;
  previewLine: { x: number; y: number; points: number[] } | null;
}

/**
 * PreviewLineLayer
 * 
 * Renders a non-interactive layer with the line drawing preview.
 * Conditionally renders based on drawing active state.
 */
export function PreviewLineLayer({ 
  isDrawing, 
  previewLine,
}: PreviewLineLayerProps): React.ReactElement {
  return (
    <Layer listening={false}>
      {isDrawing && previewLine && (
        <PreviewLine {...previewLine} />
      )}
    </Layer>
  );
}

