/**
 * Debug Authentication Panel
 * 
 * Development-only panel for testing authentication flows.
 * Triggered by clicking on your own user in the Active Users list.
 * Provides quick access to sign-out and user info.
 */

import { useAuth } from '../store/authStore';
import './DebugAuthPanel.css';

interface DebugAuthPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

/**
 * DebugAuthPanel Component
 * Only visible in development mode
 */
export function DebugAuthPanel({ isVisible, onClose }: DebugAuthPanelProps): React.ReactElement | null {
  const { user, signOut } = useAuth();

  // Only render in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className="debug-auth-panel">
      <div className="debug-auth-header">
        <h3>🔐 Auth Debug Panel</h3>
        <button
          className="debug-close-button"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="debug-auth-content">
        {user ? (
          <>
            <div className="debug-user-info">
              <div className="debug-info-row">
                <span className="debug-label">Status:</span>
                <span className="debug-value authenticated">✓ Authenticated</span>
              </div>
              <div className="debug-info-row">
                <span className="debug-label">Name:</span>
                <span className="debug-value">{user.displayName}</span>
              </div>
              <div className="debug-info-row">
                <span className="debug-label">Color:</span>
                <span className="debug-value">
                  <span className="debug-color-dot" style={{ backgroundColor: user.color }} />
                  {user.color}
                </span>
              </div>
              <div className="debug-info-row">
                <span className="debug-label">User ID:</span>
                <span className="debug-value debug-user-id">
                  {user.userId.substring(0, 8)}...
                </span>
              </div>
            </div>

            <button
              className="debug-signout-button"
              onClick={async () => {
                await signOut();
                onClose();
              }}
            >
              Sign Out (Test Auth Modal)
            </button>
          </>
        ) : (
          <div className="debug-user-info">
            <div className="debug-info-row">
              <span className="debug-label">Status:</span>
              <span className="debug-value not-authenticated">✗ Not Authenticated</span>
            </div>
            <p className="debug-hint">Sign in to see user details</p>
          </div>
        )}
      </div>

      <div className="debug-auth-footer">
        <small>Development Only • Click to close</small>
      </div>
    </div>
  );
}

