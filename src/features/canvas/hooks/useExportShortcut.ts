/**
 * useExportShortcut Hook
 * 
 * Handles Cmd+S keyboard shortcut for exporting the canvas
 */

import { useEffect } from 'react';

interface UseExportShortcutParams {
  onExport: () => void;
}

/**
 * Custom hook to listen for Cmd+S and trigger export
 */
export function useExportShortcut({ onExport }: UseExportShortcutParams) {
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

      // Check for Cmd+S (Mac) or Ctrl+S (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault(); // Prevent browser's default save behavior
        console.log('[ExportShortcut] Cmd+S pressed - triggering export');
        onExport();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onExport]);
}

