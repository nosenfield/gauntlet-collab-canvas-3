/**
 * Canvas Component
 * 
 * Main canvas component that renders the Konva stage and handles
 * user interactions for drawing and navigation.
 */

import React, { useEffect, useState } from 'react';
import { Stage, Layer, Rect, Circle, Text } from 'react-konva';
import { useAuth } from '@/hooks/useAuth';
import { usePresence } from '@/hooks/usePresence';
import { useShapes } from '@/hooks/useShapes';
import { Grid } from '@/components/Grid';
import type { CanvasHook } from '@/types';
import { TOOLBAR_HEIGHT } from '@/types';

/**
 * Canvas component props
 */
interface CanvasProps {
  className?: string;
  canvasHook: CanvasHook;
}

/**
 * Main Canvas component
 */
export const Canvas: React.FC<CanvasProps> = ({ className, canvasHook }) => {
  const {
    viewport,
    tool,
    grid,
    isReady,
    bounds,
    stageRef,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    screenToCanvas
  } = canvasHook;

  const { currentUser } = useAuth();
  const { 
    activeUsers, 
    isLoading: presenceLoading, 
    updateCursor: updatePresenceCursor,
    joinSession,
    leaveSession
  } = usePresence();
  const { shapes, addShape } = useShapes();

  const [stageSize, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight - TOOLBAR_HEIGHT
  });

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);

  /**
   * Handle window resize
   */
  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight - TOOLBAR_HEIGHT
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Join session when user is authenticated
   */
  useEffect(() => {
    if (currentUser && !presenceLoading) {
      joinSession(currentUser.id);
    }

    // Cleanup on unmount
    return () => {
      if (currentUser) {
        leaveSession();
      }
    };
  }, [currentUser, presenceLoading, joinSession, leaveSession]);

  /**
   * Handle cursor position updates
   */
  const handleCursorMove = (event: any) => {
    if (!currentUser) return;

    const canvasPos = screenToCanvas(event.evt.clientX, event.evt.clientY);
    updatePresenceCursor(currentUser.id, canvasPos);
  };

  /**
   * Handle mouse down for drawing
   */
  const handleCanvasMouseDown = (event: any) => {
    if (!currentUser) return;

    const canvasPos = screenToCanvas(event.evt.clientX, event.evt.clientY);
    
    if (tool.activeTool === 'rectangle') {
      setIsDrawing(true);
      setDrawStart(canvasPos);
      setDrawCurrent(canvasPos);
    } else {
      // Call original handler for panning
      handleMouseDown(event);
    }
  };

  /**
   * Handle mouse move during drawing
   */
  const handleCanvasMouseMove = (event: any) => {
    if (!currentUser) return;

    const canvasPos = screenToCanvas(event.evt.clientX, event.evt.clientY);
    updatePresenceCursor(currentUser.id, canvasPos);

    if (isDrawing && tool.activeTool === 'rectangle') {
      setDrawCurrent(canvasPos);
    } else {
      // Call original handler for other interactions
      handleMouseMove(event);
    }
  };

  /**
   * Handle mouse up to complete drawing
   */
  const handleCanvasMouseUp = () => {
    if (!currentUser) return;

    if (isDrawing && tool.activeTool === 'rectangle' && drawStart && drawCurrent) {
      // Calculate rectangle dimensions
      const x = Math.min(drawStart.x, drawCurrent.x);
      const y = Math.min(drawStart.y, drawCurrent.y);
      const width = Math.abs(drawCurrent.x - drawStart.x);
      const height = Math.abs(drawCurrent.y - drawStart.y);

      // Only create rectangle if it has meaningful dimensions
      if (width > 5 && height > 5) {
        addShape({
          type: 'rectangle',
          x,
          y,
          width,
          height,
          fill: currentUser.color,
          createdBy: currentUser.id
        });
      }

      // Reset drawing state
      setIsDrawing(false);
      setDrawStart(null);
      setDrawCurrent(null);
    } else {
      // Call original handler for other interactions
      handleMouseUp();
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
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={(e) => {
          handleCanvasMouseMove(e);
          handleCursorMove(e);
        }}
        onMouseUp={handleCanvasMouseUp}
        draggable={false}  // We handle dragging manually via wheel events
      >
        <Layer>
          {/* Canvas background */}
          <Rect
            x={0}
            y={0}
            width={bounds.width}
            height={bounds.height}
            fill="#2d3748"
            stroke="#4a5568"
            strokeWidth={1}
            listening={false}
          />
          
          {/* Grid overlay */}
          <Grid grid={grid} />
          
          
          {/* Render preview rectangle while drawing */}
          {isDrawing && drawStart && drawCurrent && tool.activeTool === 'rectangle' && (
            <Rect
              x={Math.min(drawStart.x, drawCurrent.x)}
              y={Math.min(drawStart.y, drawCurrent.y)}
              width={Math.abs(drawCurrent.x - drawStart.x)}
              height={Math.abs(drawCurrent.y - drawStart.y)}
              fill={currentUser?.color || '#007bff'}
              stroke="#000000"
              strokeWidth={1}
              opacity={0.7}
              listening={false}
            />
          )}

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
              onDragEnd={() => {
                // Handle shape drag end
                console.log('Shape dragged:', shape.id);
              }}
            />
          ))}
          
          {/* Render multiplayer cursors */}
          {Array.from(activeUsers.values()).map((user) => {
            // Don't render current user's cursor
            if (currentUser && user.id === currentUser.id) return null;
            
            return (
              <React.Fragment key={user.id}>
                {/* Cursor circle */}
                <Circle
                  x={user.cursorPosition.x}
                  y={user.cursorPosition.y}
                  radius={8}
                  fill={user.color}
                  stroke="#ffffff"
                  strokeWidth={2}
                  listening={false}
                />
                {/* User label */}
                <Text
                  x={user.cursorPosition.x + 12}
                  y={user.cursorPosition.y - 8}
                  text={user.displayName}
                  fontSize={12}
                  fill={user.color}
                  fontStyle="bold"
                  listening={false}
                />
              </React.Fragment>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};
