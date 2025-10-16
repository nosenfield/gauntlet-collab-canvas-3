/**
 * TypeScript type definitions for CollabCanvas MVP
 * 
 * This file exports all type definitions used throughout the application.
 * Organized by domain: User, Shape, Canvas, and Application state.
 */

// User-related types
export type { User, CreateUserData, UpdateUserData } from './User';

// Shape-related types
export type { 
  Shape, 
  ShapeType, 
  CreateShapeData, 
  UpdateShapeData, 
  RectangleShape, 
  InProgressShape 
} from './Shape';

// Canvas-related types
export type { CanvasSession, UpdateCanvasSessionData } from './canvas';

// Canvas interaction types
export type {
  CanvasViewport,
  CanvasBounds,
  CanvasMouseEvent,
  DrawingTool,
  CanvasHandlers,
  ShapeDragState,
  CanvasHook,
  Point,
  Size
} from './CanvasTypes';

// Canvas constants
export { CANVAS_WIDTH, CANVAS_HEIGHT, TOOLBAR_HEIGHT, MAX_ZOOM_PIXEL_SIZE, WINDOW_RESIZE_DEBOUNCE_MS } from './CanvasTypes';

// Application state types
export type {
  UserState,
  PresenceState,
  ShapeState,
  CanvasState,
  AppState,
  ServiceResponse,
  FirebaseResult,
  ListenerOptions
} from './AppTypes';

// Grid-related types
export type { GridState } from './Grid';
export { GRID_CONFIG } from './Grid';
