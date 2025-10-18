/**
 * Properties Modal Component
 * 
 * Displays editable properties for selected display objects.
 * Separates universal properties (x, y, rotation, etc.) from
 * object-specific properties (fill color, font, etc.)
 */

import React, { useMemo } from 'react';
import { useSelection } from '../store/selectionStore';
import { useShapes } from '@/features/displayObjects/shapes/store/shapesStore';
import { useTexts } from '@/features/displayObjects/texts/store/textsStore';
import { useAuth } from '@/features/auth/store/authStore';
import type { TransformableObject } from '../types';
import type { ShapeDisplayObject } from '@/features/displayObjects/shapes/types';
import type { TextDisplayObject } from '@/features/displayObjects/texts/types';
import { UniversalProperties } from './PropertiesModal/UniversalProperties';
import { ShapeProperties } from './PropertiesModal/ShapeProperties';
import { TextProperties } from './PropertiesModal/TextProperties';
import './PropertiesModal.css';

/**
 * Properties Modal Component
 * 
 * Shows when objects are selected.
 * Displays universal properties and object-specific properties.
 */
export function PropertiesModal(): React.ReactElement | null {
  const { selectedIds } = useSelection();
  const { shapes } = useShapes();
  const { texts } = useTexts();
  const { user } = useAuth();
  
  // Get selected objects
  const selectedObjects = useMemo((): TransformableObject[] => {
    const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
    const selectedTexts = texts.filter(t => selectedIds.includes(t.id));
    return [...selectedShapes, ...selectedTexts];
  }, [shapes, texts, selectedIds]);
  
  // Don't show modal if nothing is selected
  if (selectedObjects.length === 0) {
    return null;
  }
  
  // Determine if all selected objects are of the same category
  const categories = new Set(selectedObjects.map(obj => obj.category));
  const isSingleCategory = categories.size === 1;
  const category = isSingleCategory ? Array.from(categories)[0] : null;
  
  // For object-specific properties, we need typed objects
  const selectedShapes = selectedObjects.filter(obj => obj.category === 'shape') as ShapeDisplayObject[];
  const selectedTexts = selectedObjects.filter(obj => obj.category === 'text') as TextDisplayObject[];
  
  return (
    <div className="properties-modal">
      <div className="properties-modal__container">
        {/* Header */}
        <div className="properties-modal__header">
          <h3 className="properties-modal__title">
            Properties
          </h3>
          <div className="properties-modal__subtitle">
            {selectedObjects.length} {selectedObjects.length === 1 ? 'object' : 'objects'} selected
          </div>
        </div>
        
        {/* Scrollable content */}
        <div className="properties-modal__content">
          {/* Universal Properties Section */}
          <UniversalProperties 
            selectedObjects={selectedObjects}
            userId={user?.userId}
          />
          
          {/* Object-Specific Properties Section */}
          {isSingleCategory && category === 'shape' && selectedShapes.length > 0 && (
            <ShapeProperties 
              selectedShapes={selectedShapes}
              userId={user?.userId}
            />
          )}
          
          {isSingleCategory && category === 'text' && selectedTexts.length > 0 && (
            <TextProperties 
              selectedTexts={selectedTexts}
              userId={user?.userId}
            />
          )}
          
          {/* Mixed selection message */}
          {!isSingleCategory && (
            <div className="properties-modal__section">
              <div className="properties-modal__section-title">Object-Specific Properties</div>
              <div className="properties-modal__mixed-message">
                Mixed selection: Select objects of the same type to edit specific properties.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

