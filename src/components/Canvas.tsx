/**
 * Canvas Component
 * 
 * Main canvas component that renders the Konva stage and handles
 * user interactions for drawing and navigation.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { useAuth } from '@/hooks/useAuth';
import { usePresence } from '@/hooks/usePresence';
import { useShapes } from '@/hooks/useShapes';
import { useDrawing } from '@/hooks/useDrawing';
import { useCanvasEvents } from '@/hooks/useCanvasEvents';
import { Grid } from '@/components/Grid';
import { Cursor } from '@/components/Cursor';
import { DrawingPreview } from '@/components/DrawingPreview';
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
    handleWheel
  } = canvasHook;

  const { currentUser } = useAuth();
  const { 
    activeUsers, 
    isLoading: presenceLoading, 
    joinSession,
    leaveSession,
    setupCleanup
  } = usePresence();
  const { shapes } = useShapes();
  const drawingHook = useDrawing();
  const { isDrawing, drawStart, drawCurrent } = drawingHook;
  const eventHandlers = useCanvasEvents(canvasHook, drawingHook);

  const [stageSize, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight - TOOLBAR_HEIGHT
  });

  /**
   * Memoized active users array for performance
   */
  const activeUsersArray = useMemo(() => activeUsers, [activeUsers]);

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
    if (currentUser && currentUser.id && !presenceLoading) {
      joinSession(currentUser.id);
      // Set up cleanup on page unload
      setupCleanup(currentUser.id);
    }

    // Cleanup on unmount
    return () => {
      if (currentUser && currentUser.id) {
        leaveSession(currentUser.id);
      }
    };
  }, [currentUser, presenceLoading, joinSession, leaveSession, setupCleanup]);

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
        onMouseDown={eventHandlers.handleCanvasMouseDown}
        onMouseMove={(e) => {
          eventHandlers.handleCanvasMouseMove(e);
          eventHandlers.handleCursorMove(e);
        }}
        onMouseUp={eventHandlers.handleCanvasMouseUp}
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
          
          {/* Drawing preview */}
          <DrawingPreview
            isDrawing={isDrawing}
            drawStart={drawStart}
            drawCurrent={drawCurrent}
            tool={tool}
            userColor={currentUser?.color || '#007bff'}
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
              onDragEnd={() => {
                // Handle shape drag end
              }}
            />
          ))}
          
          {/* Render multiplayer cursors */}
          {activeUsersArray.map((user) => (
            <Cursor
              key={user.id}
              user={user}
              isCurrentUser={!!(currentUser && user.id === currentUser.id)}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};
