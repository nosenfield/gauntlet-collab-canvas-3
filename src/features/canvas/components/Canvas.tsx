/**
 * Canvas Component
 * 
 * Main canvas workspace using Konva.js for 2D rendering.
 * - 10,000 x 10,000 pixel drawing area (coordinate space)
 * - Fills entire browser window (viewport)
 * - Responsive to window resize
 */

import { Stage, Layer } from 'react-konva';
import { useCanvasSize } from '../hooks/useCanvasSize';

/**
 * Canvas Component
 * Renders a Konva Stage that fills the browser window
 * 
 * The canvas provides a 10,000 x 10,000 pixel coordinate space
 * that users can pan and zoom to navigate.
 */
export function Canvas(): React.ReactElement {
  const { width, height } = useCanvasSize();

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
        // Initial viewport centered on canvas
        x={0}
        y={0}
        scale={{ x: 1, y: 1 }}
      >
        {/* Main canvas layer - will contain shapes later */}
        <Layer>
          {/* Placeholder - shapes will be rendered here */}
        </Layer>
      </Stage>
    </div>
  );
}

