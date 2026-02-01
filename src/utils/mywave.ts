import { Track } from '../contexts/PlayerContext';
import { fetchSoundCloudAPI, searchSoundCloud } from './soundcloud';

export interface MyWaveState {
  queue: Track[];
  index: number;
}

// Функция для сохранения ID артиста
export const storeArtistId = (artistId: string | number): void => {
  if (!artistId) return;
  
  try {
    const key = 'axurmo-mywave-artists';
    let arr: (string | number)[] = [];
    
    try {
      arr = JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
      arr = [];
    }
    
    // Нормализуем к числу если возможно
    const idVal = (typeof artistId === 'string' && artistId.match(/^\d+$/)) ? Number(artistId) : artistId;
    
    if (!arr.includes(idVal)) {
      arr.push(idVal);
      try {
        localStorage.setItem(key, JSON.stringify(arr));
      } catch (e) {
        // Silent fail
      }
    }
  } catch (e) {
    // Silent fail
  }
};

// Функция для получения очереди MyWave
export const getMyWaveQueue = async (limit: number = 50): Promise<Track[]> => {
  const raw = localStorage.getItem('axurmo-mywave-artists') || '[]';
  let ids: (string | number)[] = [];
  
  try {
    ids = JSON.parse(raw);
  } catch (e) {
    ids = [];
  }
  
  ids = Array.from(new Set((ids || []).filter(Boolean)));
  
  if (!ids.length) return [];

  const results: any[] = [];

  for (const userId of ids) {
    try {
      const url = `https://api-v2.soundcloud.com/users/${userId}/tracks?limit=10`;
      let res: any = [];
      
      try {
        res = await fetchSoundCloudAPI(url);
      } catch (e) {
        // Silent fail
      }
      
      // Нормализуем разные форматы ответа
      let items: any[] = [];
      if (Array.isArray(res)) items = res;
      else if (res && res.collection) items = res.collection;
      else if (res && res.data) items = res.data;
      else if (res && res.tracks) items = res.tracks;
      else items = [];

      if ((!items || items.length === 0) && userId) {
        try {
          const userInfo = await fetchSoundCloudAPI(`https://api-v2.soundcloud.com/users/${userId}`);
          const uname = userInfo && (userInfo.username || userInfo.permalink);
          
          if (uname) {
            const searchRes = await searchSoundCloud(uname);
            if (Array.isArray(searchRes) && searchRes.length) {
              items = searchRes;
            }
          }
        } catch (e) {
          // Silent fail
        }
      }

      if (Array.isArray(items) && items.length) {
        for (let t of items) {
          // Если у трека нет медиа, пробуем получить детальную информацию
          if ((!t.media || (Array.isArray(t.media.transcodings) && t.media.transcodings.length === 0)) && t.id) {
            try {
              const detailed = await fetchSoundCloudAPI(`https://api-v2.soundcloud.com/tracks/${t.id}`);
              if (detailed && detailed.id) t = detailed;
            } catch (e) {
              // Silent fail
            }
          }
          results.push(t);
          if (results.length >= limit) break;
        }
      }
    } catch (e) {
      // Silent fail
    }
    if (results.length >= limit) break;
  }

  // Удаляем дубликаты и перемешиваем
  const map = new Map();
  results.forEach(r => { if (r && r.id) map.set(r.id, r); });
  const uniq = Array.from(map.values());
  
  // Перемешиваем массив
  for (let i = uniq.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [uniq[i], uniq[j]] = [uniq[j], uniq[i]];
  }
  
  return uniq.slice(0, limit).map((track: any) => ({
    id: track.id.toString(),
    title: track.title,
    user: {
      username: track.user.username,
      id: track.user.id.toString()
    },
    duration: track.duration / 1000,
    permalink_url: track.permalink_url,
    media: track.media,
    artwork_url: track.artwork_url
  }));
};