/**
 * Toolbar Component
 * 
 * Fixed toolbar component that provides tool selection
 * and canvas controls. Positioned at the top of the viewport.
 */

import React from 'react';
import { useCanvas } from '@/hooks/useCanvas';

/**
 * Toolbar component props
 */
interface ToolbarProps {
  className?: string;
}

/**
 * Toolbar component
 */
export const Toolbar: React.FC<ToolbarProps> = ({ className }) => {
  const { tool, setActiveTool } = useCanvas();

  /**
   * Handle tool selection
   */
  const handleToolSelect = (selectedTool: 'rectangle' | 'none') => {
    setActiveTool(selectedTool);
  };

  return (
    <div className={`toolbar ${className || ''}`}>
      <div className="toolbar-content">
        <div className="tool-group">
          <h3>Tools</h3>
          <button
            className={`tool-button ${tool.activeTool === 'rectangle' ? 'active' : ''}`}
            onClick={() => handleToolSelect('rectangle')}
            title="Draw Rectangle"
          >
            📦 Draw Rect
          </button>
          <button
            className={`tool-button ${tool.activeTool === 'none' ? 'active' : ''}`}
            onClick={() => handleToolSelect('none')}
            title="Select Tool"
          >
            ✋ Select
          </button>
        </div>
        
        <div className="tool-group">
          <h3>Status</h3>
          <div className="status-indicator">
            {tool.isDrawing ? 'Drawing...' : 'Ready'}
          </div>
        </div>
      </div>
    </div>
  );
};
