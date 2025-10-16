import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Canvas } from '@/components/Canvas';
import './App.css';

function App() {
  const { currentUser, isLoading, error } = useAuth();

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
      <Canvas />
    </div>
  );
}

export default App;