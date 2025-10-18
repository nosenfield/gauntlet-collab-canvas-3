/**
 * Number Input Component
 * 
 * Reusable number input with support for:
 * - Mixed values (when multiple objects have different values)
 * - Min/max constraints
 * - Step increments
 * - Optional suffix (px, °, ×, %)
 */

import React, { useState, useEffect } from 'react';

interface NumberInputProps {
  value: number | 'mixed';
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  disabled?: boolean;
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = '',
  disabled = false,
}: NumberInputProps): React.ReactElement {
  const [inputValue, setInputValue] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);
  
  // Update input value when prop changes (if not focused)
  useEffect(() => {
    if (!isFocused) {
      if (value === 'mixed') {
        setInputValue('Mixed');
      } else {
        setInputValue(value.toString());
      }
    }
  }, [value, isFocused]);
  
  const handleFocus = () => {
    setIsFocused(true);
    if (value === 'mixed') {
      setInputValue('');
    }
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    
    // Parse and validate input
    const numValue = parseFloat(inputValue);
    
    if (!isNaN(numValue)) {
      let finalValue = numValue;
      
      // Apply constraints
      if (min !== undefined && finalValue < min) finalValue = min;
      if (max !== undefined && finalValue > max) finalValue = max;
      
      onChange(finalValue);
    } else if (value !== 'mixed') {
      // Reset to current value if invalid
      setInputValue(value.toString());
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const currentValue = value === 'mixed' ? 0 : value;
      const newValue = currentValue + step;
      onChange(max !== undefined ? Math.min(newValue, max) : newValue);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const currentValue = value === 'mixed' ? 0 : value;
      const newValue = currentValue - step;
      onChange(min !== undefined ? Math.max(newValue, min) : newValue);
    }
  };
  
  return (
    <div className="number-input">
      <input
        type="text"
        className={`number-input__field ${value === 'mixed' ? 'number-input__field--mixed' : ''}`}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      {suffix && <span className="number-input__suffix">{suffix}</span>}
    </div>
  );
}

