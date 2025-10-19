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
import type { ShapeDisplayObject, RectangleShape } from '@/features/displayObjects/shapes/types';
import { updateShapesBatch } from '@/features/displayObjects/shapes/services/shapeService';
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

/**
 * Get common value for rectangle-specific properties
 */
function getRectangleCommonValue<T>(rectangles: RectangleShape[], key: keyof RectangleShape): T | 'mixed' {
  if (rectangles.length === 0) return 'mixed';
  
  const firstValue = rectangles[0][key];
  const allSame = rectangles.every(rect => rect[key] === firstValue);
  
  return allSame ? (firstValue as T) : 'mixed';
}

export function ShapeProperties({ selectedShapes, userId }: ShapePropertiesProps): React.ReactElement {
  // Get common values
  const fillColor = getCommonValue<string>(selectedShapes, 'fillColor');
  const strokeColor = getCommonValue<string>(selectedShapes, 'strokeColor');
  const strokeWidth = getCommonValue<number>(selectedShapes, 'strokeWidth');
  
  // Check if all selected shapes are lines (lines don't have fill)
  const allLines = selectedShapes.length > 0 && selectedShapes.every(s => s.type === 'line');
  
  // Border radius only for rectangles
  const rectangles = selectedShapes.filter((s): s is RectangleShape => s.type === 'rectangle');
  const hasBorderRadius = rectangles.length > 0;
  const borderRadius = hasBorderRadius 
    ? getRectangleCommonValue<number | undefined>(rectangles, 'borderRadius')
    : 'mixed';
  
  /**
   * Update a shape property for all selected shapes
   * Uses batch updates for performance with multiple shapes
   */
  const updateProperty = useCallback(async (key: keyof ShapeDisplayObject, value: any) => {
    if (!userId) return;
    
    try {
      // Batch update all shapes
      const batchUpdates = selectedShapes.map(shape => ({
        shapeId: shape.id,
        updates: { [key]: value },
      }));
      
      await updateShapesBatch(userId, batchUpdates);
    } catch (error) {
      console.error(`[ShapeProperties] Error updating ${key}:`, error);
    }
  }, [selectedShapes, userId]);
  
  /**
   * Update rectangle-specific properties
   */
  const updateRectangleProperty = useCallback(async (key: keyof RectangleShape, value: any) => {
    if (!userId || rectangles.length === 0) return;
    
    try {
      // Only update rectangles
      const batchUpdates = rectangles.map(rect => ({
        shapeId: rect.id,
        updates: { [key]: value },
      }));
      
      await updateShapesBatch(userId, batchUpdates);
    } catch (error) {
      console.error(`[ShapeProperties] Error updating ${key}:`, error);
    }
  }, [rectangles, userId]);
  
  return (
    <div className="properties-modal__section">
      <div className="properties-modal__section-title">Shape Properties</div>
      
      <div className="properties-modal__grid">
        {/* Fill Color */}
        <div className="properties-modal__field properties-modal__field--full">
          <label className="properties-modal__label">
            Fill Color
            {allLines && <span className="properties-modal__label-note"> (not available for lines)</span>}
          </label>
          <ColorInput
            value={fillColor}
            onChange={(value) => updateProperty('fillColor', value)}
            disabled={allLines}
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
              onChange={(value) => updateRectangleProperty('borderRadius', value)}
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

