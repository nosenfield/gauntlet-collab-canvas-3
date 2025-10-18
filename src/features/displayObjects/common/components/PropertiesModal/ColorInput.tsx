/**
 * Color Input Component
 * 
 * Color picker with hex input field.
 * Supports mixed values for multi-selection.
 */

import React, { useState, useEffect } from 'react';

interface ColorInputProps {
  value: string | 'mixed';
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ColorInput({ value, onChange, disabled = false }: ColorInputProps): React.ReactElement {
  const [hexValue, setHexValue] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);
  
  // Update hex value when prop changes (if not focused)
  useEffect(() => {
    if (!isFocused) {
      if (value === 'mixed') {
        setHexValue('Mixed');
      } else {
        setHexValue(value);
      }
    }
  }, [value, isFocused]);
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    onChange(newColor);
  };
  
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHexValue(e.target.value);
  };
  
  const handleHexBlur = () => {
    setIsFocused(false);
    
    // Validate hex format
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    if (hexPattern.test(hexValue)) {
      onChange(hexValue);
    } else if (value !== 'mixed') {
      // Reset to current value if invalid
      setHexValue(value);
    }
  };
  
  const handleHexFocus = () => {
    setIsFocused(true);
    if (value === 'mixed') {
      setHexValue('#');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };
  
  return (
    <div className="color-input">
      <input
        type="color"
        className="color-input__picker"
        value={value === 'mixed' ? '#000000' : value}
        onChange={handleColorChange}
        disabled={disabled}
      />
      <input
        type="text"
        className={`color-input__hex ${value === 'mixed' ? 'color-input__hex--mixed' : ''}`}
        value={hexValue}
        onChange={handleHexChange}
        onFocus={handleHexFocus}
        onBlur={handleHexBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="#000000"
      />
    </div>
  );
}

