/**
 * Blend Mode Selector Component
 * 
 * Dropdown selector for blend modes with visual grouping.
 * Supports all standard Canvas globalCompositeOperation modes.
 */

import React, { useState, useRef, useEffect } from 'react';
import type { BlendMode } from '../../types';
import './BlendModeSelector.css';

/**
 * Blend Mode Option
 * Defines a blend mode option with display label and optional divider
 */
interface BlendModeOption {
  value: BlendMode;
  label: string;
  dividerBefore?: boolean; // Show divider line before this option
}

/**
 * Blend Mode Options with grouping
 * Organized by category with visual dividers
 */
const BLEND_MODE_OPTIONS: BlendModeOption[] = [
  // Basic modes
  { value: 'source-over', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  
  // Advanced modes (divider)
  { value: 'darken', label: 'Darken', dividerBefore: true },
  { value: 'lighten', label: 'Lighten' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'color-burn', label: 'Color Burn' },
  { value: 'hard-light', label: 'Hard Light' },
  { value: 'soft-light', label: 'Soft Light' },
  
  // Difference modes (divider)
  { value: 'difference', label: 'Difference', dividerBefore: true },
  { value: 'exclusion', label: 'Exclusion' },
  
  // Color modes (divider)
  { value: 'hue', label: 'Hue', dividerBefore: true },
  { value: 'saturation', label: 'Saturation' },
  { value: 'color', label: 'Color' },
  { value: 'luminosity', label: 'Luminosity' },
  
  // Special modes (divider)
  { value: 'xor', label: 'XOR', dividerBefore: true },
];

/**
 * Get display label for a blend mode value
 */
function getBlendModeLabel(value: BlendMode | 'mixed'): string {
  if (value === 'mixed') return 'Mixed';
  const option = BLEND_MODE_OPTIONS.find(opt => opt.value === value);
  return option ? option.label : 'Normal';
}

/**
 * BlendModeSelector Props
 */
export interface BlendModeSelectorProps {
  value: BlendMode | 'mixed';
  onChange: (blendMode: BlendMode) => void;
  disabled?: boolean;
}

/**
 * BlendModeSelector Component
 * 
 * Dropdown menu for selecting blend modes.
 * Features:
 * - Visual grouping with dividers
 * - Keyboard navigation (arrow keys, Enter, Escape)
 * - Click outside to close
 * - Mixed state support for multi-selection
 */
export function BlendModeSelector({
  value,
  onChange,
  disabled = false,
}: BlendModeSelectorProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  /**
   * Handle click on dropdown button
   */
  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        // When opening, focus the current selection
        const currentIndex = value !== 'mixed' 
          ? BLEND_MODE_OPTIONS.findIndex(opt => opt.value === value)
          : 0;
        setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
      }
    }
  };
  
  /**
   * Handle selecting a blend mode
   */
  const handleSelect = (blendMode: BlendMode) => {
    onChange(blendMode);
    setIsOpen(false);
  };
  
  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => 
          prev < BLEND_MODE_OPTIONS.length - 1 ? prev + 1 : prev
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
        
      case 'Enter':
        e.preventDefault();
        handleSelect(BLEND_MODE_OPTIONS[focusedIndex].value);
        break;
        
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };
  
  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);
  
  /**
   * Scroll focused option into view
   */
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const focusedElement = dropdownRef.current.querySelector(
        `[data-index="${focusedIndex}"]`
      ) as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex, isOpen]);
  
  return (
    <div className="blend-mode-selector" ref={dropdownRef}>
      {/* Label */}
      <label className="blend-mode-selector__label">Blend Mode</label>
      
      {/* Dropdown button */}
      <button
        type="button"
        className={`blend-mode-selector__button ${isOpen ? 'blend-mode-selector__button--open' : ''}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="blend-mode-selector__value">
          {getBlendModeLabel(value)}
        </span>
        <span className="blend-mode-selector__arrow">▼</span>
      </button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <div className="blend-mode-selector__dropdown" role="listbox">
          {BLEND_MODE_OPTIONS.map((option, index) => (
            <React.Fragment key={option.value}>
              {/* Divider before groups */}
              {option.dividerBefore && (
                <div className="blend-mode-selector__divider" role="separator" />
              )}
              
              {/* Option */}
              <button
                type="button"
                className={`blend-mode-selector__option ${
                  value === option.value ? 'blend-mode-selector__option--selected' : ''
                } ${
                  focusedIndex === index ? 'blend-mode-selector__option--focused' : ''
                }`}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => setFocusedIndex(index)}
                data-index={index}
                role="option"
                aria-selected={value === option.value}
              >
                {option.label}
                {value === option.value && (
                  <span className="blend-mode-selector__checkmark">✓</span>
                )}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

