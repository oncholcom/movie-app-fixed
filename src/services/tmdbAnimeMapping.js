import { search } from './api';

class TMDBAnimeMapper {
  constructor() {
    this.cache = new Map();
  }

  // Find TMDB ID for an AniList anime
  async findTMDBId(anilistAnime) {
    try {
      const cacheKey = `anilist_${anilistAnime.id}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const title = anilistAnime.title?.english || 
                   anilistAnime.title?.romaji || 
                   anilistAnime.title?.native;

      if (!title) {
        return null;
      }

      // Search for movie first
      const movieResult = await this.searchTMDBMovie(title);
      if (movieResult) {
        const mapping = {
          tmdbId: movieResult.id,
          type: 'movie',
          title: movieResult.title,
          originalTitle: movieResult.original_title,
          releaseDate: movieResult.release_date,
          posterPath: movieResult.poster_path,
          backdropPath: movieResult.backdrop_path,
        };
        
        this.cache.set(cacheKey, mapping);
        return mapping;
      }

      // Search for TV show
      const tvResult = await this.searchTMDBTV(title);
      if (tvResult) {
        const mapping = {
          tmdbId: tvResult.id,
          type: 'tv',
          title: tvResult.name,
          originalTitle: tvResult.original_name,
          firstAirDate: tvResult.first_air_date,
          posterPath: tvResult.poster_path,
          backdropPath: tvResult.backdrop_path,
        };
        
        this.cache.set(cacheKey, mapping);
        return mapping;
      }

      return null;
    } catch (error) {
      console.error('Error finding TMDB ID:', error);
      return null;
    }
  }

  // Search TMDB for movies
  async searchTMDBMovie(title) {
    try {
      const response = await search.movies(title);
      const results = response.data.results;
      
      // Filter for anime/Japanese content
      const animeResults = results.filter(item => 
        item.original_language === 'ja' && 
        (item.genre_ids?.includes(16) || // Animation genre
         item.genre_ids?.includes(16)) // Animation genre
      );
      
      return animeResults.length > 0 ? animeResults[0] : null;
    } catch (error) {
      console.error('Error searching TMDB movies:', error);
      return null;
    }
  }

  // Search TMDB for TV shows
  async searchTMDBTV(title) {
    try {
      const response = await search.tv(title);
      const results = response.data.results;
      
      // Filter for anime/Japanese content
      const animeResults = results.filter(item => 
        item.original_language === 'ja' && 
        (item.genre_ids?.includes(16) || // Animation genre
         item.genre_ids?.includes(16)) // Animation genre
      );
      
      return animeResults.length > 0 ? animeResults[0] : null;
    } catch (error) {
      console.error('Error searching TMDB TV shows:', error);
      return null;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache size
  getCacheSize() {
    return this.cache.size;
  }
}

export default new TMDBAnimeMapper();
