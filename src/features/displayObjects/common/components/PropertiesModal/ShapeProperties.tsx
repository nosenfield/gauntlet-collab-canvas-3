/**
 * Shape Properties Component
 * 
 * Displays and allows editing of shape-specific properties:
 * - Fill Color
 * - Stroke Color
 * - Stroke Width
 * - Border Radius (rectangles only)
 */

import React, { useCallback } from 'react';
import type { ShapeDisplayObject } from '@/features/displayObjects/shapes/types';
import { updateShape } from '@/features/displayObjects/shapes/services/shapeService';
import { NumberInput } from './NumberInput';
import { ColorInput } from './ColorInput';

interface ShapePropertiesProps {
  selectedShapes: ShapeDisplayObject[];
  userId: string | undefined;
}

/**
 * Get common value across selected shapes
 */
function getCommonValue<T>(shapes: ShapeDisplayObject[], key: keyof ShapeDisplayObject): T | 'mixed' {
  if (shapes.length === 0) return 'mixed';
  
  const firstValue = shapes[0][key];
  const allSame = shapes.every(shape => shape[key] === firstValue);
  
  return allSame ? (firstValue as T) : 'mixed';
}

export function ShapeProperties({ selectedShapes, userId }: ShapePropertiesProps): React.ReactElement {
  // Get common values
  const fillColor = getCommonValue<string>(selectedShapes, 'fillColor');
  const strokeColor = getCommonValue<string>(selectedShapes, 'strokeColor');
  const strokeWidth = getCommonValue<number>(selectedShapes, 'strokeWidth');
  
  // Border radius only for rectangles
  const rectangles = selectedShapes.filter(s => s.type === 'rectangle');
  const hasBorderRadius = rectangles.length > 0;
  const borderRadius = hasBorderRadius 
    ? getCommonValue<number | undefined>(rectangles as any, 'borderRadius')
    : 'mixed';
  
  /**
   * Update a shape property for all selected shapes
   */
  const updateProperty = useCallback(async (key: keyof ShapeDisplayObject, value: any) => {
    if (!userId) return;
    
    try {
      const updatePromises = selectedShapes.map(shape => {
        // Only update borderRadius for rectangles
        if (key === 'borderRadius' && shape.type !== 'rectangle') {
          return Promise.resolve();
        }
        
        return updateShape(shape.id, userId, { [key]: value });
      });
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error(`[ShapeProperties] Error updating ${key}:`, error);
    }
  }, [selectedShapes, userId]);
  
  return (
    <div className="properties-modal__section">
      <div className="properties-modal__section-title">Shape Properties</div>
      
      <div className="properties-modal__grid">
        {/* Fill Color */}
        <div className="properties-modal__field properties-modal__field--full">
          <label className="properties-modal__label">Fill Color</label>
          <ColorInput
            value={fillColor}
            onChange={(value) => updateProperty('fillColor', value)}
          />
        </div>
        
        {/* Stroke Color */}
        <div className="properties-modal__field properties-modal__field--full">
          <label className="properties-modal__label">Stroke Color</label>
          <ColorInput
            value={strokeColor}
            onChange={(value) => updateProperty('strokeColor', value)}
          />
        </div>
        
        {/* Stroke Width */}
        <div className="properties-modal__field properties-modal__field--full">
          <label className="properties-modal__label">Stroke Width</label>
          <NumberInput
            value={strokeWidth}
            onChange={(value) => updateProperty('strokeWidth', value)}
            min={0}
            max={10}
            step={0.5}
            suffix="px"
          />
        </div>
        
        {/* Border Radius (rectangles only) */}
        {hasBorderRadius && (
          <div className="properties-modal__field properties-modal__field--full">
            <label className="properties-modal__label">
              Border Radius
              {rectangles.length !== selectedShapes.length && (
                <span className="properties-modal__label-note"> (rectangles only)</span>
              )}
            </label>
            <NumberInput
              value={typeof borderRadius === 'number' ? borderRadius : 'mixed'}
              onChange={(value) => updateProperty('borderRadius', value)}
              min={0}
              max={50}
              step={1}
              suffix="px"
            />
          </div>
        )}
      </div>
    </div>
  );
}

