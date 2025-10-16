import { KonvaEventObject } from 'konva/lib/Node';
import { Vector2d } from 'konva/lib/types';

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
