/**
 * Firebase Data Type Definitions
 * 
 * This file contains TypeScript interfaces for all Firebase data structures.
 * - User profiles stored in Firestore
 * - UserPresence stored in Realtime Database (uses number timestamps)
 * - Shape objects stored in Firestore
 */

import { Timestamp } from 'firebase/firestore';

/**
 * User Profile (Firestore)
 * Stored in: /users/{userId}
 * 
 * Persistent user data including assigned color and display name.
 */
export interface User {
  userId: string;          // Firebase Auth UID
  displayName: string;     // Google name or "Anonymous User [UUID-prefix]"
  color: string;           // Hex color code from predefined palette
  createdAt: Timestamp;    // Account creation timestamp
  lastActive: Timestamp;   // Last activity timestamp
}

/**
 * User Presence (Realtime Database)
 * Stored in: /presence/main/{userId}
 * 
 * Real-time ephemeral data for active users.
 * NOTE: Uses number timestamps (Unix ms) instead of Firestore Timestamps
 * for better performance with Realtime Database.
 */
export interface UserPresence {
  userId: string;
  displayName: string;
  color: string;
  cursorX: number;         // Canvas coordinates (not screen coordinates)
  cursorY: number;         // Canvas coordinates (not screen coordinates)
  connectedAt: number;     // Unix timestamp (milliseconds)
  lastUpdate: number;      // Unix timestamp (milliseconds)
}

/**
 * Shape Object (Firestore)
 * Stored in: /documents/{documentId}/shapes/{shapeId}
 * 
 * All display objects on the canvas (rectangles, circles, lines).
 */
export interface Shape {
  id: string;              // UUID
  type: 'rectangle' | 'circle' | 'line';
  
  // Position (canvas coordinates)
  x: number;
  y: number;
  
  // Dimensions (optional based on type)
  width?: number;          // Rectangle/Circle
  height?: number;         // Rectangle
  radius?: number;         // Circle
  points?: number[];       // Line: [x1, y1, x2, y2]
  
  // Visual properties
  fillColor: string;       // Hex color
  strokeColor: string;     // Hex color
  strokeWidth: number;     // 1-10px
  opacity: number;         // 0-1
  borderRadius?: number;   // Rectangle only, 0-50px
  
  // Transform
  rotation: number;        // Degrees
  zIndex: number;          // Layer order
  
  // Metadata
  createdBy: string;       // User ID
  createdAt: Timestamp;
  lastModifiedBy: string;
  lastModifiedAt: Timestamp;
  
  // Locking (for collaborative editing)
  lockedBy: string | null; // User ID or null
  lockedAt: Timestamp | null;
}

/**
 * Document Metadata (Firestore)
 * Stored in: /documents/{documentId}
 * 
 * Metadata for canvas documents (single "main" document for MVP).
 */
export interface DocumentMetadata {
  name: string;
  createdAt: Timestamp;
  lastModified: Timestamp;
}

/**
 * Predefined Color Palette
 * Colors assigned to users sequentially (cycle if >10 users)
 */
export const USER_COLOR_PALETTE = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Orange
  '#98D8C8', // Mint
  '#FFE66D', // Yellow
  '#A8E6CF', // Green
  '#C7CEEA', // Lavender
  '#FF8B94', // Pink
  '#B4A7D6', // Purple
] as const;

/**
 * Canvas Configuration Constants
 */
export const CANVAS_CONFIG = {
  width: 10000,      // Canvas width in pixels
  height: 10000,     // Canvas height in pixels
  gridSpacing: 100,  // Primary grid spacing in pixels
  gridAccent: 5,     // Secondary grid every Nth line
} as const;

