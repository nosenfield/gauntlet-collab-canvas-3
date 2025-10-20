/**
 * UserPresenceSidebar Component
 * 
 * Draggable and resizable modal showing active users.
 * - Current user at top (highlighted)
 * - Other users below (alphabetically sorted)
 * - Shows color swatch + display name for each
 * - Updates in real-time
 */

import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/store/authStore';
import { useAllActiveUsers } from '../hooks/useActiveUsers';
import { UserPresenceItem } from './UserPresenceItem';
import { useModalResize } from '@/features/displayObjects/common/components/PropertiesModal/useModalResize';
import { DebugAuthPanel } from '@/features/auth/components/DebugAuthPanel';
import './UserPresenceSidebar.css';

/**
 * UserPresenceSidebar Component
 * Fixed position (top-right) and vertically resizable modal
 */
export function UserPresenceSidebar(): React.ReactElement | null {
  const { user } = useAuth();
  const allActiveUsers = useAllActiveUsers();
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  // Fixed position (top-right), only resizable vertically
  const { height, isResizing, handleResizeStart } = useModalResize({
    initialHeight: 150, // Set to min height
    minHeight: 150,
    storageKey: 'user-presence-modal-height'
  });

  // Toggle debug panel with 'A' key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      // Don't trigger if any modifier keys are pressed (e.g., Cmd+A for Select All)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      
      if (e.key === 'a' || e.key === 'A') {
        setShowDebugPanel((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

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
    <>
      {/* Debug Auth Panel - positioned to the left of sidebar */}
      <DebugAuthPanel 
        isVisible={showDebugPanel}
        onClose={() => setShowDebugPanel(false)}
      />
      
      <div 
        className={`user-presence-sidebar ${isResizing ? 'user-presence-sidebar--resizing' : ''}`}
        style={{
          height: `${height}px`,
        }}
      >
        <div className="sidebar-container">
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
              {sortedUsers.map((presence) => {
                const isCurrentUser = presence.userId === user.userId;
                return (
                  <UserPresenceItem
                    key={presence.userId}
                    presence={presence}
                    isCurrentUser={isCurrentUser}
                    onClick={isCurrentUser ? () => setShowDebugPanel(!showDebugPanel) : undefined}
                  />
                );
              })}
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
    </>
  );
}
