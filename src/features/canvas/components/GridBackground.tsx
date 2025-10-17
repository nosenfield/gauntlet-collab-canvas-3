/**
 * GridBackground Component
 * 
 * Renders a grid background with primary and secondary (accent) lines.
 * - Primary lines: 100px spacing, white 25% opacity
 * - Secondary lines: 500px spacing (every 5th line), white 50% opacity
 * - Background color: #2A2A2A (dark gray)
 * 
 * Grid scales with zoom and uses viewport culling for performance.
 */

import { Layer, Line, Rect } from 'react-konva';
import { calculateVisibleGridLines, isAccentLine, getVisibleCanvasBounds } from '../utils/gridUtils';

interface GridBackgroundProps {
  width: number;          // Viewport width
  height: number;         // Viewport height
  stageX: number;         // Stage X position (for viewport culling)
  stageY: number;         // Stage Y position (for viewport culling)
  scale: number;          // Current zoom scale
}

/**
 * GridBackground Component
 * Renders grid lines with viewport culling for performance
 */
export function GridBackground({
  width,
  height,
  stageX,
  stageY,
  scale,
}: GridBackgroundProps): React.ReactElement {
  // Grid configuration from PRD
  const PRIMARY_SPACING = 100;
  const ACCENT_EVERY = 5; // Every 5th line is an accent line
  const PRIMARY_OPACITY = 0.25;
  const ACCENT_OPACITY = 0.5;
  const LINE_COLOR = '#FFFFFF';
  const CANVAS_SIZE = 10000;

  // Calculate visible canvas bounds for viewport culling
  const visibleBounds = getVisibleCanvasBounds(
    stageX,
    stageY,
    width,
    height,
    scale
  );

  // Calculate which grid lines are visible
  const gridLines = calculateVisibleGridLines(visibleBounds, PRIMARY_SPACING);

  return (
    <Layer listening={false}>
      <Rect
        x={0}
        y={0}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        fill="#2A2A2A"
      />
      {gridLines.vertical.map((x) => {
        const isAccent = isAccentLine(x, PRIMARY_SPACING, ACCENT_EVERY);
        return (
          <Line
            key={`v-${x}`}
            points={[x, 0, x, CANVAS_SIZE]}
            stroke={LINE_COLOR}
            strokeWidth={1}
            opacity={isAccent ? ACCENT_OPACITY : PRIMARY_OPACITY}
          />
        );
      })}
      {gridLines.horizontal.map((y) => {
        const isAccent = isAccentLine(y, PRIMARY_SPACING, ACCENT_EVERY);
        return (
          <Line
            key={`h-${y}`}
            points={[0, y, CANVAS_SIZE, y]}
            stroke={LINE_COLOR}
            strokeWidth={1}
            opacity={isAccent ? ACCENT_OPACITY : PRIMARY_OPACITY}
          />
        );
      })}
    </Layer>
  );
}

