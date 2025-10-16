/**
 * useCanvas Hook
 * 
 * Manages canvas viewport state, navigation (pan/zoom), and drawing tools.
 * Provides canvas interaction handlers and boundary enforcement with improved UX.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { CanvasViewport, DrawingTool, CanvasBounds, GridState, Point, Size } from '@/types';
import { GRID_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT, TOOLBAR_HEIGHT, MAX_ZOOM_PIXEL_SIZE, WINDOW_RESIZE_DEBOUNCE_MS } from '@/types';
import { useWindowSize } from './useWindowSize';

/**
 * Canvas configuration constants
 */
const CANVAS_BOUNDS: CanvasBounds = {
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  centerX: 0,
  centerY: 0
};

/**
 * Custom hook for canvas management
 */
export const useCanvas = () => {
  // Window size tracking
  const windowSize = useWindowSize(WINDOW_RESIZE_DEBOUNCE_MS);
  
  // Calculate canvas window size (accounting for toolbar)
  const canvasWindowSize = useMemo<Size>(() => ({
    width: windowSize.width,
    height: windowSize.height - TOOLBAR_HEIGHT
  }), [windowSize]);

  const [viewport, setViewport] = useState<CanvasViewport>({
    scale: 1,
    x: 0,
    y: 0
  });

  const [tool, setTool] = useState<DrawingTool>({
    activeTool: 'none',
    isDrawing: false,
    currentShape: undefined
  });

  const [grid, setGrid] = useState<GridState>({
    isVisible: true,
    spacing: GRID_CONFIG.DEFAULT_SPACING,
    color: GRID_CONFIG.DEFAULT_COLOR,
    opacity: GRID_CONFIG.DEFAULT_OPACITY
  });

  const [isReady, setIsReady] = useState(false);
  const stageRef = useRef<any>(null);

  /**
   * Constraint function to keep canvas within viewport bounds
   */
  const constrainPosition = useCallback((pos: Point, scale: number, viewport: Size): Point => {
    const canvasWidth = CANVAS_WIDTH * scale;
    const canvasHeight = CANVAS_HEIGHT * scale;
    
    // Keep canvas visible in viewport
    // pos.x is where the left edge of canvas appears
    // pos.y is where the top edge of canvas appears
    
    const minX = viewport.width - canvasWidth;   // Canvas right edge at viewport right edge
    const maxX = 0;                               // Canvas left edge at viewport left edge
    const minY = viewport.height - canvasHeight;  // Canvas bottom edge at viewport bottom edge
    const maxY = 0;                               // Canvas top edge at viewport top edge
    
    const constrainedX = Math.max(minX, Math.min(maxX, pos.x));
    const constrainedY = Math.max(minY, Math.min(maxY, pos.y));
    
    return { x: constrainedX, y: constrainedY };
  }, []);

  /**
   * Calculate zoom limits based on viewport size
   */
  const calculateZoomLimits = useCallback((viewport: Size): { min: number; max: number } => {
    const minDimension = Math.min(viewport.width, viewport.height);
    const maxDimension = Math.max(viewport.width, viewport.height);
    
    const maxScale = minDimension / MAX_ZOOM_PIXEL_SIZE;  // Don't zoom in too much
    const minScale = maxDimension / Math.max(CANVAS_WIDTH, CANVAS_HEIGHT);  // Fit canvas in viewport
    
    return { min: minScale, max: maxScale };
  }, []);

  /**
   * Calculate initial viewport position and scale
   */
  const calculateInitialViewport = useCallback((viewport: Size): { x: number; y: number; scale: number } => {
    // Calculate scale to fill the window with canvas
    const scaleX = viewport.width / CANVAS_WIDTH;
    const scaleY = viewport.height / CANVAS_HEIGHT;
    const scale = Math.max(scaleX, scaleY); // Use larger scale to fill window
    
    // Position canvas to fill the window (no window background visible)
    const canvasWidth = CANVAS_WIDTH * scale;
    const canvasHeight = CANVAS_HEIGHT * scale;
    
    // Position so canvas fills the window completely
    const x = viewport.width - canvasWidth;  // Right edge of canvas at window right edge
    const y = viewport.height - canvasHeight; // Bottom edge of canvas at window bottom edge
    
    return { x, y, scale };
  }, []);

  /**
   * Convert screen coordinates to canvas coordinates
   */
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };

    const stagePos = stage.getAbsolutePosition();
    const scale = stage.scaleX();

    return {
      x: (screenX - stagePos.x) / scale,
      y: (screenY - stagePos.y) / scale
    };
  }, []);

  /**
   * Convert canvas coordinates to screen coordinates
   */
  const canvasToScreen = useCallback((canvasX: number, canvasY: number) => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };

    const stagePos = stage.getAbsolutePosition();
    const scale = stage.scaleX();

    return {
      x: canvasX * scale + stagePos.x,
      y: canvasY * scale + stagePos.y
    };
  }, []);

  /**
   * Clamp coordinates to canvas boundaries
   */
  const clampToBounds = useCallback((x: number, y: number) => {
    const halfWidth = CANVAS_BOUNDS.width / 2;
    const halfHeight = CANVAS_BOUNDS.height / 2;

    return {
      x: Math.max(-halfWidth, Math.min(halfWidth, x)),
      y: Math.max(-halfHeight, Math.min(halfHeight, y))
    };
  }, []);

  /**
   * Update viewport with boundary constraints
   */
  const updateViewport = useCallback((newViewport: Partial<CanvasViewport>) => {
    setViewport(prev => {
      let { scale, x, y } = { ...prev, ...newViewport };

      // Apply zoom limits
      const limits = calculateZoomLimits(canvasWindowSize);
      scale = Math.max(limits.min, Math.min(limits.max, scale));

      // Constrain position to keep canvas visible
      const constrainedPos = constrainPosition({ x, y }, scale, canvasWindowSize);

      return { 
        scale, 
        x: constrainedPos.x, 
        y: constrainedPos.y 
      };
    });
  }, [canvasWindowSize, calculateZoomLimits, constrainPosition]);

  /**
   * Pan the canvas
   */
  const pan = useCallback((deltaX: number, deltaY: number) => {
    updateViewport({
      x: viewport.x + deltaX,
      y: viewport.y + deltaY
    });
  }, [viewport.x, viewport.y, updateViewport]);

  /**
   * Zoom the canvas with improved mouse-centric zoom
   */
  const zoom = useCallback((scaleDelta: number, focalPoint?: { x: number; y: number }) => {
    const newScale = viewport.scale + scaleDelta;
    
    if (focalPoint && newScale !== viewport.scale) {
      // Zoom towards focal point
      const stage = stageRef.current;
      if (!stage) return;
      
      const stagePos = stage.getAbsolutePosition();
      const oldScale = stage.scaleX();
      
      // Calculate the point under the cursor in canvas coordinates
      const pointTo = {
        x: (focalPoint.x - stagePos.x) / oldScale,
        y: (focalPoint.y - stagePos.y) / oldScale
      };
      
      // Calculate new position to keep the same point under the cursor
      const newPos = {
        x: focalPoint.x - pointTo.x * newScale,
        y: focalPoint.y - pointTo.y * newScale
      };
      
      updateViewport({
        scale: newScale,
        x: newPos.x,
        y: newPos.y
      });
    } else {
      // Zoom towards center
      updateViewport({ scale: newScale });
    }
  }, [viewport.scale, updateViewport]);

  /**
   * Reset viewport to default
   */
  const resetViewport = useCallback(() => {
    const initialViewport = calculateInitialViewport(canvasWindowSize);
    setViewport({
      scale: initialViewport.scale,
      x: initialViewport.x,
      y: initialViewport.y
    });
  }, [calculateInitialViewport, canvasWindowSize]);

  /**
   * Adjust viewport on window resize with smart scaling logic
   */
  const adjustViewportOnResize = useCallback((
    newWidth: number,
    newHeight: number,
    currentPos: Point,
    currentScale: number
  ): { x: number; y: number; scale: number } => {
    const newViewport = { width: newWidth, height: newHeight };
    
    // First, check if the current scale allows the canvas to fit properly
    const canvasWidth = CANVAS_WIDTH * currentScale;
    const canvasHeight = CANVAS_HEIGHT * currentScale;
    
    // If canvas is smaller than viewport, we might need to scale up
    // If canvas is larger than viewport, we might need to scale down
    const needsScaleAdjustment = canvasWidth < newWidth || canvasHeight < newHeight;
    
    let newScale = currentScale;
    let newPos = currentPos;
    
    if (needsScaleAdjustment) {
      // Calculate scale to fit canvas to viewport
      const scaleX = newWidth / CANVAS_WIDTH;
      const scaleY = newHeight / CANVAS_HEIGHT;
      
      // Use the larger scale to ensure canvas fills the window
      newScale = Math.max(scaleX, scaleY);
      
      // Calculate zoom limits to ensure reasonable bounds
      const limits = calculateZoomLimits(newViewport);
      newScale = Math.max(limits.min, Math.min(limits.max, newScale));
      
      // Position canvas to fill the window completely
      const scaledCanvasWidth = CANVAS_WIDTH * newScale;
      const scaledCanvasHeight = CANVAS_HEIGHT * newScale;
      
      newPos = {
        x: newWidth - scaledCanvasWidth,  // Right edge of canvas at window right edge
        y: newHeight - scaledCanvasHeight  // Bottom edge of canvas at window bottom edge
      };
    } else {
      // Just constrain the current position
      newPos = constrainPosition(currentPos, currentScale, newViewport);
    }
    
    return { x: newPos.x, y: newPos.y, scale: newScale };
  }, [calculateZoomLimits, constrainPosition]);

  /**
   * Adjust viewport to fit window (useful for manual triggers)
   */
  const fitToWindow = useCallback(() => {
    const newViewport = calculateInitialViewport(canvasWindowSize);
    setViewport({
      scale: newViewport.scale,
      x: newViewport.x,
      y: newViewport.y
    });
  }, [canvasWindowSize, calculateInitialViewport]);

  /**
   * Set active drawing tool
   */
  const setActiveTool = useCallback((activeTool: 'rectangle' | 'none') => {
    setTool(prev => ({
      ...prev,
      activeTool,
      isDrawing: false,
      currentShape: undefined
    }));
  }, []);

  /**
   * Toggle grid visibility on/off
   * 
   * @example
   * ```tsx
   * const { toggleGrid } = useCanvas();
   * 
   * // Toggle grid visibility
   * <button onClick={toggleGrid}>Toggle Grid</button>
   * ```
   */
  const toggleGrid = useCallback(() => {
    setGrid(prev => ({
      ...prev,
      isVisible: !prev.isVisible
    }));
  }, []);

  /**
   * Start drawing a shape
   */
  const startDrawing = useCallback((startX: number, startY: number) => {
    if (tool.activeTool === 'none') return;

    setTool(prev => ({
      ...prev,
      isDrawing: true,
      currentShape: {
        startX,
        startY,
        currentX: startX,
        currentY: startY
      }
    }));
  }, [tool.activeTool]);

  /**
   * Update current drawing shape
   */
  const updateDrawing = useCallback((currentX: number, currentY: number) => {
    if (!tool.isDrawing || !tool.currentShape) return;

    setTool(prev => ({
      ...prev,
      currentShape: {
        ...prev.currentShape!,
        currentX,
        currentY
      }
    }));
  }, [tool.isDrawing, tool.currentShape]);

  /**
   * Finish drawing
   */
  const finishDrawing = useCallback(() => {
    setTool(prev => ({
      ...prev,
      isDrawing: false,
      currentShape: undefined
    }));
  }, []);

  /**
   * Handle mouse wheel for panning and zooming with improved UX
   */
  const handleWheel = useCallback((event: any) => {
    event.evt.preventDefault();
    
    const { deltaX, deltaY, ctrlKey, metaKey } = event.evt;
    const isZoom = ctrlKey || metaKey; // Cmd/Ctrl + Scroll for zoom
    
    if (isZoom) {
      // Handle zoom (Cmd/Ctrl + wheel)
      const scaleBy = 1.05;
      const stage = event.target.getStage();
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      
      if (!pointer) return;
      
      // Calculate mouse position relative to canvas
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };
      
      const direction = deltaY > 0 ? -1 : 1;
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
      
      // Apply zoom limits
      const limits = calculateZoomLimits(canvasWindowSize);
      const clampedScale = Math.max(limits.min, Math.min(limits.max, newScale));
      
      // Calculate new position to zoom towards mouse cursor
      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };
      
      // Constrain position to boundaries
      const constrainedPos = constrainPosition(newPos, clampedScale, canvasWindowSize);
      
      setViewport({
        scale: clampedScale,
        x: constrainedPos.x,
        y: constrainedPos.y
      });
    } else {
      // Handle pan (wheel without modifier keys)
      // In Konva, negative delta moves content in the direction of the scroll
      const panSpeed = 1.0;
      const newPos = {
        x: viewport.x - deltaX * panSpeed,
        y: viewport.y - deltaY * panSpeed,
      };
      
      // Constrain position to boundaries
      const constrainedPos = constrainPosition(newPos, viewport.scale, canvasWindowSize);
      setViewport(prev => ({
        ...prev,
        x: constrainedPos.x,
        y: constrainedPos.y
      }));
    }
  }, [viewport, canvasWindowSize, calculateZoomLimits, constrainPosition]);

  /**
   * Handle mouse down for drawing or panning
   */
  const handleMouseDown = useCallback((event: any) => {
    const canvasPos = screenToCanvas(event.evt.clientX, event.evt.clientY);
    
    if (tool.activeTool !== 'none') {
      startDrawing(canvasPos.x, canvasPos.y);
    }
  }, [tool.activeTool, screenToCanvas, startDrawing]);

  /**
   * Handle mouse move for drawing or cursor tracking
   */
  const handleMouseMove = useCallback((event: any) => {
    const canvasPos = screenToCanvas(event.evt.clientX, event.evt.clientY);
    
    if (tool.isDrawing) {
      updateDrawing(canvasPos.x, canvasPos.y);
    }
  }, [tool.isDrawing, screenToCanvas, updateDrawing]);

  /**
   * Handle mouse up to finish drawing
   */
  const handleMouseUp = useCallback(() => {
    if (tool.isDrawing) {
      finishDrawing();
    }
  }, [tool.isDrawing, finishDrawing]);

  /**
   * Initialize canvas with proper viewport
   */
  useEffect(() => {
    const initialViewport = calculateInitialViewport(canvasWindowSize);
    setViewport({
      scale: initialViewport.scale,
      x: initialViewport.x,
      y: initialViewport.y
    });
    setIsReady(true);
  }, []); // Only run once on mount

  /**
   * Handle window resize to keep canvas filling the window
   */
  useEffect(() => {
    const handleResize = () => {
      const newSize = {
        width: window.innerWidth,
        height: window.innerHeight - TOOLBAR_HEIGHT
      };
      
      // Get current stage values directly from the stage ref to avoid stale state
      const stage = stageRef.current;
      if (stage) {
        const currentPos = { x: stage.x(), y: stage.y() };
        const currentScale = stage.scaleX();
        
        // Adjust viewport to maintain canvas visibility
        const adjusted = adjustViewportOnResize(
          newSize.width,
          newSize.height,
          currentPos,
          currentScale
        );
        
        setViewport({
          scale: adjusted.scale,
          x: adjusted.x,
          y: adjusted.y
        });
      } else {
        // Fallback to state values if stage ref is not available
        const adjusted = adjustViewportOnResize(
          newSize.width,
          newSize.height,
          { x: viewport.x, y: viewport.y },
          viewport.scale
        );
        
        setViewport({
          scale: adjusted.scale,
          x: adjusted.x,
          y: adjusted.y
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [adjustViewportOnResize, viewport]);

  return {
    // State
    viewport,
    tool,
    grid,
    isReady,
    bounds: CANVAS_BOUNDS,
    
    // Refs
    stageRef,
    
    // Actions
    pan,
    zoom,
    resetViewport,
    fitToWindow,
    setActiveTool,
    toggleGrid,
    startDrawing,
    updateDrawing,
    finishDrawing,
    
    // Coordinate conversion
    screenToCanvas,
    canvasToScreen,
    clampToBounds,
    
    // Event handlers
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  };
};
