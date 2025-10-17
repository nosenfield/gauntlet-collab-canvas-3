/**
 * Shape Display Objects Types
 * 
 * Type definitions for shape-based display objects (rectangles, circles, lines)
 */

import type { Timestamp } from 'firebase/firestore';
import type { BaseDisplayObject } from '../common/types';

/**
 * Shape Type
 * Supported shape primitives
 */
export type ShapeType = 'rectangle' | 'circle' | 'line';

/**
 * Shape Visual Properties
 * Common visual attributes for all shapes
 */
export interface ShapeVisualProperties {
  fillColor: string;    // Hex color (e.g., '#FF6B6B')
  strokeColor: string;  // Hex color (e.g., '#000000')
  strokeWidth: number;  // 1-10px
}

/**
 * Rectangle Shape
 */
export interface RectangleShape extends BaseDisplayObject, ShapeVisualProperties {
  category: 'shape';
  type: 'rectangle';
  width: number;           // Width in pixels
  height: number;          // Height in pixels
  borderRadius?: number;   // Corner radius (0-50px, optional)
}

/**
 * Circle Shape
 */
export interface CircleShape extends BaseDisplayObject, ShapeVisualProperties {
  category: 'shape';
  type: 'circle';
  radius: number;          // Radius in pixels
}

/**
 * Line Shape
 */
export interface LineShape extends BaseDisplayObject, ShapeVisualProperties {
  category: 'shape';
  type: 'line';
  points: number[];        // [x1, y1, x2, y2] relative to (x, y)
}

/**
 * Shape Display Object (Union Type)
 * Discriminated union of all shape types
 */
export type ShapeDisplayObject = RectangleShape | CircleShape | LineShape;

/**
 * Shape Creation Data
 * Data required to create a new shape (before ID assignment)
 */
export interface CreateShapeData {
  type: ShapeType;
  x: number;
  y: number;
  width?: number;      // Rectangle
  height?: number;     // Rectangle
  radius?: number;     // Circle
  points?: number[];   // Line
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number; // Rectangle only
  opacity?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  zIndex?: number;
}

/**
 * Shape Update Data
 * Partial update data for existing shapes
 */
export interface UpdateShapeData {
  // Transform
  x?: number;
  y?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  
  // Dimensions
  width?: number;      // Rectangle
  height?: number;     // Rectangle
  radius?: number;     // Circle
  points?: number[];   // Line
  
  // Visual properties
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number; // Rectangle only
  opacity?: number;
  
  // Layer
  zIndex?: number;
  
  // Lock state
  lockedBy?: string | null;
  lockedAt?: Timestamp | null;
}

/**
 * Default shape properties
 */
export const DEFAULT_SHAPE_PROPERTIES = {
  // Rectangle defaults
  rectangle: {
    width: 100,
    height: 100,
    fillColor: '#4ECDC4',
    strokeColor: '#2C3E50',
    strokeWidth: 2,
    borderRadius: 0,
    opacity: 1,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  },
  
  // Circle defaults
  circle: {
    radius: 50,
    fillColor: '#FF6B6B',
    strokeColor: '#2C3E50',
    strokeWidth: 2,
    opacity: 1,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  },
  
  // Line defaults
  line: {
    points: [0, 0, 100, 100],
    fillColor: 'transparent',
    strokeColor: '#2C3E50',
    strokeWidth: 2,
    opacity: 1,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  },
} as const;

/**
 * Shape Constants
 */
export const SHAPE_CONSTANTS = {
  // Dimension constraints
  MIN_DIMENSION: 10,      // Minimum width/height/radius
  MAX_DIMENSION: 5000,    // Maximum width/height/radius
  
  // Stroke constraints
  MIN_STROKE_WIDTH: 0,
  MAX_STROKE_WIDTH: 10,
  
  // Border radius constraints (rectangles)
  MIN_BORDER_RADIUS: 0,
  MAX_BORDER_RADIUS: 50,
  
  // Line constraints
  MIN_LINE_LENGTH: 10,
  MAX_LINE_LENGTH: 5000,
} as const;

