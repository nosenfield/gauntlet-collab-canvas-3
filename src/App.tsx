import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCanvas } from '@/hooks/useCanvas';
import { Canvas } from '@/components/Canvas';
import { Toolbar } from '@/components/Toolbar';
import './App.css';

function App() {
  const { isLoading, error } = useAuth();
  const canvasHook = useCanvas();

  useEffect(() => {
    console.log('CollabCanvas MVP initialized');
  }, []);

  if (isLoading) {
    return (
      <div className="App">
        <h1>CollabCanvas MVP</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <h1>CollabCanvas MVP</h1>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="App">
      <Toolbar canvasHook={canvasHook} />
      <Canvas canvasHook={canvasHook} />
    </div>
  );
}

export default App;