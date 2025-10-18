/**
 * CanvasLayers Component
 * 
 * Consolidates all Konva layers for the canvas:
 * - Grid Background (lowest layer)
 * - Shape Layer (interactive shapes)
 * - Bounding Box Layer (selection highlights)
 * - Marquee Layer (drag-to-select box)
 * - Remote Cursors (top layer)
 * 
 * This component encapsulates the rendering logic for all canvas content,
 * making Canvas.tsx a thin coordinator.
 */

import { GridBackground } from './GridBackground';
import { ShapeLayer } from '@/features/displayObjects/shapes/components/ShapeLayer';
import { BoundingBoxLayer } from './BoundingBoxLayer';
import { MarqueeLayer } from './MarqueeLayer';
import { RemoteCursors } from '@/features/presence/components/RemoteCursors';
import type { ShapeDisplayObject } from '@/features/displayObjects/shapes/types';
import type { Point } from '@/features/displayObjects/common/types';

interface CanvasLayersProps {
  // Grid props
  width: number;
  height: number;
  stageX: number;
  stageY: number;
  scale: number;
  
  // Shape layer props
  selectedIds: string[];
  onShapeClick: (shapeId: string, isShiftClick: boolean) => void;
  
  // Bounding box props
  selectedShapes: ShapeDisplayObject[];
  objectCorners: Map<string, Point[]>;
  collectionCorners: Point[] | null;
  
  // Marquee props
  isMarqueeActive: boolean;
  marqueeBox: { x: number; y: number; width: number; height: number } | null;
}

/**
 * CanvasLayers
 * 
 * Renders all canvas layers in the correct z-order.
 * All props are passed down from Canvas component.
 */
export function CanvasLayers({
  // Grid
  width,
  height,
  stageX,
  stageY,
  scale,
  
  // Shapes
  selectedIds,
  onShapeClick,
  
  // Bounding boxes
  selectedShapes,
  objectCorners,
  collectionCorners,
  
  // Marquee
  isMarqueeActive,
  marqueeBox,
}: CanvasLayersProps): React.ReactElement {
  return (
    <>
      {/* Layer 1: Grid Background (non-interactive) */}
      <GridBackground
        width={width}
        height={height}
        stageX={stageX}
        stageY={stageY}
        scale={scale}
      />
      
      {/* Layer 2: Shapes (interactive) */}
      <ShapeLayer
        selectedIds={selectedIds}
        onShapeClick={onShapeClick}
      />
      
      {/* Layer 3: Bounding Box Layer - Selection highlights */}
      <BoundingBoxLayer
        selectedShapes={selectedShapes}
        objectCorners={objectCorners}
        collectionCorners={collectionCorners}
        scale={scale}
      />
      
      {/* Layer 4: Marquee Selection Layer */}
      <MarqueeLayer
        isMarqueeActive={isMarqueeActive}
        marqueeBox={marqueeBox}
        scale={scale}
      />
      
      {/* Layer 5: Remote Cursors (top layer) */}
      <RemoteCursors />
    </>
  );
}

