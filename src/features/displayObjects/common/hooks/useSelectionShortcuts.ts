/**
 * useSelectionShortcuts Hook
 * 
 * Handles keyboard shortcuts for selection operations
 * - CMD+A / CTRL+A: Select all display objects
 */

import { useEffect } from 'react';
import { useSelection } from '../store/selectionStore';
import { useShapes } from '../../shapes/store/shapesStore';
import { useTexts } from '../../texts/store/textsStore';

/**
 * useSelectionShortcuts
 * 
 * Listens for selection keyboard shortcuts and performs actions accordingly.
 * Shortcuts work when user is not typing in an input field.
 */
export function useSelectionShortcuts() {
  const { setSelection } = useSelection();
  const { shapes } = useShapes();
  const { texts } = useTexts();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Detect Mac vs Windows/Linux
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      // CMD/CTRL + A - Select All
      if (ctrlOrCmd && event.key === 'a') {
        event.preventDefault();
        
        // Get all display object IDs (shapes + texts)
        const allIds = [
          ...shapes.map(s => s.id),
          ...texts.map(t => t.id),
        ];
        
        if (allIds.length > 0) {
          setSelection(allIds);
          console.log(`[SelectionShortcuts] Selected all ${allIds.length} objects (CMD+A)`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelection, shapes, texts]);
}

