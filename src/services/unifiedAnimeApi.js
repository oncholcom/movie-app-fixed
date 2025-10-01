import anilistApi from './anilistApi';
import { getMovies, getTVShows } from './api'; // TMDB API
import myAnimeListApi from './myAnimeListApi';
import { API_CONFIG } from '../constants/Config';

class UnifiedAnimeAPI {
  constructor() {
    this.primarySource = 'anilist'; // Default primary source
    this.fallbackSources = ['tmdb', 'mal'];
  }

  // Main search function that combines all sources
  async searchAnime(query, options = {}) {
    const results = {
      anilist: [],
      tmdb: [],
      mal: [],
      combined: []
    };

    try {
      // Search AniList
      const anilistResults = await anilistApi.search(query);
      results.anilist = anilistResults.Page?.media || [];

      // Search TMDB for anime (using animation genre + Japanese language)
      const tmdbResults = await getMovies.byGenre(16); // Animation genre
      const tmdbAnime = tmdbResults.data.results.filter(item => 
        item.original_language === 'ja' && 
        item.title?.toLowerCase().includes(query.toLowerCase())
      );
      results.tmdb = tmdbAnime;

      // Search MyAnimeList (if implemented)
      try {
        const malResults = await myAnimeListApi.search(query);
        results.mal = malResults.data || [];
      } catch (error) {
        console.warn('MAL search failed:', error);
        results.mal = []; // Ensure empty array on failure
      }

      // Combine and deduplicate results
      results.combined = this.combineResults(results);
      
      return results;
    } catch (error) {
      console.error('Unified search error:', error);
      throw error;
    }
  }

  // Get anime details from multiple sources
  async getAnimeDetails(id, sourceType = 'anilist') {
    try {
      let primaryDetails = null;
      let additionalData = {};

      // Get primary details
      switch (sourceType) {
        case 'anilist':
          const anilistResponse = await anilistApi.getDetails(id);
          primaryDetails = anilistResponse.Media; // Extract Media from response
          break;
        case 'tmdb':
          primaryDetails = await getMovies.details(id);
          break;
        case 'mal':
          primaryDetails = await myAnimeListApi.getDetails(id);
          break;
      }

      // Try to find matching anime in other sources for additional data
      if (primaryDetails && sourceType === 'anilist') {
        const title = primaryDetails.title?.english || 
                     primaryDetails.title?.romaji;
        
        if (title) {
          // Try to find TMDB match
          try {
            const tmdbSearch = await this.searchTMDBAnime(title);
            if (tmdbSearch.length > 0) {
              additionalData.tmdb = tmdbSearch[0];
            }
          } catch (error) {
            console.warn('TMDB lookup failed:', error);
          }

          // Try to find MAL match
          try {
            const malSearch = await myAnimeListApi.search(title);
            if (malSearch.data?.length > 0) {
              additionalData.mal = malSearch.data[0];
            }
          } catch (error) {
            console.warn('MAL lookup failed:', error);
            // Don't throw, just continue without MAL data
          }
        }
      }

      return {
        primary: primaryDetails,
        additional: additionalData,
        unified: this.mergeAnimeData(primaryDetails, additionalData)
      };
    } catch (error) {
      console.error('Get details error:', error);
      throw error;
    }
  }

  // Search TMDB specifically for anime
  async searchTMDBAnime(title) {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${API_CONFIG.API_KEY}&query=${encodeURIComponent(title)}`
      );
      const data = await response.json();
      
      return data.results.filter(item => 
        item.original_language === 'ja' && 
        (item.genre_ids?.includes(16) || // Animation genre
         item.genres?.some(g => g.id === 16))
      );
    } catch (error) {
      console.error('TMDB anime search error:', error);
      return [];
    }
  }

  // Combine results from different sources
  combineResults(results) {
    const combined = [];
    const seenTitles = new Set();

    // Add AniList results first (primary source)
    results.anilist.forEach(anime => {
      const title = anime.title?.english || anime.title?.romaji;
      if (title && !seenTitles.has(title.toLowerCase())) {
        seenTitles.add(title.toLowerCase());
        combined.push({
          ...anime,
          source: 'anilist',
          sourceId: anime.id,
          unifiedId: `anilist_${anime.id}`
        });
      }
    });

    // Add TMDB results that don't duplicate AniList
    results.tmdb.forEach(anime => {
      const title = anime.title || anime.name;
      if (title && !seenTitles.has(title.toLowerCase())) {
        seenTitles.add(title.toLowerCase());
        combined.push({
          ...this.convertTMDBToAniListFormat(anime),
          source: 'tmdb',
          sourceId: anime.id,
          unifiedId: `tmdb_${anime.id}`
        });
      }
    });

    // Add MAL results
    results.mal.forEach(anime => {
      const title = anime.title;
      if (title && !seenTitles.has(title.toLowerCase())) {
        seenTitles.add(title.toLowerCase());
        combined.push({
          ...this.convertMALToAniListFormat(anime),
          source: 'mal',
          sourceId: anime.mal_id,
          unifiedId: `mal_${anime.mal_id}`
        });
      }
    });

    return combined;
  }

  // Convert TMDB format to AniList format
  convertTMDBToAniListFormat(tmdbAnime) {
    return {
      id: `tmdb_${tmdbAnime.id}`,
      title: {
        english: tmdbAnime.title || tmdbAnime.name,
        romaji: tmdbAnime.original_title || tmdbAnime.original_name,
        native: tmdbAnime.original_title || tmdbAnime.original_name
      },
      coverImage: {
        large: `https://image.tmdb.org/t/p/w500${tmdbAnime.poster_path}`,
        medium: `https://image.tmdb.org/t/p/w300${tmdbAnime.poster_path}`
      },
      bannerImage: tmdbAnime.backdrop_path ? 
        `https://image.tmdb.org/t/p/w1280${tmdbAnime.backdrop_path}` : null,
      averageScore: tmdbAnime.vote_average * 10,
      genres: [], // TMDB doesn't provide genre names directly
      status: tmdbAnime.status === 'Released' ? 'FINISHED' : 'RELEASING',
      episodes: null, // TMDB doesn't have episode info for anime
      duration: tmdbAnime.runtime,
      seasonYear: tmdbAnime.release_date ? 
        new Date(tmdbAnime.release_date).getFullYear() : null,
      description: tmdbAnime.overview,
      format: 'MOVIE', // Assume movie for TMDB
      source: 'tmdb'
    };
  }

  // Parse duration string to minutes
  parseDuration(duration) {
    if (!duration) return null;
    
    // Handle formats like "24 min per ep", "1 hr 30 min", "Unknown"
    if (duration === 'Unknown') return null;
    
    const match = duration.match(/(\d+)\s*min/);
    if (match) {
      return parseInt(match[1]);
    }
    
    // Handle hours and minutes
    const hourMatch = duration.match(/(\d+)\s*hr/);
    const minMatch = duration.match(/(\d+)\s*min/);
    
    if (hourMatch && minMatch) {
      return parseInt(hourMatch[1]) * 60 + parseInt(minMatch[1]);
    } else if (hourMatch) {
      return parseInt(hourMatch[1]) * 60;
    }
    
    return null;
  }

  // Convert MAL format to AniList format
  convertMALToAniListFormat(malAnime) {
    return {
      id: `mal_${malAnime.mal_id}`,
      title: {
        english: malAnime.title_english || malAnime.title,
        romaji: malAnime.title,
        native: malAnime.title_japanese || malAnime.title
      },
      coverImage: {
        large: malAnime.main_picture?.large,
        medium: malAnime.main_picture?.medium
      },
      bannerImage: malAnime.main_picture?.large,
      averageScore: malAnime.score ? malAnime.score * 10 : null,
      genres: malAnime.genres?.map(g => g.name) || [],
      status: this.convertMALStatus(malAnime.status),
      episodes: malAnime.episodes,
      duration: malAnime.duration ? 
        this.parseDuration(malAnime.duration) : null,
      seasonYear: malAnime.year,
      description: malAnime.synopsis,
      format: this.convertMALMediaType(malAnime.type),
      source: 'mal'
    };
  }

  // Merge data from multiple sources for richer details
  mergeAnimeData(primaryData, additionalData) {
    if (!primaryData) return null;

    const merged = { ...primaryData };

    // Add TMDB data if available
    if (additionalData.tmdb) {
      merged.tmdbData = additionalData.tmdb;
      // Use TMDB backdrop if AniList doesn't have one
      if (!merged.bannerImage && additionalData.tmdb.backdrop_path) {
        merged.bannerImage = 
          `https://image.tmdb.org/t/p/w1280${additionalData.tmdb.backdrop_path}`;
      }
    }

    // Add MAL data if available
    if (additionalData.mal) {
      merged.malData = additionalData.mal;
      // Use MAL score as additional rating
      if (additionalData.mal.score) {
        merged.malScore = additionalData.mal.score;
      }
    }

    return merged;
  }

  // Helper functions for status conversion
  convertMALStatus(malStatus) {
    const statusMap = {
      'Finished Airing': 'FINISHED',
      'Currently Airing': 'RELEASING',
      'Not yet aired': 'NOT_YET_RELEASED'
    };
    return statusMap[malStatus] || 'UNKNOWN';
  }

  convertMALMediaType(malType) {
    const typeMap = {
      'TV': 'TV',
      'Movie': 'MOVIE',
      'OVA': 'OVA',
      'ONA': 'ONA',
      'Special': 'SPECIAL',
      'Music': 'MUSIC'
    };
    return typeMap[malType] || 'TV';
  }
}

export default new UnifiedAnimeAPI();
