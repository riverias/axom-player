import React from 'react';
import { invoke } from '@tauri-apps/api/core';
import './TitleBar.css';

const TitleBar: React.FC = () => {
  const handleMinimize = () => {
    invoke('minimize_window');
  };

  const handleMaximize = () => {
    invoke('maximize_window');
  };

  const handleClose = () => {
    invoke('close_window');
  };

  return (
    <div className="title-bar" data-tauri-drag-region>
      <div className="window-title">axom</div>
      <div className="window-controls">
        <button className="window-btn minimize" onClick={handleMinimize}>
          <img src="/images/minimize.svg" alt="Свернуть" className="default" />
          <img src="/images/minimizes.svg" alt="Свернуть" className="hover" />
        </button>
        <button className="window-btn maximize" onClick={handleMaximize}>
          <img src="/images/maximize.svg" alt="Развернуть" className="default" />
          <img src="/images/maximizes.svg" alt="Развернуть" className="hover" />
        </button>
        <button className="window-btn close" onClick={handleClose}>
          <img src="/images/close.svg" alt="Закрыть" className="default" />
          <img src="/images/closes.svg" alt="Закрыть" className="hover" />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;