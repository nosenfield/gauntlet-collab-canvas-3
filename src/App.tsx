import { useEffect } from 'react';
import { Canvas } from '@/features/canvas/components/Canvas';
import './App.css';

function App() {
  useEffect(() => {
    console.log('CollabCanvas MVP - Stage 1: Canvas initialized');
  }, []);

  return (
    <Canvas />
  );
}

export default App;