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
 * useShapeCreation Hook
 * 
 * Provides shape creation functionality
 * 
 * @returns Shape creation handler
 * 
 * @example
 * ```tsx
 * function Canvas() {
 *   const handleShapeCreation = useShapeCreation();
 *   
 *   const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
 *     handleShapeCreation(e);
 *   };
 *   
 *   return <Stage onClick={handleStageClick}>...</Stage>;
 * }
 * ```
 */
export function useShapeCreation() {
  const { currentTool, resetToSelect } = useTool();
  const { user } = useAuth();

  /**
   * Handle canvas click for shape creation
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

      if (currentTool === 'select') {
        // Selection mode - don't create shapes
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

        // Add tool-specific properties
        if (currentTool === 'rectangle') {
          // Rectangle created with default size (will be centered at click point)
          shapeData.x = canvasX - 50; // Center horizontally (default width is 100)
          shapeData.y = canvasY - 50; // Center vertically (default height is 100)
        }

        const shapeId = await createShape(user.userId, shapeData);
        console.log('[ShapeCreation] Shape created successfully:', shapeId);

        // Reset to select tool after creating shape
        resetToSelect();
      } catch (error) {
        console.error('[ShapeCreation] Error creating shape:', error);
      }
    },
    [currentTool, user, resetToSelect]
  );

  return handleCanvasClick;
}

