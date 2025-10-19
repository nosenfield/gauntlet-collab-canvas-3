/**
 * useShapeCreation Hook
 * 
 * Handles shape creation on canvas clicks
 * Integrates with tool state and shape service
 */

import { useCallback } from 'react';
import { useTool } from '../../common/store/toolStore';
import { useAuth } from '@/features/auth/store/authStore';
import { createShape } from '../services/shapeService';
import type { CreateShapeData } from '../types';

/**
 * Get canvas coordinates from Konva event
 */
interface CanvasClickEvent {
  evt: MouseEvent;
  target: any;
  currentTarget: any;
}

/**
 * Rectangle creation options
 */
interface CreateRectangleOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Circle creation options
 */
interface CreateCircleOptions {
  x: number;      // Center X
  y: number;      // Center Y
  radius: number; // Radius
  width: number;  // Diameter (for compatibility)
  height: number; // Diameter (for compatibility)
}

/**
 * Line creation options
 */
interface CreateLineOptions {
  x: number;        // Start point X
  y: number;        // Start point Y
  points: number[]; // [0, 0, x2, y2]
}

/**
 * useShapeCreation Hook
 * 
 * Provides shape creation functionality
 * 
 * @returns Shape creation handlers
 * 
 * @example
 * ```tsx
 * function Canvas() {
 *   const { handleCanvasClick, createRectangle } = useShapeCreation();
 *   
 *   // For click-to-create:
 *   const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
 *     handleCanvasClick(e);
 *   };
 *   
 *   // For drag-to-create:
 *   const handleDragComplete = async (dims: RectangleDimensions) => {
 *     await createRectangle(dims);
 *   };
 *   
 *   return <Stage onClick={handleStageClick}>...</Stage>;
 * }
 * ```
 */
export function useShapeCreation() {
  const { currentTool } = useTool();
  const { user } = useAuth();

  /**
   * Create a rectangle with specific dimensions
   * Used for drag-to-create interaction
   */
  const createRectangle = useCallback(
    async (options: CreateRectangleOptions): Promise<string | null> => {
      if (!user) {
        console.warn('[ShapeCreation] User not authenticated');
        return null;
      }

      const { x, y, width, height } = options;

      console.log('[ShapeCreation] Creating rectangle:', { x, y, width, height });

      try {
        const shapeData: CreateShapeData = {
          type: 'rectangle',
          x,
          y,
          width,
          height,
          // Visual properties will use DEFAULT_SHAPE_PROPERTIES.rectangle
        };

        const shapeId = await createShape(user.userId, shapeData);
        console.log('[ShapeCreation] Rectangle created successfully:', shapeId);
        return shapeId;
      } catch (error) {
        console.error('[ShapeCreation] Error creating rectangle:', error);
        return null;
      }
    },
    [user]
  );

  /**
   * Create a circle with specific dimensions
   * Used for drag-to-create interaction
   */
  const createCircle = useCallback(
    async (options: CreateCircleOptions): Promise<string | null> => {
      if (!user) {
        console.warn('[ShapeCreation] User not authenticated');
        return null;
      }

      const { x, y, radius, width, height } = options;

      console.log('[ShapeCreation] Creating circle:', { x, y, radius, width, height });

      try {
        const shapeData: CreateShapeData = {
          type: 'circle',
          x,
          y,
          radius,
          width,
          height,
          // Visual properties will use DEFAULT_SHAPE_PROPERTIES.circle
        };

        const shapeId = await createShape(user.userId, shapeData);
        console.log('[ShapeCreation] Circle created successfully:', shapeId);
        return shapeId;
      } catch (error) {
        console.error('[ShapeCreation] Error creating circle:', error);
        return null;
      }
    },
    [user]
  );

  /**
   * Create a line with specific points
   * Used for drag-to-create interaction
   */
  const createLine = useCallback(
    async (options: CreateLineOptions): Promise<string | null> => {
      if (!user) {
        console.warn('[ShapeCreation] User not authenticated');
        return null;
      }

      const { x, y, points } = options;

      console.log('[ShapeCreation] Creating line:', { x, y, points });

      try {
        const shapeData: CreateShapeData = {
          type: 'line',
          x,
          y,
          points,
          // Visual properties will use DEFAULT_SHAPE_PROPERTIES.line
        };

        const shapeId = await createShape(user.userId, shapeData);
        console.log('[ShapeCreation] Line created successfully:', shapeId);
        return shapeId;
      } catch (error) {
        console.error('[ShapeCreation] Error creating line:', error);
        return null;
      }
    },
    [user]
  );

  /**
   * Handle canvas click for shape creation (legacy - for non-rectangle shapes)
   */
  const handleCanvasClick = useCallback(
    async (event: CanvasClickEvent) => {
      // Only create shapes if:
      // 1. User is authenticated
      // 2. Tool is not 'select'
      // 3. Click is on empty canvas (not on existing shape)
      
      if (!user) {
        console.warn('[ShapeCreation] User not authenticated');
        return;
      }

      if (currentTool === 'select' || currentTool === 'text' || currentTool === 'rectangle' || currentTool === 'circle' || currentTool === 'line') {
        // Selection mode, text tool, or drag-to-create tools (rectangle, circle, line) - don't create shapes on click
        return;
      }

      // Check if clicked on empty canvas (stage) or existing shape
      const clickedOnEmpty = event.target === event.currentTarget;
      
      if (!clickedOnEmpty) {
        console.log('[ShapeCreation] Clicked on existing shape, not creating');
        return;
      }

      // Get click position in canvas coordinates
      const stage = event.currentTarget;
      const pointerPosition = stage.getPointerPosition();
      
      if (!pointerPosition) {
        console.warn('[ShapeCreation] Could not get pointer position');
        return;
      }

      // Convert screen coordinates to canvas coordinates
      const scale = stage.scaleX();
      const stageX = stage.x();
      const stageY = stage.y();
      
      const canvasX = (pointerPosition.x - stageX) / scale;
      const canvasY = (pointerPosition.y - stageY) / scale;

      console.log('[ShapeCreation] Creating shape at:', { canvasX, canvasY, tool: currentTool });

      try {
        // Create shape based on current tool
        const shapeData: CreateShapeData = {
          type: currentTool,
          x: canvasX,
          y: canvasY,
        };

        const shapeId = await createShape(user.userId, shapeData);
        console.log('[ShapeCreation] Shape created successfully:', shapeId);
      } catch (error) {
        console.error('[ShapeCreation] Error creating shape:', error);
      }
    },
    [currentTool, user]
  );

  return {
    handleCanvasClick,
    createRectangle,
    createCircle,
    createLine,
  };
}

