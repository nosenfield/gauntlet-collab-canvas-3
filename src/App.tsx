import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
      <h1>CollabCanvas MVP</h1>
      <p>Welcome, {currentUser?.displayName || 'Anonymous User'}!</p>
      <p>Your color: {currentUser?.color}</p>
      <p>Setup complete. Ready for development.</p>
    </div>
  );
}

export default App;