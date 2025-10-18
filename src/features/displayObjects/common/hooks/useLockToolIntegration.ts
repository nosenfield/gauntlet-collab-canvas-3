/**
 * useLockToolIntegration Hook
 * 
 * Integrates lock management with tool state.
 * Automatically releases locks when switching away from select tool.
 */

import { useEffect } from 'react';
import { useTool } from '../store/toolStore';
import { useLocking } from './useLocking';
import { useSelection } from '../store/selectionStore';

/**
 * useLockToolIntegration
 * 
 * Monitors tool changes and releases locks when switching to creation tools.
 * This ensures users don't hold locks while drawing new shapes.
 */
export function useLockToolIntegration() {
  const { currentTool } = useTool();
  const { releaseLocks } = useLocking();
  const { clearSelection } = useSelection();

  /**
   * Release locks when switching away from select mode
   * 
   * Dependencies are safe:
   * - currentTool: primitive value, changes when tool changes
   * - releaseLocks: memoized with useCallback in useLocking (deps: [user])
   * - clearSelection: memoized with useCallback in selectionStore (deps: [dispatch])
   */
  useEffect(() => {
    if (currentTool !== 'select') {
      console.log('[LockToolIntegration] Switched to creation tool, releasing locks');
      
      // Release locks
      releaseLocks();
      
      // Clear selection (select tool is not active)
      clearSelection();
    }
  }, [currentTool, releaseLocks, clearSelection]);
}

