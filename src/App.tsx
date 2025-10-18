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
import { ShapesProvider } from '@/features/displayObjects/shapes/store/shapesStore';
import { TextsProvider } from '@/features/displayObjects/texts/store/textsStore';
import { SelectionProvider } from '@/features/displayObjects/common/store/selectionStore';
import { startLockCleanupService } from '@/features/displayObjects/common/services/lockService';
import { PerformanceTest } from '@/features/displayObjects/common/components/PerformanceTest';
import './App.css';

/**
 * AppContent Component
 * Contains presence logic (requires auth to be initialized)
 */
function AppContent() {
  // Initialize user presence (heartbeat, cleanup, etc.)
  usePresence();

  // Start lock cleanup service (removes stale locks)
  useEffect(() => {
    console.log('[App] Starting lock cleanup service');
    const stopCleanup = startLockCleanupService();
    
    return () => {
      console.log('[App] Stopping lock cleanup service');
      stopCleanup();
    };
  }, []);

  return (
    <>
      <DebugAuthPanel />
      <UserPresenceSidebar />
      <DisplayObjectToolbar />
      <PerformanceTest />
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
        <ShapesProvider>
          <TextsProvider>
            <SelectionProvider>
              <AuthModal />
              <AppContent />
            </SelectionProvider>
          </TextsProvider>
        </ShapesProvider>
      </ToolProvider>
    </AuthProvider>
  );
}

export default App;