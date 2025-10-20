/**
 * useAlignment Hook
 * 
 * Hook for aligning and distributing display objects
 * Provides functions for all alignment operations
 */

import { useCallback } from 'react';
import { useShapes } from '@/features/displayObjects/shapes/store/shapesStore';
import { useTexts } from '@/features/displayObjects/texts/store/textsStore';
import { updateShapesBatch } from '@/features/displayObjects/shapes/services/shapeService';
import { updateTextsBatch } from '@/features/displayObjects/texts/services/textService';
import { useSelection } from '../store/selectionStore';
import { useAuth } from '@/features/auth/store/authStore';
import type { TransformableObject } from '../types';
import {
  applyAlignment,
  type AlignmentType,
  type AlignmentUpdate,
} from '../utils/alignmentUtils';
import { roundPosition } from '../utils/transformMath';

/**
 * Alignment operation result
 */
export interface AlignmentResult {
  success: boolean;
  message: string;
  updatedCount: number;
}

/**
 * useAlignment Hook
 * 
 * @returns Alignment management functions
 */
export function useAlignment() {
  const { shapes } = useShapes();
  const { texts } = useTexts();
  const { selectedIds } = useSelection();
  const { user } = useAuth();

  /**
   * Get selected objects (shapes + texts)
   */
  const getSelectedObjects = useCallback((): TransformableObject[] => {
    const allObjects = [...shapes, ...texts];
    return allObjects.filter(obj => selectedIds.includes(obj.id));
  }, [shapes, texts, selectedIds]);

  /**
   * Apply alignment updates to Firestore
   */
  const applyUpdates = async (updates: AlignmentUpdate[]): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Partition updates by category and round positions
    const shapeUpdates = updates
      .filter(update => shapes.some(s => s.id === update.objectId))
      .map(update => ({
        shapeId: update.objectId,
        updates: {
          ...(update.x !== undefined && { x: roundPosition(update.x) }),
          ...(update.y !== undefined && { y: roundPosition(update.y) }),
        },
      }));

    const textUpdates = updates
      .filter(update => texts.some(t => t.id === update.objectId))
      .map(update => ({
        textId: update.objectId,
        updates: {
          ...(update.x !== undefined && { x: roundPosition(update.x) }),
          ...(update.y !== undefined && { y: roundPosition(update.y) }),
        },
      }));

    // Apply updates in parallel
    await Promise.all([
      shapeUpdates.length > 0
        ? updateShapesBatch(user.userId, shapeUpdates)
        : Promise.resolve(),
      textUpdates.length > 0
        ? updateTextsBatch(user.userId, textUpdates)
        : Promise.resolve(),
    ]);
  };

  /**
   * Execute alignment operation
   */
  const align = useCallback(
    async (type: AlignmentType): Promise<AlignmentResult> => {
      const selected = getSelectedObjects();

      // Check minimum requirements
      const minRequired = type.startsWith('distribute') ? 3 : 2;
      if (selected.length < minRequired) {
        return {
          success: false,
          message: `Select at least ${minRequired} objects to ${type.replace('-', ' ')}`,
          updatedCount: 0,
        };
      }

      // Calculate alignment updates
      const updates = applyAlignment(selected, type);

      if (updates.length === 0) {
        return {
          success: false,
          message: 'No alignment changes needed',
          updatedCount: 0,
        };
      }

      try {
        await applyUpdates(updates);
        console.log(`[Alignment] Applied ${type} to ${updates.length} objects`);
        return {
          success: true,
          message: `Aligned ${updates.length} object(s)`,
          updatedCount: updates.length,
        };
      } catch (error) {
        console.error('[Alignment] Error applying alignment:', error);
        return {
          success: false,
          message: 'Failed to align objects',
          updatedCount: 0,
        };
      }
    },
    [getSelectedObjects, user]
  );

  // Individual alignment functions
  const alignLeft = useCallback(() => align('left'), [align]);
  const alignRight = useCallback(() => align('right'), [align]);
  const alignCenterHorizontal = useCallback(() => align('center-horizontal'), [align]);
  const alignTop = useCallback(() => align('top'), [align]);
  const alignBottom = useCallback(() => align('bottom'), [align]);
  const alignCenterVertical = useCallback(() => align('center-vertical'), [align]);
  const distributeHorizontal = useCallback(() => align('distribute-horizontal'), [align]);
  const distributeVertical = useCallback(() => align('distribute-vertical'), [align]);

  return {
    // Horizontal alignment
    alignLeft,
    alignRight,
    alignCenterHorizontal,

    // Vertical alignment
    alignTop,
    alignBottom,
    alignCenterVertical,

    // Distribution
    distributeHorizontal,
    distributeVertical,

    // State
    hasSelection: selectedIds.length > 0,
    selectionCount: selectedIds.length,
  };
}

