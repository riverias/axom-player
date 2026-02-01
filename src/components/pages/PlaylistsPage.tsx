import React, { useState, useEffect } from 'react';
import { usePlayer } from '../../contexts/PlayerContext';
import { getCoverUrl } from '../../utils/soundcloud';
import TrackItem from '../TrackItem.tsx';
import './PlaylistsPage.css';

const PlaylistsPage: React.FC = () => {
  const { 
    playlists, 
    currentTrack,
    createPlaylist, 
    playPlaylist,
    addTrackToPlaylist,
    downloadPlaylist,
    playlistShuffleEnabled,
    playlistRepeatMode,
    togglePlaylistShuffle,
    togglePlaylistRepeat,
    pendingTrackForPlaylist,
    setPendingTrackForPlaylist
  } = usePlayer();
  
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [buttonColor, setButtonColor] = useState('rgba(255, 255, 255, 0.9)');

  const selectedPlaylistData = playlists.find(p => p.id === selectedPlaylist);

  const handleDownloadPlaylist = () => {
    if (selectedPlaylistData && selectedPlaylistData.tracks.length > 0) {
      downloadPlaylist(selectedPlaylistData.name, selectedPlaylistData.tracks);
    }
  };

  // Extract color from playlist cover
  useEffect(() => {
    if (selectedPlaylistData && selectedPlaylistData.tracks.length > 0) {
      const coverTrack = currentTrack && selectedPlaylistData.tracks.some(t => t.id === currentTrack.id) 
        ? currentTrack 
        : selectedPlaylistData.tracks[selectedPlaylistData.tracks.length - 1];
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let r = 0, g = 0, b = 0;
        let count = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);
        
        // Increase saturation slightly
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        
        if (saturation < 0.3) {
          const boost = 1.2;
          r = Math.min(255, Math.floor(r * boost));
          g = Math.min(255, Math.floor(g * boost));
          b = Math.min(255, Math.floor(b * boost));
        }
        
        setButtonColor(`rgb(${r}, ${g}, ${b})`);
      };
      
      img.src = getCoverUrl(coverTrack);
    }
  }, [selectedPlaylistData, currentTrack]);

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowCreateForm(false);
    }
  };

  const handlePlaylistClick = (playlistId: string) => {
    if (pendingTrackForPlaylist) {
      addTrackToPlaylist(playlistId, pendingTrackForPlaylist);
      setPendingTrackForPlaylist(null);
    } else {
      setSelectedPlaylist(playlistId);
    }
  };

  const handleBackClick = () => {
    if (pendingTrackForPlaylist) {
      setPendingTrackForPlaylist(null);
    } else {
      setSelectedPlaylist(null);
    }
  };

  return (
    <div className="playlists-page">
      {pendingTrackForPlaylist && (
        <div className="pending-track-info">
          <div className="pending-track-header">
            <button className="back-btn" onClick={handleBackClick}>
              <img src="/images/arrow.svg" alt="Назад" />
            </button>
            <h2>Выберите плейлист для трека:</h2>
          </div>
          <div className="pending-track-details">
            <img src={getCoverUrl(pendingTrackForPlaylist)} alt="Обложка" className="pending-track-cover" />
            <div className="pending-track-text">
              <div className="pending-track-title">{pendingTrackForPlaylist.title}</div>
              <div className="pending-track-artist">{pendingTrackForPlaylist.user.username}</div>
            </div>
          </div>
        </div>
      )}

      {!selectedPlaylist && !pendingTrackForPlaylist && (
        <div className="playlists-header">
          <button 
            className="create-playlist-btn"
            onClick={() => setShowCreateForm(true)}
          >
            Создать плейлист
          </button>
        </div>
      )}

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Создать плейлист</h3>
            <input
              type="text"
              placeholder="Название плейлиста"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreatePlaylist()}
              autoFocus
            />
            <div className="modal-buttons">
              <button className="modal-btn cancel-btn" onClick={() => setShowCreateForm(false)}>
                Отмена
              </button>
              <button className="modal-btn create-btn" onClick={handleCreatePlaylist}>
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="playlists-content">
        {!selectedPlaylist ? (
          <div className="playlists-list">
            {playlists.length === 0 ? (
              <div className="no-playlists">
                {pendingTrackForPlaylist && (
                  <div className="no-playlists-message">
                    <p>У вас пока нет плейлистов</p>
                    <button 
                      className="create-first-playlist-btn"
                      onClick={() => setShowCreateForm(true)}
                    >
                      Создать первый плейлист
                    </button>
                  </div>
                )}
              </div>
            ) : (
              playlists.map(playlist => (
                <div key={playlist.id} className="playlist-item">
                  <div className="playlist-info" onClick={() => handlePlaylistClick(playlist.id)}>
                    <h3>{playlist.name}</h3>
                    <p>{playlist.tracks.length} треков</p>
                    {pendingTrackForPlaylist && (
                      <div className="add-track-indicator">+ Добавить трек</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="playlist-details">
            {selectedPlaylistData && selectedPlaylistData.tracks.length > 0 && (
              <div className="playlist-info-section">
                <div className="playlist-background-blur">
                  <img 
                    src={getCoverUrl(
                      currentTrack && selectedPlaylistData.tracks.some(t => t.id === currentTrack.id) 
                        ? currentTrack 
                        : selectedPlaylistData.tracks[selectedPlaylistData.tracks.length - 1]
                    )} 
                    alt="Фон плейлиста" 
                  />
                </div>
                
                <div className="playlist-header">
                  <button className="back-btn" onClick={handleBackClick}>
                    <img src="/images/arrow.svg" alt="Назад" />
                  </button>
                </div>
                
                <div className="playlist-cover">
                  <img 
                    src={getCoverUrl(
                      currentTrack && selectedPlaylistData.tracks.some(t => t.id === currentTrack.id) 
                        ? currentTrack 
                        : selectedPlaylistData.tracks[selectedPlaylistData.tracks.length - 1]
                    )} 
                    alt="Обложка плейлиста" 
                  />
                </div>
                <div className="playlist-meta">
                  <h2 className="playlist-title">{selectedPlaylistData.name}</h2>
                  <p className="playlist-artists">
                    {Array.from(new Set(selectedPlaylistData.tracks.map(track => track.user.username)))
                      .slice(0, 4)
                      .join(', ')}
                  </p>
                  <div className="playlist-buttons">
                    <button 
                      className="play-all-btn"
                      style={{ backgroundColor: buttonColor }}
                      onClick={() => playPlaylist(selectedPlaylistData)}
                    >
                      <img src="/images/play.svg" alt="Слушать" />
                      Слушать
                    </button>
                    <button 
                      className="pin-btn"
                      style={{ backgroundColor: buttonColor }}
                    >
                      <img src="/images/pin.svg" alt="Закрепить" />
                    </button>
                    <button 
                      className="download-btn"
                      style={{ backgroundColor: buttonColor }}
                      onClick={handleDownloadPlaylist}
                    >
                      <img src="/images/download.svg" alt="Скачать" />
                    </button>
                    <button 
                      className="shuffle-btn"
                      style={{ backgroundColor: buttonColor }}
                      onClick={() => togglePlaylistShuffle(selectedPlaylistData.id)}
                    >
                      <img 
                        src={playlistShuffleEnabled[selectedPlaylistData.id] ? "/images/shuffles.svg" : "/images/shuffle.svg"} 
                        alt="Перемешать" 
                      />
                    </button>
                    <button 
                      className="repeat-btn"
                      style={{ backgroundColor: buttonColor }}
                      onClick={() => togglePlaylistRepeat(selectedPlaylistData.id)}
                    >
                      <img 
                        src={
                          playlistRepeatMode[selectedPlaylistData.id] === 'all' ? "/images/repeats.svg" : 
                          playlistRepeatMode[selectedPlaylistData.id] === 'one' ? "/images/repeate.svg" : 
                          "/images/repeat.svg"
                        } 
                        alt="Повтор" 
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="playlist-tracks">
              {selectedPlaylistData?.tracks.length === 0 ? (
                <div></div>
              ) : (
                selectedPlaylistData?.tracks.map((track, trackIndex) => (
                  <div key={track.id} className="playlist-track-item">
                    <TrackItem 
                      track={track} 
                      queue={selectedPlaylistData.tracks}
                      index={trackIndex + 1}
                      hidePlaylistMenu={true}
                      context={`playlist-${selectedPlaylistData.id}`}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistsPage;