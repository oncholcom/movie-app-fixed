// Jikan API - Unofficial MyAnimeList API (Free, no authentication required)
// Documentation: https://docs.api.jikan.moe/

class MyAnimeListAPI {
  constructor() {
    this.baseURL = 'https://api.jikan.moe/v4';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async makeRequest(endpoint, params = {}) {
    try {
      const url = new URL(`${this.baseURL}${endpoint}`);
      
      Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key]);
      });

      // Check cache first
      const cacheKey = url.toString();
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limit - wait and retry
          console.warn('MAL API rate limited, waiting 1 second...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.makeRequest(endpoint, params);
        }
        throw new Error(`MAL API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache the response
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('MAL API request failed:', error);
      throw error;
    }
  }

  async search(query, limit = 20) {
    try {
      const response = await this.makeRequest('/anime', {
        q: query,
        limit,
        sfw: true, // Safe for work content only
        order_by: 'popularity',
        sort: 'desc'
      });

      return {
        data: response.data.map(item => this.formatAnimeData(item))
      };
    } catch (error) {
      console.error('MAL search failed:', error);
      return { data: [] };
    }
  }

  async getDetails(animeId) {
    try {
      const response = await this.makeRequest(`/anime/${animeId}/full`);
      return this.formatAnimeData(response.data);
    } catch (error) {
      console.error('MAL getDetails failed:', error);
      throw error;
    }
  }

  async getSeasonalAnime(year, season) {
    try {
      const response = await this.makeRequest(`/seasons/${season}/${year}`);
      return {
        data: response.data.map(item => this.formatAnimeData(item))
      };
    } catch (error) {
      console.error('MAL getSeasonalAnime failed:', error);
      return { data: [] };
    }
  }

  async getTopAnime(rankingType = 'all', limit = 20) {
    try {
      const response = await this.makeRequest('/top/anime', {
        filter: rankingType,
        limit
      });

      return {
        data: response.data.map(item => this.formatAnimeData(item))
      };
    } catch (error) {
      console.error('MAL getTopAnime failed:', error);
      return { data: [] };
    }
  }

  async getTrendingAnime(limit = 20) {
    try {
      const response = await this.makeRequest('/top/anime', {
        filter: 'airing',
        limit
      });

      return {
        data: response.data.map(item => this.formatAnimeData(item))
      };
    } catch (error) {
      console.error('MAL getTrendingAnime failed:', error);
      return { data: [] };
    }
  }

  async getPopularAnime(limit = 20) {
    try {
      const response = await this.makeRequest('/top/anime', {
        filter: 'bypopularity',
        limit
      });

      return {
        data: response.data.map(item => this.formatAnimeData(item))
      };
    } catch (error) {
      console.error('MAL getPopularAnime failed:', error);
      return { data: [] };
    }
  }

  // Format Jikan API response to match expected structure
  formatAnimeData(malAnime) {
    return {
      mal_id: malAnime.mal_id,
      title: malAnime.title || malAnime.title_english || malAnime.title_japanese,
      title_english: malAnime.title_english,
      title_japanese: malAnime.title_japanese,
      title_synonyms: malAnime.title_synonyms || [],
      type: malAnime.type,
      source: malAnime.source,
      episodes: malAnime.episodes,
      status: malAnime.status,
      airing: malAnime.airing,
      duration: malAnime.duration,
      rating: malAnime.rating,
      score: malAnime.score,
      scored_by: malAnime.scored_by,
      rank: malAnime.rank,
      popularity: malAnime.popularity,
      members: malAnime.members,
      favorites: malAnime.favorites,
      synopsis: malAnime.synopsis,
      season: malAnime.season,
      year: malAnime.year,
      broadcast: malAnime.broadcast,
      producers: malAnime.producers || [],
      licensors: malAnime.licensors || [],
      studios: malAnime.studios || [],
      genres: malAnime.genres || [],
      explicit_genres: malAnime.explicit_genres || [],
      themes: malAnime.themes || [],
      demographics: malAnime.demographics || [],
      main_picture: {
        large: malAnime.images?.jpg?.large_image_url,
        medium: malAnime.images?.jpg?.image_url
      },
      images: malAnime.images,
      trailer: malAnime.trailer,
      approved: malAnime.approved,
      background: malAnime.background,
      authors: malAnime.authors || [],
      serializations: malAnime.serializations || [],
      relations: malAnime.relations || {},
      theme: malAnime.theme || {},
      external: malAnime.external || [],
      streaming: malAnime.streaming || []
    };
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

export default new MyAnimeListAPI();
