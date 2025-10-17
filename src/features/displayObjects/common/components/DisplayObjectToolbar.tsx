/**
 * Display Object Toolbar
 * 
 * Horizontal toolbar for selecting display object creation tools
 * Location: Fixed at top of screen, below any app header
 */

import { useTool, type ToolType, TOOL_LABELS } from '../store/toolStore';
import './DisplayObjectToolbar.css';

/**
 * Tool Button Props
 */
interface ToolButtonProps {
  tool: ToolType;
  isActive: boolean;
  onClick: () => void;
}

/**
 * Tool Button Component
 * Individual button for each tool in the toolbar
 */
function ToolButton({ tool, isActive, onClick }: ToolButtonProps) {
  const label = TOOL_LABELS[tool];
  
  // Get icon for each tool
  const getIcon = () => {
    switch (tool) {
      case 'select':
        return '↖'; // Cursor/pointer icon
      case 'rectangle':
        return '□'; // Rectangle
      case 'circle':
        return '○'; // Circle
      case 'line':
        return '/'; // Line
    }
  };

  return (
    <button
      className={`tool-button ${isActive ? 'tool-button--active' : ''}`}
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={isActive}
    >
      <span className="tool-button__icon">{getIcon()}</span>
      <span className="tool-button__label">{label}</span>
    </button>
  );
}

/**
 * Display Object Toolbar Component
 * 
 * Main toolbar component containing all tool buttons
 * Positioned at top-left of screen
 */
export function DisplayObjectToolbar() {
  const { setTool, isToolActive } = useTool();

  const tools: ToolType[] = ['select', 'rectangle', 'circle', 'line'];

  const handleToolClick = (tool: ToolType) => {
    setTool(tool);
  };

  return (
    <div className="display-object-toolbar">
      <div className="display-object-toolbar__container">
        {tools.map((tool) => (
          <ToolButton
            key={tool}
            tool={tool}
            isActive={isToolActive(tool)}
            onClick={() => handleToolClick(tool)}
          />
        ))}
      </div>
    </div>
  );
}

