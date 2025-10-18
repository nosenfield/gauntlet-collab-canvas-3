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
import { useLockToolIntegration } from '@/features/displayObjects/common/hooks/useLockToolIntegration';
import { useToolShortcuts } from '@/features/displayObjects/common/hooks/useToolShortcuts';
import { TransformModal } from '@/features/displayObjects/common/components/TransformModal';
import { useTool } from '@/features/displayObjects/common/store/toolStore';
import { useSelection } from '@/features/displayObjects/common/store/selectionStore';

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
  
  // Tool and selection state for transform modal
  const { isSelectMode } = useTool();
  const { hasSelection } = useSelection();

  // Sync window dimensions to viewport store
  useEffect(() => {
    setDimensions(width, height);
  }, [width, height, setDimensions]);

  // Track cursor position and sync to Realtime Database
  useCursorTracking({ stageRef, enabled: true });

  // Release locks when switching away from select tool
  useLockToolIntegration();

  // Handle keyboard shortcuts for tool selection
  useToolShortcuts();

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
    collectionCenter,
    collectionCorners,
    objectCorners,
  } = useCanvasInteractions({
    stageRef,
    width,
    height,
    viewport,
    setPosition,
    setViewport,
  });
  
  // Transform modal visibility: show when selection exists AND tool is 'select'
  const showTransformModal = hasSelection() && isSelectMode();

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
          collectionCorners={collectionCorners}
          isMarqueeActive={isMarqueeActive}
          marqueeBox={getMarqueeBox()}
        />
      </Stage>

      {/* Transform Modal - Appears at collection center when objects selected */}
      <TransformModal
        center={collectionCenter}
        viewport={viewport}
        visible={showTransformModal}
      />

      {/* FPS Monitor - Development only */}
      <FPSMonitor />
    </div>
  );
}

