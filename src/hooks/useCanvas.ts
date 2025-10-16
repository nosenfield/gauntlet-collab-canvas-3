/**
 * useCanvas Hook
 * 
 * Manages canvas viewport state, navigation (pan/zoom), and drawing tools.
 * Provides canvas interaction handlers and boundary enforcement.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { CanvasViewport, DrawingTool, CanvasBounds } from '@/types';

/**
 * Canvas configuration constants
 */
const CANVAS_BOUNDS: CanvasBounds = {
  width: 10000,
  height: 10000,
  centerX: 0,
  centerY: 0
};

const MIN_SCALE = 0.1;
const MAX_SCALE = 5.0;
const SCALE_FACTOR = 0.1;

/**
 * Custom hook for canvas management
 */
export const useCanvas = () => {
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

  const [isReady, setIsReady] = useState(false);
  const stageRef = useRef<any>(null);

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

      // Clamp scale
      scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));

      // Calculate viewport bounds
      const viewportWidth = window.innerWidth / scale;
      const viewportHeight = window.innerHeight / scale;
      const halfCanvasWidth = CANVAS_BOUNDS.width / 2;
      const halfCanvasHeight = CANVAS_BOUNDS.height / 2;

      // Clamp position to keep canvas visible
      const minX = -halfCanvasWidth + viewportWidth / 2;
      const maxX = halfCanvasWidth - viewportWidth / 2;
      const minY = -halfCanvasHeight + viewportHeight / 2;
      const maxY = halfCanvasHeight - viewportHeight / 2;

      x = Math.max(minX, Math.min(maxX, x));
      y = Math.max(minY, Math.min(maxY, y));

      return { scale, x, y };
    });
  }, []);

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
   * Zoom the canvas
   */
  const zoom = useCallback((scaleDelta: number, focalPoint?: { x: number; y: number }) => {
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, viewport.scale + scaleDelta));
    
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
    updateViewport({
      scale: 1,
      x: 0,
      y: 0
    });
  }, [updateViewport]);

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
   * Handle mouse wheel for panning and zooming
   */
  const handleWheel = useCallback((event: any) => {
    event.evt.preventDefault();
    
    const { deltaX, deltaY, ctrlKey, metaKey } = event.evt;
    const isZoom = ctrlKey || metaKey; // Cmd/Ctrl + Scroll for zoom
    
    if (isZoom) {
      // Zoom functionality
      const scaleDelta = deltaY > 0 ? -SCALE_FACTOR : SCALE_FACTOR;
      const focalPoint = { x: event.evt.clientX, y: event.evt.clientY };
      zoom(scaleDelta, focalPoint);
    } else {
      // Pan functionality
      const panSpeed = 1.0; // Adjust pan speed as needed
      const deltaPanX = -deltaX * panSpeed;
      const deltaPanY = -deltaY * panSpeed;
      
      // Handle both horizontal and vertical scrolling
      if (deltaX !== 0 || deltaY !== 0) {
        pan(deltaPanX, deltaPanY);
      }
    }
  }, [zoom, pan]);

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
   * Initialize canvas
   */
  useEffect(() => {
    setIsReady(true);
  }, []);

  return {
    // State
    viewport,
    tool,
    isReady,
    bounds: CANVAS_BOUNDS,
    
    // Refs
    stageRef,
    
    // Actions
    pan,
    zoom,
    resetViewport,
    setActiveTool,
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
