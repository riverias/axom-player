import React from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import './DownloadProgress.css';

const DownloadProgress: React.FC = () => {
  const { downloadProgress } = usePlayer();

  if (!downloadProgress || !downloadProgress.isDownloading) {
    return null;
  }

  const progressPercentage = downloadProgress.total > 0 
    ? (downloadProgress.current / downloadProgress.total) * 100 
    : 0;

  return (
    <div className="download-progress-panel">
      <div className="download-progress-loader">
        <svg className="circular-progress" viewBox="0 0 36 36">
          <path
            className="circle-bg"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="circle"
            strokeDasharray={`${progressPercentage}, 100`}
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="progress-text">
          {downloadProgress.current}/{downloadProgress.total}
        </div>
      </div>
      
      <div className="download-info">
        {downloadProgress.currentTrack && (
          <div className="current-track-name">
            {downloadProgress.currentTrack}
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadProgress;