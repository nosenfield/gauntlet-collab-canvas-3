import type { KonvaEventObject } from 'konva/lib/Node';
import type { Vector2d } from 'konva/lib/types';
import type { GridState } from './Grid';

/**
 * Canvas viewport state
 */
export interface CanvasViewport {
  /** Current zoom level */
  scale: number;
  /** X position of viewport */
  x: number;
  /** Y position of viewport */
  y: number;
}

/**
 * Canvas boundary constraints
 */
export interface CanvasBounds {
  /** Canvas width in pixels */
  width: number;
  /** Canvas height in pixels */
  height: number;
  /** Canvas center X coordinate */
  centerX: number;
  /** Canvas center Y coordinate */
  centerY: number;
}

/**
 * Mouse event data for canvas interactions
 */
export interface CanvasMouseEvent {
  /** Screen X coordinate */
  screenX: number;
  /** Screen Y coordinate */
  screenY: number;
  /** Canvas X coordinate */
  canvasX: number;
  /** Canvas Y coordinate */
  canvasY: number;
  /** Original Konva event */
  konvaEvent: KonvaEventObject<MouseEvent>;
}

/**
 * Drawing tool state
 */
export interface DrawingTool {
  /** Currently active tool */
  activeTool: 'rectangle' | 'none';
  /** Whether user is currently drawing */
  isDrawing: boolean;
  /** Current drawing shape (if any) */
  currentShape?: {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  };
}

/**
 * Canvas interaction handlers
 */
export interface CanvasHandlers {
  onMouseDown: (event: CanvasMouseEvent) => void;
  onMouseMove: (event: CanvasMouseEvent) => void;
  onMouseUp: (event: CanvasMouseEvent) => void;
  onWheel: (event: KonvaEventObject<WheelEvent>) => void;
}

/**
 * Shape drag state
 */
export interface ShapeDragState {
  /** Shape being dragged */
  shapeId: string;
  /** Initial position when drag started */
  startPosition: Vector2d;
  /** Current drag offset */
  offset: Vector2d;
  /** Whether shape is currently being dragged */
  isDragging: boolean;
}

/**
 * Canvas hook return type
 * 
 * Defines the complete interface returned by the useCanvas hook.
 * Used by components that need access to canvas state and functionality.
 */
export interface CanvasHook {
  /** Canvas viewport state (zoom, pan position) */
  viewport: CanvasViewport;
  /** Drawing tool state and configuration */
  tool: DrawingTool;
  /** Grid overlay state and configuration */
  grid: GridState;
  /** Whether canvas is ready for interactions */
  isReady: boolean;
  /** Canvas boundary constraints */
  bounds: CanvasBounds;
  /** Reference to Konva stage instance */
  stageRef: React.RefObject<any>;
  /** Pan canvas by delta amount */
  pan: (deltaX: number, deltaY: number) => void;
  /** Zoom canvas with optional focal point */
  zoom: (scaleDelta: number, focalPoint?: { x: number; y: number }) => void;
  /** Reset viewport to default position and scale */
  resetViewport: () => void;
  /** Set the active drawing tool */
  setActiveTool: (activeTool: 'rectangle' | 'none') => void;
  /** Toggle grid visibility */
  toggleGrid: () => void;
  /** Start drawing a shape at specified coordinates */
  startDrawing: (startX: number, startY: number) => void;
  /** Update current drawing shape */
  updateDrawing: (currentX: number, currentY: number) => void;
  /** Finish current drawing operation */
  finishDrawing: () => void;
  /** Convert screen coordinates to canvas coordinates */
  screenToCanvas: (screenX: number, screenY: number) => { x: number; y: number };
  /** Convert canvas coordinates to screen coordinates */
  canvasToScreen: (canvasX: number, canvasY: number) => { x: number; y: number };
  /** Clamp coordinates to canvas boundaries */
  clampToBounds: (x: number, y: number) => { x: number; y: number };
  /** Handle mouse wheel events */
  handleWheel: (event: any) => void;
  /** Handle mouse down events */
  handleMouseDown: (event: any) => void;
  /** Handle mouse move events */
  handleMouseMove: (event: any) => void;
  /** Handle mouse up events */
  handleMouseUp: () => void;
}
