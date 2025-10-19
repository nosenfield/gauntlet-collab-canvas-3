/**
 * useZIndexManagement Hook
 * 
 * Hook for managing Z-index operations on display objects
 * Provides functions for bring to front, send to back, bring forward, send backward
 */

import { useCallback } from 'react';
import { useShapes } from '@/features/displayObjects/shapes/store/shapesStore';
import { useTexts } from '@/features/displayObjects/texts/store/textsStore';
import { updateZIndexes as updateShapeZIndexes } from '@/features/displayObjects/shapes/services/shapeService';
import { updateZIndexes as updateTextZIndexes } from '@/features/displayObjects/texts/services/textService';
import { useSelection } from '../store/selectionStore';
import type { TransformableObject } from '../types';

/**
 * Z-Index operation result
 */
export interface ZIndexUpdateResult {
  success: boolean;
  message: string;
  updatedCount: number;
}

/**
 * useZIndexManagement Hook
 * 
 * @returns Z-index management functions
 */
export function useZIndexManagement() {
  const { shapes } = useShapes();
  const { texts } = useTexts();
  const { selectedIds } = useSelection();

  /**
   * Get all display objects (shapes + texts) sorted by zIndex
   */
  const getAllObjects = useCallback((): TransformableObject[] => {
    return [...shapes, ...texts].sort((a, b) => a.zIndex - b.zIndex);
  }, [shapes, texts]);

  /**
   * Get selected objects from all display objects
   */
  const getSelectedObjects = useCallback((): TransformableObject[] => {
    const allObjects = getAllObjects();
    return allObjects.filter(obj => selectedIds.includes(obj.id));
  }, [getAllObjects, selectedIds]);

  /**
   * Update Z-indexes for objects (automatically partitions by category)
   */
  const updateZIndexes = async (
    updates: Array<{ objectId: string; zIndex: number; category: 'shape' | 'text' }>
  ): Promise<void> => {
    // Partition updates by category
    const shapeUpdates = updates
      .filter(u => u.category === 'shape')
      .map(u => ({ shapeId: u.objectId, zIndex: u.zIndex }));
    
    const textUpdates = updates
      .filter(u => u.category === 'text')
      .map(u => ({ textId: u.objectId, zIndex: u.zIndex }));

    // Update both in parallel
    await Promise.all([
      shapeUpdates.length > 0 ? updateShapeZIndexes(shapeUpdates) : Promise.resolve(),
      textUpdates.length > 0 ? updateTextZIndexes(textUpdates) : Promise.resolve(),
    ]);
  };

  /**
   * Bring selected objects to front
   * Sets their zIndex to be higher than all other objects
   */
  const bringToFront = useCallback(async (): Promise<ZIndexUpdateResult> => {
    const selected = getSelectedObjects();
    
    if (selected.length === 0) {
      return {
        success: false,
        message: 'No objects selected',
        updatedCount: 0,
      };
    }

    const allObjects = getAllObjects();
    const maxZIndex = Math.max(...allObjects.map(obj => obj.zIndex), 0);

    // Create updates: selected objects get new z-indexes starting from maxZIndex + 1
    const updates = selected.map((obj, index) => ({
      objectId: obj.id,
      zIndex: maxZIndex + 1 + index,
      category: obj.category as 'shape' | 'text',
    }));

    try {
      await updateZIndexes(updates);
      console.log('[ZIndexManagement] Brought', selected.length, 'objects to front');
      return {
        success: true,
        message: `Brought ${selected.length} object(s) to front`,
        updatedCount: selected.length,
      };
    } catch (error) {
      console.error('[ZIndexManagement] Error bringing to front:', error);
      return {
        success: false,
        message: 'Failed to bring objects to front',
        updatedCount: 0,
      };
    }
  }, [getSelectedObjects, getAllObjects]);

  /**
   * Send selected objects to back
   * Sets their zIndex to be lower than all other objects
   */
  const sendToBack = useCallback(async (): Promise<ZIndexUpdateResult> => {
    const selected = getSelectedObjects();
    
    if (selected.length === 0) {
      return {
        success: false,
        message: 'No objects selected',
        updatedCount: 0,
      };
    }

    const allObjects = getAllObjects();
    const minZIndex = Math.min(...allObjects.map(obj => obj.zIndex), 0);

    // Create updates: selected objects get new z-indexes starting from minZIndex - selected.length
    const updates = selected.map((obj, index) => ({
      objectId: obj.id,
      zIndex: minZIndex - selected.length + index,
      category: obj.category as 'shape' | 'text',
    }));

    try {
      await updateZIndexes(updates);
      console.log('[ZIndexManagement] Sent', selected.length, 'objects to back');
      return {
        success: true,
        message: `Sent ${selected.length} object(s) to back`,
        updatedCount: selected.length,
      };
    } catch (error) {
      console.error('[ZIndexManagement] Error sending to back:', error);
      return {
        success: false,
        message: 'Failed to send objects to back',
        updatedCount: 0,
      };
    }
  }, [getSelectedObjects, getAllObjects]);

  /**
   * Bring selected objects forward (move up by 1 in z-order)
   */
  const bringForward = useCallback(async (): Promise<ZIndexUpdateResult> => {
    const selected = getSelectedObjects();
    
    if (selected.length === 0) {
      return {
        success: false,
        message: 'No objects selected',
        updatedCount: 0,
      };
    }

    const allObjects = getAllObjects();
    const selectedIds = new Set(selected.map(obj => obj.id));

    // Find the next non-selected object above the highest selected object
    const maxSelectedZIndex = Math.max(...selected.map(obj => obj.zIndex));
    const objectsAbove = allObjects.filter(
      obj => !selectedIds.has(obj.id) && obj.zIndex > maxSelectedZIndex
    );

    if (objectsAbove.length === 0) {
      // Already at the front
      return {
        success: false,
        message: 'Objects are already at the front',
        updatedCount: 0,
      };
    }

    // Move up by 1
    const updates = selected.map((obj) => ({
      objectId: obj.id,
      zIndex: obj.zIndex + 1,
      category: obj.category as 'shape' | 'text',
    }));

    try {
      await updateZIndexes(updates);
      console.log('[ZIndexManagement] Brought', selected.length, 'objects forward');
      return {
        success: true,
        message: `Brought ${selected.length} object(s) forward`,
        updatedCount: selected.length,
      };
    } catch (error) {
      console.error('[ZIndexManagement] Error bringing forward:', error);
      return {
        success: false,
        message: 'Failed to bring objects forward',
        updatedCount: 0,
      };
    }
  }, [getSelectedObjects, getAllObjects]);

  /**
   * Send selected objects backward (move down by 1 in z-order)
   */
  const sendBackward = useCallback(async (): Promise<ZIndexUpdateResult> => {
    const selected = getSelectedObjects();
    
    if (selected.length === 0) {
      return {
        success: false,
        message: 'No objects selected',
        updatedCount: 0,
      };
    }

    const allObjects = getAllObjects();
    const selectedIds = new Set(selected.map(obj => obj.id));

    // Find the next non-selected object below the lowest selected object
    const minSelectedZIndex = Math.min(...selected.map(obj => obj.zIndex));
    const objectsBelow = allObjects.filter(
      obj => !selectedIds.has(obj.id) && obj.zIndex < minSelectedZIndex
    );

    if (objectsBelow.length === 0) {
      // Already at the back
      return {
        success: false,
        message: 'Objects are already at the back',
        updatedCount: 0,
      };
    }

    // Move down by 1
    const updates = selected.map((obj) => ({
      objectId: obj.id,
      zIndex: obj.zIndex - 1,
      category: obj.category as 'shape' | 'text',
    }));

    try {
      await updateZIndexes(updates);
      console.log('[ZIndexManagement] Sent', selected.length, 'objects backward');
      return {
        success: true,
        message: `Sent ${selected.length} object(s) backward`,
        updatedCount: selected.length,
      };
    } catch (error) {
      console.error('[ZIndexManagement] Error sending backward:', error);
      return {
        success: false,
        message: 'Failed to send objects backward',
        updatedCount: 0,
      };
    }
  }, [getSelectedObjects, getAllObjects]);

  return {
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    hasSelection: selectedIds.length > 0,
  };
}

