import React, { useEffect, useRef, useState } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { getCoverUrl, formatTime, fetchSoundCloudAPI } from '../utils/soundcloud';
import './FullscreenPlayer.css';

const FullscreenPlayer: React.FC = () => {
  const { 
    currentTrack,
    isPlaying,
    isFullscreenPlayerVisible,
    currentTime,
    duration,
    pauseTrack,
    resumeTrack,
    nextTrack,
    prevTrack,
    seekTo,
    toggleFullscreenPlayer
  } = usePlayer();

  const fullscreenPlayerRef = useRef<HTMLDivElement>(null);
  const coverImageRef = useRef<HTMLImageElement>(null);

  // Улучшенная функция для извлечения доминирующего цвета из изображения
  const extractDominantColor = (imgElement: HTMLImageElement): string => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return getColorFromUrl(imgElement.src);

      // Уменьшаем размер для быстрой обработки
      const size = 100;
      canvas.width = size;
      canvas.height = size;
      
      ctx.drawImage(imgElement, 0, 0, size, size);
      
      const imageData = ctx.getImageData(0, 0, size, size);
      const data = imageData.data;
      
      // Собираем цвета и их частоту
      const colorMap = new Map<string, { count: number, r: number, g: number, b: number }>();
      let totalPixels = 0;
      
      // Анализируем каждый пиксель
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const alpha = data[i + 3];
        
        // Пропускаем прозрачные пиксели
        if (alpha < 128) continue;
        
        totalPixels++;
        
        // Группируем похожие цвета (уменьшаем точность для группировки)
        const groupedR = Math.floor(r / 20) * 20;
        const groupedG = Math.floor(g / 20) * 20;
        const groupedB = Math.floor(b / 20) * 20;
        
        const colorKey = `${groupedR},${groupedG},${groupedB}`;
        
        if (colorMap.has(colorKey)) {
          const existing = colorMap.get(colorKey)!;
          existing.count++;
          // Усредняем цвета в группе
          existing.r = (existing.r + r) / 2;
          existing.g = (existing.g + g) / 2;
          existing.b = (existing.b + b) / 2;
        } else {
          colorMap.set(colorKey, { count: 1, r, g, b });
        }
      }
      
      if (colorMap.size === 0) return getColorFromUrl(imgElement.src);
      
      // Исключаем слишком редкие цвета (менее 2% от общего количества пикселей)
      const minCount = Math.max(1, totalPixels * 0.02);
      const significantColors = Array.from(colorMap.entries())
        .filter(([_, data]) => data.count >= minCount)
        .sort((a, b) => b[1].count - a[1].count);
      
      if (significantColors.length === 0) return getColorFromUrl(imgElement.src);
      
      // Берем самый частый значимый цвет
      const dominantColorData = significantColors[0][1];
      let { r, g, b } = dominantColorData;
      
      // Определяем общую яркость обложки
      const avgBrightness = (r + g + b) / 3;
      
      // Конвертируем в HSL для лучшего контроля
      const hsl = rgbToHsl(r, g, b);
      
      // Адаптивное затемнение в зависимости от исходной яркости
      let darkenFactor: number;
      let saturationFactor: number;
      
      if (avgBrightness > 180) {
        // Очень светлая обложка - умеренное затемнение
        darkenFactor = 0.7;
        saturationFactor = 1.4;
      } else if (avgBrightness > 120) {
        // Средне-светлая обложка - среднее затемнение
        darkenFactor = 0.6;
        saturationFactor = 1.3;
      } else if (avgBrightness > 80) {
        // Средняя яркость - небольшое затемнение
        darkenFactor = 0.5;
        saturationFactor = 1.2;
      } else {
        // Темная обложка - минимальное затемнение
        darkenFactor = 0.4;
        saturationFactor = 1.1;
      }
      
      // Применяем изменения - БЕЗ ЗАТЕМНЕНИЯ
      hsl[1] = Math.min(1, hsl[1] * 1.1); // Небольшое увеличение насыщенности
      // Яркость оставляем как есть - НЕ ЗАТЕМНЯЕМ
      
      const [finalR, finalG, finalB] = hslToRgb(hsl[0], hsl[1], hsl[2]);
      
      return `rgb(${Math.round(finalR)}, ${Math.round(finalG)}, ${Math.round(finalB)})`;
    } catch (e) {
      // Если CORS блокирует доступ, используем fallback метод
      return getColorFromUrl(imgElement.src);
    }
  };

  // Fallback метод для получения цвета на основе URL или предустановленных схем
  const getColorFromUrl = (url: string): string => {
    // Генерируем цвет на основе хеша URL
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Предустановленные приятные цветовые схемы для музыкальных обложек
    const colorSchemes = [
      'rgb(45, 25, 85)',   // Темно-фиолетовый
      'rgb(85, 25, 45)',   // Темно-красный
      'rgb(25, 65, 85)',   // Темно-синий
      'rgb(65, 45, 25)',   // Темно-коричневый
      'rgb(25, 85, 65)',   // Темно-зеленый
      'rgb(85, 65, 25)',   // Темно-оранжевый
      'rgb(65, 25, 85)',   // Темно-пурпурный
      'rgb(45, 85, 25)',   // Темно-лаймовый
      'rgb(25, 45, 85)',   // Темно-индиго
      'rgb(85, 45, 65)',   // Темно-розовый
    ];
    
    const index = Math.abs(hash) % colorSchemes.length;
    return colorSchemes[index];
  };

  // Вспомогательные функции для конвертации цветов
  const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return [h, s, l];
  };

  const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [r * 255, g * 255, b * 255];
  };

  const updateFullscreenBackground = () => {
    if (!coverImageRef.current || !fullscreenPlayerRef.current) return;
    
    const coverImage = coverImageRef.current;
    if (coverImage.complete && coverImage.naturalHeight !== 0) {
      try {
        const dominantColor = extractDominantColor(coverImage);
        fullscreenPlayerRef.current.style.backgroundColor = dominantColor;
      } catch (e) {
        console.warn('Не удалось извлечь цвет из обложки (CORS):', e.message);
        // Fallback: используем градиент по умолчанию
        fullscreenPlayerRef.current.style.backgroundColor = '#111111';
      }
    } else {
      fullscreenPlayerRef.current.style.backgroundColor = '#111111';
    }
  };

  useEffect(() => {
    if (isFullscreenPlayerVisible && currentTrack) {
      // Обновляем фон при открытии плеера
      setTimeout(() => updateFullscreenBackground(), 100);
    }
  }, [isFullscreenPlayerVisible, currentTrack]);

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseTrack();
    } else {
      resumeTrack();
    }
  };

  const handleCoverLoad = () => {
    updateFullscreenBackground();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seekTo(time);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!isFullscreenPlayerVisible || !currentTrack) {
    return null;
  }

  return (
    <div 
      className="fullscreen-player" 
      ref={fullscreenPlayerRef}
    >

      
      <div className="player-handle-fullscreen" onClick={toggleFullscreenPlayer}></div>
      
      <div className="fullscreen-player-controls">
        <button className="fullscreen-control-btn" onClick={prevTrack}>
          <img src="/images/previous.svg" alt="Предыдущий" />
        </button>
        
        <div className="fullscreen-center-section">
          <div className="fullscreen-cover-wrapper">
            <div className="fullscreen-cover-container">
              <img 
                ref={coverImageRef}
                src={getCoverUrl(currentTrack)} 
                alt="Cover"
                crossOrigin="anonymous"
                onLoad={handleCoverLoad}
                onError={() => {
                  // Если изображение не загрузилось с CORS, пробуем без него
                  if (coverImageRef.current && coverImageRef.current.crossOrigin) {
                    coverImageRef.current.crossOrigin = '';
                    coverImageRef.current.src = getCoverUrl(currentTrack);
                  }
                }}
              />
              <div className="fullscreen-cover-overlay"></div>
            </div>
            <button className="fullscreen-play-btn" onClick={handlePlayPause}>
              {isPlaying ? (
                <img src="/images/stops.svg" alt="Пауза" className="pause-icon" />
              ) : (
                <img src="/images/plays.svg" alt="Играть" className="play-icon" />
              )}
            </button>
          </div>
          
          <div className="fullscreen-track-info">
            <div className="fullscreen-track-title">{currentTrack.title}</div>
            <div className="fullscreen-track-artist">{currentTrack.user.username}</div>
          </div>
          
          <div className="fullscreen-progress-section">
            <div className="fullscreen-progress-container">
              <span className="fullscreen-time-current">{formatTime(currentTime)}</span>
              <input
                type="range"
                className="fullscreen-trackbar"
                value={currentTime}
                max={duration}
                step="1"
                onChange={handleSeek}
                style={{ '--track-progress': `${progressPercent}%` } as React.CSSProperties}
              />
              <span className="fullscreen-time-duration">{formatTime(duration)}</span>
            </div>
          </div>
        </div>
        
        <button className="fullscreen-control-btn" onClick={nextTrack}>
          <img src="/images/previous.svg" alt="Следующий" style={{ transform: 'rotate(180deg)' }} />
        </button>
      </div>
    </div>
  );
};

export default FullscreenPlayer;