import React, { useEffect, useState } from 'react';
import { usePlayer } from '../../contexts/PlayerContext';
import { searchSoundCloud } from '../../utils/soundcloud';
import { getMyWaveQueue } from '../../utils/mywave';
import './HomePage.css';

interface PanelState {
  masterQueue: any[];
  pointer: number;
  visible: [any | null, any | null];
  playedIndex: number;
  lastPlayedId: string | null;
}

const HomePage: React.FC = () => {
  const { playTrack } = usePlayer();
  const [forYouState, setForYouState] = useState<PanelState>({
    masterQueue: [],
    pointer: 0,
    visible: [null, null],
    playedIndex: 0,
    lastPlayedId: null
  });
  const [newState, setNewState] = useState<PanelState>({
    masterQueue: [],
    pointer: 0,
    visible: [null, null],
    playedIndex: 0,
    lastPlayedId: null
  });
  const [trendState, setTrendState] = useState<PanelState>({
    masterQueue: [],
    pointer: 0,
    visible: [null, null],
    playedIndex: 0,
    lastPlayedId: null
  });

  // Инициализация виджетов
  useEffect(() => {
    const initWidgets = async () => {
      try {
        await Promise.all([
          populateForYouWidget(),
          populateNewWidget(),
          populateTrendWidget()
        ]);
      } catch (e) {
        console.warn('Widget initialization failed', e);
      }
    };

    // Задержка для инициализации SoundCloud API
    setTimeout(initWidgets, 1000);
  }, []);

  const populateForYouWidget = async () => {
    try {
      const queue = await getMyWaveQueue(50);
      const newForYouState = {
        masterQueue: queue,
        pointer: 2,
        playedIndex: 0,
        visible: [queue[0] || null, queue[1] || null] as [any | null, any | null],
        lastPlayedId: null
      };
      setForYouState(newForYouState);
    } catch (e) {
      console.warn('populateForYouWidget failed', e);
    }
  };

  const populateNewWidget = async () => {
    try {
      const tracks = await searchSoundCloud('new releases');
      const newNewState = {
        masterQueue: tracks,
        pointer: 2,
        playedIndex: 0,
        visible: [tracks[0] || null, tracks[1] || null] as [any | null, any | null],
        lastPlayedId: null
      };
      setNewState(newNewState);
    } catch (e) {
      console.warn('populateNewWidget failed', e);
    }
  };

  const populateTrendWidget = async () => {
    try {
      const tracks = await searchSoundCloud('top');
      const newTrendState = {
        masterQueue: tracks,
        pointer: 2,
        playedIndex: 0,
        visible: [tracks[0] || null, tracks[1] || null] as [any | null, any | null],
        lastPlayedId: null
      };
      setTrendState(newTrendState);
    } catch (e) {
      console.warn('populateTrendWidget failed', e);
    }
  };

  const startForYouPlay = async (slotIndex: number) => {
    const track = forYouState.visible[slotIndex];
    if (!track) return;

    try {
      await playTrack(track, forYouState.masterQueue, forYouState.masterQueue.findIndex(t => t.id === track.id));
      
      // Обновляем состояние после воспроизведения
      if (slotIndex === 1) {
        // Если играем правый слот, сдвигаем влево
        const nextTrack = getNextFrom(forYouState);
        setForYouState(prev => ({
          ...prev,
          visible: [track, nextTrack],
          playedIndex: prev.playedIndex + 1,
          lastPlayedId: track.id
        }));
      }
    } catch (e) {
      console.warn('startForYouPlay failed', e);
    }
  };

  const startNewPanelPlay = async (slotIndex: number) => {
    const track = newState.visible[slotIndex];
    if (!track) return;

    try {
      await playTrack(track, newState.masterQueue, newState.masterQueue.findIndex(t => t.id === track.id));
      
      if (slotIndex === 1) {
        const nextTrack = getNextFrom(newState);
        setNewState(prev => ({
          ...prev,
          visible: [track, nextTrack],
          playedIndex: prev.playedIndex + 1,
          lastPlayedId: track.id
        }));
      }
    } catch (e) {
      console.warn('startNewPanelPlay failed', e);
    }
  };

  const startTrendPanelPlay = async (slotIndex: number) => {
    const track = trendState.visible[slotIndex];
    if (!track) return;

    try {
      await playTrack(track, trendState.masterQueue, trendState.masterQueue.findIndex(t => t.id === track.id));
      
      if (slotIndex === 1) {
        const nextTrack = getNextFrom(trendState);
        setTrendState(prev => ({
          ...prev,
          visible: [track, nextTrack],
          playedIndex: prev.playedIndex + 1,
          lastPlayedId: track.id
        }));
      }
    } catch (e) {
      console.warn('startTrendPanelPlay failed', e);
    }
  };

  const getNextFrom = (state: PanelState) => {
    if (!state.masterQueue || state.masterQueue.length === 0) return null;
    if (state.pointer >= state.masterQueue.length) return null;
    const track = state.masterQueue[state.pointer];
    return track;
  };

  const getCoverImageUrl = (track: any): string => {
    if (!track?.artwork_url) return '/images/logo.png';
    return track.artwork_url.replace('-large', '-t300x300');
  };

  return (
    <div className="home-page">
      <div className="panels-row">
        <div className="small-panel new-widget">
          <div className="panel-covers" id="new-covers">
            {newState.visible.map((track, index) => (
              <div 
                key={index} 
                className="panel-cover" 
                data-index={index}
                data-track-id={track?.id || ''}
                onClick={() => track && startNewPanelPlay(index)}
                style={{ cursor: track ? 'pointer' : 'default' }}
              >
                <img src={getCoverImageUrl(track)} alt={`n${index}`} />
              </div>
            ))}
          </div>
          <div className="panel-info">
            <div className="panel-title">Новое</div>
          </div>
        </div>
        
        <div className="small-panel trend-widget">
          <div className="panel-covers" id="trend-covers">
            {trendState.visible.map((track, index) => (
              <div 
                key={index} 
                className="panel-cover" 
                data-index={index}
                data-track-id={track?.id || ''}
                onClick={() => track && startTrendPanelPlay(index)}
                style={{ cursor: track ? 'pointer' : 'default' }}
              >
                <img src={getCoverImageUrl(track)} alt={`t${index}`} />
              </div>
            ))}
          </div>
          <div className="panel-info">
            <div className="panel-title">Тренды</div>
          </div>
        </div>
        
        <div className="for-you-widget">
          <div className="fyw-covers" id="fyw-covers">
            {forYouState.visible.map((track, index) => (
              <div 
                key={index} 
                className="fyw-cover" 
                data-index={index}
                data-track-id={track?.id || ''}
                onClick={() => track && startForYouPlay(index)}
                style={{ cursor: track ? 'pointer' : 'default' }}
              >
                <img src={getCoverImageUrl(track)} alt={`c${index}`} />
              </div>
            ))}
          </div>
          <div className="fyw-info">
            <div className="fyw-title">Для вас</div>
          </div>
        </div>
      </div>
      
      <div className="home-center">
      </div>
    </div>
  );
};

export default HomePage;