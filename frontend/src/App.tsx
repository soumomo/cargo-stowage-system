import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './App.css';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Containers from './pages/Containers';
import Items from './pages/Items';
import StowagePlans from './pages/StowagePlans';
import Visualization from './pages/Visualization';
import SampleComponent from './components/SampleComponent';
import NotFound from './pages/NotFound';
import { RootState } from './store';

function App() {
  const { theme } = useSelector((state: RootState) => state.ui);
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/containers" element={<Containers />} />
          <Route path="/items" element={<Items />} />
          <Route path="/stowage-plans" element={<StowagePlans />} />
          <Route path="/visualization/:planId" element={<Visualization />} />
          <Route path="/component-showcase" element={<SampleComponent />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App; 