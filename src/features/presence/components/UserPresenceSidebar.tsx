/**
 * UserPresenceSidebar Component
 * 
 * Always-visible sidebar showing active users.
 * - Current user at top (highlighted)
 * - Other users below (alphabetically sorted)
 * - Shows color swatch + display name for each
 * - Updates in real-time
 */

import { useMemo } from 'react';
import { useAuth } from '@/features/auth/store/authStore';
import { useAllActiveUsers } from '../hooks/useActiveUsers';
import { UserPresenceItem } from './UserPresenceItem';
import './UserPresenceSidebar.css';

/**
 * UserPresenceSidebar Component
 * Fixed position sidebar on right side
 */
export function UserPresenceSidebar(): React.ReactElement | null {
  const { user } = useAuth();
  const allActiveUsers = useAllActiveUsers();

  // Sort users: current user first, then others alphabetically
  const sortedUsers = useMemo(() => {
    // Filter out incomplete presence data
    const users = Array.from(allActiveUsers.values()).filter(
      (u) => u && u.userId && u.displayName
    );
    
    if (!user) return users;

    // Separate current user and others
    const currentUserPresence = users.find((u) => u.userId === user.userId);
    const otherUsers = users
      .filter((u) => u.userId !== user.userId)
      .sort((a, b) => {
        // Extra safety check during sort
        if (!a.displayName || !b.displayName) return 0;
        return a.displayName.localeCompare(b.displayName);
      });

    // Current user first, then others alphabetically
    return currentUserPresence ? [currentUserPresence, ...otherUsers] : otherUsers;
  }, [allActiveUsers, user]);

  // Don't show sidebar if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="user-presence-sidebar">
      <div className="sidebar-header">
        <h3 className="sidebar-title">Active Users</h3>
        <span className="user-count">{sortedUsers.length}</span>
      </div>

      <div className="sidebar-content">
        {sortedUsers.length === 0 ? (
          <div className="no-users-message">
            <p>No active users</p>
          </div>
        ) : (
          <div className="users-list">
            {sortedUsers.map((presence) => (
              <UserPresenceItem
                key={presence.userId}
                presence={presence}
                isCurrentUser={presence.userId === user.userId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
