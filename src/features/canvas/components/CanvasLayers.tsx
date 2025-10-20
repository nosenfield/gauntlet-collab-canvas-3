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
import { TextLayer } from '@/features/displayObjects/texts/components/TextLayer';
import { BoundingBoxLayer } from './BoundingBoxLayer';
import { MarqueeLayer } from './MarqueeLayer';
import { PreviewRectangleLayer } from './PreviewRectangleLayer';
import { PreviewCircleLayer } from './PreviewCircleLayer';
import { PreviewLineLayer } from './PreviewLineLayer';
import { RemoteCursors } from '@/features/presence/components/RemoteCursors';
import type { ShapeDisplayObject } from '@/features/displayObjects/shapes/types';
import type { TextDisplayObject } from '@/features/displayObjects/texts/types';
import type { Point, TransformableObject } from '@/features/displayObjects/common/types';
import type { ToolType } from '@/features/displayObjects/common/store/toolStore';

interface CanvasLayersProps {
  // Grid props
  width: number;
  height: number;
  stageX: number;
  stageY: number;
  scale: number;
  isGridVisible?: boolean;
  
  // Shape layer props
  selectedIds: string[];
  onShapeClick: (shapeId: string, isShiftClick: boolean) => void;
  
  // Collection drag props
  isCollectionDragging: boolean;
  driverShapeId: string;
  dragOptimisticShapes: ShapeDisplayObject[] | null;
  dragOptimisticTexts: TextDisplayObject[] | null;
  startCollectionDrag: (driverShapeId: string) => void;
  moveCollectionDrag: (driverShapeId: string, x: number, y: number) => void;
  endCollectionDrag: () => void;
  
  // Bounding box props
  selectedObjects: TransformableObject[];
  objectCorners: Map<string, Point[]>;
  collectionCorners: Point[] | null;
  
  // Marquee props
  isMarqueeActive: boolean;
  marqueeBox: { x: number; y: number; width: number; height: number } | null;
  
  // Preview rectangle props
  isDrawingRectangle: boolean;
  previewRectangle: { x: number; y: number; width: number; height: number } | null;
  
  // Preview circle props
  isDrawingCircle: boolean;
  previewCircle: { x: number; y: number; radiusX: number; radiusY: number } | null;
  
  // Preview line props
  isDrawingLine: boolean;
  previewLine: { x: number; y: number; points: number[] } | null;
  
  // Current tool
  currentTool?: ToolType;
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
  isGridVisible = true,
  
  // Shapes
  selectedIds,
  onShapeClick,
  
  // Collection drag
  isCollectionDragging,
  driverShapeId,
  dragOptimisticShapes,
  dragOptimisticTexts,
  startCollectionDrag,
  moveCollectionDrag,
  endCollectionDrag,
  
  // Bounding boxes
  selectedObjects,
  objectCorners,
  collectionCorners,
  
  // Marquee
  isMarqueeActive,
  marqueeBox,
  
  // Preview rectangle
  isDrawingRectangle,
  previewRectangle,
  
  // Preview circle
  isDrawingCircle,
  previewCircle,
  
  // Preview line
  isDrawingLine,
  previewLine,
  
  // Current tool
  currentTool,
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
        visible={isGridVisible}
      />
      
      {/* Layer 2: Shapes (interactive) */}
      <ShapeLayer
        selectedIds={selectedIds}
        onShapeClick={onShapeClick}
        isCollectionDragging={isCollectionDragging}
        driverShapeId={driverShapeId}
        dragOptimisticShapes={dragOptimisticShapes}
        startCollectionDrag={startCollectionDrag}
        moveCollectionDrag={moveCollectionDrag}
        endCollectionDrag={endCollectionDrag}
        currentTool={currentTool}
      />
      
      {/* Layer 2.5: Text Objects (interactive) */}
      <TextLayer
        selectedIds={selectedIds}
        onTextClick={onShapeClick}
        isCollectionDragging={isCollectionDragging}
        driverTextId={driverShapeId}
        dragOptimisticTexts={dragOptimisticTexts}
        startCollectionDrag={startCollectionDrag}
        moveCollectionDrag={moveCollectionDrag}
        endCollectionDrag={endCollectionDrag}
        currentTool={currentTool}
      />
      
      {/* Layer 3: Bounding Box Layer - Selection highlights */}
      <BoundingBoxLayer
        selectedObjects={selectedObjects}
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
      
      {/* Layer 4.5: Preview Rectangle Layer (drag-to-create) */}
      <PreviewRectangleLayer
        isDrawing={isDrawingRectangle}
        previewRect={previewRectangle}
      />
      
      {/* Layer 4.6: Preview Circle Layer (drag-to-create) */}
      <PreviewCircleLayer
        isDrawing={isDrawingCircle}
        previewCircle={previewCircle}
      />
      
      {/* Layer 4.7: Preview Line Layer (drag-to-create) */}
      <PreviewLineLayer
        isDrawing={isDrawingLine}
        previewLine={previewLine}
      />
      
      {/* Layer 5: Remote Cursors (top layer) */}
      <RemoteCursors />
    </>
  );
}

