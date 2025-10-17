import { useEffect } from 'react';
import { AuthProvider } from '@/features/auth/store/authStore';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { DebugAuthPanel } from '@/features/auth/components/DebugAuthPanel';
import { ViewportProvider } from '@/features/canvas/store/viewportStore';
import { Canvas } from '@/features/canvas/components/Canvas';
import { usePresence } from '@/features/presence/hooks/usePresence';
import { UserPresenceSidebar } from '@/features/presence/components/UserPresenceSidebar';
import { ShapesProvider } from '@/features/shapes/store/shapesStore';
import { ToolProvider } from '@/features/shapes/store/toolStore';
import { SelectionProvider } from '@/features/shapes/store/selectionStore';
import { ShapeToolbar } from '@/features/shapes/components/ShapeToolbar';
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
      <ShapeToolbar />
      <UserPresenceSidebar />
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
      <ShapesProvider>
        <ToolProvider>
          <SelectionProvider>
            <AuthModal />
            <AppContent />
          </SelectionProvider>
        </ToolProvider>
      </ShapesProvider>
    </AuthProvider>
  );
}

export default App;