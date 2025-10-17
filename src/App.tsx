import { useEffect } from 'react';
import { AuthProvider } from '@/features/auth/store/authStore';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { DebugAuthPanel } from '@/features/auth/components/DebugAuthPanel';
import { ViewportProvider } from '@/features/canvas/store/viewportStore';
import { Canvas } from '@/features/canvas/components/Canvas';
import './App.css';

function App() {
  useEffect(() => {
    console.log('CollabCanvas MVP - Stage 2: User Authentication & Presence');
  }, []);

  return (
    <AuthProvider>
      <AuthModal />
      <DebugAuthPanel />
      <ViewportProvider>
        <Canvas />
      </ViewportProvider>
    </AuthProvider>
  );
}

export default App;