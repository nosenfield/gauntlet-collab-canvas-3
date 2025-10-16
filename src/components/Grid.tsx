/**
 * Grid Component
 * 
 * Renders the canvas grid overlay using Konva Line components.
 * Handles grid line generation and rendering optimization.
 */

import React, { useMemo } from 'react';
import { Line } from 'react-konva';
import type { GridState } from '@/types';
import { GRID_CONFIG } from '@/types';

/**
 * Grid component props
 */
interface GridProps {
  /** Grid state containing visibility and styling information */
  grid: GridState;
}

/**
 * Grid line object for Konva rendering
 */
interface GridLine {
  key: string;
  points: number[];
  stroke: string;
  strokeWidth: number;
  opacity: number;
}

/**
 * Grid component for canvas overlay
 * 
 * Renders a grid of lines at specified intervals for visual alignment assistance.
 * Optimized with useMemo to only recalculate when grid properties change.
 * 
 * @example
 * ```tsx
 * <Grid grid={gridState} />
 * ```
 */
export const Grid: React.FC<GridProps> = ({ grid }) => {
  /**
   * Generate grid lines based on grid settings
   * 
   * @returns Array of grid line objects for Konva rendering
   */
  const gridLines = useMemo((): GridLine[] => {
    if (!grid.isVisible) return [];

    const lines: GridLine[] = [];
    const spacing = grid.spacing;
    const { MIN_X, MAX_X, MIN_Y, MAX_Y } = GRID_CONFIG.RENDER_BOUNDS;

    // Generate vertical lines
    for (let x = MIN_X; x <= MAX_X; x += spacing) {
      lines.push({
        key: `v-${x}`,
        points: [x, MIN_Y, x, MAX_Y],
        stroke: grid.color,
        strokeWidth: GRID_CONFIG.STROKE_WIDTH,
        opacity: grid.opacity
      });
    }

    // Generate horizontal lines
    for (let y = MIN_Y; y <= MAX_Y; y += spacing) {
      lines.push({
        key: `h-${y}`,
        points: [MIN_X, y, MAX_X, y],
        stroke: grid.color,
        strokeWidth: GRID_CONFIG.STROKE_WIDTH,
        opacity: grid.opacity
      });
    }

    return lines;
  }, [grid.isVisible, grid.spacing, grid.color, grid.opacity]);

  return (
    <>
      {gridLines.map((line) => (
        <Line
          key={line.key}
          points={line.points}
          stroke={line.stroke}
          strokeWidth={line.strokeWidth}
          opacity={line.opacity}
          listening={false}
        />
      ))}
    </>
  );
};
