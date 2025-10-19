/**
 * Z-Index Controls Component
 * 
 * Contextual toolbar for managing z-index of selected objects
 * Appears when objects are selected
 * 
 * Features:
 * - Bring to Front (Cmd+Shift+])
 * - Send to Back (Cmd+Shift+[)
 * - Bring Forward (Cmd+])
 * - Send Backward (Cmd+[)
 */

import { useEffect } from 'react';
import { useZIndexManagement } from '../hooks/useZIndexManagement';
import { useSelection } from '../store/selectionStore';
import './ZIndexControls.css';

/**
 * Z-Index Controls Component
 * 
 * Displays z-index manipulation buttons when objects are selected
 */
export function ZIndexControls() {
  const { selectedIds } = useSelection();
  const {
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    hasSelection,
  } = useZIndexManagement();

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when objects are selected
      if (!hasSelection) return;
      
      // Detect Mac vs Windows/Linux
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      
      // Cmd/Ctrl + Shift + ] - Bring to Front
      if (ctrlOrCmd && e.shiftKey && e.key === ']') {
        e.preventDefault();
        bringToFront();
      }
      
      // Cmd/Ctrl + Shift + [ - Send to Back
      else if (ctrlOrCmd && e.shiftKey && e.key === '[') {
        e.preventDefault();
        sendToBack();
      }
      
      // Cmd/Ctrl + ] - Bring Forward
      else if (ctrlOrCmd && !e.shiftKey && e.key === ']') {
        e.preventDefault();
        bringForward();
      }
      
      // Cmd/Ctrl + [ - Send Backward
      else if (ctrlOrCmd && !e.shiftKey && e.key === '[') {
        e.preventDefault();
        sendBackward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasSelection, bringToFront, sendToBack, bringForward, sendBackward]);

  // Don't render if no objects are selected
  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <div className="zindex-controls">
      <div className="zindex-controls__container">
        <div className="zindex-controls__label">Layer Order:</div>
        
        <button
          className="zindex-controls__button"
          onClick={bringToFront}
          title="Bring to Front (Cmd+Shift+])"
          aria-label="Bring to Front"
        >
          <span className="zindex-controls__icon">⬆⬆</span>
          <span className="zindex-controls__text">To Front</span>
        </button>
        
        <button
          className="zindex-controls__button"
          onClick={bringForward}
          title="Bring Forward (Cmd+])"
          aria-label="Bring Forward"
        >
          <span className="zindex-controls__icon">⬆</span>
          <span className="zindex-controls__text">Forward</span>
        </button>
        
        <button
          className="zindex-controls__button"
          onClick={sendBackward}
          title="Send Backward (Cmd+[)"
          aria-label="Send Backward"
        >
          <span className="zindex-controls__icon">⬇</span>
          <span className="zindex-controls__text">Backward</span>
        </button>
        
        <button
          className="zindex-controls__button"
          onClick={sendToBack}
          title="Send to Back (Cmd+Shift+[)"
          aria-label="Send to Back"
        >
          <span className="zindex-controls__icon">⬇⬇</span>
          <span className="zindex-controls__text">To Back</span>
        </button>
      </div>
    </div>
  );
}

