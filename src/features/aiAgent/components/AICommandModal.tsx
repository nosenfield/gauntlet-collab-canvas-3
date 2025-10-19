/**
 * AI Command Modal Component
 * 
 * Modal UI for entering natural language commands
 * Provides input field, examples, and submit/cancel actions
 */

import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { useAIAgent } from '../hooks/useAIAgent';
import './AICommandModal.css';

/**
 * AI Command Modal Props
 */
interface AICommandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * AI Command Modal Component
 * 
 * Modal that appears when user clicks AI button
 * Allows natural language input for canvas operations
 */
export function AICommandModal({ isOpen, onClose }: AICommandModalProps) {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { executeCommand } = useAIAgent();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!command.trim() || isProcessing) {
      return;
    }

    setIsProcessing(true);
    
    try {
      await executeCommand(command);
      
      // Success - clear input and close modal
      setCommand('');
      onClose();
    } catch (error) {
      // Show error to user
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to execute command';
      
      alert(errorMessage);
      
      console.error('[AICommandModal] Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' && !isProcessing) {
      onClose();
    }
  };

  /**
   * Handle overlay click (close modal)
   */
  const handleOverlayClick = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  /**
   * Handle modal content click (prevent close)
   */
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="ai-command-modal-overlay" 
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-modal-title"
    >
      <div 
        className="ai-command-modal"
        onClick={handleModalClick}
      >
        <div className="ai-command-modal__content">
          {/* Header */}
          <div className="ai-command-modal__header">
            <span className="ai-command-modal__icon">✨</span>
            <h2 id="ai-modal-title" className="ai-command-modal__title">
              AI Command
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="ai-command-modal__form">
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Try: 'Make a 200x300 blue rectangle' or 'Create a large red square'"
              className={`ai-command-modal__input ${isProcessing ? 'ai-command-modal__input--processing' : ''}`}
              disabled={isProcessing}
              aria-label="AI Command Input"
            />

            {/* Buttons */}
            <div className="ai-command-modal__buttons">
              <button
                type="button"
                onClick={onClose}
                className="ai-command-modal__button ai-command-modal__button--cancel"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!command.trim() || isProcessing}
                className="ai-command-modal__button ai-command-modal__button--submit"
              >
                {isProcessing ? 'Processing...' : 'Execute'}
              </button>
            </div>
          </form>

          {/* Examples */}
          <div className="ai-command-modal__examples">
            <p className="ai-command-modal__examples-title">Example Commands</p>
            <ul className="ai-command-modal__examples-list">
              <li className="ai-command-modal__examples-item">
                "Make a 200x300 rectangle"
              </li>
              <li className="ai-command-modal__examples-item">
                "Create a red square"
              </li>
              <li className="ai-command-modal__examples-item">
                "Add a large blue rectangle with rounded corners"
              </li>
              <li className="ai-command-modal__examples-item">
                "Make a green rectangle at position 2000, 3000"
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

