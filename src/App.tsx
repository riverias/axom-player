import React, { useEffect } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import Player from './components/Player';
import FullscreenPlayer from './components/FullscreenPlayer';
import Toast from './components/Toast';
import DownloadProgress from './components/DownloadProgress';
import { PlayerProvider, usePlayer } from './contexts/PlayerContext';
import { fetchAndSetClientId } from './utils/soundcloud';
import './App.css';

const AppContent: React.FC = () => {
  const { toasts, removeToast } = usePlayer();

  return (
    <div className="app">
      <TitleBar />
      <div className="app-body">
        <Sidebar />
        <MainContent />
      </div>
      <Player />
      <FullscreenPlayer />
      <DownloadProgress />
      
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};

function App() {
  useEffect(() => {
    // Инициализируем SoundCloud Client ID при загрузке приложения
    const initSoundCloud = async () => {
      try {
        await fetchAndSetClientId();
      } catch (error) {
        // Silent fail
      }
    };

    initSoundCloud();
  }, []);

  return (
    <PlayerProvider>
      <AppContent />
    </PlayerProvider>
  );
}

export default App;