import React, { useEffect, useRef } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const { activePage, setActivePage } = usePlayer();
  const iconsContainerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  const handlePageChange = (page: string) => {
    setActivePage(page);
  };

  // Функция для перемещения активной полоски (адаптированная для центрированных кнопок)
  const moveSidebarActiveIndicator = (pageId: string) => {
    const indicator = indicatorRef.current;
    const iconsContainer = iconsContainerRef.current;
    
    if (!indicator || !iconsContainer) return;

    const btns = Array.from(iconsContainer.querySelectorAll('.icon-btn'));
    const pageIndex = ['home', 'search', 'playlists', 'settings'].indexOf(pageId);
    const btn = btns[pageIndex];
    
    if (!btn) return;

    const btnRect = btn.getBoundingClientRect();
    const panelRect = document.querySelector('.left-panel')?.getBoundingClientRect();
    
    if (!panelRect) return;
    
    // Вычисляем позицию относительно левой панели
    const btnHeight = btnRect.height;
    const indicatorHeight = 22; // как в CSS
    const topPosition = btnRect.top - panelRect.top + (btnHeight / 2) - (indicatorHeight / 2);
    
    indicator.style.top = topPosition + 'px';
  };

  useEffect(() => {
    // Перемещаем полоску при изменении активной страницы
    // Добавляем небольшую задержку, чтобы DOM успел обновиться
    const timer = setTimeout(() => moveSidebarActiveIndicator(activePage), 50);
    return () => clearTimeout(timer);
  }, [activePage]);

  useEffect(() => {
    // Инициализируем позицию полоски при монтировании
    const timer = setTimeout(() => moveSidebarActiveIndicator(activePage), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="left-panel">
      <div className="sidebar-active-indicator" ref={indicatorRef}></div>
      <div className="left-panel-content">
        <div className="top-section">
          <img src="/images/logo.png" alt="Logo" className="logo-panel" />
        </div>
        
        <div className="icons-container" ref={iconsContainerRef}>
          <button 
            className={`icon-btn ${activePage === 'home' ? 'active' : ''}`}
            onClick={() => handlePageChange('home')}
          >
            <img src="/images/home.svg" alt="Главная" className="default" />
            <img src="/images/homes.svg" alt="Главная" className="hover" />
          </button>
          <button 
            className={`icon-btn ${activePage === 'search' ? 'active' : ''}`}
            onClick={() => handlePageChange('search')}
          >
            <img src="/images/search.svg" alt="Поиск" className="default" />
            <img src="/images/searchs.svg" alt="Поиск" className="hover" />
          </button>
          <button 
            className={`icon-btn ${activePage === 'playlists' ? 'active' : ''}`}
            onClick={() => handlePageChange('playlists')}
          >
            <img src="/images/lib.svg" alt="Плейлисты" className="default" />
            <img src="/images/libs.svg" alt="Плейлисты" className="hover" />
          </button>
          <button 
            className={`icon-btn ${activePage === 'settings' ? 'active' : ''}`}
            onClick={() => handlePageChange('settings')}
          >
            <img src="/images/setting.svg" alt="Настройки" className="default" />
            <img src="/images/settings.svg" alt="Настройки" className="hover" />
          </button>
        </div>
        
        <div className="bottom-section">
          <img src="/images/test.jpg" alt="Профиль" className="profile-img" />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;