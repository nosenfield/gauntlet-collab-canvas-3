/**
 * useTextCreation Hook
 * 
 * Handles text object creation logic when text tool is active.
 * Creates text boxes on canvas click.
 */

import { useCallback } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useTexts } from '../store/textsStore';
import { useAuth } from '@/features/auth/store/authStore';
import { useTool } from '@/features/displayObjects/common/store/toolStore';
import { createText } from '../services/textService';
import { screenToCanvas } from '@/features/canvas/utils/coordinateTransform';

/**
 * useTextCreation Hook
 * 
 * Provides handlers for creating text objects on canvas click
 * 
 * @returns Object with text creation handlers
 */
export function useTextCreation() {
  const { user } = useAuth();
  const { addText } = useTexts();
  const { currentTool, resetToSelect } = useTool();
  
  /**
   * Handle canvas click when text tool is active
   * Creates a new text object at the click position
   */
  const handleCanvasClick = useCallback(async (
    e: KonvaEventObject<MouseEvent>,
    viewport: { x: number; y: number; scale: number }
  ) => {
    // Only create text if text tool is active
    if (currentTool !== 'text' || !user) return;
    
    // Get click position in screen coordinates
    const stage = e.target.getStage();
    if (!stage) return;
    
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;
    
    // Convert to canvas coordinates
    const canvasPos = screenToCanvas(
      pointerPos.x,
      pointerPos.y,
      viewport.x,
      viewport.y,
      viewport.scale
    );
    
    try {
      console.log('[useTextCreation] Creating text at', canvasPos);
      
      // Create text in Firestore
      const newText = await createText(user.userId, {
        x: canvasPos.x,
        y: canvasPos.y,
      });
      
      // Add to local state (optimistic)
      addText(newText);
      
      console.log('[useTextCreation] Text created:', newText.id);
      
      // Auto-revert to select tool after creation
      resetToSelect();
    } catch (error) {
      console.error('[useTextCreation] Failed to create text:', error);
    }
  }, [currentTool, user, addText, resetToSelect]);
  
  return {
    handleCanvasClick,
    isTextTool: currentTool === 'text',
  };
}

