/**
 * UserPresenceSidebar Component
 * 
 * Draggable and resizable modal showing active users.
 * - Current user at top (highlighted)
 * - Other users below (alphabetically sorted)
 * - Shows color swatch + display name for each
 * - Updates in real-time
 */

import { useMemo } from 'react';
import { useAuth } from '@/features/auth/store/authStore';
import { useAllActiveUsers } from '../hooks/useActiveUsers';
import { UserPresenceItem } from './UserPresenceItem';
import { useModalDrag } from '@/features/displayObjects/common/components/PropertiesModal/useModalDrag';
import { useModalResize } from '@/features/displayObjects/common/components/PropertiesModal/useModalResize';
import './UserPresenceSidebar.css';

/**
 * UserPresenceSidebar Component
 * Draggable and resizable modal on right side
 */
export function UserPresenceSidebar(): React.ReactElement | null {
  const { user } = useAuth();
  const allActiveUsers = useAllActiveUsers();
  
  // Drag and resize functionality (using separate storage keys from properties modal)
  const { position, isDragging, handleMouseDown } = useModalDrag({ 
    initialPosition: { 
      x: window.innerWidth - 260, // Right side of screen
      y: 20 
    },
    storageKey: 'user-presence-modal-position'
  });
  const { height, isResizing, handleResizeStart } = useModalResize({
    initialHeight: 400,
    minHeight: 150,
    storageKey: 'user-presence-modal-height'
  });

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
    <div 
      className={`user-presence-sidebar ${isDragging ? 'user-presence-sidebar--dragging' : ''} ${isResizing ? 'user-presence-sidebar--resizing' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        height: `${height}px`,
      }}
    >
      <div className="sidebar-container">
        <div 
          className="sidebar-header"
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
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
        
        {/* Resize Handle */}
        <div 
          className="sidebar-resize-handle"
          onMouseDown={handleResizeStart}
          title="Drag to resize"
        >
          <div className="sidebar-resize-indicator">⋮</div>
        </div>
      </div>
    </div>
  );
}
