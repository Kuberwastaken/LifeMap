import React from 'react';
import LifeMap from './components/LifeMap';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <LifeMap />
      </div>
    </AuthProvider>
  );
}

export default App;