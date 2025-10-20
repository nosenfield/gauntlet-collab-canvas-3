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
import { roundNumericProperty } from '../../utils/transformMath';

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

/**
 * Get common value for dimension properties (width/height)
 * Only works for shapes that have these properties (rectangles and circles)
 */
function getDimensionCommonValue(shapes: ShapeDisplayObject[], key: 'width' | 'height'): number | 'mixed' {
  const shapesWithDimensions = shapes.filter(s => s.type === 'rectangle' || s.type === 'circle');
  if (shapesWithDimensions.length === 0) return 'mixed';
  
  const firstValue = (shapesWithDimensions[0] as any)[key] as number;
  const allSame = shapesWithDimensions.every(shape => (shape as any)[key] === firstValue);
  
  return allSame ? firstValue : 'mixed';
}

export function ShapeProperties({ selectedShapes, userId }: ShapePropertiesProps): React.ReactElement {
  // Get common values
  const fillColor = getCommonValue<string>(selectedShapes, 'fillColor');
  const strokeColor = getCommonValue<string>(selectedShapes, 'strokeColor');
  const strokeWidth = getCommonValue<number>(selectedShapes, 'strokeWidth');
  
  // Check if all selected shapes are lines (lines don't have fill or dimensions)
  const allLines = selectedShapes.length > 0 && selectedShapes.every(s => s.type === 'line');
  
  // Width/Height for rectangles and circles (lines don't have these)
  const shapesWithDimensions = selectedShapes.filter(s => s.type === 'rectangle' || s.type === 'circle');
  const hasDimensions = shapesWithDimensions.length > 0;
  const width = getDimensionCommonValue(selectedShapes, 'width');
  const height = getDimensionCommonValue(selectedShapes, 'height');
  
  // Rectangle-specific properties
  const rectangles = selectedShapes.filter((s): s is RectangleShape => s.type === 'rectangle');
  const hasRectangleProps = rectangles.length > 0;
  const borderRadius = hasRectangleProps 
    ? getRectangleCommonValue<number | undefined>(rectangles, 'borderRadius')
    : 'mixed';
  
  /**
   * Update a shape property for all selected shapes
   * Uses batch updates for performance with multiple shapes
   */
  const updateProperty = useCallback(async (key: keyof ShapeDisplayObject, value: any) => {
    if (!userId) return;
    
    try {
      // Round numeric properties to 2 decimal places
      const processedValue = (key === 'strokeWidth') 
        ? roundNumericProperty(value)
        : value;
      
      // Batch update all shapes
      const batchUpdates = selectedShapes.map(shape => ({
        shapeId: shape.id,
        updates: { [key]: processedValue },
      }));
      
      await updateShapesBatch(userId, batchUpdates);
    } catch (error) {
      console.error(`[ShapeProperties] Error updating ${key}:`, error);
    }
  }, [selectedShapes, userId]);
  
  /**
   * Update dimension properties (width/height for rectangles and circles)
   */
  const updateDimensionProperty = useCallback(async (key: 'width' | 'height', value: number) => {
    if (!userId || shapesWithDimensions.length === 0) return;
    
    try {
      const processedValue = roundNumericProperty(value);
      
      // Update all shapes that have dimensions (rectangles and circles)
      const batchUpdates = shapesWithDimensions.map(shape => ({
        shapeId: shape.id,
        updates: { [key]: processedValue },
      }));
      
      await updateShapesBatch(userId, batchUpdates);
    } catch (error) {
      console.error(`[ShapeProperties] Error updating ${key}:`, error);
    }
  }, [shapesWithDimensions, userId]);
  
  /**
   * Update rectangle-specific properties (border radius only)
   */
  const updateRectangleProperty = useCallback(async (key: keyof RectangleShape, value: any) => {
    if (!userId || rectangles.length === 0) return;
    
    try {
      // Round numeric properties to 2 decimal places
      const processedValue = (key === 'borderRadius') 
        ? roundNumericProperty(value)
        : value;
      
      // Only update rectangles
      const batchUpdates = rectangles.map(rect => ({
        shapeId: rect.id,
        updates: { [key]: processedValue },
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
        {/* Width (rectangles and circles) */}
        {hasDimensions && (
          <div className="properties-modal__field">
            <label className="properties-modal__label">
              Width
              {shapesWithDimensions.length !== selectedShapes.length && (
                <span className="properties-modal__label-note"> (not for lines)</span>
              )}
            </label>
            <NumberInput
              value={width}
              onChange={(value) => updateDimensionProperty('width', value)}
              min={1}
              max={2000}
              step={1}
              suffix="px"
            />
          </div>
        )}
        
        {/* Height (rectangles and circles) */}
        {hasDimensions && (
          <div className="properties-modal__field">
            <label className="properties-modal__label">
              Height
              {shapesWithDimensions.length !== selectedShapes.length && (
                <span className="properties-modal__label-note"> (not for lines)</span>
              )}
            </label>
            <NumberInput
              value={height}
              onChange={(value) => updateDimensionProperty('height', value)}
              min={1}
              max={2000}
              step={1}
              suffix="px"
            />
          </div>
        )}
        
        {/* Fill Color */}
        <div className="properties-modal__field properties-modal__field--full">
          <label className="properties-modal__label">
            Fill Color
            {allLines && <span className="properties-modal__label-note"> (not available for lines)</span>}
          </label>
          <ColorInput
            value={fillColor}
            onChange={(value: string) => updateProperty('fillColor', value)}
            disabled={allLines}
          />
        </div>
        
        {/* Stroke Color */}
        <div className="properties-modal__field properties-modal__field--full">
          <label className="properties-modal__label">Stroke Color</label>
          <ColorInput
            value={strokeColor}
            onChange={(value: string) => updateProperty('strokeColor', value)}
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
        {hasRectangleProps && (
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

