/**
 * Canvas Component
 * 
 * Main canvas component that renders the Konva stage and handles
 * user interactions for drawing and navigation.
 */

import React, { useEffect, useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
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

  const { currentUser } = useAuth();
  const { updateCursor: updatePresenceCursor } = usePresence();
  const { shapes, addShape } = useShapes();

  const [stageSize, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  /**
   * Handle window resize
   */
  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        width={stageSize.width}
        height={stageSize.height}
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
          <Rect
            x={-bounds.width / 2}
            y={-bounds.height / 2}
            width={bounds.width}
            height={bounds.height}
            fill="#f8f9fa"
            stroke="#dee2e6"
            strokeWidth={1}
            listening={false}
          />
          
          {/* Render shapes */}
          {shapes.map((shape) => (
            <Rect
              key={shape.id}
              x={shape.x}
              y={shape.y}
              width={shape.width}
              height={shape.height}
              fill={shape.fill}
              stroke="#000000"
              strokeWidth={1}
              draggable={true}
              onDragEnd={(e) => {
                // Handle shape drag end
                console.log('Shape dragged:', shape.id);
              }}
            />
          ))}
          
          {/* Render cursors */}
          {/* Cursors will be rendered here */}
        </Layer>
      </Stage>
    </div>
  );
};
