/**
 * useCanvasInteractions Hook
 * 
 * Consolidates all canvas event handling logic:
 * - Pan (scroll/wheel without modifiers)
 * - Zoom (Cmd/Ctrl + scroll)
 * - Viewport constraints
 * - Shape creation
 * - Shape selection (click, shift-click)
 * - Marquee selection (drag-to-select)
 * 
 * This hook acts as the interaction orchestrator for Canvas.tsx,
 * delegating to specialized hooks and providing unified event handlers.
 */

import { usePan } from './usePan';
import { useZoom } from './useZoom';
import { useViewportConstraints } from './useViewportConstraints';
import { useShapeCreation } from '@/features/displayObjects/shapes/hooks/useShapeCreation';
import { useSelection } from '@/features/displayObjects/common/store/selectionStore';
import { useTool } from '@/features/displayObjects/common/store/toolStore';
import { useMarqueeSelection } from '@/features/displayObjects/common/hooks/useMarqueeSelection';
import { useShapes } from '@/features/displayObjects/shapes/store/shapesStore';
import { useBoundingBox } from '@/features/displayObjects/common/hooks/useBoundingBox';
import type { ShapeDisplayObject } from '@/features/displayObjects/shapes/types';

interface UseCanvasInteractionsParams {
  stageRef: React.RefObject<any>;
  width: number;
  height: number;
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
  setPosition: (x: number, y: number) => void;
  setViewport: (x: number, y: number, scale: number) => void;
}

interface UseCanvasInteractionsReturn {
  // Event handlers for Stage component
  handleWheel: (e: any) => void;
  handleStageClick: (e: any) => void;
  handleStageMouseDown: (e: any) => void;
  handleStageMouseMove: (e: any) => void;
  handleStageMouseUp: () => void;
  handleShapeClick: (shapeId: string, isShiftClick: boolean) => void;
  
  // Data for rendering
  selectedIds: string[];
  selectedShapes: ShapeDisplayObject[];
  isMarqueeActive: boolean;
  getMarqueeBox: () => { x: number; y: number; width: number; height: number } | null;
  collectionBounds: any;
  objectCorners: Map<string, any[]>;
}

/**
 * useCanvasInteractions
 * 
 * Orchestrates all canvas interaction logic.
 * Returns event handlers ready to attach to Stage component.
 */
export function useCanvasInteractions({
  stageRef,
  width,
  height,
  viewport,
  setPosition,
  setViewport,
}: UseCanvasInteractionsParams): UseCanvasInteractionsReturn {
  // Tool state
  const { isSelectMode } = useTool();
  
  // Selection state
  const { selectedIds, selectShape, toggleSelectShape, setSelection, clearSelection } = useSelection();
  
  // Shapes for selection
  const { shapes } = useShapes();
  
  // Shape creation handler
  const handleShapeCreation = useShapeCreation();
  
  // Marquee selection
  const {
    isMarqueeActive,
    getMarqueeBox,
    handleMouseDown: marqueeMouseDown,
    handleMouseMove: marqueeMouseMove,
    handleMouseUp: marqueeMouseUp,
  } = useMarqueeSelection(shapes, stageRef, isSelectMode());
  
  // Get selected shapes for bounding box calculation
  const selectedShapes = shapes.filter(shape => selectedIds.includes(shape.id));
  
  // Calculate bounding boxes for selected shapes
  const { collectionBounds, objectCorners } = useBoundingBox(selectedShapes);
  
  // Pan gesture handling via scroll/wheel
  const panHandlers = usePan({
    viewportWidth: width,
    viewportHeight: height,
    scale: viewport.scale,
    currentX: viewport.x,
    currentY: viewport.y,
    onPan: setPosition,
  });
  
  // Zoom gesture handling via Cmd/Ctrl + scroll
  const zoomHandlers = useZoom({
    viewportWidth: width,
    viewportHeight: height,
    currentX: viewport.x,
    currentY: viewport.y,
    currentScale: viewport.scale,
    onZoom: setViewport,
  });
  
  // Maintain viewport constraints on window resize
  useViewportConstraints({
    viewportWidth: width,
    viewportHeight: height,
    currentX: viewport.x,
    currentY: viewport.y,
    currentScale: viewport.scale,
    onUpdate: setViewport,
  });
  
  // Combined wheel handler - delegates to pan or zoom based on modifier keys
  const handleWheel = (e: any): void => {
    if (e.evt.ctrlKey || e.evt.metaKey) {
      zoomHandlers.handleWheel(e);
    } else {
      panHandlers.handleWheel(e);
    }
  };
  
  // Handle shape click (select when in select mode)
  const handleShapeClick = (shapeId: string, isShiftClick: boolean) => {
    if (isSelectMode()) {
      if (isShiftClick) {
        console.log('[Canvas] Shape shift-clicked in select mode:', shapeId);
        toggleSelectShape(shapeId);
      } else {
        console.log('[Canvas] Shape clicked in select mode:', shapeId);
        selectShape(shapeId);
      }
    }
  };
  
  // Handle stage mouse down (start marquee or create shape)
  const handleStageMouseDown = (e: any) => {
    const clickedOnEmpty = e.target === e.currentTarget;
    
    if (clickedOnEmpty && isSelectMode()) {
      // Start marquee selection
      marqueeMouseDown(e);
    }
  };
  
  // Handle stage mouse move (update marquee)
  const handleStageMouseMove = (e: any) => {
    marqueeMouseMove(e);
  };
  
  // Handle stage mouse up (complete marquee or shape creation)
  const handleStageMouseUp = () => {
    if (isMarqueeActive) {
      // Complete marquee selection
      const selectedShapeIds = marqueeMouseUp();
      if (selectedShapeIds && selectedShapeIds.length > 0) {
        setSelection(selectedShapeIds);
      } else {
        // Clicked on empty space without dragging - clear selection
        clearSelection();
      }
    }
  };
  
  // Handle stage click (for shape creation)
  const handleStageClick = (e: any) => {
    const clickedOnEmpty = e.target === e.currentTarget;
    
    if (!clickedOnEmpty || !isSelectMode()) {
      // Handle shape creation when not in select mode or clicked on a shape
      handleShapeCreation(e);
    }
  };
  
  return {
    // Event handlers
    handleWheel,
    handleStageClick,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
    handleShapeClick,
    
    // Data for rendering
    selectedIds,
    selectedShapes,
    isMarqueeActive,
    getMarqueeBox,
    collectionBounds,
    objectCorners,
  };
}

