/**
 * useAIModal Hook
 * 
 * Hook for managing AI command modal state
 * Provides open/close functionality
 */

import { useState, useCallback } from 'react';

/**
 * useAIModal Hook
 * 
 * Manages the open/close state of the AI command modal
 * 
 * @returns Object with modal state and control functions
 * 
 * @example
 * ```tsx
 * function Toolbar() {
 *   const { isOpen, openModal, closeModal } = useAIModal();
 *   
 *   return (
 *     <>
 *       <button onClick={openModal}>AI Commands</button>
 *       <AICommandModal isOpen={isOpen} onClose={closeModal} />
 *     </>
 *   );
 * }
 * ```
 */
export function useAIModal() {
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Open the AI command modal
   */
  const openModal = useCallback(() => {
    setIsOpen(true);
    console.log('[AIModal] Modal opened');
  }, []);

  /**
   * Close the AI command modal
   */
  const closeModal = useCallback(() => {
    setIsOpen(false);
    console.log('[AIModal] Modal closed');
  }, []);

  /**
   * Toggle the modal state
   */
  const toggleModal = useCallback(() => {
    setIsOpen(prev => !prev);
    console.log('[AIModal] Modal toggled');
  }, []);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
  };
}

