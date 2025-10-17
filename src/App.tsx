import { useEffect } from 'react';
import { AuthProvider } from '@/features/auth/store/authStore';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { DebugAuthPanel } from '@/features/auth/components/DebugAuthPanel';
import { ViewportProvider } from '@/features/canvas/store/viewportStore';
import { Canvas } from '@/features/canvas/components/Canvas';
import { usePresence } from '@/features/presence/hooks/usePresence';
import { UserPresenceSidebar } from '@/features/presence/components/UserPresenceSidebar';
import { ToolProvider } from '@/features/displayObjects/common/store/toolStore';
import { DisplayObjectToolbar } from '@/features/displayObjects/common/components/DisplayObjectToolbar';
import './App.css';

/**
 * AppContent Component
 * Contains presence logic (requires auth to be initialized)
 */
function AppContent() {
  // Initialize user presence (heartbeat, cleanup, etc.)
  usePresence();

  return (
    <>
      <DebugAuthPanel />
      <UserPresenceSidebar />
      <DisplayObjectToolbar />
      <ViewportProvider>
        <Canvas />
      </ViewportProvider>
    </>
  );
}

function App() {
  useEffect(() => {
    console.log('CollabCanvas MVP - Stage 3: Display Objects (Shapes)');
  }, []);

  return (
    <AuthProvider>
      <ToolProvider>
        <AuthModal />
        <AppContent />
      </ToolProvider>
    </AuthProvider>
  );
}

export default App;