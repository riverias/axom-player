import React, { useState, useEffect } from 'react';
import { usePlayer } from '../../contexts/PlayerContext';
import { searchSoundCloud, formatTime, getCoverUrl } from '../../utils/soundcloud';
import TrackItem from '../TrackItem';
import './SearchPage.css';

const SearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const { 
    searchResults, 
    setSearchResults, 
    isSearching, 
    setIsSearching,
    playTrack 
  } = usePlayer();

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchSoundCloud(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for search
    const timeout = setTimeout(() => {
      handleSearch(query);
    }, 500);

    setSearchTimeout(timeout);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      handleSearch(searchQuery);
    }
  };

  const handleTrackPlay = (track: any, index: number) => {
    playTrack(track, searchResults, index);
  };

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const renderContent = () => {
    if (isSearching) {
      return (
        <div className="track-skeleton-list">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="track-skeleton">
              <div className="track-skeleton-number">
                <div className="track-skeleton-number-shimmer"></div>
              </div>
              <div className="circle">
                <div className="track-skeleton-shimmer"></div>
              </div>
              <div className="lines">
                <div className="line1"></div>
                <div className="line2"></div>
              </div>
              <div className="duration"></div>
              <div className="track-skeleton-shimmer"></div>
            </div>
          ))}
        </div>
      );
    }

    if (searchResults.length === 0) {
      return (
        <div className="no-results">
          {searchQuery ? (
            <img src="/images/404.png" className="img-404" alt="404" />
          ) : (
            'Начните поиск...'
          )}
        </div>
      );
    }

    return (
      <div className="search-results-list">
        {searchResults.map((track, index) => (
          <TrackItem
            key={track.id}
            track={track}
            index={index + 1}
            queue={searchResults}
            context="search"
          />
        ))}
      </div>
    );
  };

  return (
    <div className="search-page">
      <div className="search-container">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="Введите название песни..."
            value={searchQuery}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
          />
          <img src="/images/search.svg" alt="Поиск" className="search-icon" />
        </div>
      </div>
      
      <div className="search-results">
        {renderContent()}
      </div>
    </div>
  );
};

export default SearchPage;