import { useEffect } from 'react';
import './App.css';

function App() {
  useEffect(() => {
    console.log('CollabCanvas MVP initialized');
  }, []);

  return (
    <div className="App">
      <h1>CollabCanvas MVP</h1>
      <p>Setup complete. Ready for development.</p>
    </div>
  );
}

export default App;