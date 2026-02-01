import { Track } from '../contexts/PlayerContext';
import { fetch } from '@tauri-apps/plugin-http';

let soundCloudClientId: string | null = null;

// Функция для получения Client ID (точная копия из оригинала)
export const fetchAndSetClientId = async (): Promise<string> => {
  if (soundCloudClientId) return soundCloudClientId;

  try {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 YaBrowser/23.11.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    ];
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    const mainPageResponse = await fetch('https://soundcloud.com', { 
      headers: { 'User-Agent': randomUserAgent } 
    });
    const mainPageHtml = await mainPageResponse.text();

    const scriptUrls = mainPageHtml.match(/https:\/\/a-v2\.sndcdn\.com\/assets\/[a-zA-Z0-9\-_]+\.js/g);

    if (!scriptUrls) {
      throw new Error('Не найдены скрипты на странице SoundCloud.');
    }

    for (const url of scriptUrls) {
      const scriptResponse = await fetch(url, { 
        headers: { 'User-Agent': randomUserAgent } 
      });
      const scriptContent = await scriptResponse.text();
      const match = scriptContent.match(/client_id:"([a-zA-Z0-9_]+)"/);
      if (match && match[1]) {
        soundCloudClientId = match[1];
        return soundCloudClientId;
      }
    }
    throw new Error('Client ID не найден ни в одном из скриптов.');
  } catch (error) {
    throw error;
  }
};

// Функция для выполнения запросов к SoundCloud API
export const fetchSoundCloudAPI = async (url: string, retry: boolean = true): Promise<any> => {
  if (!soundCloudClientId) {
    await fetchAndSetClientId();
    if (!soundCloudClientId) throw new Error("Client ID отсутствует.");
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
  };

  const separator = url.includes('?') ? '&' : '?';
  const fullUrl = `${url}${separator}client_id=${soundCloudClientId}`;
  
  const response = await fetch(fullUrl, { headers });

  if (response.status === 401 && retry) {
    soundCloudClientId = null;
    await fetchAndSetClientId();
    return fetchSoundCloudAPI(url, false);
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Ошибка SoundCloud API: ${response.status} ${response.statusText}. Ответ: ${errorBody}`);
  }
  
  return response.json();
};

// Функция поиска треков
export const searchSoundCloud = async (query: string): Promise<Track[]> => {
  try {
    const url = `https://api-v2.soundcloud.com/search/tracks?q=${encodeURIComponent(query)}&limit=200`;
    const data = await fetchSoundCloudAPI(url);
    
    if (data && data.collection) {
      return data.collection.filter((track: any) => 
        track && track.title && track.user && track.media
      ).map((track: any) => ({
        id: track.id.toString(),
        title: track.title,
        user: {
          username: track.user.username,
          id: track.user.id.toString()
        },
        duration: track.duration / 1000, // Convert to seconds
        permalink_url: track.permalink_url,
        media: track.media,
        artwork_url: track.artwork_url
      }));
    }
    
    return [];
  } catch (error) {
    throw error;
  }
};

// Функция для получения stream URL
export const getStreamUrl = async (track: Track): Promise<string> => {
  if (!track.media?.transcodings?.length) {
    throw new Error('No media transcodings available');
  }

  // Ищем MP3 transcoding
  const mp3Transcoding = track.media.transcodings.find(
    t => t.format.protocol === 'progressive' && t.format.mime_type === 'audio/mpeg'
  );

  const transcoding = mp3Transcoding || track.media.transcodings[0];
  
  try {
    const data = await fetchSoundCloudAPI(transcoding.url);
    return data.url;
  } catch (error) {
    throw error;
  }
};

// Функция форматирования времени
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

// Функция для получения обложки
export const getCoverUrl = (track: Track): string => {
  if (!track.artwork_url) return '/images/logo.png';
  return track.artwork_url.replace('-large', '-t500x500');
};