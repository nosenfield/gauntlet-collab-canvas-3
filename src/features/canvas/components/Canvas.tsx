/**
 * Canvas Component
 * 
 * Main canvas workspace using Konva.js for 2D rendering.
 * - 10,000 x 10,000 pixel drawing area (coordinate space)
 * - Fills entire browser window (viewport)
 * - Responsive to window resize
 * - Supports pan navigation with scroll/wheel
 * - Supports zoom with Cmd/Ctrl + scroll (cursor-centered)
 */

import { Stage, Layer } from 'react-konva';
import { useCanvasSize } from '../hooks/useCanvasSize';
import { useViewport } from '../store/viewportStore';
import { usePan } from '../hooks/usePan';
import { useZoom } from '../hooks/useZoom';
import { useViewportConstraints } from '../hooks/useViewportConstraints';
import { GridBackground } from './GridBackground';
import { useEffect, useRef } from 'react';
import { FPSMonitor } from './FPSMonitor';
import { useCursorTracking } from '@/features/presence/hooks/useCursorTracking';
import { RemoteCursors } from '@/features/presence/components/RemoteCursors';
import { ShapeLayer } from '@/features/displayObjects/shapes/components/ShapeLayer';
import { useShapeCreation } from '@/features/displayObjects/shapes/hooks/useShapeCreation';
import { useSelection } from '@/features/displayObjects/common/store/selectionStore';
import { useTool } from '@/features/displayObjects/common/store/toolStore';
import { useMarqueeSelection } from '@/features/displayObjects/common/hooks/useMarqueeSelection';
import { MarqueeBox } from '@/features/displayObjects/common/components/MarqueeBox';
import { useShapes } from '@/features/displayObjects/shapes/store/shapesStore';
import { useBoundingBox } from '@/features/displayObjects/common/hooks/useBoundingBox';
import { CollectionBoundingBox } from '@/features/displayObjects/common/components/CollectionBoundingBox';
import { ObjectHighlight } from '@/features/displayObjects/common/components/ObjectHighlight';

/**
 * Canvas Component
 * Renders a Konva Stage that fills the browser window
 * 
 * The canvas provides a 10,000 x 10,000 pixel coordinate space
 * that users can pan (scroll) and zoom (Cmd/Ctrl + scroll) to navigate.
 */
export function Canvas(): React.ReactElement {
  const { width, height } = useCanvasSize();
  const { viewport, setPosition, setViewport, setDimensions } = useViewport();
  const stageRef = useRef<any>(null); // Konva Stage ref

  // Sync window dimensions to viewport store
  useEffect(() => {
    setDimensions(width, height);
  }, [width, height, setDimensions]);

  // Track cursor position and sync to Realtime Database
  useCursorTracking({ stageRef, enabled: true });

  // Shape creation handler
  const handleShapeCreation = useShapeCreation();

  // Selection state from store
  const { selectedIds, selectShape, toggleSelectShape, setSelection, clearSelection } = useSelection();
  const { isSelectMode } = useTool();
  
  // Shapes for marquee selection
  const { shapes } = useShapes();
  
  // Marquee selection
  const {
    isMarqueeActive,
    getMarqueeBox,
    handleMouseDown: marqueeMouseDown,
    handleMouseMove: marqueeMouseMove,
    handleMouseUp: marqueeMouseUp,
  } = useMarqueeSelection(shapes, stageRef, isSelectMode());
  
  // Get selected shapes for bounding box calculation
  const selectedShapes = shapes.filter(shape => selectedIds.includes(shape.id));
  
  // Calculate bounding boxes for selected shapes
  const { collectionBounds, objectCorners } = useBoundingBox(selectedShapes);

  // Handle shape click (select when in select mode)
  const handleShapeClick = (shapeId: string, isShiftClick: boolean) => {
    if (isSelectMode()) {
      if (isShiftClick) {
        console.log('[Canvas] Shape shift-clicked in select mode:', shapeId);
        toggleSelectShape(shapeId);
      } else {
        console.log('[Canvas] Shape clicked in select mode:', shapeId);
        selectShape(shapeId);
      }
    }
  };

  // Handle stage mouse down (start marquee or create shape)
  const handleStageMouseDown = (e: any) => {
    const clickedOnEmpty = e.target === e.currentTarget;
    
    if (clickedOnEmpty && isSelectMode()) {
      // Start marquee selection
      marqueeMouseDown(e);
    }
  };
  
  // Handle stage mouse move (update marquee)
  const handleStageMouseMove = (e: any) => {
    marqueeMouseMove(e);
  };
  
  // Handle stage mouse up (complete marquee or shape creation)
  const handleStageMouseUp = () => {
    if (isMarqueeActive) {
      // Complete marquee selection
      const selectedShapeIds = marqueeMouseUp();
      if (selectedShapeIds && selectedShapeIds.length > 0) {
        setSelection(selectedShapeIds);
      } else {
        // Clicked on empty space without dragging - clear selection
        clearSelection();
      }
    }
  };
  
  // Handle stage click (for shape creation)
  const handleStageClick = (e: any) => {
    const clickedOnEmpty = e.target === e.currentTarget;
    
    if (!clickedOnEmpty || !isSelectMode()) {
      // Handle shape creation when not in select mode or clicked on a shape
      handleShapeCreation(e);
    }
  };

  // Pan gesture handling via scroll/wheel
  const panHandlers = usePan({
    viewportWidth: width,
    viewportHeight: height,
    scale: viewport.scale,
    currentX: viewport.x,
    currentY: viewport.y,
    onPan: setPosition,
  });

  // Zoom gesture handling via Cmd/Ctrl + scroll
  const zoomHandlers = useZoom({
    viewportWidth: width,
    viewportHeight: height,
    currentX: viewport.x,
    currentY: viewport.y,
    currentScale: viewport.scale,
    onZoom: setViewport,
  });

  // Maintain viewport constraints on window resize
  useViewportConstraints({
    viewportWidth: width,
    viewportHeight: height,
    currentX: viewport.x,
    currentY: viewport.y,
    currentScale: viewport.scale,
    onUpdate: setViewport,
  });

  // Combined wheel handler - delegates to pan or zoom based on modifier keys
  const handleWheel = (e: Parameters<typeof panHandlers.handleWheel>[0]): void => {
    if (e.evt.ctrlKey || e.evt.metaKey) {
      zoomHandlers.handleWheel(e);
    } else {
      panHandlers.handleWheel(e);
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        backgroundColor: '#2A2A2A', // Dark gray background
      }}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        x={viewport.x}
        y={viewport.y}
        scale={{ x: viewport.scale, y: viewport.scale }}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
      >
        <GridBackground
          width={width}
          height={height}
          stageX={viewport.x}
          stageY={viewport.y}
          scale={viewport.scale}
        />
        <ShapeLayer
          selectedIds={selectedIds}
          onShapeClick={handleShapeClick}
        />
        {/* Bounding Box Layer - Selection highlights */}
        <Layer listening={false}>
          {/* Individual object highlights (solid OBB) */}
          {selectedShapes.map(shape => {
            const corners = objectCorners.get(shape.id);
            if (!corners) return null;
            return (
              <ObjectHighlight 
                key={`highlight-${shape.id}`} 
                corners={corners}
                scale={viewport.scale}
              />
            );
          })}
          
          {/* Collection bounding box (dashed AABB) */}
          {collectionBounds && selectedShapes.length > 1 && (
            <CollectionBoundingBox 
              bounds={collectionBounds}
              scale={viewport.scale}
            />
          )}
        </Layer>
        {/* Marquee Selection Layer */}
        <Layer listening={false}>
          {isMarqueeActive && getMarqueeBox() && (
            <MarqueeBox {...getMarqueeBox()!} scale={viewport.scale} />
          )}
        </Layer>
        <RemoteCursors />
      </Stage>

      {/* FPS Monitor - Development only */}
      <FPSMonitor />
    </div>
  );
}

