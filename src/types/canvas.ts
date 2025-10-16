import { Timestamp } from 'firebase/firestore';

/**
 * Canvas session data model for Firestore canvasSession collection
 * Tracks active users and session state
 */
export interface CanvasSession {
  /** Session identifier (typically 'default') */
  id: string;
  /** Array of active user IDs */
  activeUsers: string[];
  /** Last modification timestamp */
  lastModified: Timestamp;
}

/**
 * Canvas session update data
 */
export interface UpdateCanvasSessionData {
  activeUsers?: string[];
  lastModified?: Timestamp;
}