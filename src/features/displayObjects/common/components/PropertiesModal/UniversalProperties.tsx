/**
 * Universal Properties Component
 * 
 * Displays and allows editing of universal properties shared by all display objects:
 * - Position (x, y)
 * - Rotation
 * - Scale (scaleX, scaleY)
 * - Opacity
 */

import React, { useCallback } from 'react';
import type { TransformableObject, BlendMode } from '../../types';
import { updateShapesBatch } from '@/features/displayObjects/shapes/services/shapeService';
import { updateTextsBatch } from '@/features/displayObjects/texts/services/textService';
import { calculateCollectionAABB, getAABBCenter } from '../../utils/boundingBoxUtils';
import { NumberInput } from './NumberInput';
import { BlendModeSelector } from './BlendModeSelector';
import { useShapes } from '@/features/displayObjects/shapes/store/shapesStore';
import { useTexts } from '@/features/displayObjects/texts/store/textsStore';
import { useAlignment } from '../../hooks/useAlignment';

interface UniversalPropertiesProps {
  selectedObjects: TransformableObject[];
  userId: string | undefined;
}

/**
 * Get common value across selected objects
 * Returns the value if all objects have the same value, otherwise returns mixed indicator
 */
function getCommonValue<T>(objects: TransformableObject[], key: keyof TransformableObject): T | 'mixed' {
  if (objects.length === 0) return 'mixed';
  
  const firstValue = objects[0][key];
  const allSame = objects.every(obj => obj[key] === firstValue);
  
  return allSame ? (firstValue as T) : 'mixed';
}

export function UniversalProperties({ selectedObjects, userId }: UniversalPropertiesProps): React.ReactElement {
  // Get common values
  const x = getCommonValue<number>(selectedObjects, 'x');
  const y = getCommonValue<number>(selectedObjects, 'y');
  const rotation = getCommonValue<number>(selectedObjects, 'rotation');
  const scaleX = getCommonValue<number>(selectedObjects, 'scaleX');
  const scaleY = getCommonValue<number>(selectedObjects, 'scaleY');
  const opacity = getCommonValue<number>(selectedObjects, 'opacity');
  const blendMode = getCommonValue<BlendMode | undefined>(selectedObjects, 'blendMode');
  const zIndex = getCommonValue<number>(selectedObjects, 'zIndex');
  
  // Z-index management - we'll implement custom simple logic for the buttons
  const { shapes } = useShapes();
  const { texts } = useTexts();
  
  // Alignment functions
  const {
    alignLeft,
    alignRight,
    alignCenterHorizontal,
    alignTop,
    alignBottom,
    alignCenterVertical,
    distributeHorizontal,
    distributeVertical,
    selectionCount,
  } = useAlignment();
  
  /**
   * Get all display objects for z-index calculations
   */
  const getAllObjects = useCallback((): TransformableObject[] => {
    return [...shapes, ...texts];
  }, [shapes, texts]);
  
  /**
   * Forward: Increase z-index by 1
   */
  const handleForward = useCallback(async () => {
    if (!userId || selectedObjects.length === 0) return;
    
    try {
      // Separate shapes and texts for batch updates
      const shapesToUpdate = selectedObjects.filter(obj => obj.category === 'shape');
      const textsToUpdate = selectedObjects.filter(obj => obj.category === 'text');
      
      const promises: Promise<void>[] = [];
      
      if (shapesToUpdate.length > 0) {
        const shapeUpdates = shapesToUpdate.map(obj => ({
          shapeId: obj.id,
          updates: { zIndex: obj.zIndex + 1 },
        }));
        promises.push(updateShapesBatch(userId, shapeUpdates));
      }
      
      if (textsToUpdate.length > 0) {
        const textUpdates = textsToUpdate.map(obj => ({
          textId: obj.id,
          updates: { zIndex: obj.zIndex + 1 },
        }));
        promises.push(updateTextsBatch(userId, textUpdates));
      }
      
      await Promise.all(promises);
      console.log('[UniversalProperties] Moved forward:', selectedObjects.length, 'objects');
    } catch (error) {
      console.error('[UniversalProperties] Error moving forward:', error);
    }
  }, [selectedObjects, userId]);
  
  /**
   * Backward: Decrease z-index by 1
   */
  const handleBackward = useCallback(async () => {
    if (!userId || selectedObjects.length === 0) return;
    
    try {
      // Separate shapes and texts for batch updates
      const shapesToUpdate = selectedObjects.filter(obj => obj.category === 'shape');
      const textsToUpdate = selectedObjects.filter(obj => obj.category === 'text');
      
      const promises: Promise<void>[] = [];
      
      if (shapesToUpdate.length > 0) {
        const shapeUpdates = shapesToUpdate.map(obj => ({
          shapeId: obj.id,
          updates: { zIndex: obj.zIndex - 1 },
        }));
        promises.push(updateShapesBatch(userId, shapeUpdates));
      }
      
      if (textsToUpdate.length > 0) {
        const textUpdates = textsToUpdate.map(obj => ({
          textId: obj.id,
          updates: { zIndex: obj.zIndex - 1 },
        }));
        promises.push(updateTextsBatch(userId, textUpdates));
      }
      
      await Promise.all(promises);
      console.log('[UniversalProperties] Moved backward:', selectedObjects.length, 'objects');
    } catch (error) {
      console.error('[UniversalProperties] Error moving backward:', error);
    }
  }, [selectedObjects, userId]);
  
  /**
   * To Front: Set to highest known z-index + 1
   */
  const handleToFront = useCallback(async () => {
    if (!userId || selectedObjects.length === 0) return;
    
    try {
      const allObjects = getAllObjects();
      const maxZIndex = Math.max(...allObjects.map(obj => obj.zIndex), 0);
      
      // Separate shapes and texts for batch updates
      const shapesToUpdate = selectedObjects.filter(obj => obj.category === 'shape');
      const textsToUpdate = selectedObjects.filter(obj => obj.category === 'text');
      
      const promises: Promise<void>[] = [];
      
      if (shapesToUpdate.length > 0) {
        const shapeUpdates = shapesToUpdate.map(obj => ({
          shapeId: obj.id,
          updates: { zIndex: maxZIndex + 1 },
        }));
        promises.push(updateShapesBatch(userId, shapeUpdates));
      }
      
      if (textsToUpdate.length > 0) {
        const textUpdates = textsToUpdate.map(obj => ({
          textId: obj.id,
          updates: { zIndex: maxZIndex + 1 },
        }));
        promises.push(updateTextsBatch(userId, textUpdates));
      }
      
      await Promise.all(promises);
      console.log('[UniversalProperties] Brought to front:', selectedObjects.length, 'objects');
    } catch (error) {
      console.error('[UniversalProperties] Error bringing to front:', error);
    }
  }, [selectedObjects, userId, getAllObjects]);
  
  /**
   * To Back: Set to lowest known z-index - 1
   */
  const handleToBack = useCallback(async () => {
    if (!userId || selectedObjects.length === 0) return;
    
    try {
      const allObjects = getAllObjects();
      const minZIndex = Math.min(...allObjects.map(obj => obj.zIndex), 0);
      
      // Separate shapes and texts for batch updates
      const shapesToUpdate = selectedObjects.filter(obj => obj.category === 'shape');
      const textsToUpdate = selectedObjects.filter(obj => obj.category === 'text');
      
      const promises: Promise<void>[] = [];
      
      if (shapesToUpdate.length > 0) {
        const shapeUpdates = shapesToUpdate.map(obj => ({
          shapeId: obj.id,
          updates: { zIndex: minZIndex - 1 },
        }));
        promises.push(updateShapesBatch(userId, shapeUpdates));
      }
      
      if (textsToUpdate.length > 0) {
        const textUpdates = textsToUpdate.map(obj => ({
          textId: obj.id,
          updates: { zIndex: minZIndex - 1 },
        }));
        promises.push(updateTextsBatch(userId, textUpdates));
      }
      
      await Promise.all(promises);
      console.log('[UniversalProperties] Sent to back:', selectedObjects.length, 'objects');
    } catch (error) {
      console.error('[UniversalProperties] Error sending to back:', error);
    }
  }, [selectedObjects, userId, getAllObjects]);
  
  /**
   * Update a universal property for all selected objects
   * Uses batch updates for performance with multiple objects
   * For scale properties, scales from collection center (like scale knob)
   */
  const updateProperty = useCallback(async (key: keyof TransformableObject, value: number) => {
    if (!userId || selectedObjects.length === 0) return;
    
    try {
      // Separate shapes and texts for batch updates
      const shapes = selectedObjects.filter(obj => obj.category === 'shape');
      const texts = selectedObjects.filter(obj => obj.category === 'text');
      
      const promises: Promise<void>[] = [];
      
      // Special handling for scale properties - scale from collection center
      if (key === 'scaleX' || key === 'scaleY') {
        // Calculate collection center as pivot point
        const collectionBounds = calculateCollectionAABB(selectedObjects);
        if (!collectionBounds) return;
        const center = getAABBCenter(collectionBounds);
        
        // For each object, calculate new position and scale
        const shapeUpdates = shapes.map(obj => {
          // Skip objects without width/height
          if (!obj.width || !obj.height) return null;
          
          // Calculate object's center point (accounting for current scale)
          const halfWidth = (obj.width * obj.scaleX) / 2;
          const halfHeight = (obj.height * obj.scaleY) / 2;
          const objectCenter = {
            x: obj.x + halfWidth,
            y: obj.y + halfHeight,
          };
          
          // Calculate distance from collection center
          const deltaX = objectCenter.x - center.x;
          const deltaY = objectCenter.y - center.y;
          
          // Calculate scale factor (new / old)
          const oldScale = key === 'scaleX' ? obj.scaleX : obj.scaleY;
          const scaleFactor = value / oldScale;
          
          // Scale the distance from center (only the relevant axis for non-uniform scaling)
          const newCenterX = key === 'scaleX' ? center.x + (deltaX * scaleFactor) : objectCenter.x;
          const newCenterY = key === 'scaleY' ? center.y + (deltaY * scaleFactor) : objectCenter.y;
          
          // Apply new scale
          const newScaleX = key === 'scaleX' ? value : obj.scaleX;
          const newScaleY = key === 'scaleY' ? value : obj.scaleY;
          
          // Constrain scale (0.1 to 100.0)
          const constrainedScaleX = Math.max(0.1, Math.min(100.0, newScaleX));
          const constrainedScaleY = Math.max(0.1, Math.min(100.0, newScaleY));
          
          // Calculate new half dimensions with constrained scale
          const newHalfWidth = (obj.width * constrainedScaleX) / 2;
          const newHalfHeight = (obj.height * constrainedScaleY) / 2;
          
          // Convert back to top-left coordinates
          const newX = newCenterX - newHalfWidth;
          const newY = newCenterY - newHalfHeight;
          
          return {
            shapeId: obj.id,
            updates: {
              x: newX,
              y: newY,
              scaleX: constrainedScaleX,
              scaleY: constrainedScaleY,
            },
          };
        }).filter((update): update is NonNullable<typeof update> => update !== null);
        
        const textUpdates = texts.map(obj => {
          // Skip objects without width/height
          if (!obj.width || !obj.height) return null;
          
          // Calculate object's center point (accounting for current scale)
          const halfWidth = (obj.width * obj.scaleX) / 2;
          const halfHeight = (obj.height * obj.scaleY) / 2;
          const objectCenter = {
            x: obj.x + halfWidth,
            y: obj.y + halfHeight,
          };
          
          // Calculate distance from collection center
          const deltaX = objectCenter.x - center.x;
          const deltaY = objectCenter.y - center.y;
          
          // Calculate scale factor (new / old)
          const oldScale = key === 'scaleX' ? obj.scaleX : obj.scaleY;
          const scaleFactor = value / oldScale;
          
          // Scale the distance from center (only the relevant axis for non-uniform scaling)
          const newCenterX = key === 'scaleX' ? center.x + (deltaX * scaleFactor) : objectCenter.x;
          const newCenterY = key === 'scaleY' ? center.y + (deltaY * scaleFactor) : objectCenter.y;
          
          // Apply new scale
          const newScaleX = key === 'scaleX' ? value : obj.scaleX;
          const newScaleY = key === 'scaleY' ? value : obj.scaleY;
          
          // Constrain scale (0.1 to 100.0)
          const constrainedScaleX = Math.max(0.1, Math.min(100.0, newScaleX));
          const constrainedScaleY = Math.max(0.1, Math.min(100.0, newScaleY));
          
          // Calculate new half dimensions with constrained scale
          const newHalfWidth = (obj.width * constrainedScaleX) / 2;
          const newHalfHeight = (obj.height * constrainedScaleY) / 2;
          
          // Convert back to top-left coordinates
          const newX = newCenterX - newHalfWidth;
          const newY = newCenterY - newHalfHeight;
          
          return {
            textId: obj.id,
            updates: {
              x: newX,
              y: newY,
              scaleX: constrainedScaleX,
              scaleY: constrainedScaleY,
            },
          };
        }).filter((update): update is NonNullable<typeof update> => update !== null);
        
        if (shapeUpdates.length > 0) {
          promises.push(updateShapesBatch(userId, shapeUpdates));
        }
        if (textUpdates.length > 0) {
          promises.push(updateTextsBatch(userId, textUpdates));
        }
      } else {
        // For non-scale properties, simple batch update
        const updates = { [key]: value };
        
        if (shapes.length > 0) {
          const shapeBatchUpdates = shapes.map(shape => ({
            shapeId: shape.id,
            updates,
          }));
          promises.push(updateShapesBatch(userId, shapeBatchUpdates));
        }
        
        if (texts.length > 0) {
          const textBatchUpdates = texts.map(text => ({
            textId: text.id,
            updates,
          }));
          promises.push(updateTextsBatch(userId, textBatchUpdates));
        }
      }
      
      await Promise.all(promises);
    } catch (error) {
      console.error(`[UniversalProperties] Error updating ${key}:`, error);
    }
  }, [selectedObjects, userId]);
  
  /**
   * Update blend mode for all selected objects
   */
  const updateBlendMode = useCallback(async (newBlendMode: BlendMode) => {
    if (!userId || selectedObjects.length === 0) return;
    
    try {
      // Separate shapes and texts for batch updates
      const shapes = selectedObjects.filter(obj => obj.category === 'shape');
      const texts = selectedObjects.filter(obj => obj.category === 'text');
      
      const promises: Promise<void>[] = [];
      
      // Update shapes
      if (shapes.length > 0) {
        const shapeUpdates = shapes.map(obj => ({
          shapeId: obj.id,
          updates: { blendMode: newBlendMode },
        }));
        
        promises.push(updateShapesBatch(userId, shapeUpdates));
      }
      
      // Update texts
      if (texts.length > 0) {
        const textUpdates = texts.map(obj => ({
          textId: obj.id,
          updates: { blendMode: newBlendMode },
        }));
        
        promises.push(updateTextsBatch(userId, textUpdates));
      }
      
      await Promise.all(promises);
    } catch (error) {
      console.error('[UniversalProperties] Error updating blend mode:', error);
    }
  }, [selectedObjects, userId]);
  
  return (
    <div className="properties-modal__section">
      <div className="properties-modal__section-title">Universal Properties</div>
      
      <div className="properties-modal__grid">
        {/* Position */}
        <div className="properties-modal__field">
          <label className="properties-modal__label">X Position</label>
          <NumberInput
            value={x}
            onChange={(value) => updateProperty('x', value)}
            min={-10000}
            max={20000}
            step={1}
            suffix="px"
          />
        </div>
        
        <div className="properties-modal__field">
          <label className="properties-modal__label">Y Position</label>
          <NumberInput
            value={y}
            onChange={(value) => updateProperty('y', value)}
            min={-10000}
            max={20000}
            step={1}
            suffix="px"
          />
        </div>
        
        {/* Alignment - always visible, disabled when < 2 objects */}
        <div className="properties-modal__field properties-modal__field--full">
          <label className="properties-modal__label">Alignment</label>
          <div className="properties-modal__alignment-rows">
            {/* Horizontal Row */}
            <div className="properties-modal__alignment-row">
              <button
                className="properties-modal__alignment-button"
                onClick={alignLeft}
                disabled={selectionCount < 2}
                title={selectionCount < 2 ? "Select 2+ objects to align" : "Align Left"}
                aria-label="Align Left"
              >
                ⊢
              </button>
              <button
                className="properties-modal__alignment-button"
                onClick={alignCenterHorizontal}
                disabled={selectionCount < 2}
                title={selectionCount < 2 ? "Select 2+ objects to align" : "Align Center (Horizontal)"}
                aria-label="Align Center Horizontal"
              >
                ⊢⊣
              </button>
              <button
                className="properties-modal__alignment-button"
                onClick={alignRight}
                disabled={selectionCount < 2}
                title={selectionCount < 2 ? "Select 2+ objects to align" : "Align Right"}
                aria-label="Align Right"
              >
                ⊣
              </button>
              <button
                className="properties-modal__alignment-button"
                onClick={distributeHorizontal}
                disabled={selectionCount < 3}
                title={selectionCount < 3 ? "Select 3+ objects to distribute" : "Distribute Horizontally"}
                aria-label="Distribute Horizontally"
              >
                ⟷
              </button>
            </div>
            
            {/* Vertical Row */}
            <div className="properties-modal__alignment-row">
              <button
                className="properties-modal__alignment-button"
                onClick={alignTop}
                disabled={selectionCount < 2}
                title={selectionCount < 2 ? "Select 2+ objects to align" : "Align Top"}
                aria-label="Align Top"
              >
                ⊤
              </button>
              <button
                className="properties-modal__alignment-button"
                onClick={alignCenterVertical}
                disabled={selectionCount < 2}
                title={selectionCount < 2 ? "Select 2+ objects to align" : "Align Middle (Vertical)"}
                aria-label="Align Center Vertical"
              >
                ⊥⊤
              </button>
              <button
                className="properties-modal__alignment-button"
                onClick={alignBottom}
                disabled={selectionCount < 2}
                title={selectionCount < 2 ? "Select 2+ objects to align" : "Align Bottom"}
                aria-label="Align Bottom"
              >
                ⊥
              </button>
              <button
                className="properties-modal__alignment-button"
                onClick={distributeVertical}
                disabled={selectionCount < 3}
                title={selectionCount < 3 ? "Select 3+ objects to distribute" : "Distribute Vertically"}
                aria-label="Distribute Vertically"
              >
                ⇅
              </button>
            </div>
          </div>
        </div>
        
        {/* Rotation */}
        <div className="properties-modal__field properties-modal__field--full">
          <label className="properties-modal__label">Rotation</label>
          <NumberInput
            value={rotation}
            onChange={(value) => updateProperty('rotation', value)}
            min={-360}
            max={360}
            step={1}
            suffix="°"
          />
        </div>
        
        {/* Scale */}
        <div className="properties-modal__field">
          <label className="properties-modal__label">Scale X</label>
          <NumberInput
            value={scaleX}
            onChange={(value) => updateProperty('scaleX', value)}
            min={0.1}
            max={10}
            step={0.1}
            suffix="×"
          />
        </div>
        
        <div className="properties-modal__field">
          <label className="properties-modal__label">Scale Y</label>
          <NumberInput
            value={scaleY}
            onChange={(value) => updateProperty('scaleY', value)}
            min={0.1}
            max={10}
            step={0.1}
            suffix="×"
          />
        </div>
        
        {/* Opacity */}
        <div className="properties-modal__field properties-modal__field--full">
          <label className="properties-modal__label">Opacity</label>
          <div className="properties-modal__slider-group">
            <input
              type="range"
              className="properties-modal__slider"
              value={opacity === 'mixed' ? 1 : opacity}
              onChange={(e) => updateProperty('opacity', parseFloat(e.target.value))}
              min={0}
              max={1}
              step={0.01}
            />
            <NumberInput
              value={opacity === 'mixed' ? 'mixed' : Math.round(opacity * 100)}
              onChange={(value) => updateProperty('opacity', value / 100)}
              min={0}
              max={100}
              step={1}
              suffix="%"
            />
          </div>
        </div>
        
        {/* Blend Mode */}
        <div className="properties-modal__field properties-modal__field--full">
          <BlendModeSelector
            value={blendMode === 'mixed' ? 'mixed' : (blendMode || 'source-over')}
            onChange={updateBlendMode}
          />
        </div>
        
        {/* Z-Index (Layer Order) */}
        <div className="properties-modal__field properties-modal__field--full">
          <label className="properties-modal__label">Z-Index (Layer)</label>
          <div className="properties-modal__zindex-group">
            <NumberInput
              value={zIndex}
              onChange={(value) => updateProperty('zIndex', Math.round(value))}
              min={0}
              max={10000}
              step={1}
              suffix=""
            />
            <div className="properties-modal__zindex-buttons">
              <button
                className="properties-modal__zindex-button"
                onClick={handleForward}
                title="Forward (Z-Index +1)"
                aria-label="Forward"
              >
                ⬆
              </button>
              <button
                className="properties-modal__zindex-button"
                onClick={handleBackward}
                title="Backward (Z-Index -1)"
                aria-label="Backward"
              >
                ⬇
              </button>
              <button
                className="properties-modal__zindex-button"
                onClick={handleToFront}
                title="To Front (Highest + 1)"
                aria-label="To Front"
              >
                ⬆⬆
              </button>
              <button
                className="properties-modal__zindex-button"
                onClick={handleToBack}
                title="To Back (Lowest - 1)"
                aria-label="To Back"
              >
                ⬇⬇
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

