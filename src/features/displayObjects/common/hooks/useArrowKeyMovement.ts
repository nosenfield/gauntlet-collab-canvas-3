/**
 * Arrow Key Movement Hook
 * 
 * Handles arrow key shortcuts to move selected objects
 * - Arrow keys: Move 1px in the direction
 * - Shift + Arrow keys: Move 10px in the direction
 */

import { useEffect, useCallback } from 'react';
import { useSelection } from '../store/selectionStore';
import { useShapes } from '@/features/displayObjects/shapes/store/shapesStore';
import { useTexts } from '@/features/displayObjects/texts/store/textsStore';
import { updateShape } from '@/features/displayObjects/shapes/services/shapeService';
import { updateText } from '@/features/displayObjects/texts/services/textService';
import { roundPosition } from '../utils/transformMath';

/**
 * Movement amounts
 */
const NORMAL_MOVE = 1;  // 1px for normal arrow key
const SHIFT_MOVE = 10;  // 10px for shift + arrow key

/**
 * useArrowKeyMovement Hook
 * 
 * Enables arrow key navigation for selected objects
 * 
 * @param userId - Current user ID for updating objects
 */
export function useArrowKeyMovement(userId: string | undefined) {
  const { selectedIds } = useSelection();
  const { shapes } = useShapes();
  const { texts } = useTexts();

  /**
   * Move selected objects by delta x and y
   */
  const moveObjects = useCallback(async (deltaX: number, deltaY: number) => {
    if (!userId || selectedIds.length === 0) {
      return;
    }

    try {
      // Create maps for quick lookup
      const shapeMap = new Map(shapes.map(s => [s.id, s]));
      const textMap = new Map(texts.map(t => [t.id, t]));

      // Update all selected objects
      const updatePromises = selectedIds.map(async (id) => {
        const shape = shapeMap.get(id);
        const text = textMap.get(id);

        if (shape) {
          // Update shape position
          return updateShape(id, userId, {
            x: roundPosition(shape.x + deltaX),
            y: roundPosition(shape.y + deltaY),
          });
        } else if (text) {
          // Update text position
          return updateText(userId, id, {
            x: roundPosition(text.x + deltaX),
            y: roundPosition(text.y + deltaY),
          });
        }
      });

      await Promise.all(updatePromises);
      
      const distance = Math.abs(deltaX) + Math.abs(deltaY);
      console.log(`[ArrowKeyMovement] Moved ${selectedIds.length} objects by ${distance}px`);
    } catch (error) {
      console.error('[ArrowKeyMovement] Error moving objects:', error);
    }
  }, [userId, selectedIds, shapes, texts]);

  /**
   * Keyboard event handler for arrow keys
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle arrow keys
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        return;
      }

      // Don't trigger if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Don't trigger if no objects are selected
      if (selectedIds.length === 0) {
        return;
      }

      // Prevent default arrow key behavior (page scrolling)
      e.preventDefault();

      // Determine movement amount based on Shift key
      const moveAmount = e.shiftKey ? SHIFT_MOVE : NORMAL_MOVE;

      // Calculate delta based on arrow key
      let deltaX = 0;
      let deltaY = 0;

      switch (e.key) {
        case 'ArrowUp':
          deltaY = -moveAmount;
          break;
        case 'ArrowDown':
          deltaY = moveAmount;
          break;
        case 'ArrowLeft':
          deltaX = -moveAmount;
          break;
        case 'ArrowRight':
          deltaX = moveAmount;
          break;
      }

      // Move objects
      moveObjects(deltaX, deltaY);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, moveObjects]);
}

