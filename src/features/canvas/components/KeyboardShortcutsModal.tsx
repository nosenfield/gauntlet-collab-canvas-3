/**
 * Keyboard Shortcuts Modal Component
 * 
 * Displays all available keyboard shortcuts in a modal
 */

import { useEffect } from 'react';
import './KeyboardShortcutsModal.css';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Keyboard Shortcuts Modal Component
 */
export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps): React.ReactElement | null {
  
  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  // Detect Mac vs Windows/Linux for display
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  return (
    <div 
      className="shortcuts-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
    >
      <div 
        className="shortcuts-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shortcuts-modal-header">
          <h3 id="shortcuts-modal-title">⌨️ Keyboard Shortcuts</h3>
          <button
            className="shortcuts-close-button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="shortcuts-modal-content">
          {/* File Section */}
          <div className="shortcuts-section">
            <h4 className="shortcuts-section-title">File</h4>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <span className="shortcut-label">Export as PNG</span>
                <div className="shortcut-combo">
                  <kbd className="shortcut-key">{modKey}</kbd>
                  <span className="shortcut-plus">+</span>
                  <kbd className="shortcut-key">S</kbd>
                </div>
              </div>
            </div>
          </div>

          {/* View Section */}
          <div className="shortcuts-section">
            <h4 className="shortcuts-section-title">View</h4>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <span className="shortcut-label">Toggle Grid</span>
                <kbd className="shortcut-key">G</kbd>
              </div>
            </div>
          </div>

          {/* Tools Section */}
          <div className="shortcuts-section">
            <h4 className="shortcuts-section-title">Tools</h4>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <span className="shortcut-label">Select Tool</span>
                <kbd className="shortcut-key">V</kbd>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-label">Rectangle Tool</span>
                <kbd className="shortcut-key">R</kbd>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-label">Circle Tool</span>
                <kbd className="shortcut-key">C</kbd>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-label">Line Tool</span>
                <kbd className="shortcut-key">L</kbd>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-label">Text Tool</span>
                <kbd className="shortcut-key">T</kbd>
              </div>
            </div>
          </div>

          {/* Edit Section */}
          <div className="shortcuts-section">
            <h4 className="shortcuts-section-title">Edit</h4>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <span className="shortcut-label">Select All</span>
                <div className="shortcut-combo">
                  <kbd className="shortcut-key">{modKey}</kbd>
                  <span className="shortcut-plus">+</span>
                  <kbd className="shortcut-key">A</kbd>
                </div>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-label">Copy</span>
                <div className="shortcut-combo">
                  <kbd className="shortcut-key">{modKey}</kbd>
                  <span className="shortcut-plus">+</span>
                  <kbd className="shortcut-key">C</kbd>
                </div>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-label">Paste</span>
                <div className="shortcut-combo">
                  <kbd className="shortcut-key">{modKey}</kbd>
                  <span className="shortcut-plus">+</span>
                  <kbd className="shortcut-key">V</kbd>
                </div>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-label">Paste in Place</span>
                <div className="shortcut-combo">
                  <kbd className="shortcut-key">{modKey}</kbd>
                  <span className="shortcut-plus">+</span>
                  <kbd className="shortcut-key">Shift</kbd>
                  <span className="shortcut-plus">+</span>
                  <kbd className="shortcut-key">V</kbd>
                </div>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-label">Delete Selected</span>
                <kbd className="shortcut-key">Del / Backspace</kbd>
              </div>
            </div>
          </div>

          {/* Movement Section */}
          <div className="shortcuts-section">
            <h4 className="shortcuts-section-title">Movement</h4>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <span className="shortcut-label">Move 1px</span>
                <kbd className="shortcut-key">Arrow Keys</kbd>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-label">Move 10px</span>
                <div className="shortcut-combo">
                  <kbd className="shortcut-key">Shift</kbd>
                  <span className="shortcut-plus">+</span>
                  <kbd className="shortcut-key">Arrow Keys</kbd>
                </div>
              </div>
            </div>
          </div>

          {/* Layer Order Section */}
          <div className="shortcuts-section">
            <h4 className="shortcuts-section-title">Layer Order</h4>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <span className="shortcut-label">Bring to Front</span>
                <div className="shortcut-combo">
                  <kbd className="shortcut-key">{modKey}</kbd>
                  <span className="shortcut-plus">+</span>
                  <kbd className="shortcut-key">Shift</kbd>
                  <span className="shortcut-plus">+</span>
                  <kbd className="shortcut-key">]</kbd>
                </div>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-label">Bring Forward</span>
                <div className="shortcut-combo">
                  <kbd className="shortcut-key">{modKey}</kbd>
                  <span className="shortcut-plus">+</span>
                  <kbd className="shortcut-key">]</kbd>
                </div>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-label">Send Backward</span>
                <div className="shortcut-combo">
                  <kbd className="shortcut-key">{modKey}</kbd>
                  <span className="shortcut-plus">+</span>
                  <kbd className="shortcut-key">[</kbd>
                </div>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-label">Send to Back</span>
                <div className="shortcut-combo">
                  <kbd className="shortcut-key">{modKey}</kbd>
                  <span className="shortcut-plus">+</span>
                  <kbd className="shortcut-key">Shift</kbd>
                  <span className="shortcut-plus">+</span>
                  <kbd className="shortcut-key">[</kbd>
                </div>
              </div>
            </div>
          </div>

          {/* AI Commands Section */}
          <div className="shortcuts-section">
            <h4 className="shortcuts-section-title">AI Commands</h4>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <span className="shortcut-label">Open AI Command Modal</span>
                <kbd className="shortcut-key">Spacebar</kbd>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-label">Close AI Modal</span>
                <kbd className="shortcut-key">Esc</kbd>
              </div>
            </div>
          </div>
        </div>

        <div className="shortcuts-modal-footer">
          <small>Press Esc to close</small>
        </div>
      </div>
    </div>
  );
}

