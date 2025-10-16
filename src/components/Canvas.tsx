/**
 * Canvas Component
 * 
 * Main canvas component that renders the Konva stage and handles
 * user interactions for drawing and navigation.
 */

import React, { useEffect, useRef } from 'react';
import { Stage, Layer } from 'react-konva';
import { useCanvas } from '@/hooks/useCanvas';
import { useAuth } from '@/hooks/useAuth';
import { usePresence } from '@/hooks/usePresence';
import { useShapes } from '@/hooks/useShapes';

/**
 * Canvas component props
 */
interface CanvasProps {
  className?: string;
}

/**
 * Main Canvas component
 */
export const Canvas: React.FC<CanvasProps> = ({ className }) => {
  const {
    viewport,
    tool,
    isReady,
    bounds,
    stageRef,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    screenToCanvas
  } = useCanvas();

  const { currentUser, updateCursor } = useAuth();
  const { updateCursor: updatePresenceCursor } = usePresence();
  const { shapes, addShape, selectShape } = useShapes();

  /**
   * Handle cursor position updates
   */
  const handleCursorMove = (event: any) => {
    if (!currentUser) return;

    const canvasPos = screenToCanvas(event.evt.clientX, event.evt.clientY);
    updatePresenceCursor(currentUser.id, canvasPos);
  };

  /**
   * Handle shape creation
   */
  const handleShapeCreation = (event: any) => {
    if (!currentUser || tool.activeTool === 'none') return;

    const canvasPos = screenToCanvas(event.evt.clientX, event.evt.clientY);
    
    if (tool.activeTool === 'rectangle') {
      // Create rectangle shape
      addShape({
        type: 'rectangle',
        x: canvasPos.x,
        y: canvasPos.y,
        width: 100,
        height: 100,
        fill: currentUser.color,
        createdBy: currentUser.id
      });
    }
  };

  if (!isReady) {
    return (
      <div className={`canvas-loading ${className || ''}`}>
        <div>Loading canvas...</div>
      </div>
    );
  }

  return (
    <div className={`canvas-container ${className || ''}`}>
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        x={viewport.x}
        y={viewport.y}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => {
          handleMouseMove(e);
          handleCursorMove(e);
        }}
        onMouseUp={handleMouseUp}
        onClick={handleShapeCreation}
        draggable={tool.activeTool === 'none'}
      >
        <Layer>
          {/* Canvas background */}
          <div
            style={{
              position: 'absolute',
              left: bounds.minX,
              top: bounds.minY,
              width: bounds.width,
              height: bounds.height,
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6'
            }}
          />
          
          {/* Render shapes */}
          {shapes.map((shape) => (
            <div key={shape.id}>
              {/* Shape will be rendered here */}
            </div>
          ))}
          
          {/* Render cursors */}
          {/* Cursors will be rendered here */}
        </Layer>
      </Stage>
    </div>
  );
};
