/**
 * useConnectionState Hook
 * 
 * Monitors Firebase Realtime Database connection state.
 * Uses .info/connected to detect online/offline status.
 * 
 * More reliable than browser navigator.onLine as it detects actual
 * Firebase connectivity, not just network availability.
 */

import { useState, useEffect } from 'react';
import { onConnectionStateChange } from '../services/presenceService';

/**
 * Connection state hook
 * 
 * @returns Object with connection state and timestamp of last change
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isConnected, lastChanged } = useConnectionState();
 *   
 *   if (!isConnected) {
 *     return <div>You are offline</div>;
 *   }
 *   
 *   return <div>You are online</div>;
 * }
 * ```
 */
export function useConnectionState() {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [lastChanged, setLastChanged] = useState<Date>(new Date());

  useEffect(() => {
    const unsubscribe = onConnectionStateChange((connected) => {
      setIsConnected(connected);
      setLastChanged(new Date());
      
      if (connected) {
        console.log('[useConnectionState] Connection restored');
      } else {
        console.log('[useConnectionState] Connection lost');
      }
    });

    return unsubscribe;
  }, []);

  return {
    isConnected,
    lastChanged,
  };
}

