/**
 * Canvas grid configuration and state types
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './CanvasTypes';

/**
 * Grid state interface for canvas grid overlay
 */
export interface GridState {
  /** Whether the grid is currently visible */
  isVisible: boolean;
  /** Spacing between grid lines in pixels */
  spacing: number;
  /** Color of grid lines (hex format) */
  color: string;
  /** Opacity of grid lines (0-1) */
  opacity: number;
}

/**
 * Grid configuration constants
 */
export const GRID_CONFIG = {
  /** Default grid spacing in pixels */
  DEFAULT_SPACING: 100,
  /** Default grid color */
  DEFAULT_COLOR: '#e2e8f0',
  /** Default grid opacity */
  DEFAULT_OPACITY: 0.8,
  /** Grid stroke width in pixels */
  STROKE_WIDTH: 2,
  /** Grid rendering bounds (extends beyond canvas for pan/zoom) */
  RENDER_BOUNDS: {
    MIN_X: 0,
    MAX_X: CANVAS_WIDTH,
    MIN_Y: 0,
    MAX_Y: CANVAS_HEIGHT
  }
} as const;
