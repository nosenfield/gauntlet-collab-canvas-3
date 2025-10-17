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

import { Stage, Layer, Rect } from 'react-konva';
import { useCanvasSize } from '../hooks/useCanvasSize';
import { useViewport } from '../store/viewportStore';
import { usePan } from '../hooks/usePan';
import { useZoom } from '../hooks/useZoom';
import { useViewportConstraints } from '../hooks/useViewportConstraints';
import { GridBackground } from './GridBackground';
import { useEffect, useState, useRef } from 'react';
import { startFPSMonitoring, stopFPSMonitoring } from '@/utils/performanceMonitor';
import type { PerformanceMetrics } from '@/utils/performanceMonitor';
import { useCursorTracking } from '@/features/presence/hooks/useCursorTracking';
import { RemoteCursors } from '@/features/presence/components/RemoteCursors';
import { ShapeRenderer } from '@/features/shapes/components/ShapeRenderer';
import { useRectangleCreation } from '@/features/shapes/hooks/useRectangleCreation';

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
  const [fpsMetrics, setFpsMetrics] = useState<PerformanceMetrics>({ fps: 60, frameTime: 0, timestamp: 0 });
  const [showFPS, setShowFPS] = useState(false); // Toggle with 'F' key
  const stageRef = useRef<any>(null); // Konva Stage ref

  // Sync window dimensions to viewport store
  useEffect(() => {
    setDimensions(width, height);
  }, [width, height, setDimensions]);

  // Performance monitoring in development
  useEffect(() => {
    // Only enable in development mode
    if (import.meta.env.DEV) {
      startFPSMonitoring((metrics) => {
        setFpsMetrics(metrics);
      });

      return () => {
        stopFPSMonitoring();
      };
    }
  }, []);

  // Toggle FPS display with 'F' key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        setShowFPS((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Track cursor position and sync to Realtime Database
  useCursorTracking({ stageRef, enabled: true });

  // Rectangle creation handling
  const {
    previewRectangle,
    handleMouseDown: handleRectMouseDown,
    handleMouseMove: handleRectMouseMove,
    handleMouseUp: handleRectMouseUp,
  } = useRectangleCreation();

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
        onMouseDown={handleRectMouseDown}
        onMouseMove={handleRectMouseMove}
        onMouseUp={handleRectMouseUp}
      >
        <GridBackground
          width={width}
          height={height}
          stageX={viewport.x}
          stageY={viewport.y}
          scale={viewport.scale}
        />
        
        {/* Render all persistent shapes */}
        <ShapeRenderer />
        
        {/* Preview layer for shape being created */}
        {previewRectangle && (
          <Layer>
            <Rect
              x={previewRectangle.x}
              y={previewRectangle.y}
              width={previewRectangle.width}
              height={previewRectangle.height}
              fill="rgba(255, 255, 255, 0.3)"
              stroke="#FFFFFF"
              strokeWidth={2}
              dash={[5, 5]}
              listening={false}
            />
          </Layer>
        )}
        
        <RemoteCursors />
      </Stage>

      {/* FPS Overlay - Toggle with 'F' key (development only) */}
      {import.meta.env.DEV && showFPS && (
        <div
          style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: fpsMetrics.fps < 60 ? '#ff6b6b' : '#51cf66',
            padding: '8px 12px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '14px',
            zIndex: 1000,
            pointerEvents: 'none',
          }}
        >
          <div>FPS: {fpsMetrics.fps}</div>
          <div style={{ fontSize: '11px', opacity: 0.7 }}>
            Frame: {fpsMetrics.frameTime.toFixed(2)}ms
          </div>
          <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '4px' }}>
            Press F to hide
          </div>
        </div>
      )}
    </div>
  );
}

