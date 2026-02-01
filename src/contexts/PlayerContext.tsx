import React, { createContext, useContext, useState, useRef, ReactNode, useCallback, useEffect } from 'react';
import { getStreamUrl } from '../utils/soundcloud';

export interface Track {
  id: string;
  title: string;
  user: {
    username: string;
    id: string;
  };
  duration: number;
  permalink_url?: string;
  media?: {
    transcodings: Array<{
      url: string;
      format: {
        protocol: string;
        mime_type: string;
      };
    }>;
  };
  artwork_url?: string;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: Date;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  activePage: string;
  isFullscreenPlayerVisible: boolean;
  searchResults: Track[];
  isSearching: boolean;
  currentQueue: Track[];
  currentIndex: number;
  playlists: Playlist[];
  toasts: ToastMessage[];
  activeContextMenu: string | null;
  downloadProgress: {
    isDownloading: boolean;
    current: number;
    total: number;
    currentTrack?: string;
    status: string;
  } | null;
  recentTracks: any[];
  settings: {
    downloadPath: string;
    audioQuality: 'low' | 'medium' | 'high';
    autoPlay: boolean;
    showNotifications: boolean;
    darkTheme: boolean;
  };
  isShuffleEnabled: boolean;
  repeatMode: 'off' | 'all' | 'one';
  playlistShuffleEnabled: Record<string, boolean>;
  playlistRepeatMode: Record<string, 'off' | 'all' | 'one'>;
  likedTracks: Record<string, string[]>;
  pendingTrackForPlaylist: Track | null;
  playTrack: (track: Track, queue?: Track[], index?: number) => Promise<void>;
  pauseTrack: () => void;
  resumeTrack: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  togglePlaylistShuffle: (playlistId: string) => void;
  togglePlaylistRepeat: (playlistId: string) => void;
  toggleLike: (trackId: string, context: string) => void;
  isTrackLiked: (trackId: string, context: string) => boolean;
  setActivePage: (page: string) => void;
  toggleFullscreenPlayer: () => void;
  setSearchResults: (results: Track[]) => void;
  setIsSearching: (searching: boolean) => void;
  createPlaylist: (name: string) => void;
  deletePlaylist: (playlistId: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  playPlaylist: (playlist: Playlist) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  removeToast: (toastId: string) => void;
  setActiveContextMenu: (trackId: string | null) => void;
  downloadPlaylist: (playlistName: string, tracks: any[]) => Promise<void>;
  setDownloadProgress: (progress: any) => void;
  setPendingTrackForPlaylist: (track: Track | null) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

interface PlayerProviderProps {
  children: ReactNode;
}

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [activePage, setActivePage] = useState('home');
  const [isFullscreenPlayerVisible, setIsFullscreenPlayerVisible] = useState(false);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentQueue, setCurrentQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeContextMenu, setActiveContextMenu] = useState<string | null>(null);
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [likedTracks, setLikedTracks] = useState<Record<string, string[]>>({});
  const [playlistShuffleEnabled, setPlaylistShuffleEnabled] = useState<Record<string, boolean>>({});
  const [playlistRepeatMode, setPlaylistRepeatMode] = useState<Record<string, 'off' | 'all' | 'one'>>({});
  const [downloadProgress, setDownloadProgress] = useState<{
    isDownloading: boolean;
    current: number;
    total: number;
    currentTrack?: string;
    status: string;
  } | null>(null);
  const [recentTracks, setRecentTracks] = useState<any[]>([]);
  const [pendingTrackForPlaylist, setPendingTrackForPlaylist] = useState<Track | null>(null);
  const [settings, setSettings] = useState({
    downloadPath: 'Downloads',
    audioQuality: 'high' as 'low' | 'medium' | 'high',
    autoPlay: true,
    showNotifications: true,
    darkTheme: true
  });
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const savedPlaylists = localStorage.getItem('axom-playlists');
    if (savedPlaylists) {
      try {
        const parsedPlaylists = JSON.parse(savedPlaylists);
        const playlistsWithDates = parsedPlaylists.map((playlist: any) => ({
          ...playlist,
          createdAt: new Date(playlist.createdAt)
        }));
        setPlaylists(playlistsWithDates);
      } catch (error) {
        console.error('Failed to load playlists from localStorage:', error);
      }
    }

    const savedLikes = localStorage.getItem('axom-liked-tracks');
    if (savedLikes) {
      try {
        const parsedLikes = JSON.parse(savedLikes);
        setLikedTracks(parsedLikes || {});
      } catch (error) {
        console.error('Failed to load liked tracks from localStorage:', error);
      }
    }

    const savedRecent = localStorage.getItem('axom-recent-tracks');
    if (savedRecent) {
      try {
        const parsedRecent = JSON.parse(savedRecent);
        setRecentTracks(parsedRecent || []);
      } catch (error) {
        console.error('Failed to load recent tracks from localStorage:', error);
      }
    }

    const savedSettings = localStorage.getItem('axom-settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      } catch (error) {
        console.error('Failed to load settings from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('axom-playlists', JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    localStorage.setItem('axom-liked-tracks', JSON.stringify(likedTracks));
  }, [likedTracks]);

  useEffect(() => {
    localStorage.setItem('axom-recent-tracks', JSON.stringify(recentTracks));
  }, [recentTracks]);

  const playTrack = useCallback(async (track: Track, queue?: Track[], index?: number) => {
    if (!audioRef.current) return;
    
    setIsLoading(true);
    setCurrentTrack(track);
    
    if (queue) {
      setCurrentQueue(queue);
      setCurrentIndex(index ?? queue.findIndex(t => t.id === track.id));
    }
    
    setRecentTracks(prev => {
      const filtered = prev.filter(t => t.id !== track.id);
      return [track, ...filtered].slice(0, 10);
    });
    
    try {
      const { storeArtistId } = await import('../utils/mywave');
      if (track.user?.id) {
        storeArtistId(track.user.id);
      }
    } catch (e) {
      console.warn('Failed to store artist ID', e);
    }
    
    try {
      const streamUrl = await getStreamUrl(track);
      audioRef.current.src = streamUrl;
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing track:', error);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pauseTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const resumeTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  const nextTrack = useCallback(() => {
    if (currentQueue.length === 0 || currentIndex === -1) return;
    
    let nextIndex: number;
    
    if (repeatMode === 'one') {
      nextIndex = currentIndex;
    } else if (isShuffleEnabled) {
      do {
        nextIndex = Math.floor(Math.random() * currentQueue.length);
      } while (nextIndex === currentIndex && currentQueue.length > 1);
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= currentQueue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          return;
        }
      }
    }
    
    const nextTrack = currentQueue[nextIndex];
    playTrack(nextTrack, currentQueue, nextIndex);
  }, [currentQueue, currentIndex, playTrack, isShuffleEnabled, repeatMode]);

  const prevTrack = useCallback(() => {
    if (currentQueue.length === 0 || currentIndex === -1) return;
    
    let prevIndex: number;
    
    if (repeatMode === 'one') {
      prevIndex = currentIndex;
    } else if (isShuffleEnabled) {
      do {
        prevIndex = Math.floor(Math.random() * currentQueue.length);
      } while (prevIndex === currentIndex && currentQueue.length > 1);
    } else {
      prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        if (repeatMode === 'all') {
          prevIndex = currentQueue.length - 1;
        } else {
          return;
        }
      }
    }
    
    const prevTrack = currentQueue[prevIndex];
    playTrack(prevTrack, currentQueue, prevIndex);
  }, [currentQueue, currentIndex, playTrack, isShuffleEnabled, repeatMode]);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setVolumeState(newVolume);
    }
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffleEnabled(!isShuffleEnabled);
  }, [isShuffleEnabled]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode(current => {
      switch (current) {
        case 'off': return 'all';
        case 'all': return 'one';
        case 'one': return 'off';
        default: return 'off';
      }
    });
  }, []);

  const toggleLike = useCallback((trackId: string, context: string) => {
    setLikedTracks(prev => {
      const newLikedTracks = { ...prev };
      const contextLikes = [...(newLikedTracks[context] || [])];
      
      const trackIndex = contextLikes.indexOf(trackId);
      if (trackIndex !== -1) {
        contextLikes.splice(trackIndex, 1);
      } else {
        contextLikes.push(trackId);
      }
      
      if (contextLikes.length === 0) {
        delete newLikedTracks[context];
      } else {
        newLikedTracks[context] = contextLikes;
      }
      
      return newLikedTracks;
    });
  }, []);

  const isTrackLiked = useCallback((trackId: string, context: string) => {
    const contextLikes = likedTracks[context] || [];
    return contextLikes.includes(trackId);
  }, [likedTracks]);

  const togglePlaylistShuffle = useCallback((playlistId: string) => {
    setPlaylistShuffleEnabled(prev => ({
      ...prev,
      [playlistId]: !prev[playlistId]
    }));
  }, []);

  const togglePlaylistRepeat = useCallback((playlistId: string) => {
    setPlaylistRepeatMode(prev => {
      const currentMode = prev[playlistId] || 'off';
      const newMode = currentMode === 'off' ? 'all' : currentMode === 'all' ? 'one' : 'off';
      return {
        ...prev,
        [playlistId]: newMode
      };
    });
  }, []);

  const downloadPlaylist = useCallback(async (playlistName: string, tracks: any[]) => {
    try {
      setDownloadProgress({
        isDownloading: true,
        current: 0,
        total: tracks.length,
        status: 'starting'
      });

      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('download_playlist', {
        playlistName,
        tracks
      });
    } catch (error) {
      console.error('Error downloading playlist:', error);
      setDownloadProgress(null);
    }
  }, []);

  useEffect(() => {
    const setupDownloadListener = async () => {
      const { listen } = await import('@tauri-apps/api/event');
      
      const unlisten = await listen('download_progress', (event: any) => {
        const progress = event.payload;
        setDownloadProgress({
          isDownloading: progress.status !== 'completed',
          current: progress.current,
          total: progress.total,
          currentTrack: progress.current_track,
          status: progress.status
        });

        if (progress.status === 'completed') {
          setTimeout(() => {
            setDownloadProgress(null);
          }, 3000);
        }
      });

      return unlisten;
    };

    setupDownloadListener();
  }, []);

  const toggleFullscreenPlayer = useCallback(() => {
    setIsFullscreenPlayerVisible(!isFullscreenPlayerVisible);
  }, [isFullscreenPlayerVisible]);

  const createPlaylist = useCallback((name: string) => {
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      tracks: [],
      createdAt: new Date()
    };
    setPlaylists(prev => [...prev, newPlaylist]);
  }, []);

  const deletePlaylist = useCallback((playlistId: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
  }, []);

  const addTrackToPlaylist = useCallback((playlistId: string, track: Track) => {
    setPlaylists(prev => prev.map(playlist => 
      playlist.id === playlistId 
        ? { ...playlist, tracks: [...playlist.tracks, track] }
        : playlist
    ));
  }, []);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists(prev => prev.map(playlist => 
      playlist.id === playlistId 
        ? { ...playlist, tracks: playlist.tracks.filter(t => t.id !== trackId) }
        : playlist
    ));
  }, []);

  const playPlaylist = useCallback((playlist: Playlist) => {
    if (playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0], playlist.tracks, 0);
    }
  }, [playTrack]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const newToast: ToastMessage = {
      id: Date.now().toString(),
      message,
      type
    };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== toastId));
  }, []);

  const value: PlayerContextType = {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    activePage,
    isFullscreenPlayerVisible,
    searchResults,
    isSearching,
    currentQueue,
    currentIndex,
    playlists,
    toasts,
    activeContextMenu,
    isShuffleEnabled,
    repeatMode,
    likedTracks,
    downloadProgress,
    playlistShuffleEnabled,
    playlistRepeatMode,
    recentTracks,
    settings,
    pendingTrackForPlaylist,
    playTrack,
    pauseTrack,
    resumeTrack,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
    isTrackLiked,
    togglePlaylistShuffle,
    togglePlaylistRepeat,
    setActivePage,
    toggleFullscreenPlayer,
    setSearchResults,
    setIsSearching,
    createPlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    playPlaylist,
    showToast,
    removeToast,
    setActiveContextMenu,
    downloadPlaylist,
    setDownloadProgress,
    setPendingTrackForPlaylist,
    audioRef
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onDurationChange={() => setDuration(audioRef.current?.duration || 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          nextTrack();
        }}
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
      />
    </PlayerContext.Provider>
  );
};