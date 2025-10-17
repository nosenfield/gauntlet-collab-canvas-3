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

import { Stage } from 'react-konva';
import { useCanvasSize } from '../hooks/useCanvasSize';
import { useViewport } from '../store/viewportStore';
import { useCanvasInteractions } from '../hooks/useCanvasInteractions';
import { CanvasLayers } from './CanvasLayers';
import { useEffect, useRef } from 'react';
import { FPSMonitor } from './FPSMonitor';
import { useCursorTracking } from '@/features/presence/hooks/useCursorTracking';

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

  // Consolidated interaction handling
  const {
    handleWheel,
    handleStageClick,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
    handleShapeClick,
    selectedIds,
    selectedShapes,
    isMarqueeActive,
    getMarqueeBox,
    collectionBounds,
    objectCorners,
  } = useCanvasInteractions({
    stageRef,
    width,
    height,
    viewport,
    setPosition,
    setViewport,
  });

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
        <CanvasLayers
          width={width}
          height={height}
          stageX={viewport.x}
          stageY={viewport.y}
          scale={viewport.scale}
          selectedIds={selectedIds}
          onShapeClick={handleShapeClick}
          selectedShapes={selectedShapes}
          objectCorners={objectCorners}
          collectionBounds={collectionBounds}
          isMarqueeActive={isMarqueeActive}
          marqueeBox={getMarqueeBox()}
        />
      </Stage>

      {/* FPS Monitor - Development only */}
      <FPSMonitor />
    </div>
  );
}

