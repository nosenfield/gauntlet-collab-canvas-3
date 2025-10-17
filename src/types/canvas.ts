/**
 * Canvas Type Definitions
 * 
 * Domain types for canvas coordinate systems, transformations, and configuration.
 * 
 * Note: Store-specific state types (like ViewportState) are co-located with their
 * store implementations. This file contains shared domain types and constants.
 */

/**
 * Canvas Configuration
 * Fixed constants for the canvas workspace
 */
export interface CanvasConfig {
  width: 10000;        // Canvas width constant (10,000px)
  height: 10000;       // Canvas height constant (10,000px)
  gridSpacing: 100;    // Primary grid spacing (100px)
  gridAccent: 5;       // Secondary grid every Nth line (500px)
}

/**
 * Canvas Bounds
 * Represents a rectangular area in canvas coordinates
 */
export interface CanvasBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Point in 2D Space
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Transform Matrix
 * Represents the transformation between screen and canvas coordinates
 */
export interface TransformMatrix {
  translateX: number;  // Horizontal translation
  translateY: number;  // Vertical translation
  scaleX: number;      // Horizontal scale
  scaleY: number;      // Vertical scale (same as scaleX for uniform scaling)
}

/**
 * Zoom Constraints
 * Limits for zoom levels
 */
export interface ZoomConstraints {
  minScale: number;    // Maximum zoom out (entire canvas visible)
  maxScale: number;    // Maximum zoom in (100px across viewport)
}

/**
 * Grid Configuration
 */
export interface GridConfig {
  primarySpacing: number;      // Primary grid line spacing (100px)
  primaryOpacity: number;      // Primary grid line opacity (0.25)
  secondarySpacing: number;    // Secondary grid line spacing (500px)
  secondaryOpacity: number;    // Secondary grid line opacity (0.5)
  backgroundColor: string;     // Canvas background color (#2A2A2A)
  lineColor: string;           // Grid line color (white)
}

/**
 * Canvas Constants
 */
export const CANVAS_CONSTANTS: CanvasConfig = {
  width: 10000,
  height: 10000,
  gridSpacing: 100,
  gridAccent: 5,
};

/**
 * Grid Style Constants
 */
export const GRID_CONSTANTS: GridConfig = {
  primarySpacing: 100,
  primaryOpacity: 0.25,
  secondarySpacing: 500,
  secondaryOpacity: 0.5,
  backgroundColor: '#2A2A2A',
  lineColor: '#FFFFFF',
};
