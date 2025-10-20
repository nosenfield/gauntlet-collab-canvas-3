/**
 * Text Properties Component
 * 
 * Displays and allows editing of text-specific properties:
 * - Content
 * - Font Family
 * - Font Size
 * - Font Weight
 * - Text Alignment
 * - Line Height
 * - Text Color
 */

import React, { useState, useCallback } from 'react';
import type { TextDisplayObject } from '@/features/displayObjects/texts/types';
import { updateTextsBatch } from '@/features/displayObjects/texts/services/textService';
import { NumberInput } from './NumberInput';
import { ColorInput } from './ColorInput';
import { roundNumericProperty } from '../../utils/transformMath';

interface TextPropertiesProps {
  selectedTexts: TextDisplayObject[];
  userId: string | undefined;
}

/**
 * Get common value across selected texts
 */
function getCommonValue<T>(texts: TextDisplayObject[], key: keyof TextDisplayObject): T | 'mixed' {
  if (texts.length === 0) return 'mixed';
  
  const firstValue = texts[0][key];
  const allSame = texts.every(text => text[key] === firstValue);
  
  return allSame ? (firstValue as T) : 'mixed';
}

const FONT_FAMILIES = ['Arial', 'Helvetica', 'Times New Roman', 'Courier', 'Georgia'];
const TEXT_ALIGNMENTS = ['left', 'center', 'right', 'justify'] as const;

export function TextProperties({ selectedTexts, userId }: TextPropertiesProps): React.ReactElement {
  // Get common values
  const content = getCommonValue<string>(selectedTexts, 'content');
  const fontFamily = getCommonValue<string>(selectedTexts, 'fontFamily');
  const fontSize = getCommonValue<number>(selectedTexts, 'fontSize');
  const fontWeight = getCommonValue<number>(selectedTexts, 'fontWeight');
  const textAlign = getCommonValue<string>(selectedTexts, 'textAlign');
  const lineHeight = getCommonValue<number>(selectedTexts, 'lineHeight');
  const color = getCommonValue<string>(selectedTexts, 'color');
  
  const [editingContent, setEditingContent] = useState<string>('');
  const [isEditingContent, setIsEditingContent] = useState(false);
  
  /**
   * Update a text property for all selected texts
   * Uses batch updates for performance with multiple texts
   */
  const updateProperty = useCallback(async (key: keyof TextDisplayObject, value: any) => {
    if (!userId) return;
    
    try {
      if (selectedTexts.length === 0) return;
      
      // Round numeric properties to 2 decimal places
      const processedValue = (key === 'fontSize' || key === 'lineHeight') 
        ? roundNumericProperty(value)
        : value;
      
      // Batch update all texts
      const batchUpdates = selectedTexts.map(text => ({
        textId: text.id,
        updates: { [key]: processedValue },
      }));
      
      await updateTextsBatch(userId, batchUpdates);
    } catch (error) {
      console.error(`[TextProperties] Error updating ${key}:`, error);
    }
  }, [selectedTexts, userId]);
  
  // Content editing handlers
  const handleContentFocus = () => {
    setIsEditingContent(true);
    setEditingContent(content === 'mixed' ? '' : content);
  };
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditingContent(e.target.value);
  };
  
  const handleContentBlur = () => {
    setIsEditingContent(false);
    if (editingContent !== content && editingContent.trim() !== '') {
      updateProperty('content', editingContent);
    }
  };
  
  return (
    <div className="properties-modal__section">
      <div className="properties-modal__section-title">Text Properties</div>
      
      <div className="properties-modal__grid">
        {/* Content */}
        <div className="properties-modal__field properties-modal__field--full">
          <label className="properties-modal__label">Content</label>
          <textarea
            className={`properties-modal__textarea ${content === 'mixed' ? 'properties-modal__textarea--mixed' : ''}`}
            value={isEditingContent ? editingContent : (content === 'mixed' ? 'Mixed' : content)}
            onChange={handleContentChange}
            onFocus={handleContentFocus}
            onBlur={handleContentBlur}
            rows={3}
          />
        </div>
        
        {/* Font Family */}
        <div className="properties-modal__field properties-modal__field--full">
          <label className="properties-modal__label">Font Family</label>
          <select
            className="properties-modal__select"
            value={fontFamily === 'mixed' ? '' : fontFamily}
            onChange={(e) => updateProperty('fontFamily', e.target.value)}
          >
            {fontFamily === 'mixed' && <option value="">Mixed</option>}
            {FONT_FAMILIES.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>
        
        {/* Font Size */}
        <div className="properties-modal__field">
          <label className="properties-modal__label">Font Size</label>
          <NumberInput
            value={fontSize}
            onChange={(value) => updateProperty('fontSize', value)}
            min={12}
            max={72}
            step={1}
            suffix="px"
          />
        </div>
        
        {/* Font Weight */}
        <div className="properties-modal__field">
          <label className="properties-modal__label">Font Weight</label>
          <select
            className="properties-modal__select"
            value={fontWeight === 'mixed' ? '' : fontWeight}
            onChange={(e) => updateProperty('fontWeight', parseInt(e.target.value))}
          >
            {fontWeight === 'mixed' && <option value="">Mixed</option>}
            <option value="100">Thin (100)</option>
            <option value="200">Extra Light (200)</option>
            <option value="300">Light (300)</option>
            <option value="400">Normal (400)</option>
            <option value="500">Medium (500)</option>
            <option value="600">Semi Bold (600)</option>
            <option value="700">Bold (700)</option>
            <option value="800">Extra Bold (800)</option>
            <option value="900">Black (900)</option>
          </select>
        </div>
        
        {/* Text Alignment */}
        <div className="properties-modal__field properties-modal__field--full">
          <label className="properties-modal__label">Text Alignment</label>
          <div className="properties-modal__button-group">
            {TEXT_ALIGNMENTS.map(align => (
              <button
                key={align}
                className={`properties-modal__button ${textAlign === align ? 'properties-modal__button--active' : ''}`}
                onClick={() => updateProperty('textAlign', align)}
                title={align}
              >
                {align === 'left' && '⬅'}
                {align === 'center' && '⬌'}
                {align === 'right' && '➡'}
                {align === 'justify' && '☰'}
              </button>
            ))}
          </div>
        </div>
        
        {/* Line Height */}
        <div className="properties-modal__field properties-modal__field--full">
          <label className="properties-modal__label">Line Height</label>
          <NumberInput
            value={lineHeight}
            onChange={(value) => updateProperty('lineHeight', value)}
            min={0.8}
            max={3.0}
            step={0.1}
            suffix="×"
          />
        </div>
        
        {/* Text Color */}
        <div className="properties-modal__field properties-modal__field--full">
          <label className="properties-modal__label">Text Color</label>
          <ColorInput
            value={color}
            onChange={(value) => updateProperty('color', value)}
          />
        </div>
      </div>
    </div>
  );
}

