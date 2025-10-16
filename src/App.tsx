import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCanvas } from '@/hooks/useCanvas';
import { usePresence } from '@/hooks/usePresence';
import { Canvas } from '@/components/Canvas';
import { Toolbar } from '@/components/Toolbar';
import './App.css';

function App() {
  const { isLoading, error, currentUser } = useAuth();
  const canvasHook = useCanvas();
  const { activeUsers } = usePresence();

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
      <Toolbar 
        canvasHook={canvasHook} 
        activeUsers={activeUsers}
        currentUser={currentUser}
      />
      <Canvas canvasHook={canvasHook} />
    </div>
  );
}

export default App;