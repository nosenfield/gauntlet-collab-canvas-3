import { Timestamp } from 'firebase/firestore';

/**
 * User data model for Firestore users collection
 * Represents an anonymous user in the collaborative canvas
 */
export interface User {
  /** Unique user identifier (Firebase Auth UID) */
  id: string;
  /** Hex color assigned to user for cursors and shapes */
  color: string;
  /** Display name (typically the user ID) */
  displayName: string;
  /** Last activity timestamp for presence tracking */
  lastActive: Timestamp;
  /** Current cursor position on canvas */
  cursorPosition: {
    x: number;
    y: number;
  };
}

/**
 * User creation data (without auto-generated fields)
 */
export interface CreateUserData {
  color: string;
  displayName: string;
  cursorPosition: {
    x: number;
    y: number;
  };
}

/**
 * User update data (partial updates)
 */
export interface UpdateUserData {
  color?: string;
  displayName?: string;
  lastActive?: Timestamp;
  cursorPosition?: {
    x: number;
    y: number;
  };
}
