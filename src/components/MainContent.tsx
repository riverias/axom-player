import React from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import PlaylistsPage from './pages/PlaylistsPage';
import SettingsPage from './pages/SettingsPage';
import './MainContent.css';

const MainContent: React.FC = () => {
  const { activePage } = usePlayer();

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage />;
      case 'search':
        return <SearchPage />;
      case 'playlists':
        return <PlaylistsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="main-content">
      {renderPage()}
    </div>
  );
};

export default MainContent;