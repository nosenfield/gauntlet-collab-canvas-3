/**
 * Debug Authentication Panel
 * 
 * Development-only panel for testing authentication flows.
 * Press 'A' to toggle visibility.
 * Provides quick access to sign-out and user info.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../store/authStore';
import './DebugAuthPanel.css';

/**
 * DebugAuthPanel Component
 * Only visible in development mode
 */
export function DebugAuthPanel(): React.ReactElement | null {
  const { user, signOut } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  // Only render in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  // Toggle visibility with 'A' key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A') {
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isVisible) {
    return (
      <div className="debug-auth-hint">
        Press 'A' for Auth Debug
      </div>
    );
  }

  return (
    <div className="debug-auth-panel">
      <div className="debug-auth-header">
        <h3>🔐 Auth Debug Panel</h3>
        <button
          className="debug-close-button"
          onClick={() => setIsVisible(false)}
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
                setIsVisible(false);
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
        <small>Development Only • Press 'A' to hide</small>
      </div>
    </div>
  );
}

