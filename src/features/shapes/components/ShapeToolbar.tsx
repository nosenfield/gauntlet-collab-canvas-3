/**
 * Shape Toolbar Component
 * 
 * Displays tool selection buttons at top of screen.
 * Allows users to switch between selection and shape creation tools.
 */

import { useTool } from '../hooks/useTool';
import type { CanvasTool } from '../store/toolStore';
import './ShapeToolbar.css';

/**
 * Tool Button Component
 */
interface ToolButtonProps {
  label: string;
  icon: string;
  isSelected: boolean;
  onClick: () => void;
}

function ToolButton({ label, icon, isSelected, onClick }: ToolButtonProps) {
  return (
    <button
      className={`tool-button ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={isSelected}
    >
      <span className="tool-icon">{icon}</span>
      <span className="tool-label">{label}</span>
    </button>
  );
}

/**
 * Shape Toolbar Component
 */
export function ShapeToolbar() {
  const { currentTool, setTool, isToolSelected } = useTool();

  const tools: Array<{ tool: CanvasTool; label: string; icon: string }> = [
    { tool: 'select', label: 'Select', icon: '⬆️' },
    { tool: 'rectangle', label: 'Rectangle', icon: '▭' },
    { tool: 'circle', label: 'Circle', icon: '◯' },
    { tool: 'line', label: 'Line', icon: '⟍' },
  ];

  return (
    <div className="shape-toolbar">
      <div className="toolbar-section">
        <span className="toolbar-title">Tools</span>
      </div>
      <div className="toolbar-section toolbar-tools">
        {tools.map(({ tool, label, icon }) => (
          <ToolButton
            key={tool}
            label={label}
            icon={icon}
            isSelected={isToolSelected(tool)}
            onClick={() => setTool(tool)}
          />
        ))}
      </div>
      <div className="toolbar-section toolbar-info">
        <span className="current-tool-label">
          Current: <strong>{currentTool}</strong>
        </span>
      </div>
    </div>
  );
}

