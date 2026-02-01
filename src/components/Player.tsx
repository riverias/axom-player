import React from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { formatTime, getCoverUrl } from '../utils/soundcloud';
import './Player.css';

const Player: React.FC = () => {
  const { 
    currentTrack, 
    isPlaying, 
    currentTime, 
    duration,
    isShuffleEnabled,
    repeatMode,
    pauseTrack,
    resumeTrack,
    nextTrack,
    prevTrack,
    seekTo,
    toggleShuffle,
    toggleRepeat,
    toggleFullscreenPlayer
  } = usePlayer();

  if (!currentTrack) return null;

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseTrack();
    } else {
      resumeTrack();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seekTo(time);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="custom-player">
      <div className="player-handle" onClick={toggleFullscreenPlayer}></div>
      
      <div className="player-cover">
        <img 
          src={getCoverUrl(currentTrack)} 
          alt="Cover" 
        />
      </div>
      
      <div className="player-info">
        <div className="player-title">{currentTrack.title}</div>
        <div className="player-artist">{currentTrack.user.username}</div>
      </div>
      
      <div className="player-main-controls">
        <div className="player-progress-container">
          <span className="time-current">{formatTime(currentTime)}</span>
          <input
            type="range"
            className="player-trackbar"
            value={currentTime}
            max={duration}
            step="1"
            onChange={handleSeek}
            style={{ '--track-progress': `${progressPercent}%` } as React.CSSProperties}
          />
          <span className="time-duration">{formatTime(duration)}</span>
        </div>
        
        <div className="player-controls">
          <button className="player-btn shuffle-btn" onClick={toggleShuffle}>
            <img 
              src={isShuffleEnabled ? "/images/shuffles.svg" : "/images/shuffle.svg"} 
              alt="Перемешать" 
              className={`default shuffle-icon ${isShuffleEnabled ? 'active' : ''}`} 
            />
            <img 
              src="/images/shuffles.svg" 
              alt="Перемешать" 
              className="hover shuffle-icon" 
            />
          </button>
          
          <button className="player-btn prev-btn" onClick={prevTrack}>
            <img src="/images/previou.svg" alt="Предыдущий" className="default prev-icon" />
            <img src="/images/previous.svg" alt="Предыдущий" className="hover prev-icon" />
          </button>
          
          <button className="player-btn play-btn" onClick={handlePlayPause}>
            {isPlaying ? (
              <>
                <img src="/images/stop.svg" alt="Пауза" className="default pause-icon" />
                <img src="/images/stops.svg" alt="Пауза" className="hover pause-icon" />
              </>
            ) : (
              <>
                <img src="/images/play.svg" alt="Играть" className="default play-icon" />
                <img src="/images/plays.svg" alt="Играть" className="hover play-icon" />
              </>
            )}
          </button>
          
          <button className="player-btn next-btn" onClick={nextTrack}>
            <img src="/images/previou.svg" alt="Следующий" className="default next-icon" />
            <img src="/images/previous.svg" alt="Следующий" className="hover next-icon" />
          </button>
          
          <button className="player-btn repeat-btn" onClick={toggleRepeat}>
            <img 
              src={
                repeatMode === 'all' ? "/images/repeats.svg" : 
                repeatMode === 'one' ? "/images/repeate.svg" : 
                "/images/repeat.svg"
              } 
              alt="Повтор" 
              className={`default repeat-icon ${repeatMode !== 'off' ? 'active' : ''}`} 
            />
            <img 
              src={
                repeatMode === 'one' ? "/images/repeate.svg" : "/images/repeats.svg"
              }
              alt="Повтор" 
              className="hover repeat-icon" 
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Player;