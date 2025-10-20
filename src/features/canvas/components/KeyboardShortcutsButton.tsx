/**
 * Keyboard Shortcuts Button Component
 * 
 * Button positioned in the lower right corner to open keyboard shortcuts modal
 */

import { useState } from 'react';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import './KeyboardShortcutsButton.css';

/**
 * Keyboard Shortcuts Button Component
 */
export function KeyboardShortcutsButton(): React.ReactElement {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        className="keyboard-shortcuts-button"
        onClick={() => setIsModalOpen(true)}
        title="Keyboard Shortcuts"
        aria-label="View keyboard shortcuts"
      >
        <span className="keyboard-shortcuts-button__label">show hotkeys</span>
      </button>

      <KeyboardShortcutsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

