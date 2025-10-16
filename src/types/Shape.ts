import { Timestamp } from 'firebase/firestore';

/**
 * Shape types supported in the MVP
 */
export type ShapeType = 'rectangle';

/**
 * Shape data model for Firestore shapes collection
 * Represents a shape drawn on the collaborative canvas
 */
export interface Shape {
  /** Unique shape identifier */
  id: string;
  /** Type of shape (only rectangle in MVP) */
  type: ShapeType;
  /** X position on canvas */
  x: number;
  /** Y position on canvas */
  y: number;
  /** Width of the shape */
  width: number;
  /** Height of the shape */
  height: number;
  /** Fill color (hex string) */
  fill: string;
  /** User ID who created this shape */
  createdBy: string;
  /** Creation timestamp */
  createdAt: Timestamp;
  /** User ID who currently has this shape locked (optional) */
  lockedBy?: string;
  /** Timestamp when shape was locked (optional) */
  lockedAt?: Timestamp;
}

/**
 * Shape creation data (without auto-generated fields)
 */
export interface CreateShapeData {
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  createdBy: string;
}

/**
 * Shape update data (partial updates)
 */
export interface UpdateShapeData {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  lockedBy?: string;
  lockedAt?: Timestamp;
}

/**
 * Rectangle-specific shape data
 */
export interface RectangleShape extends Shape {
  type: 'rectangle';
}

/**
 * In-progress shape data for real-time drawing
 */
export interface InProgressShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  createdBy: string;
  isComplete: false;
}
