// Simple Watchlist Utility
import AsyncStorage from '@react-native-async-storage/async-storage';

const WATCHLIST_KEY = 'userWatchlist';

// Add content to watchlist
export const addToWatchlist = async (content) => {
  try {
    const watchlist = await getWatchlist();
    
    // Create unique key for content
    const contentKey = `${content.type}_${content.id}`;
    
    // Update or add content
    watchlist[contentKey] = {
      id: content.id,
      type: content.type, // 'movie' or 'tv'
      title: content.title,
      poster_path: content.poster_path,
      backdrop_path: content.backdrop_path,
      overview: content.overview,
      lastWatched: Date.now(),
      // For TV shows, track last episode
      season: content.season || null,
      episode: content.episode || null,
      // For movies, just mark as watched
      isMovie: content.type === 'movie'
    };
    
    await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
    console.log('Added to watchlist:', content.title);
  } catch (error) {
    console.error('Error adding to watchlist:', error);
  }
};

// Get watchlist
export const getWatchlist = async () => {
  try {
    const watchlist = await AsyncStorage.getItem(WATCHLIST_KEY);
    return watchlist ? JSON.parse(watchlist) : {};
  } catch (error) {
    console.error('Error getting watchlist:', error);
    return {};
  }
};

// Remove from watchlist
export const removeFromWatchlist = async (contentId, contentType) => {
  try {
    const watchlist = await getWatchlist();
    const contentKey = `${contentType}_${contentId}`;
    
    if (watchlist[contentKey]) {
      delete watchlist[contentKey];
      await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
      console.log('Removed from watchlist:', contentId);
    }
  } catch (error) {
    console.error('Error removing from watchlist:', error);
  }
};

// Get continue watching data (sorted by last watched)
export const getContinueWatchingData = async () => {
  try {
    const watchlist = await getWatchlist();
    
    if (Object.keys(watchlist).length === 0) {
      return [];
    }
    
    // Convert to array and sort by last watched
    const continueWatching = Object.values(watchlist)
      .sort((a, b) => b.lastWatched - a.lastWatched)
      .slice(0, 10); // Return top 10 most recent
    
    return continueWatching;
  } catch (error) {
    console.error('Error getting continue watching data:', error);
    return [];
  }
};

// Check if content is in watchlist
export const isInWatchlist = async (contentId, contentType) => {
  try {
    const watchlist = await getWatchlist();
    const contentKey = `${contentType}_${contentId}`;
    return !!watchlist[contentKey];
  } catch (error) {
    console.error('Error checking watchlist:', error);
    return false;
  }
};

// Update TV show episode (for when user watches a different episode)
export const updateTVShowEpisode = async (contentId, season, episode, content) => {
  try {
    const watchlist = await getWatchlist();
    const contentKey = `tv_${contentId}`;
    
    if (watchlist[contentKey]) {
      // Update existing TV show entry
      watchlist[contentKey] = {
        ...watchlist[contentKey],
        season,
        episode,
        lastWatched: Date.now(),
        title: content?.title || watchlist[contentKey].title || `TV Show ${contentId}`,
        poster_path: content?.poster_path || watchlist[contentKey].poster_path,
        backdrop_path: content?.backdrop_path || watchlist[contentKey].backdrop_path,
        overview: content?.overview || watchlist[contentKey].overview
      };
    } else {
      // Add new TV show entry
      watchlist[contentKey] = {
        id: contentId,
        type: 'tv',
        title: content?.title || `TV Show ${contentId}`,
        poster_path: content?.poster_path || null,
        backdrop_path: content?.backdrop_path || null,
        overview: content?.overview || null,
        season,
        episode,
        lastWatched: Date.now(),
        isMovie: false
      };
    }
    
    await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
    console.log('Updated TV show episode:', content?.title || `TV Show ${contentId}`, `S${season}E${episode}`);
  } catch (error) {
    console.error('Error updating TV show episode:', error);
  }
};

// Clear entire watchlist
export const clearWatchlist = async () => {
  try {
    await AsyncStorage.removeItem(WATCHLIST_KEY);
    console.log('Watchlist cleared');
  } catch (error) {
    console.error('Error clearing watchlist:', error);
  }
};
