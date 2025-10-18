/**
 * UserPresenceItem Component
 * 
 * Displays a single user in the presence sidebar.
 * Shows color swatch and display name.
 */

import type { UserPresence } from '@/types/firebase';
import './UserPresenceItem.css';

interface UserPresenceItemProps {
  presence: UserPresence;
  isCurrentUser?: boolean;
  onClick?: () => void;
}

/**
 * UserPresenceItem Component
 * Individual user item in presence list
 */
export function UserPresenceItem({
  presence,
  isCurrentUser = false,
  onClick,
}: UserPresenceItemProps): React.ReactElement {
  return (
    <div 
      className={`user-presence-item ${isCurrentUser ? 'current-user' : ''} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div
        className="user-color-swatch"
        style={{ backgroundColor: presence.color }}
        title={presence.color}
      />
      <span className="user-display-name">
        {presence.displayName}
        {isCurrentUser && <span className="current-user-badge"> (You)</span>}
      </span>
    </div>
  );
}

