import { useEffect } from 'react';
import { ViewportProvider } from '@/features/canvas/store/viewportStore';
import { Canvas } from '@/features/canvas/components/Canvas';
import './App.css';

function App() {
  useEffect(() => {
    console.log('CollabCanvas MVP - Stage 1: Canvas with Pan initialized');
  }, []);

  return (
    <ViewportProvider>
      <Canvas />
    </ViewportProvider>
  );
}

export default App;