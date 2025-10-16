/**
 * Toolbar Component
 * 
 * Fixed toolbar at the top of the viewport with drawing tools.
 * Provides visual feedback for active tools and manages drawing state.
 */

import React from 'react';
import type { CanvasHook } from '@/types';
import './Toolbar.css';

/**
 * Toolbar component props
 */
interface ToolbarProps {
  className?: string;
  canvasHook: CanvasHook;
}

/**
 * Toolbar component
 */
export const Toolbar: React.FC<ToolbarProps> = ({ className, canvasHook }) => {
  const { tool, grid, setActiveTool, toggleGrid } = canvasHook;

  /**
   * Handle tool selection
   */
  const handleToolSelect = (toolType: 'rectangle' | 'none') => {
    setActiveTool(toolType);
  };

  return (
    <div className={`toolbar ${className || ''}`}>
      <div className="toolbar-content">
        <h2 className="toolbar-title">CollabCanvas</h2>
        
        <div className="toolbar-tools">
          <button
            className={`toolbar-button ${tool.activeTool === 'none' ? 'active' : ''}`}
            onClick={() => handleToolSelect('none')}
            title="Select Tool"
          >
            <span className="toolbar-icon">↖</span>
            Select
          </button>
          
          <button
            className={`toolbar-button ${tool.activeTool === 'rectangle' ? 'active' : ''}`}
            onClick={() => handleToolSelect('rectangle')}
            title="Draw Rectangle"
          >
            <span className="toolbar-icon">▭</span>
            Rectangle
          </button>
          
          <button
            className={`toolbar-button ${grid.isVisible ? 'active' : ''}`}
            onClick={toggleGrid}
            title="Toggle Grid"
          >
            <span className="toolbar-icon">⊞</span>
            Grid
          </button>
        </div>
        
        <div className="toolbar-status">
          <span className="status-text">
            {tool.activeTool === 'none' ? 'Pan/Zoom Mode' : `${tool.activeTool} Tool Active`}
          </span>
        </div>
      </div>
    </div>
  );
};