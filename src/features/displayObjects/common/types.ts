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
 */
export interface BaseDisplayObject {
  // Identity
  id: string;                          // UUID
  category: DisplayObjectCategory;     // Type discriminator
  
  // Transform
  x: number;                           // Position X (canvas coordinates)
  y: number;                           // Position Y (canvas coordinates)
  rotation: number;                    // Rotation in degrees (default: 0)
  scaleX: number;                      // Horizontal scale (default: 1.0)
  scaleY: number;                      // Vertical scale (default: 1.0)
  
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
  
  // Selection limits
  MAX_SELECTION: 100, // Maximum objects in selection
  
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

