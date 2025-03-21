import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar, toggleTheme } from '../store/uiSlice';
import { RootState } from '../store';
import './Navbar.css';

const Navbar: React.FC = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { sidebarOpen, theme } = useSelector((state: RootState) => state.ui);

  const getActiveClass = (path: string) => {
    return location.pathname === path ? 'nav-link active' : 'nav-link';
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <button className="menu-toggle" onClick={() => dispatch(toggleSidebar())}>
            <span className="menu-icon">{sidebarOpen ? '✕' : '☰'}</span>
          </button>
          <Link to="/" className="logo">
            <span className="logo-text">Cargo Stowage</span>
          </Link>
        </div>
        
        <nav className="navbar-nav">
          <Link to="/" className={getActiveClass('/')}>
            Dashboard
          </Link>
          <Link to="/containers" className={getActiveClass('/containers')}>
            Containers
          </Link>
          <Link to="/items" className={getActiveClass('/items')}>
            Items
          </Link>
          <Link to="/stowage-plans" className={getActiveClass('/stowage-plans')}>
            Stowage Plans
          </Link>
          <Link to="/component-showcase" className={getActiveClass('/component-showcase')}>
            UI Components
          </Link>
        </nav>
        
        <div className="navbar-actions">
          <button 
            className="theme-toggle" 
            onClick={() => dispatch(toggleTheme())}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div className="user-profile">
            <span className="user-avatar">👨‍🚀</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar; 