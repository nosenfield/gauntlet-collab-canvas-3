/**
 * useCursorTracking Hook
 * 
 * Tracks local user's cursor position and updates Realtime Database.
 * - Throttled to 50ms (max 20 updates/second)
 * - Converts screen coordinates to canvas coordinates
 * - Only tracks when cursor is over canvas
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth/store/authStore';
import { updateCursorPosition, getCurrentTabId } from '../services/presenceService';
import { throttle } from '@/utils/performanceMonitor';

interface UseCursorTrackingProps {
  stageRef: React.RefObject<any>; // Konva Stage ref
  enabled?: boolean;
}

/**
 * useCursorTracking Hook
 * Tracks and syncs cursor position to Realtime Database
 */
export function useCursorTracking({
  stageRef,
  enabled = true,
}: UseCursorTrackingProps): void {
  const { user } = useAuth();
  const throttledUpdateRef = useRef<((x: number, y: number) => void) | null>(null);
  const isWindowFocusedRef = useRef<boolean>(true); // Track window focus state

  useEffect(() => {
    if (!user || !enabled || !stageRef.current) {
      return;
    }

    // Get current tab ID
    const tabId = getCurrentTabId();

    // Create throttled update function (50ms = 20 updates/second max)
    const throttledFn = throttle((...args: unknown[]) => {
      const [x, y] = args as [number, number];
      updateCursorPosition(user.userId, tabId, x, y).catch((error) => {
        // Silent failure - cursor updates shouldn't break the app
        if (import.meta.env.DEV) {
          console.debug('Cursor update failed:', error);
        }
      });
    }, 50);
    
    throttledUpdateRef.current = (x: number, y: number) => throttledFn(x, y);

    const stage = stageRef.current;

    const handleMouseMove = () => {
      // Only track cursor if window is focused
      if (!isWindowFocusedRef.current || !throttledUpdateRef.current) return;

      const pointerPosition = stage.getPointerPosition();
      if (!pointerPosition) return;

      // Convert screen coordinates to canvas coordinates
      // Account for stage position and scale
      const scale = stage.scaleX(); // Assume uniform scale (scaleX === scaleY)
      const stageX = stage.x();
      const stageY = stage.y();

      const canvasX = (pointerPosition.x - stageX) / scale;
      const canvasY = (pointerPosition.y - stageY) / scale;

      // Update cursor position in Realtime Database
      throttledUpdateRef.current(canvasX, canvasY);
    };

    // Listen to mouse move on stage container
    const container = stage.container();
    container.addEventListener('mousemove', handleMouseMove);

    // Listen to window focus/blur events
    const handleFocus = () => {
      isWindowFocusedRef.current = true;
    };

    const handleBlur = () => {
      isWindowFocusedRef.current = false;
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      throttledUpdateRef.current = null;
    };
  }, [user, enabled, stageRef]);
}
