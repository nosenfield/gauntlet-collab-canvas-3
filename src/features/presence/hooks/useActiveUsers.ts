/**
 * useActiveUsers Hook
 * 
 * Listens to all active users in presence
 * Returns map of userId → UserPresence
 * Automatically filters out stale presences (>30s old)
 */

import { useState, useEffect } from 'react';
import type { UserPresence } from '@/types/firebase';
import { onPresenceChange } from '../services/presenceService';

/**
 * useActiveUsers Hook
 * Returns map of all active users (excluding current user)
 */
export function useActiveUsers(excludeUserId?: string): Map<string, UserPresence> {
  const [activeUsers, setActiveUsers] = useState<Map<string, UserPresence>>(new Map());

  useEffect(() => {
    // Subscribe to presence changes
    const unsubscribe = onPresenceChange((presences) => {
      const usersMap = new Map<string, UserPresence>();

      Object.values(presences).forEach((presence) => {
        // Exclude current user if specified
        if (excludeUserId && presence.userId === excludeUserId) {
          return;
        }

        usersMap.set(presence.userId, presence);
      });

      setActiveUsers(usersMap);
    });

    return () => {
      unsubscribe();
    };
  }, [excludeUserId]);

  return activeUsers;
}

/**
 * useAllActiveUsers Hook
 * Returns map of all active users (including current user)
 */
export function useAllActiveUsers(): Map<string, UserPresence> {
  return useActiveUsers(undefined);
}
