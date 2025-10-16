import type { User } from './User';
import type { Shape } from './Shape';
import type { CanvasViewport, DrawingTool } from './CanvasTypes';

/**
 * Application state interfaces
 */

/**
 * User state for authentication and current user data
 */
export interface UserState {
  /** Current authenticated user */
  currentUser: User | null;
  /** Whether authentication is in progress */
  isLoading: boolean;
  /** Authentication error if any */
  error: string | null;
}

/**
 * Presence state for tracking active users
 */
export interface PresenceState {
  /** Map of active users by user ID */
  activeUsers: Map<string, User>;
  /** Whether presence data is loading */
  isLoading: boolean;
  /** Presence sync error if any */
  error: string | null;
}

/**
 * Shape state for managing canvas shapes
 */
export interface ShapeState {
  /** Map of shapes by shape ID */
  shapes: Map<string, Shape>;
  /** Currently selected shape ID */
  selectedShapeId: string | null;
  /** Whether shapes are loading */
  isLoading: boolean;
  /** Shape operation error if any */
  error: string | null;
}

/**
 * Canvas state for viewport and tool management
 */
export interface CanvasState {
  /** Current viewport state */
  viewport: CanvasViewport;
  /** Current drawing tool */
  tool: DrawingTool;
  /** Whether canvas is ready */
  isReady: boolean;
}

/**
 * Combined application state
 */
export interface AppState {
  user: UserState;
  presence: PresenceState;
  shapes: ShapeState;
  canvas: CanvasState;
}

/**
 * Service response types
 */
export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * Firebase operation result
 */
export interface FirebaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Real-time listener options
 */
export interface ListenerOptions {
  /** Whether to include metadata changes */
  includeMetadataChanges?: boolean;
  /** Source of the listener */
  source?: 'default' | 'cache' | 'server';
}
