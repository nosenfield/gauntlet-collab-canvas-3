/**
 * Display Objects Common Types
 * 
 * Base interfaces and types shared across all display object categories
 * (shapes, text, images, etc.)
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Point - 2D coordinate
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Axis-Aligned Bounding Box (AABB)
 * Used for collision detection and viewport culling
 */
export interface AxisAlignedBoundingBox {
  x: number;      // Top-left X
  y: number;      // Top-left Y
  width: number;  // Width
  height: number; // Height
}

/**
 * Oriented Bounding Box (OBB)
 * Rotated bounding box defined by 4 corners
 * Used for accurate bounds of rotated objects
 */
export interface OrientedBoundingBox {
  corners: Point[];  // 4 corner points in world space [TL, TR, BR, BL]
  center: Point;     // Center point
  rotation: number;  // Rotation in degrees
}

/**
 * Transform
 * Describes position, rotation, and scale of a display object
 */
export interface Transform {
  x: number;        // Position X (canvas coordinates)
  y: number;        // Position Y (canvas coordinates)
  rotation: number; // Rotation in degrees (0-360)
  scaleX: number;   // Horizontal scale (1.0 = 100%)
  scaleY: number;   // Vertical scale (1.0 = 100%)
}

/**
 * Display Object Category
 * Discriminator for different types of display objects
 */
export type DisplayObjectCategory = 'shape' | 'text' | 'image' | 'group';

/**
 * BaseDisplayObject
 * Common properties shared by all display objects on the canvas
 * 
 * All concrete display object types extend this interface
 * 
 * COORDINATE SYSTEM DOCUMENTATION:
 * --------------------------------
 * The data model and rendering layer use different coordinate reference points:
 * 
 * 1. DATA MODEL (x, y): Represents the TOP-LEFT CORNER of the object
 *    - Stored in Firestore as top-left coordinates
 *    - Used for position calculations and bounding boxes
 *    - This is the "source of truth" for object position
 * 
 * 2. KONVA RENDERING: Uses CENTER POINT as the rotation and scale pivot
 *    - Konva renders objects with their center as the origin
 *    - Rotation and scale transformations occur around the center point
 *    - Conversion required: centerX = x + (width * scaleX) / 2
 *                           centerY = y + (height * scaleY) / 2
 * 
 * 3. WHY TWO SYSTEMS:
 *    - Top-left is intuitive for positioning and layout
 *    - Center point is required for rotation/scale to feel natural
 *    - Konva's architecture requires center-based transforms
 * 
 * See: transformMath.ts, boundingBoxUtils.ts, RectangleShape.tsx for conversion implementations
 */
export interface BaseDisplayObject {
  // Identity
  id: string;                          // UUID
  category: DisplayObjectCategory;     // Type discriminator
  
  // Transform
  // IMPORTANT: (x, y) represents TOP-LEFT CORNER in canvas coordinates
  // Konva renders using CENTER POINT with offset for rotation pivot
  // To get center: centerX = x + (width * scaleX) / 2, centerY = y + (height * scaleY) / 2
  x: number;                           // Position X - Top-left corner (canvas coordinates)
  y: number;                           // Position Y - Top-left corner (canvas coordinates)
  
  // Rotation occurs around the object's CENTER POINT, not the (x, y) corner
  // When rendering in Konva, use offsetX/offsetY to shift the pivot to center
  rotation: number;                    // Rotation in degrees (default: 0), pivot = object center
  
  // Scale is applied from the object's CENTER POINT
  // Scale affects the final dimensions: finalWidth = width * scaleX
  scaleX: number;                      // Horizontal scale (default: 1.0, 1.0 = 100%)
  scaleY: number;                      // Vertical scale (default: 1.0, 1.0 = 100%)
  
  // Visual properties
  opacity: number;                     // 0-1 (default: 1)
  
  // Layer management
  zIndex: number;                      // Layer order (higher = in front)
  
  // Metadata
  createdBy: string;                   // User ID
  createdAt: Timestamp;                // Creation timestamp
  lastModifiedBy: string;              // User ID
  lastModifiedAt: Timestamp;           // Last modification timestamp
}

/**
 * Selection State
 * Tracks which display objects are currently selected
 */
export interface SelectionState {
  selectedIds: string[];                          // IDs of selected objects
  collectionBounds: AxisAlignedBoundingBox | null; // AABB around all selected
  collectionCenter: Point | null;                  // Center point of selection
}

/**
 * Display Object Visibility
 * Determines what's visible at the display level
 */
export interface VisibilityState {
  showBoundingBoxes: boolean;    // Show OBBs
  showCollectionBounds: boolean; // Show AABB around selection
  showCenters: boolean;          // Show center points
  showLockIndicators: boolean;   // Show lock icons
}

/**
 * Constants for display objects
 */
export const DISPLAY_OBJECT_CONSTANTS = {
  // Scale constraints
  MIN_SCALE: 0.1,    // 10% minimum
  MAX_SCALE: 10.0,   // 1000% maximum
  
  // Lock timeout
  LOCK_TIMEOUT_MS: 60000, // 60 seconds
  LOCK_HEARTBEAT_MS: 5000, // 5 seconds
  
  // Z-index range
  MIN_Z_INDEX: 0,
  MAX_Z_INDEX: 10000,
  
  // Opacity range
  MIN_OPACITY: 0,
  MAX_OPACITY: 1,
} as const;

