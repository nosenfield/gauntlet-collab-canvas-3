/**
 * Toolbar Component
 * 
 * Fixed toolbar at the top of the viewport with drawing tools.
 * Provides visual feedback for active tools and manages drawing state.
 */

import React from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import './Toolbar.css';

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