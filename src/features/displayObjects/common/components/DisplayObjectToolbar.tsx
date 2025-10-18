/**
 * Display Object Toolbar
 * 
 * Horizontal toolbar for selecting display object creation tools
 * Location: Fixed at top of screen, below any app header
 */

import { useTool, type ToolType, TOOL_LABELS } from '../store/toolStore';
import { deleteAllShapes } from '@/features/displayObjects/shapes/services/shapeService';
import { useSelection } from '../store/selectionStore';
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
 * Tool keyboard shortcuts for display
 */
const TOOL_SHORTCUT_KEYS: Record<ToolType, string> = {
  select: 'V',
  rectangle: 'R',
  circle: 'C',
  line: 'L',
};

/**
 * Tool Button Component
 * Individual button for each tool in the toolbar
 */
function ToolButton({ tool, isActive, onClick }: ToolButtonProps) {
  const label = TOOL_LABELS[tool];
  const shortcut = TOOL_SHORTCUT_KEYS[tool];
  
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
      title={`${label} (${shortcut})`}
      aria-label={`${label} (${shortcut})`}
      aria-pressed={isActive}
    >
      <span className="tool-button__icon">{getIcon()}</span>
      <span className="tool-button__label">{label}</span>
      <span className="tool-button__shortcut">{shortcut}</span>
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
  const { clearSelection } = useSelection();

  const tools: ToolType[] = ['select', 'rectangle', 'circle', 'line'];

  const handleToolClick = (tool: ToolType) => {
    setTool(tool);
  };

  const handleClearAll = async () => {
    // Confirm before deleting
    const confirmed = window.confirm(
      'Are you sure you want to delete all objects from the canvas? This action cannot be undone.'
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      // Clear selection first
      clearSelection();
      
      // Delete all shapes
      const count = await deleteAllShapes();
      console.log(`[Toolbar] Cleared ${count} objects from canvas`);
    } catch (error) {
      console.error('[Toolbar] Error clearing canvas:', error);
      alert('Failed to clear canvas. Please try again.');
    }
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
        
        {/* Separator */}
        <div className="display-object-toolbar__separator" />
        
        {/* Clear All Button */}
        <button
          className="tool-button tool-button--danger"
          onClick={handleClearAll}
          title="Clear All Objects"
          aria-label="Clear All Objects"
        >
          <span className="tool-button__icon">🗑️</span>
          <span className="tool-button__label">Clear All</span>
        </button>
      </div>
    </div>
  );
}

