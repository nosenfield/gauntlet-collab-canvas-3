/**
 * Authentication Modal
 * 
 * Displays on app load if user is not authenticated.
 * Provides two sign-in options:
 * - Continue as Guest (Anonymous Auth)
 * - Sign in with Google (OAuth)
 */

import { useAuth } from '../store/authStore';
import './AuthModal.css';

/**
 * AuthModal Component
 * Modal overlay with authentication options
 */
export function AuthModal(): React.ReactElement | null {
  const { user, loading, error, signInAnonymous, signInWithGoogle } = useAuth();

  // Don't show modal if user is authenticated
  if (user) {
    return null;
  }

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <div className="auth-modal-header">
          <h1>Welcome to CollabCanvas</h1>
          <p>A real-time collaborative design tool</p>
        </div>

        <div className="auth-modal-content">
          {error && (
            <div className="auth-modal-error">
              <span>⚠️ {error}</span>
            </div>
          )}

          <div className="auth-modal-buttons">
            <button
              className="auth-button auth-button-guest"
              onClick={signInAnonymous}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Continue as Guest'}
            </button>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <button
              className="auth-button auth-button-google"
              onClick={signInWithGoogle}
              disabled={loading}
            >
              <svg
                className="google-icon"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </button>
          </div>

          <div className="auth-modal-footer">
            <p className="auth-modal-info">
              Choose Guest for anonymous access or sign in with Google for a personalized experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

