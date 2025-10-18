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
import { useLocking } from '@/features/displayObjects/common/hooks/useLocking';
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
  handleStageMouseUp: (e: any) => void;
  handleShapeClick: (shapeId: string, isShiftClick: boolean) => void;
  
  // Data for rendering
  selectedIds: string[];
  selectedShapes: ShapeDisplayObject[];
  isMarqueeActive: boolean;
  getMarqueeBox: () => { x: number; y: number; width: number; height: number } | null;
  collectionBounds: any;
  collectionCenter: any;
  collectionCorners: any;
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
  
  // Locking management
  const { tryLockAndSelect, getUnlockedObjects } = useLocking();
  
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
  const { collectionBounds, collectionCenter, collectionCorners, objectCorners } = useBoundingBox(selectedShapes);
  
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
  const handleShapeClick = async (shapeId: string, isShiftClick: boolean) => {
    if (isSelectMode()) {
      // Determine which objects will be selected
      let targetIds: string[];
      
      if (isShiftClick) {
        // Shift-click: toggle selection
        if (selectedIds.includes(shapeId)) {
          // Deselecting - no need to check locks
          console.log('[Canvas] Shape shift-clicked (deselecting):', shapeId);
          toggleSelectShape(shapeId);
          return;
        } else {
          // Adding to selection
          targetIds = [...selectedIds, shapeId];
        }
      } else {
        // Single click: replace selection
        targetIds = [shapeId];
      }
      
      // Check which objects are available for locking
      console.log('[Canvas] Attempting to lock and select:', targetIds);
      const { unlocked, locked, conflicts } = await getUnlockedObjects(targetIds);
      
      // Log any locked objects
      if (locked.length > 0) {
        console.warn(
          `[Canvas] ${locked.length} object(s) cannot be selected (locked by other users):`,
          conflicts
        );
        // TODO: Show user-friendly notification
      }
      
      // Try to acquire locks for unlocked objects
      if (unlocked.length > 0) {
        const success = await tryLockAndSelect(unlocked);
        
        if (success) {
          // Locks acquired, update selection to unlocked objects only
          if (isShiftClick && unlocked.length < targetIds.length) {
            // Partial selection - only add unlocked objects
            console.log(`[Canvas] Partially selected ${unlocked.length} of ${targetIds.length} object(s)`);
            setSelection(unlocked);
          } else if (isShiftClick) {
            console.log('[Canvas] Shape shift-clicked (adding):', shapeId);
            toggleSelectShape(shapeId);
          } else {
            console.log('[Canvas] Shape clicked in select mode:', shapeId);
            selectShape(shapeId);
          }
        } else {
          console.warn('[Canvas] Failed to acquire locks');
        }
      } else {
        console.warn('[Canvas] All objects are locked - cannot select');
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
    // Don't interfere if a shape is being dragged by Konva's built-in drag
    const stage = e.target.getStage();
    if (stage && stage.isDragging && stage.isDragging()) {
      return; // Konva is handling the drag internally
    }
    
    marqueeMouseMove(e);
  };
  
  // Handle stage mouse up (complete marquee or shape creation)
  const handleStageMouseUp = async (e: any) => {
    // Don't interfere if a shape was being dragged by Konva's built-in drag
    const stage = e?.target?.getStage?.();
    if (stage && stage.isDragging && stage.isDragging()) {
      return; // Konva is handling the drag end internally
    }
    
    if (isMarqueeActive) {
      // Complete marquee selection
      const selectedShapeIds = marqueeMouseUp();
      if (selectedShapeIds && selectedShapeIds.length > 0) {
        console.log('[Canvas] Marquee selection completed:', selectedShapeIds.length, 'objects');
        
        // Check which objects are unlocked (available for selection)
        const { unlocked, locked, conflicts } = await getUnlockedObjects(selectedShapeIds);
        
        // Log any locked objects that were excluded
        if (locked.length > 0) {
          console.warn(
            `[Canvas] ${locked.length} object(s) excluded from selection (locked by other users):`,
            conflicts
          );
          // TODO: Show user-friendly notification with locked object count
        }
        
        // Select only unlocked objects
        if (unlocked.length > 0) {
          console.log(`[Canvas] Selecting ${unlocked.length} unlocked object(s)`);
          
          // Try to acquire locks for unlocked objects
          // Skip pre-check since we already filtered for unlocked objects
          const success = await tryLockAndSelect(unlocked, true); // skipPreCheck = true
          
          if (success) {
            setSelection(unlocked);
            console.log(`[Canvas] Successfully selected ${unlocked.length} object(s)`);
          } else {
            console.warn('[Canvas] Failed to acquire locks for unlocked objects');
            clearSelection();
          }
        } else {
          // All objects were locked - clear selection
          console.warn('[Canvas] All objects in marquee are locked - cannot select any');
          clearSelection();
        }
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
    collectionCenter,
    collectionCorners,
    objectCorners,
  };
}

