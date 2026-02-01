import React, { useState, useEffect } from 'react';
import { usePlayer } from '../../contexts/PlayerContext';
import './SettingsPage.css';

const SettingsPage: React.FC = () => {
  const { volume, setVolume } = usePlayer();
  const [downloadPath, setDownloadPath] = useState('Downloads');
  const [audioQuality, setAudioQuality] = useState('high');
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    const savedSettings = localStorage.getItem('axom-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setDownloadPath(settings.downloadPath || 'Downloads');
        setAudioQuality(settings.audioQuality || 'high');
        setAutoPlay(settings.autoPlay !== undefined ? settings.autoPlay : true);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  const saveSettings = () => {
    const settings = {
      downloadPath,
      audioQuality,
      autoPlay
    };
    localStorage.setItem('axom-settings', JSON.stringify(settings));
  };

  useEffect(() => {
    saveSettings();
  }, [downloadPath, audioQuality, autoPlay]);

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-sections">
          <div className="settings-section">
            <h2 className="section-title">Аудио</h2>
            
            <div className="setting-item">
              <div className="setting-info">
                <div className="setting-name">Громкость</div>
                <div className="setting-description">Общая громкость воспроизведения</div>
              </div>
              <div className="setting-control">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="volume-slider"
                />
                <span className="volume-value">{Math.round(volume * 100)}%</span>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <div className="setting-name">Качество аудио</div>
                <div className="setting-description">Качество скачиваемых треков</div>
              </div>
              <div className="setting-control">
                <select 
                  value={audioQuality} 
                  onChange={(e) => setAudioQuality(e.target.value)}
                  className="quality-select"
                >
                  <option value="low">Низкое (128 kbps)</option>
                  <option value="medium">Среднее (192 kbps)</option>
                  <option value="high">Высокое (320 kbps)</option>
                </select>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <div className="setting-name">Автовоспроизведение</div>
                <div className="setting-description">Автоматически воспроизводить следующий трек</div>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={autoPlay}
                    onChange={(e) => setAutoPlay(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h2 className="section-title">Загрузки</h2>
            
            <div className="setting-item">
              <div className="setting-info">
                <div className="setting-name">Папка загрузок</div>
                <div className="setting-description">Полный путь к папке для сохранения треков</div>
              </div>
              <div className="setting-control">
                <input
                  type="text"
                  value={downloadPath}
                  onChange={(e) => setDownloadPath(e.target.value)}
                  className="path-input"
                  placeholder="C:\Users\Username\Downloads"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;