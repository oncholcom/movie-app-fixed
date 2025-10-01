import axios from 'axios';
import { API_CONFIG } from '../constants/Config';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  params: {
    api_key: API_CONFIG.API_KEY,
  },
});

// Image URL helpers
export const getImageUrl = (path, size = 'w500') => {
  if (!path) return null;
  return `${API_CONFIG.IMAGE_BASE_URL}/${size}${path}`;
};

export const getBackdropUrl = (path) => getImageUrl(path, API_CONFIG.BACKDROP_SIZE);
export const getPosterUrl = (path) => getImageUrl(path, API_CONFIG.POSTER_SIZE);

// Movie APIs
export const getMovies = {
  trending: (params = {}) => api.get('/trending/movie/week', { params }),
  popular: (params = {}) => api.get('/movie/popular', { params }),
  topRated: (params = {}) => api.get('/movie/top_rated', { params }),
  upcoming: (params = {}) => api.get('/movie/upcoming', { params }),
  nowPlaying: (params = {}) => api.get('/movie/now_playing', { params }),
  byGenre: (genreId, params = {}) => api.get('/discover/movie', { params: { with_genres: genreId, ...params } }),
  details: (movieId, params = {}) => api.get(`/movie/${movieId}`, { 
    params: { append_to_response: 'videos,credits,similar', ...params } 
  }),
};

export const getMovie = async (movieId) => {
  const { data } = await api.get(`/movie/${movieId}`);
  return data;
};

// TV APIs
export const getTVShows = {
  trending: (params = {}) => api.get('/trending/tv/week', { params }),
  popular: (params = {}) => api.get('/tv/popular', { params }),
  topRated: (params = {}) => api.get('/tv/top_rated', { params }),
  onTheAir: (params = {}) => api.get('/tv/on_the_air', { params }),
  airingToday: (params = {}) => api.get('/tv/airing_today', { params }),
  byGenre: (genreId, params = {}) => api.get('/discover/tv', { params: { with_genres: genreId, ...params } }),
  details: (tvId, params = {}) => api.get(`/tv/${tvId}`, { 
    params: { append_to_response: 'videos,credits,similar', ...params } 
  }),
};

// Search APIs
export const search = {
  multi: (query) => api.get('/search/multi', { params: { query } }),
  movies: (query) => api.get('/search/movie', { params: { query } }),
  tv: (query) => api.get('/search/tv', { params: { query } }),
};

// Genre APIs
export const getGenres = {
  movies: () => api.get('/genre/movie/list'),
  tv: () => api.get('/genre/tv/list'),
};

// TV Season & Episode APIs
export const getTVSeasons = {
  details: (tvId, seasonNumber) => api.get(`/tv/${tvId}/season/${seasonNumber}`),
  episodes: (tvId, seasonNumber) => api.get(`/tv/${tvId}/season/${seasonNumber}`),
};

// Video/Trailer APIs
export const getVideos = {
  movie: (movieId) => api.get(`/movie/${movieId}/videos`),
  tv: (tvId) => api.get(`/tv/${tvId}/videos`),
};

// Helper function to get YouTube trailer URL
export const getTrailerUrl = (videos) => {
  if (!videos || !videos.length) return null;

  // Find official trailer or teaser
  const trailer =
    videos.find(
      (video) =>
        video.site === 'YouTube' &&
        (video.type === 'Trailer' || video.type === 'Teaser') &&
        video.official
    ) ||
    videos.find(
      (video) =>
        video.site === 'YouTube' &&
        (video.type === 'Trailer' || video.type === 'Teaser')
    ) ||
    videos.find((video) => video.site === 'YouTube');

  return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
};

export const getYouTubeEmbedUrl = (videoKey) => {
  return `https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0`;
};

// Bollywood/Regional Content APIs
export const getBollywoodContent = {
  hindi: (params = {}) => api.get('/discover/movie', {
    params: {
      with_original_language: 'hi',
      sort_by: 'popularity.desc',
      include_adult: false,
      include_video: false,
      ...params,
    },
  }),
  tamil: (params = {}) => api.get('/discover/movie', {
    params: {
      with_original_language: 'ta',
      sort_by: 'popularity.desc',
      include_adult: false,
      include_video: false,
      ...params,
    },
  }),
  malayalam: (params = {}) => api.get('/discover/movie', {
    params: {
      with_original_language: 'ml',
      sort_by: 'popularity.desc',
      include_adult: false,
      include_video: false,
      ...params,
    },
  }),
  bengali: (params = {}) => api.get('/discover/movie', {
    params: {
      with_original_language: 'bn',
      sort_by: 'popularity.desc',
      include_adult: false,
      include_video: false,
      ...params,
    },
  }),
  urdu: (params = {}) => api.get('/discover/movie', {
    params: {
      with_original_language: 'ur',
      sort_by: 'popularity.desc',
      include_adult: false,
      include_video: false,
      ...params,
    },
  }),
  // Combined Bollywood (multiple languages)
  combined: (params = {}) => api.get('/discover/movie', {
    params: {
      with_original_language: 'hi|ta|ml|bn|ur|te|kn',
      sort_by: 'popularity.desc',
      include_adult: false,
      include_video: false,
      ...params,
    },
  }),
};

export const getBollywoodTV = {
  hindi: (params = {}) => api.get('/discover/tv', {
    params: {
      with_original_language: 'hi',
      sort_by: 'popularity.desc',
      include_adult: false,
      include_video: false,
      ...params,
    },
  }),
  tamil: (params = {}) => api.get('/discover/tv', {
    params: {
      with_original_language: 'ta',
      sort_by: 'popularity.desc',
      include_adult: false,
      include_video: false,
      ...params,
    },
  }),
  malayalam: (params = {}) => api.get('/discover/tv', {
    params: {
      with_original_language: 'ml',
      sort_by: 'popularity.desc',
      include_adult: false,
      include_video: false,
      ...params,
    },
  }),
  bengali: (params = {}) => api.get('/discover/tv', {
    params: {
      with_original_language: 'bn',
      sort_by: 'popularity.desc',
      include_adult: false,
      include_video: false,
      ...params,
    },
  }),
  urdu: (params = {}) => api.get('/discover/tv', {
    params: {
      with_original_language: 'ur',
      sort_by: 'popularity.desc',
      include_adult: false,
      include_video: false,
      ...params,
    },
  }),
  combined: (params = {}) => api.get('/discover/tv', {
    params: {
      with_original_language: 'hi|ta|ml|bn|ur|te|kn',
      sort_by: 'popularity.desc',
      include_adult: false,
      include_video: false,
      ...params,
    },
  }),
};

// Animation & Anime APIs
export const getAnimationContent = {
  // Cartoons (Western Animation - mostly English)
  cartoons: () => api.get('/discover/movie', { 
    params: { 
      with_genres: 16, // Animation genre
      with_original_language: 'en',
      'primary_release_date.gte': '1990-01-01', // Modern cartoons
      sort_by: 'popularity.desc'
    } 
  }),
  cartoonsTV: () => api.get('/discover/tv', { 
    params: { 
      with_genres: 16, // Animation genre
      with_original_language: 'en',
      sort_by: 'popularity.desc'
    } 
  }),
  // Anime (Japanese Animation)
  anime: () => api.get('/discover/movie', { 
    params: { 
      with_genres: 16, // Animation genre
      with_original_language: 'ja', // Japanese
      sort_by: 'popularity.desc'
    } 
  }),
  animeTV: () => api.get('/discover/tv', { 
    params: { 
      with_genres: 16, // Animation genre
      with_original_language: 'ja', // Japanese
      sort_by: 'popularity.desc'
    } 
  }),
  // All Animation (combined)
  all: () => api.get('/discover/movie', { 
    params: { 
      with_genres: 16,
      sort_by: 'popularity.desc'
    } 
  }),
  allTV: () => api.get('/discover/tv', { 
    params: { 
      with_genres: 16,
      sort_by: 'popularity.desc'
    } 
  }),
};

// Language mapping for display names
export const LANGUAGE_NAMES = {
  hi: 'Hindi',
  ta: 'Tamil',
  ml: 'Malayalam',
  bn: 'Bengali',
  ur: 'Urdu',
  te: 'Telugu',
  kn: 'Kannada',
  en: 'English',
  ja: 'Japanese',
};

// Genre-based content
export const getMoviesByGenre = {
  action: () => api.get('/discover/movie', { params: { with_genres: 28, sort_by: 'popularity.desc' } }),
  comedy: () => api.get('/discover/movie', { params: { with_genres: 35, sort_by: 'popularity.desc' } }),
  horror: () => api.get('/discover/movie', { params: { with_genres: 27, sort_by: 'popularity.desc' } }),
  drama: () => api.get('/discover/movie', { params: { with_genres: 18, sort_by: 'popularity.desc' } }),
  thriller: () => api.get('/discover/movie', { params: { with_genres: 53, sort_by: 'popularity.desc' } }),
  romance: () => api.get('/discover/movie', { params: { with_genres: 10749, sort_by: 'popularity.desc' } }),
  sciFi: () => api.get('/discover/movie', { params: { with_genres: 878, sort_by: 'popularity.desc' } }),
  adventure: () => api.get('/discover/movie', { params: { with_genres: 12, sort_by: 'popularity.desc' } }),
  crime: () => api.get('/discover/movie', { params: { with_genres: 80, sort_by: 'popularity.desc' } }),
  fantasy: () => api.get('/discover/movie', { params: { with_genres: 14, sort_by: 'popularity.desc' } }),
};

export const getTVByGenre = {
  action: () => api.get('/discover/tv', { params: { with_genres: 10759, sort_by: 'popularity.desc' } }),
  comedy: () => api.get('/discover/tv', { params: { with_genres: 35, sort_by: 'popularity.desc' } }),
  drama: () => api.get('/discover/tv', { params: { with_genres: 18, sort_by: 'popularity.desc' } }),
  crime: () => api.get('/discover/tv', { params: { with_genres: 80, sort_by: 'popularity.desc' } }),
  mystery: () => api.get('/discover/tv', { params: { with_genres: 9648, sort_by: 'popularity.desc' } }),
  sciFi: () => api.get('/discover/tv', { params: { with_genres: 10765, sort_by: 'popularity.desc' } }),
  reality: () => api.get('/discover/tv', { params: { with_genres: 10764, sort_by: 'popularity.desc' } }),
  documentary: () => api.get('/discover/tv', { params: { with_genres: 99, sort_by: 'popularity.desc' } }),
  family: () => api.get('/discover/tv', { params: { with_genres: 10751, sort_by: 'popularity.desc' } }),
  news: () => api.get('/discover/tv', { params: { with_genres: 10763, sort_by: 'popularity.desc' } }),
};

// Year-based filtering
export const getMoviesByYear = (year) => api.get('/discover/movie', { 
  params: { 
    primary_release_year: year,
    sort_by: 'popularity.desc'
  } 
});

export const getTVByYear = (year) => api.get('/discover/tv', { 
  params: { 
    first_air_date_year: year,
    sort_by: 'popularity.desc'
  } 
});

// Popular content by language (enhanced for BD preferences)
export const getPopularByLanguage = {
  movies: {
    english: (page = 1) => api.get('/discover/movie', { params: { with_original_language: 'en', sort_by: 'popularity.desc', page } }),
    hindi: (page = 1) => api.get('/discover/movie', { params: { with_original_language: 'hi', sort_by: 'popularity.desc', page } }),
    bengali: (page = 1) => api.get('/discover/movie', { params: { with_original_language: 'bn', sort_by: 'popularity.desc', page } }),
    urdu: (page = 1) => api.get('/discover/movie', { params: { with_original_language: 'ur', sort_by: 'popularity.desc', page } }),
    tamil: (page = 1) => api.get('/discover/movie', { params: { with_original_language: 'ta', sort_by: 'popularity.desc', page } }),
    malayalam: (page = 1) => api.get('/discover/movie', { params: { with_original_language: 'ml', sort_by: 'popularity.desc', page } }),
    telugu: (page = 1) => api.get('/discover/movie', { params: { with_original_language: 'te', sort_by: 'popularity.desc', page } }),
    korean: (page = 1) => api.get('/discover/movie', { params: { with_original_language: 'ko', sort_by: 'popularity.desc', page } }),
    japanese: (page = 1) => api.get('/discover/movie', { params: { with_original_language: 'ja', sort_by: 'popularity.desc', page } }),
    french: (page = 1) => api.get('/discover/movie', { params: { with_original_language: 'fr', sort_by: 'popularity.desc', page } }),
    spanish: (page = 1) => api.get('/discover/movie', { params: { with_original_language: 'es', sort_by: 'popularity.desc', page } }),
  },
  tv: {
    english: (page = 1) => api.get('/discover/tv', { params: { with_original_language: 'en', sort_by: 'popularity.desc', page } }),
    hindi: (page = 1) => api.get('/discover/tv', { params: { with_original_language: 'hi', sort_by: 'popularity.desc', page } }),
    bengali: (page = 1) => api.get('/discover/tv', { params: { with_original_language: 'bn', sort_by: 'popularity.desc', page } }),
    urdu: (page = 1) => api.get('/discover/tv', { params: { with_original_language: 'ur', sort_by: 'popularity.desc', page } }),
    tamil: (page = 1) => api.get('/discover/tv', { params: { with_original_language: 'ta', sort_by: 'popularity.desc', page } }),
    korean: (page = 1) => api.get('/discover/tv', { params: { with_original_language: 'ko', sort_by: 'popularity.desc', page } }),
    japanese: (page = 1) => api.get('/discover/tv', { params: { with_original_language: 'ja', sort_by: 'popularity.desc', page } }),
    french: (page = 1) => api.get('/discover/tv', { params: { with_original_language: 'fr', sort_by: 'popularity.desc', page } }),
    spanish: (page = 1) => api.get('/discover/tv', { params: { with_original_language: 'es', sort_by: 'popularity.desc', page } }),
    turkish: (page = 1) => api.get('/discover/tv', { params: { with_original_language: 'tr', sort_by: 'popularity.desc', page } }),
  },
};

// Regional/Language-based specialized content helpers
export const getRegionalContent = {
  // TV - United States
  tvUSLatest: (todayIso, page = 1) => api.get('/discover/tv', { params: { with_origin_country: 'US', sort_by: 'first_air_date.desc', 'first_air_date.lte': todayIso, page } }),
  tvUSPopular: async (todayIso, page = 1) => {
    const maxPages = 2
    const resolveDate = (iso) => {
      if (!iso) return new Date()
      const parsed = new Date(iso)
      return Number.isNaN(parsed.getTime()) ? new Date() : parsed
    }
    const toIso = (date) => {
      const d = new Date(date)
      if (Number.isNaN(d.getTime())) return null
      return d.toISOString().slice(0, 10)
    }
    const todayDate = resolveDate(todayIso)
    const todayStr = toIso(todayDate)
    const since = new Date(todayDate)
    since.setMonth(since.getMonth() - 6)
    const sinceStr = toIso(since)

    const baseParams = {
      with_origin_country: 'US',
      with_original_language: 'en',
      sort_by: 'popularity.desc',
      'first_air_date.lte': todayStr,
      ...(sinceStr ? { 'first_air_date.gte': sinceStr } : {}),
      'vote_count.gte': 50,
    }

    let combined = []
    for (let offset = 0; offset < maxPages; offset += 1) {
      const currentPage = page + offset
      try {
        const response = await api.get('/discover/tv', { params: { ...baseParams, page: currentPage } })
        combined = combined.concat(response?.data?.results || [])
      } catch (_) {}
    }

    const seen = new Set()
    const filtered = combined
      .filter(item => {
        const dateIso = item?.first_air_date || item?.release_date
        if (!dateIso) return false
        const releaseDate = new Date(dateIso)
        return !Number.isNaN(releaseDate.getTime()) && releaseDate <= todayDate
      })
      .filter(item => {
        if (!item?.id) return false
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })

    return {
      data: {
        results: filtered.slice(0, 20),
      },
    }
  },

  // Movies - South Indian (Tamil, Telugu, Malayalam, Kannada) - recent releases
  moviesSouthIndiaRecent: (todayIso, page = 1) => api.get('/discover/movie', { 
    params: { 
      with_original_language: 'ta|te|ml|kn',
      with_origin_country: 'IN',
      sort_by: 'primary_release_date.desc',
      'vote_count.gte': 10,
      ...(todayIso ? { 'primary_release_date.lte': todayIso } : {}),
      page
    } 
  }),

  moviesIndianRecent: async (todayIso, page = 1) => {
    const maxPages = 2
    const resolveDate = (iso) => {
      if (!iso) return new Date()
      const parsed = new Date(iso)
      return Number.isNaN(parsed.getTime()) ? new Date() : parsed
    }
    const toIso = (date) => {
      const d = new Date(date)
      if (Number.isNaN(d.getTime())) return null
      return d.toISOString().slice(0, 10)
    }
    const todayDate = resolveDate(todayIso)
    const todayStr = toIso(todayDate)
    const since = new Date(todayDate)
    since.setMonth(since.getMonth() - 6)
    const sinceStr = toIso(since)

    const baseParams = {
      with_origin_country: 'IN',
      with_original_language: 'hi|ta|te|ml|bn|kn',
      sort_by: 'release_date.desc',
      with_release_type: '2|3',
      'vote_count.gte': 10,
      region: 'IN',
      ...(todayStr ? { 'primary_release_date.lte': todayStr } : {}),
      ...(sinceStr ? { 'primary_release_date.gte': sinceStr } : {}),
    }

    let combined = []
    for (let offset = 0; offset < maxPages; offset += 1) {
      const currentPage = page + offset
      try {
        const response = await api.get('/discover/movie', { params: { ...baseParams, page: currentPage } })
        combined = combined.concat(response?.data?.results || [])
      } catch (_) {}
    }

    const seen = new Set()
    const filtered = combined
      .filter(item => {
        const releaseIso = item?.release_date
        if (!releaseIso) return false
        const releaseDate = new Date(releaseIso)
        return !Number.isNaN(releaseDate.getTime()) && releaseDate <= todayDate
      })
      .filter(item => {
        if (!item?.id) return false
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })

    return {
      data: {
        results: filtered.slice(0, 20),
      },
    }
  },

  // Movies - Top rated (as IMDb proxy) with recent bias handled in UI
  moviesTopImdbRecent: async (todayIso, page = 1) => {
    const currentYear = new Date().getFullYear()
    const recentStartYear = currentYear - 2
    const baseParams = {
      sort_by: 'vote_average.desc',
      'vote_count.gte': 1000,
      'vote_average.gte': 7.0,
      page,
    }

    const recentParams = {
      ...baseParams,
      'primary_release_date.gte': `${recentStartYear}-01-01`,
    }

    const recent = await api.get('/discover/movie', { params: recentParams })
    let combined = recent?.data?.results || []

    if (combined.length < 20) {
      const olderParams = {
        ...baseParams,
        'primary_release_date.lte': `${recentStartYear}-12-31`,
      }
      const older = await api.get('/discover/movie', { params: olderParams })
      combined = combined.concat(older?.data?.results || [])
    }

    return {
      data: {
        ...recent?.data,
        results: combined.slice(0, 20),
      },
    }
  },

  // TV - Hindi recent
  tvHindiRecent: async (todayIso, page = 1) => {
    const maxPages = 2
    const resolveDate = (iso) => {
      if (!iso) return new Date()
      const parsed = new Date(iso)
      return Number.isNaN(parsed.getTime()) ? new Date() : parsed
    }
    const toIso = (date) => {
      const d = new Date(date)
      if (Number.isNaN(d.getTime())) return null
      return d.toISOString().slice(0, 10)
    }
    const todayDate = resolveDate(todayIso)
    const todayStr = toIso(todayDate)
    const since = new Date(todayDate)
    since.setMonth(since.getMonth() - 6)
    const sinceStr = toIso(since)

    const baseParams = {
      with_original_language: 'hi',
      with_origin_country: 'IN',
      sort_by: 'first_air_date.desc',
      'vote_count.gte': 5,
      ...(todayStr ? { 'first_air_date.lte': todayStr } : {}),
      ...(sinceStr ? { 'first_air_date.gte': sinceStr } : {}),
    }

    let combined = []
    for (let offset = 0; offset < maxPages; offset += 1) {
      const currentPage = page + offset
      try {
        const response = await api.get('/discover/tv', { params: { ...baseParams, page: currentPage } })
        combined = combined.concat(response?.data?.results || [])
      } catch (_) {}
    }

    const seen = new Set()
    const filtered = combined
      .filter(item => {
        const dateIso = item?.first_air_date || item?.release_date
        if (!dateIso) return false
        const releaseDate = new Date(dateIso)
        return !Number.isNaN(releaseDate.getTime()) && releaseDate <= todayDate
      })
      .filter(item => {
        if (!item?.id) return false
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })

    return {
      data: {
        results: filtered.slice(0, 20),
      },
    }
  },

  // Movies - Bengali (Bangladesh) recent
  moviesBengaliBDRecent: (todayIso, page = 1) => api.get('/discover/movie', {
    params: {
      with_original_language: 'bn',
      with_origin_country: 'BD',
      sort_by: 'primary_release_date.desc',
      'vote_count.gte': 5,
      ...(todayIso ? { 'primary_release_date.lte': todayIso } : {}),
      page,
    }
  }),

  // Movies - Bengali (India) recent
  moviesBengaliINRecent: (todayIso, page = 1) => api.get('/discover/movie', { 
    params: { 
      with_original_language: 'bn',
      with_origin_country: 'IN',
      sort_by: 'primary_release_date.desc',
      'primary_release_date.lte': todayIso,
      page
    } 
  }),

  // TV - Bengali (BD + IN) recent
  tvBengaliBDINRecent: async (todayIso, page = 1) => {
    const maxPages = 2
    const resolveDate = (iso) => {
      if (!iso) return new Date()
      const parsed = new Date(iso)
      return Number.isNaN(parsed.getTime()) ? new Date() : parsed
    }
    const toIso = (date) => {
      const d = new Date(date)
      if (Number.isNaN(d.getTime())) return null
      return d.toISOString().slice(0, 10)
    }
    const todayDate = resolveDate(todayIso)
    const todayStr = toIso(todayDate)
    const since = new Date(todayDate)
    since.setMonth(since.getMonth() - 6)
    const sinceStr = toIso(since)

    const baseParams = {
      with_original_language: 'bn',
      with_origin_country: 'BD|IN',
      sort_by: 'first_air_date.desc',
      'vote_count.gte': 3,
      ...(todayStr ? { 'first_air_date.lte': todayStr } : {}),
      ...(sinceStr ? { 'first_air_date.gte': sinceStr } : {}),
    }

    let combined = []
    for (let offset = 0; offset < maxPages; offset += 1) {
      const currentPage = page + offset
      try {
        const response = await api.get('/discover/tv', { params: { ...baseParams, page: currentPage } })
        combined = combined.concat(response?.data?.results || [])
      } catch (_) {}
    }

    const seen = new Set()
    const filtered = combined
      .filter(item => {
        const dateIso = item?.first_air_date || item?.release_date
        if (!dateIso) return false
        const releaseDate = new Date(dateIso)
        return !Number.isNaN(releaseDate.getTime()) && releaseDate <= todayDate
      })
      .filter(item => {
        if (!item?.id) return false
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })

    return {
      data: {
        results: filtered.slice(0, 20),
      },
    }
  },

  // TV - Indian recent (mixed languages)
  tvIndianRecent: async (todayIso, page = 1) => {
    const maxPages = 2
    const resolveDate = (iso) => {
      if (!iso) return new Date()
      const parsed = new Date(iso)
      return Number.isNaN(parsed.getTime()) ? new Date() : parsed
    }
    const toIso = (date) => {
      const d = new Date(date)
      if (Number.isNaN(d.getTime())) return null
      return d.toISOString().slice(0, 10)
    }
    const todayDate = resolveDate(todayIso)
    const todayStr = toIso(todayDate)
    const since = new Date(todayDate)
    since.setMonth(since.getMonth() - 6)
    const sinceStr = toIso(since)

    const baseParams = {
      with_origin_country: 'IN',
      with_original_language: 'hi|ta|te|ml|bn|kn',
      sort_by: 'first_air_date.desc',
      'vote_count.gte': 5,
      ...(todayStr ? { 'first_air_date.lte': todayStr } : {}),
      ...(sinceStr ? { 'first_air_date.gte': sinceStr } : {}),
    }

    let combined = []
    for (let offset = 0; offset < maxPages; offset += 1) {
      const currentPage = page + offset
      try {
        const response = await api.get('/discover/tv', { params: { ...baseParams, page: currentPage } })
        combined = combined.concat(response?.data?.results || [])
      } catch (_) {}
    }

    const seen = new Set()
    const filtered = combined
      .filter(item => {
        const dateIso = item?.first_air_date || item?.release_date
        if (!dateIso) return false
        const releaseDate = new Date(dateIso)
        return !Number.isNaN(releaseDate.getTime()) && releaseDate <= todayDate
      })
      .filter(item => {
        if (!item?.id) return false
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })

    return {
      data: {
        results: filtered.slice(0, 20),
      },
    }
  },

  moviesUSPopular: async (todayIso, page = 1) => {
    const maxPages = 2
    const resolveDate = (iso) => {
      if (!iso) return new Date()
      const parsed = new Date(iso)
      return Number.isNaN(parsed.getTime()) ? new Date() : parsed
    }
    const toIso = (date) => {
      const d = new Date(date)
      if (Number.isNaN(d.getTime())) return null
      return d.toISOString().slice(0, 10)
    }
    const todayDate = resolveDate(todayIso)
    const todayStr = toIso(todayDate)
    const since = new Date(todayDate)
    since.setMonth(since.getMonth() - 6)
    const sinceStr = toIso(since)

    const baseParams = {
      with_origin_country: 'US',
      with_original_language: 'en',
      sort_by: 'release_date.desc',
      with_release_type: '2|3',
      'vote_count.gte': 50,
      region: 'US',
      ...(todayStr ? { 'primary_release_date.lte': todayStr } : {}),
      ...(sinceStr ? { 'primary_release_date.gte': sinceStr } : {}),
    }

    let combined = []
    for (let offset = 0; offset < maxPages; offset += 1) {
      const currentPage = page + offset
      try {
        const response = await api.get('/discover/movie', { params: { ...baseParams, page: currentPage } })
        combined = combined.concat(response?.data?.results || [])
      } catch (_) {}
    }

    const seen = new Set()
    const filtered = combined
      .filter(item => {
        const releaseIso = item?.release_date
        if (!releaseIso) return false
        const releaseDate = new Date(releaseIso)
        return !Number.isNaN(releaseDate.getTime()) && releaseDate <= todayDate
      })
      .filter(item => {
        if (!item?.id) return false
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })

    return {
      data: {
        results: filtered.slice(0, 20),
      },
    }
  },

  // Movies - English newly released (Hollywood)
  hollywoodNewlyReleased: async (todayIso, page = 1) => {
    const maxPages = 2
    const todayDate = (() => {
      if (!todayIso) return new Date()
      const parsed = new Date(todayIso)
      return Number.isNaN(parsed.getTime()) ? new Date() : parsed
    })()
    const toIso = (date) => {
      const d = new Date(date)
      if (Number.isNaN(d.getTime())) return null
      return d.toISOString().slice(0, 10)
    }
    const todayStr = toIso(todayDate)
    const since = new Date(todayDate)
    since.setMonth(since.getMonth() - 6)
    const sinceStr = toIso(since)

    const baseParams = {
      with_original_language: 'en',
      sort_by: 'release_date.desc',
      with_release_type: '2|3',
      'vote_count.gte': 1,
      ...(todayStr ? { 'primary_release_date.lte': todayStr } : {}),
      ...(sinceStr ? { 'primary_release_date.gte': sinceStr } : {}),
    }

    let combined = []
    for (let offset = 0; offset < maxPages; offset += 1) {
      const currentPage = page + offset
      try {
        const response = await api.get('/discover/movie', { params: { ...baseParams, page: currentPage } })
        const results = response?.data?.results || []
        combined = combined.concat(results)
      } catch (error) {
        // continue to next page
      }
    }

    const seen = new Set()
    const filtered = combined
      .filter(item => {
        if (!item) return false
        const releaseIso = item.release_date
        if (!releaseIso) return false
        const releaseDate = new Date(releaseIso)
        if (Number.isNaN(releaseDate.getTime())) return false
        return releaseDate <= todayDate
      })
      .filter(item => {
        if (!item.id) return false
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })

    return {
      data: {
        results: filtered.slice(0, 20),
      },
    }
  },

  // Movies - Hindi newly released (Bollywood)
  bollywoodHindiNewlyReleased: async (todayIso, page = 1) => {
    const maxPages = 2
    const todayDate = (() => {
      if (!todayIso) return new Date()
      const parsed = new Date(todayIso)
      return Number.isNaN(parsed.getTime()) ? new Date() : parsed
    })()
    const toIso = (date) => {
      const d = new Date(date)
      if (Number.isNaN(d.getTime())) return null
      return d.toISOString().slice(0, 10)
    }
    const todayStr = toIso(todayDate)
    const since = new Date(todayDate)
    since.setMonth(since.getMonth() - 6)
    const sinceStr = toIso(since)

    const baseParams = {
      with_original_language: 'hi',
      sort_by: 'release_date.desc',
      with_release_type: '2|3',
      'vote_count.gte': 1,
      ...(todayStr ? { 'primary_release_date.lte': todayStr } : {}),
      ...(sinceStr ? { 'primary_release_date.gte': sinceStr } : {}),
    }

    let combined = []
    for (let offset = 0; offset < maxPages; offset += 1) {
      const currentPage = page + offset
      try {
        const response = await api.get('/discover/movie', { params: { ...baseParams, page: currentPage } })
        const results = response?.data?.results || []
        combined = combined.concat(results)
      } catch (_) {
        // continue to next page on error
      }
    }

    const seen = new Set()
    const filtered = combined
      .filter(item => {
        if (!item) return false
        const releaseIso = item.release_date
        if (!releaseIso) return false
        const releaseDate = new Date(releaseIso)
        if (Number.isNaN(releaseDate.getTime())) return false
        return releaseDate <= todayDate
      })
      .filter(item => {
        if (!item.id) return false
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })

    return {
      data: {
        results: filtered.slice(0, 20),
      },
    }
  },

  // Movies - Tamil newly released
  tamilNewlyReleased: async (todayIso, page = 1) => {
    const maxPages = 2
    const todayDate = (() => {
      if (!todayIso) return new Date()
      const parsed = new Date(todayIso)
      return Number.isNaN(parsed.getTime()) ? new Date() : parsed
    })()
    const toIso = (date) => {
      const d = new Date(date)
      if (Number.isNaN(d.getTime())) return null
      return d.toISOString().slice(0, 10)
    }
    const todayStr = toIso(todayDate)
    const since = new Date(todayDate)
    since.setMonth(since.getMonth() - 6)
    const sinceStr = toIso(since)

    const baseParams = {
      with_original_language: 'ta',
      sort_by: 'release_date.desc',
      with_release_type: '2|3',
      'vote_count.gte': 1,
      ...(todayStr ? { 'primary_release_date.lte': todayStr } : {}),
      ...(sinceStr ? { 'primary_release_date.gte': sinceStr } : {}),
    }

    let combined = []
    for (let offset = 0; offset < maxPages; offset += 1) {
      const currentPage = page + offset
      try {
        const response = await api.get('/discover/movie', { params: { ...baseParams, page: currentPage } })
        const results = response?.data?.results || []
        combined = combined.concat(results)
      } catch (_) {}
    }

    const seen = new Set()
    const filtered = combined
      .filter(item => {
        const releaseIso = item?.release_date
        if (!releaseIso) return false
        const releaseDate = new Date(releaseIso)
        return !Number.isNaN(releaseDate.getTime()) && releaseDate <= todayDate
      })
      .filter(item => {
        if (!item?.id) return false
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })

    return {
      data: {
        results: filtered.slice(0, 20),
      },
    }
  },
};

// Constants for filters
export const MOVIE_GENRES = [
  { id: 'action', name: 'Action', icon: '💥' },
  { id: 'comedy', name: 'Comedy', icon: '😂' },
  { id: 'horror', name: 'Horror', icon: '👻' },
  { id: 'drama', name: 'Drama', icon: '🎭' },
  { id: 'thriller', name: 'Thriller', icon: '🔥' },
  { id: 'romance', name: 'Romance', icon: '❤️' },
  { id: 'sciFi', name: 'Sci-Fi', icon: '🚀' },
  { id: 'adventure', name: 'Adventure', icon: '🗺️' },
  { id: 'crime', name: 'Crime', icon: '🕵️' },
  { id: 'fantasy', name: 'Fantasy', icon: '🧙' },
];

export const TV_GENRES = [
  { id: 'action', name: 'Action', icon: '💥' },
  { id: 'comedy', name: 'Comedy', icon: '😂' },
  { id: 'drama', name: 'Drama', icon: '🎭' },
  { id: 'crime', name: 'Crime', icon: '🕵️' },
  { id: 'mystery', name: 'Mystery', icon: '🔍' },
  { id: 'sciFi', name: 'Sci-Fi', icon: '🚀' },
  { id: 'reality', name: 'Reality', icon: '📺' },
  { id: 'documentary', name: 'Documentary', icon: '📹' },
  { id: 'family', name: 'Family', icon: '👨‍👩‍👧‍👦' },
  { id: 'news', name: 'News', icon: '📰' },
];

export const POPULAR_LANGUAGES = [
  { id: 'english', name: 'English', icon: '🇺🇸' },
  { id: 'hindi', name: 'Hindi', icon: '🇮🇳' },
  { id: 'bengali', name: 'Bengali', icon: '🇧🇩' },
  { id: 'urdu', name: 'Urdu', icon: '🕌' },
  { id: 'tamil', name: 'Tamil', icon: '🏛️' },
  { id: 'malayalam', name: 'Malayalam', icon: '🌴' },
  { id: 'telugu', name: 'Telugu', icon: '🎪' },
  { id: 'korean', name: 'Korean', icon: '🇰🇷' },
  { id: 'japanese', name: 'Japanese', icon: '🇯🇵' },
];

export const RECENT_YEARS = [
  { id: 2024, name: '2024', icon: '🆕' },
  { id: 2023, name: '2023', icon: '✨' },
  { id: 2022, name: '2022', icon: '🎬' },
  { id: 2021, name: '2021', icon: '🍿' },
  { id: 2020, name: '2020', icon: '🎭' },
  { id: 2019, name: '2019', icon: '🎪' },
];

export default api;

// TMDB to IMDB conversion utility
/**
 * Convert TMDB ID to IMDB ID using external API.
 * @param {number|string} tmdbId - The TMDB ID to convert.
 * @param {"movie"|"tv"} contentType - The type of content ("movie" or "tv").
 * @returns {Promise<{ tmdb_id: number, imdb_id: string, title: string, year: number, content_type: string, source: string, cached_at: string }|null>} The conversion result or null on error.
 */
export async function convertTMDBtoIMDB(tmdbId, contentType = "movie") {
  try {
    if (!tmdbId || (contentType !== "movie" && contentType !== "tv")) return null;
    const url = `https://tmdb-imdb.hasansarker58.workers.dev/${contentType}/${tmdbId}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("convertTMDBtoIMDB error:", error);
    return null;
  }
}
