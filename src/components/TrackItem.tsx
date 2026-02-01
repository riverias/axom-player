import React, { useState } from 'react';
import { Track } from '../contexts/PlayerContext';
import { usePlayer } from '../contexts/PlayerContext';
import { formatTime, getCoverUrl } from '../utils/soundcloud';
import { invoke } from '@tauri-apps/api/core';
import './TrackItem.css';

interface TrackItemProps {
  track: Track;
  index?: number;
  queue?: Track[];
  onPlay?: () => void;
  hidePlaylistMenu?: boolean;
  context?: string; // Контекст для лайков (search, playlist-id, home, etc.)
}

const TrackItem: React.FC<TrackItemProps> = ({ track, index, queue, onPlay, hidePlaylistMenu = false, context = 'default' }) => {
  const { 
    currentTrack, 
    isPlaying, 
    playTrack, 
    playlists, 
    addTrackToPlaylist, 
    showToast,
    activeContextMenu,
    setActiveContextMenu,
    toggleLike,
    isTrackLiked,
    setActivePage,
    setPendingTrackForPlaylist
  } = usePlayer();
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  
  const isCurrentTrack = currentTrack?.id === track.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;
  const showContextMenu = activeContextMenu === track.id;

  const handleClick = () => {
    if (onPlay) {
      onPlay();
    } else if (queue && index !== undefined) {
      playTrack(track, queue, index);
    } else {
      playTrack(track);
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setActiveContextMenu(track.id);
  };

  const handleDownload = async () => {
    setActiveContextMenu(null);
    try {
      const trackUrl = track.permalink_url || `https://soundcloud.com/${track.user.username}/${track.title.toLowerCase().replace(/\s+/g, '-')}`;
      const result = await invoke('download_track', {
        url: trackUrl,
        title: track.title,
        artist: track.user.username
      });
    } catch (error) {
      console.error('Ошибка скачивания:', error);
    }
  };

  const handleCopyLink = () => {
    setActiveContextMenu(null);
    const trackUrl = track.permalink_url || `https://soundcloud.com/${track.user.username}/${track.title.toLowerCase().replace(/\s+/g, '-')}`;
    navigator.clipboard.writeText(trackUrl);
  };

  const handleAddToPlaylistPage = () => {
    setActiveContextMenu(null);
    setPendingTrackForPlaylist(track);
    setActivePage('playlists');
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike(track.id, context);
  };

  const isLiked = isTrackLiked(track.id, context);

  // Закрытие меню при клике вне его
  React.useEffect(() => {
    const handleClickOutside = () => {
      setActiveContextMenu(null);
    };

    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu, setActiveContextMenu]);

  return (
    <div 
      className={`track-item ${isCurrentTrack ? 'playing' : ''} ${isCurrentlyPlaying ? 'is-playing' : ''}`}
      onClick={handleClick}
      onContextMenu={handleRightClick}
      data-track-id={track.id}
    >
      {index !== undefined && <div className="track-item-number">{index}</div>}
      
      <div className="track-item-cover">
        <div 
          style={{ 
            backgroundImage: `url(${getCoverUrl(track)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            width: '100%',
            height: '100%',
            borderRadius: '13px'
          }}
        >
          <div className="cover-hover-controls">
            <img src="/images/playcovers.svg" alt="Play" className="play-icon" />
            <img src="/images/stopcovers.svg" alt="Stop" className="stop-icon" />
          </div>
          
          {isCurrentlyPlaying && (
            <div className="playing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
        </div>
      </div>
      
      <div className="track-item-info">
        <div className="track-item-title">{track.title}</div>
        <div className="track-item-artist">{track.user.username}</div>
      </div>
      
      <button 
        className="like-btn"
        onClick={handleLikeClick}
      >
        <img 
          src={isLiked ? "/images/likes.svg" : "/images/like.svg"} 
          alt={isLiked ? "Убрать из избранного" : "Добавить в избранное"} 
        />
      </button>
      
      <div className="track-length">{formatTime(track.duration)}</div>
      
      {showContextMenu && (
        <div 
          className="context-menu"
          style={{ 
            position: 'fixed',
            left: contextMenuPos.x,
            top: contextMenuPos.y,
            zIndex: 2000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="context-menu-item" onClick={handleDownload}>
            <img src="/images/download.svg" alt="Скачать" />
            <span>Скачать музыку</span>
          </div>
          
          <div className="context-menu-item" onClick={handleCopyLink}>
            <img src="/images/copy.svg" alt="Копировать" />
            <span>Скопировать ссылку</span>
          </div>
          
          {!hidePlaylistMenu && (
            <div 
              className="context-menu-item"
              onClick={handleAddToPlaylistPage}
            >
              <img src="/images/playlist.svg" alt="Плейлист" />
              <span>Добавить в плейлист</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackItem;