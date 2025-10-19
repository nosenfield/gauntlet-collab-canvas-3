/**
 * Display Object Toolbar
 * 
 * Horizontal toolbar for selecting display object creation tools
 * Location: Fixed at top of screen, below any app header
 */

import { useEffect, useCallback } from 'react';
import { useTool, type ToolType, TOOL_LABELS } from '../store/toolStore';
import { deleteShape } from '@/features/displayObjects/shapes/services/shapeService';
import { deleteText } from '@/features/displayObjects/texts/services/textService';
import { useSelection } from '../store/selectionStore';
import { useShapes } from '@/features/displayObjects/shapes/store/shapesStore';
import { useTexts } from '@/features/displayObjects/texts/store/textsStore';
import { useAIModal } from '@/features/aiAgent/hooks/useAIModal';
import { AICommandModal } from '@/features/aiAgent/components/AICommandModal';
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
  text: 'T',
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
      case 'text':
        return 'T'; // Text
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
  const { selectedIds, clearSelection } = useSelection();
  const { shapes } = useShapes();
  const { texts } = useTexts();
  const { isOpen, openModal, closeModal } = useAIModal();

  const tools: ToolType[] = ['select', 'rectangle', 'circle', 'line', 'text'];

  const handleToolClick = (tool: ToolType) => {
    setTool(tool);
  };

  const handleDelete = useCallback(async () => {
    if (selectedIds.length === 0) {
      return;
    }
    
    try {
      // Determine which IDs are shapes vs texts by checking the stores
      const shapeIds = new Set(shapes.map(s => s.id));
      const textIds = new Set(texts.map(t => t.id));
      
      // Delete all selected objects
      const deletePromises = selectedIds.map(async (id) => {
        if (shapeIds.has(id)) {
          return deleteShape(id);
        } else if (textIds.has(id)) {
          return deleteText(id);
        }
        // If ID not found, log warning but continue
        console.warn(`[Toolbar] Could not find object with ID: ${id}`);
      });
      
      await Promise.all(deletePromises);
      
      console.log(`[Toolbar] Deleted ${selectedIds.length} objects from canvas`);
      
      // Clear selection after deletion
      clearSelection();
    } catch (error) {
      console.error('[Toolbar] Error deleting objects:', error);
      alert('Failed to delete objects. Please try again.');
    }
  }, [selectedIds, shapes, texts, clearSelection]);

  // Keyboard shortcut for delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Delete or Backspace key is pressed
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't trigger if user is typing in an input/textarea
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        
        // Prevent default backspace navigation
        e.preventDefault();
        
        // Delete selected objects
        if (selectedIds.length > 0) {
          handleDelete();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, handleDelete]);

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
        
        {/* AI Commands Button */}
        <button
          className="tool-button tool-button--ai"
          onClick={openModal}
          title="AI Commands (Spacebar)"
          aria-label="AI Commands"
        >
          <span className="tool-button__icon">✨</span>
          <span className="tool-button__label">AI</span>
          <span className="tool-button__shortcut">Spacebar</span>
        </button>
        
        {/* Delete Button */}
        <button
          className="tool-button tool-button--danger"
          onClick={handleDelete}
          disabled={selectedIds.length === 0}
          title={selectedIds.length > 0 ? `Delete ${selectedIds.length} selected object${selectedIds.length > 1 ? 's' : ''} (Del)` : 'Delete (select objects first)'}
          aria-label="Delete selected objects"
        >
          <span className="tool-button__icon">🗑️</span>
          <span className="tool-button__label">Delete</span>
          <span className="tool-button__shortcut">Del</span>
        </button>
      </div>
      
      {/* AI Command Modal */}
      <AICommandModal isOpen={isOpen} onClose={closeModal} />
    </div>
  );
}

