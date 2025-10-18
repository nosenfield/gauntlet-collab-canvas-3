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
import type { TransformableObject } from '../../types';
import { updateShapesBatch } from '@/features/displayObjects/shapes/services/shapeService';
import { updateTextsBatch } from '@/features/displayObjects/texts/services/textService';
import { calculateCollectionAABB, getAABBCenter } from '../../utils/boundingBoxUtils';
import { NumberInput } from './NumberInput';

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
        });
        
        const textUpdates = texts.map(obj => {
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
        });
        
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
      </div>
    </div>
  );
}

