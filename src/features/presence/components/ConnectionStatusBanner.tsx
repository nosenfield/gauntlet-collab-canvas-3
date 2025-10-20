/**
 * ConnectionStatusBanner Component
 * 
 * Displays a banner at the top of the screen when user is offline.
 * Automatically hides when connection is restored.
 */

import { useConnectionState } from '../hooks/useConnectionState';
import './ConnectionStatusBanner.css';

/**
 * Connection status banner component
 * 
 * Shows warning when Firebase connection is lost.
 * Indicates reconnecting state.
 */
export function ConnectionStatusBanner() {
  const { isConnected } = useConnectionState();

  // Don't render when connected
  if (isConnected) {
    return null;
  }

  return (
    <div className="connection-status-banner">
      <div className="connection-status-banner__content">
        <span className="connection-status-banner__icon">⚠️</span>
        <span className="connection-status-banner__text">
          You are offline. Reconnecting...
        </span>
        <div className="connection-status-banner__spinner" />
      </div>
    </div>
  );
}

