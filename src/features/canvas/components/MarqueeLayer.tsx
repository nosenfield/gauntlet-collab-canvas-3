/**
 * MarqueeLayer Component
 * 
 * Renders the marquee selection box (drag-to-select) on the canvas.
 * Only visible when user is actively dragging to select multiple shapes.
 * 
 * Visual: Dashed blue rectangle with 50% opacity
 */

import { Layer } from 'react-konva';
import { MarqueeBox } from '@/features/displayObjects/common/components/MarqueeBox';

interface MarqueeLayerProps {
  isMarqueeActive: boolean;
  marqueeBox: { x: number; y: number; width: number; height: number } | null;
  scale: number;
}

/**
 * MarqueeLayer
 * 
 * Renders a non-interactive layer with the marquee selection box.
 * Conditionally renders based on marquee active state.
 */
export function MarqueeLayer({ 
  isMarqueeActive, 
  marqueeBox, 
  scale 
}: MarqueeLayerProps): React.ReactElement {
  return (
    <Layer listening={false}>
      {isMarqueeActive && marqueeBox && (
        <MarqueeBox {...marqueeBox} scale={scale} />
      )}
    </Layer>
  );
}

