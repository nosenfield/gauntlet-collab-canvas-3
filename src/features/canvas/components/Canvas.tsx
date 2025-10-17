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
import { useEffect } from 'react';

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

  // Sync window dimensions to viewport store
  useEffect(() => {
    setDimensions(width, height);
  }, [width, height, setDimensions]);

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
        width={width}
        height={height}
        x={viewport.x}
        y={viewport.y}
        scale={{ x: viewport.scale, y: viewport.scale }}
        onWheel={handleWheel}
      >
        <GridBackground
          width={width}
          height={height}
          stageX={viewport.x}
          stageY={viewport.y}
          scale={viewport.scale}
        />
        <Layer></Layer>
      </Stage>
    </div>
  );
}

