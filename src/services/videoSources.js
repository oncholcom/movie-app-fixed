// Video Sources Configuration
export const VIDEO_SOURCES = {
  // VIP Sources (Always on top)
  vip_fmftp: {
    id: "vip_fmftp",
    name: "VIP FMFTP",
    type: "api",
    quality: "4K",
    icon: "👑",
    getApiUrl: (id, season, episode, type) => {
      if (!id) return '';
      if (type === 'movie') {
        return `https://fmftp-player.hasansarker58.workers.dev/${id}`;
      } else if (type === 'tv') {
        if (!season || !episode) return '';
        return `https://fmftp-player.hasansarker58.workers.dev/${id}/${season}/${episode}`;
      }
      return '';
    },
    description: "VIP FMFTP - Premium 4K Source",
    language: "Multi",
    isWorking: true,
    isApiBased: true,
    isVipSource: true,
    priority: 1
  },

  vip_moviebox: {
    id: "vip_moviebox",
    name: "VIP MovieBox",
    type: "embed",
    quality: "4K",
    icon: "🎬",
    getUrl: (id, season, episode, type) => {
      if (!id) return '';
      if (type === 'movie') {
        return `https://moviebox.steep-bread-3c84.workers.dev/${id}`;
      } else if (type === 'tv') {
        if (!season || !episode) return '';
        return `https://moviebox.steep-bread-3c84.workers.dev/${id}/${season}/${episode}`;
      }
      return '';
    },
    description: "VIP MovieBox - Premium 4K Source",
    language: "Multi",
    isWorking: true,
    isVipSource: true,
    priority: 2
  },

  vip_roarzone: {
    id: "vip_roarzone",
    name: "VIP RoarZone",
    type: "api",
    quality: "4K",
    icon: "🦁",
    getApiUrl: (id, season, episode, type) => {
      if (!id) return '';
      if (type === 'movie') {
        return `https://roarzone-player.hasansarker58.workers.dev/${id}`;
      } else if (type === 'tv') {
        if (!season || !episode) return '';
        return `https://roarzone-player.hasansarker58.workers.dev/${id}/${season}/${episode}`;
      }
      return '';
    },
    description: "VIP RoarZone - Premium 4K Source",
    language: "Multi",
    isWorking: true,
    isApiBased: true,
    isVipSource: true,
    priority: 3
  },

  vip_crazyctg: {
    id: "vip_crazyctg",
    name: "VIP CrazyCTG",
    type: "api",
    quality: "4K",
    icon: "🎯",
    movieOnly: true,
    getApiUrl: (id, season, episode, type) => {
      if (!id) return '';
      if (type === 'movie') {
        return `https://crazyctg-player.hasansarker58.workers.dev/${id}`;
      }
      return '';
    },
    description: "VIP CrazyCTG - Premium 4K Movies Only",
    language: "Multi",
    isWorking: true,
    isApiBased: true,
    isVipSource: true,
    priority: 4
  },

  vip_binudon: {
    id: "vip_binudon",
    name: "VIP Binudon",
    type: "api",
    quality: "4K",
    icon: "🍜",
    movieOnly: true,
    getApiUrl: (id, season, episode, type) => {
      if (!id) return '';
      if (type === 'movie') {
        return `https://binudon-player.hasansarker58.workers.dev/${id}`;
      }
      return '';
    },
    description: "VIP Binudon - Premium 4K Movies Only",
    language: "Multi",
    isWorking: true,
    isApiBased: true,
    isVipSource: true,
    priority: 5
  },

  vip_spdx: {
    id: "vip_spdx",
    name: "VIP SPDX",
    type: "api",
    quality: "4K",
    icon: "⚡",
    movieOnly: true,
    getApiUrl: (id, season, episode, type) => {
      if (!id) return '';
      if (type === 'movie') {
        return `https://spdx.steep-bread-3c84.workers.dev/${id}`;
      }
      return '';
    },
    description: "VIP SPDX - Premium 4K Movies Only",
    language: "Multi",
    isWorking: true,
    isApiBased: true,
    isVipSource: true,
    priority: 6
  },

  vip_hydrahd_scrape: {
    id: "vip_hydrahd_scrape",
    name: "VIP HydraHD Scrape",
    type: "api",
    quality: "4K",
    icon: "🌊",
    getApiUrl: (id, season, episode, type) => {
      if (!id) return '';
      if (type === 'movie') {
        return `https://hydrahd-scrape.premiumhub.workers.dev/https://hyhd.org/embed/${id}`;
      } else if (type === 'tv') {
        if (!season || !episode) return '';
        return `https://hydrahd-scrape.premiumhub.workers.dev/https://hyhd.org/embed/tv/${id}/${season}/${episode}`;
      }
      return '';
    },
    description: "VIP HydraHD Scrape - Premium 4K Source",
    language: "Multi",
    isWorking: true,
    isApiBased: true,
    isVipSource: true,
    priority: 7
  },

  // Top Priority Sources (1-8)
  videasy: {
    id: "videasy",
    name: "Videasy",
    type: "embed",
    quality: "4K",
    icon: "📺",
    getUrl: (id, season, episode, type) => 
      type === "movie" 
        ? `https://player.videasy.net/movie/${id}`
        : `https://player.videasy.net/tv/${id}/${season}/${episode}`,
    description: "Multi Audio Server",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    priority: 8
  },

  vidjoy: {
    id: "vidjoy",
    name: "VidJoy",
    type: "embed",
    quality: "HD",
    icon: "💡",
    getUrl: (id, season, episode, type) => 
      type === "movie"
        ? `https://vidjoy.pro/embed/movie/${id}`
        : `https://vidjoy.pro/embed/tv/${id}/${season}/${episode}`,
    description: "Multi Audio Server",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    priority: 9
  },

  hydrahd: {
    id: "hydrahd",
    name: "HydraHD",
    type: "embed",
    quality: "HD",
    icon: "🌊",
    getUrl: (id, season, episode, type) => 
      type === "movie"
        ? `https://hydrahd.net/embed/movie/${id}`
        : `https://hydrahd.net/embed/tv/${id}/${season}/${episode}`,
    description: "HydraHD - Multi Server",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    priority: 10
  },

  ridomovies: {
    id: "ridomovies",
    name: "RidoMovies",
    type: "embed",
    quality: "HD",
    icon: "🎭",
    getUrl: (id, season, episode, type) => 
      type === "movie"
        ? `https://ridomovies.com/embed/movie/${id}`
        : `https://ridomovies.com/embed/tv/${id}/${season}/${episode}`,
    description: "RidoMovies - Multi Server",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    priority: 11
  },

  vidlink: {
    id: "vidlink",
    name: "VidLink",
    type: "embed",
    quality: "HD",
    icon: "🔗",
    getUrl: (id, season, episode, type) => 
      type === "movie"
        ? `https://vidlink.to/embed/movie/${id}`
        : `https://vidlink.to/embed/tv/${id}/${season}/${episode}`,
    description: "VidLink - Multi Server",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    priority: 12
  },

  vidsrc: {
    id: "vidsrc",
    name: "VidSrc",
    type: "embed",
    quality: "HD",
    icon: "🎬",
    getUrl: (id, season, episode, type) => 
      type === "movie"
        ? `https://vidsrc.cc/v2/embed/movie/${id}`
        : `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}`,
    description: "VidSrc - Multi Server",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    priority: 13
  },

  vidsrc_v3: {
    id: "vidsrc_v3",
    name: "VidSrc v3",
    type: "embed",
    quality: "HD",
    icon: "🎬",
    getUrl: (id, season, episode, type) => 
      type === "movie"
        ? `https://vidsrc.cc/v3/embed/movie/${id}?autoPlay=false`
        : `https://vidsrc.cc/v3/embed/tv/${id}/${season}/${episode}?autoPlay=false`,
    description: "VidSrc v3 - Enhanced Player",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    priority: 14
  },

  xprime: {
    id: "xprime",
    name: "XPrime",
    type: "embed",
    quality: "HD",
    icon: "⭐",
    getUrl: (id, season, episode, type) => 
      type === "movie"
        ? `https://xprime.tv/watch/${id}`
        : `https://xprime.tv/watch/${id}/${season}/${episode}`,
    description: "XPrime - Multi Server",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    priority: 15
  },

  vidrock: {
    id: "vidrock",
    name: "VidRock",
    type: "embed",
    quality: "HD",
    icon: "🪨",
    getUrl: (id, season, episode, type) => 
      type === "movie"
        ? `https://vidrock.steep-bread-3c84.workers.dev/movie/${id}`
        : `https://vidrock.steep-bread-3c84.workers.dev/tv/${id}/${season}/${episode}`,
    description: "VidRock - Premium HD Source",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    priority: 16
  },

  spencerdevs: {
    id: "spencerdevs",
    name: "SpencerDevs",
    type: "embed",
    quality: "HD",
    icon: "⚙️",
    getUrl: (id, season, episode, type, theme = 'dark') => 
      type === "movie"
        ? `https://spencerdevs.xyz/movie/${id}?theme=${theme}`
        : `https://spencerdevs.xyz/tv/${id}/${season}/${episode}?theme=${theme}`,
    description: "SpencerDevs - Premium HD Source",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    priority: 17
  },

  // Other Sources (9+)
  // NontonGo Source
  nontongo: {
    id: "nontongo",
    name: "NontonGo",
    type: "embed",
    quality: "HD",
    icon: "🎬",
    getUrl: (id, season, episode, type) => {
      if (!id) return '';
      if (type === 'movie') {
        return `https://www.NontonGo.win/embed/movie/${id}`;
      } else if (type === 'tv') {
        if (!season || !episode) return '';
        return `https://www.NontonGo.win/embed/tv/${id}/${season}/${episode}`;
      }
      return '';
    },
    description: "NontonGo - TMDB ID Movie/TV Player",
    language: "Multi",
    isWorking: true,
    timeoutAvoidance: true,
    timeout: 45000, // 45 seconds timeout
    retryAttempts: 3,
    retryDelay: 2000, // 2 seconds between retries
    keepAlive: true, // Keep connection alive
    preloadStrategy: 'aggressive' // Preload content to avoid timeouts
  },


  mappletv: {
    id: "mappletv",
    name: "MappleTV",
    type: "embed",
    quality: "4K",
    icon: "🍁",
    getUrl: (id, season, episode, type) => 
      type === "movie"
        ? `https://mappletv.uk/watch/movie/${id}?autoPlay=true&theme=4f46e5&startAt=0`
        : `https://mappletv.uk/watch/tv/${id}-${season}-${episode}?autoPlay=true&autoNext=true&theme=4f46e5&startAt=0`,
    description: "MappleTV - Modern Player",
    language: "Multi",
    isWorking: true
  },


  vidify: {
    id: "vidify",
    name: "Vidify",
    type: "embed",
    quality: "4K",
    icon: "🎪",
    getUrl: (id, season, episode, type) => 
      type === "movie"
        ? `https://vidify.top/embed/movie/${id}`
        : `https://vidify.top/embed/tv/${id}/${season}/${episode}`,
    description: "Vidify - 4K+ Multi Audio",
    language: "Multi",
    isWorking: true
  },



  movies111: {
    id: "movies111",
    name: "111movies",
    type: "embed",
    quality: "HD",
    icon: "🎬",
    getUrl: (id, season, episode, type) => 
      type === "movie"
        ? `https://111movies.com/movie/${id}`
        : `https://111movies.com/tv/${id}/${season}/${episode}`,
    description: "111movies - Multi Server",
    language: "Multi",
    isWorking: true
  },

  qstream: {
    id: "qstream",
    name: "QStream",
    type: "embed",
    quality: "HD",
    icon: "🎬",
    getUrl: (id, season, episode, type) => 
      type === "movie"
        ? `https://qstream-scrape.premiumhub.workers.dev/movie/${id}`
        : `https://qstream-scrape.premiumhub.workers.dev/episode/${id}`,
    description: "QStream - Ad-Free Embed Player",
    language: "Multi",
    isWorking: true
  },



  beech: {
    id: "beech",
    name: "Beech",
    type: "embed",
    quality: "HD",
    icon: "🌳",
    getUrl: (id, season, episode, type) => 
      type === "movie"
        ? `https://www.beech.watch/watch/movie/${id}`
        : `https://www.beech.watch/watch/tv/${id}`,
    description: "Beech Server - Built-in Episode Selection",
    language: "Multi",
    isWorking: true
  },


  godrive: {
    id: "godrive",
    name: "GoDrive",
    type: "embed",
    quality: "HD",
    icon: "🚀",
    tvOnly: true,
    getUrl: (id, season, episode, type) => 
      type === "tv" ? `https://godriveplayer.com/player.php?type=series&tmdb=${id}&season=${season}&episode=${episode}` : '',
    description: "TV series streaming with sandbox support",
    language: "Multi",
    isWorking: true
  },


  vidsrc_wtf_1: {
    id: "vidsrc_wtf_1",
    name: "VidSrc API 1",
    type: "embed",
    quality: "HD",
    icon: "🌟",
    getUrl: (id, season, episode, type) => {
      const hexColor = "FF0000";
      return type === "movie"
        ? `https://vidsrc.wtf/api/1/movie/?id=${id}&color=${hexColor}`
        : `https://vidsrc.wtf/api/1/tv/?id=${id}&s=${season}&e=${episode}&color=${hexColor}`;
    },
    description: "Multi Server",
    language: "Multi",
    isWorking: true,
    requiresNoReferrer: false
  },




  vidzee: {
    id: "vidzee",
    name: "VidZee",
    type: "embed",
    quality: "HD",
    icon: "🎬",
    getUrl: (id, season, episode, type) => 
      type === "movie"
        ? `https://player.vidzee.wtf/embed/movie/${id}`
        : `https://player.vidzee.wtf/embed/tv/${id}/${season}/${episode}`,
    description: "VidZee - Multi Audio Server",
    language: "Multi",
    isWorking: true
  },

  vidzee_4k: {
    id: "vidzee_4k",
    name: "VidZee 4K",
    type: "embed",
    quality: "4K",
    icon: "🎬",
    getUrl: (id, season, episode, type) => 
      type === "movie"
        ? `https://player.vidzee.wtf/embed/movie/4k/${id}`
        : `https://player.vidzee.wtf/embed/tv/${id}/${season}/${episode}`,
    description: "VidZee 4K - Ultra HD Quality",
    language: "Multi",
    isWorking: true
  },
  
  // Smashy Source: Accepts IMDB (tt prefix) or TMDB ID for movies/TV
  smashy: {
    id: "smashy",
    name: "Smashy",
    type: "embed",
    quality: "HD",
    icon: "💥",
    getUrl: (id, season, episode, type) => {
      if (!id) return '';
      if (type === 'movie') {
        // Advanced: add ?btPosition=20&playerList=D|SU|F|FMD|J&remove=videoPlayer|watchWithFriends|addSubtitles|search&startTime=0&subLang=English as needed
        return `https://player.smashy.stream/movie/${id}`;
      } else if (type === 'tv') {
        if (!season || !episode) return '';
        return `https://player.smashy.stream/tv/${id}?s=${season}&e=${episode}`;
      }
      return '';
    },
    description: "Smashy - Accepts IMDB (tt) or TMDB ID. Advanced player features.",
    language: "Multi",
    isWorking: true
  },





};

// Anime Sources
export const ANIME_SOURCES = {
  vidsrc_anime_sub: {
    id: "vidsrc_anime_sub",
    name: "VidSrc (Sub)",
    type: "embed",
    quality: "HD",
    icon: "🎌",
    getUrl: (id, season, episode) => {
      const episodeNum = episode || 1;
      // VidSrc anime format: v2/embed/anime/{id}/{episode}/{type}
      // AniList ID must have 'ani' prefix
      return `https://vidsrc.cc/v2/embed/anime/ani${id}/${episodeNum}/sub?autoPlay=false&autoSkipIntro=true`;
    },
    description: "VidSrc - Japanese with Subtitles",
    language: "Japanese (Sub)",
    isWorking: true
  },

  vidsrc_anime_dub: {
    id: "vidsrc_anime_dub",
    name: "VidSrc (Dub)",
    type: "embed",
    quality: "HD",
    icon: "🎌",
    getUrl: (id, season, episode) => {
      const episodeNum = episode || 1;
      // VidSrc anime format: v2/embed/anime/{id}/{episode}/{type}
      // AniList ID must have 'ani' prefix
      return `https://vidsrc.cc/v2/embed/anime/ani${id}/${episodeNum}/dub?autoPlay=false&autoSkipIntro=true`;
    },
    description: "VidSrc - English Dubbed",
    language: "English (Dub)",
    isWorking: true
  },

  videasy_anime_sub: {
    id: "videasy_anime_sub",
    name: "Videasy (Sub)",
    type: "embed",
    quality: "HD",
    icon: "🎯",
    getUrl: (id, season, episode) => {
      const episodeNum = episode || 1;
      // Videasy anime format: https://player.videasy.net/anime/anilist_id/episode
      // Default is sub, no dub parameter needed
      return `https://player.videasy.net/anime/${id}/${episodeNum}`;
    },
    description: "Videasy - Japanese with Subtitles",
    language: "Japanese (Sub)",
    isWorking: true
  },

  videasy_anime_dub: {
    id: "videasy_anime_dub",
    name: "Videasy (Dub)",
    type: "embed",
    quality: "HD",
    icon: "🎯",
    getUrl: (id, season, episode) => {
      const episodeNum = episode || 1;
      // Videasy anime format: https://player.videasy.net/anime/anilist_id/episode?dub=true
      return `https://player.videasy.net/anime/${id}/${episodeNum}?dub=true`;
    },
    description: "Videasy - English Dubbed",
    language: "English (Dub)",
    isWorking: true
  },



};

// AniList to TMDB conversion function using external API
export const convertAniListToTMDB = async (anilistId) => {
  try {
    console.log(`[AniList to TMDB] Converting AniList ID: ${anilistId}`);
    
    const response = await fetch(`https://anitotmdb.steep-bread-3c84.workers.dev/convert?anilist_id=${anilistId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[AniList to TMDB] API Response:`, data);
    
    if (data.success && data.tmdb_id) {
      console.log(`[AniList to TMDB] Successfully converted: AniList ${anilistId} -> TMDB ${data.tmdb_id}`);
      return {
        tmdbId: data.tmdb_id.toString(),
        anilistId: data.anilist_id,
        method: data.method,
        success: data.success
      };
    } else {
      console.log(`[AniList to TMDB] Conversion failed for AniList ID: ${anilistId}`);
      return null;
    }
  } catch (error) {
    console.error('[AniList to TMDB] Error converting AniList to TMDB:', error);
    return null;
  }
};

// Enhanced Anime Sources with TMDB Support
export const ENHANCED_ANIME_SOURCES = {
  // Existing anime sources
  ...ANIME_SOURCES,
  
  // TMDB-based anime sources (use TMDB ID when available)
  tmdb_videasy: {
    id: "tmdb_videasy",
    name: "Videasy (TMDB)",
    type: "embed",
    quality: "4K",
    icon: "📺",
    getUrl: (tmdbId, season, episode, type) => 
      type === "movie" 
        ? `https://player.videasy.net/movie/${tmdbId}`
        : `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}`,
    description: "Videasy with TMDB ID",
    language: "Multi",
    isWorking: true,
    requiresTMDB: true // Flag to indicate TMDB requirement
  },

  tmdb_vidsrc: {
    id: "tmdb_vidsrc",
    name: "VidSrc (TMDB)",
    type: "embed",
    quality: "HD",
    icon: "🎨",
    getUrl: (tmdbId, season, episode, type) => 
      type === "movie"
        ? `https://vidsrc.cc/v2/embed/movie/${tmdbId}`
        : `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`,
    description: "VidSrc with TMDB ID",
    language: "Multi",
    isWorking: true,
    requiresTMDB: true,
  },

  tmdb_vidsrc_v3: {
    id: "tmdb_vidsrc_v3",
    name: "VidSrc v3 (TMDB)",
    type: "embed",
    quality: "HD",
    icon: "🎯",
    getUrl: (tmdbId, season, episode, type) => 
      type === "movie"
        ? `https://vidsrc.cc/v3/embed/movie/${tmdbId}?autoPlay=false`
        : `https://vidsrc.cc/v3/embed/tv/${tmdbId}/${season}/${episode}?autoPlay=false`,
    description: "VidSrc v3 with TMDB ID",
    language: "Multi",
    isWorking: true,
    requiresTMDB: true,
  },

  // All VIP Sources for Anime (using TMDB ID)
  tmdb_vip_fmftp: {
    id: "tmdb_vip_fmftp",
    name: "VIP FMFTP (Anime)",
    type: "api",
    quality: "4K",
    icon: "👑",
    getApiUrl: (tmdbId, season, episode, type) => {
      if (!tmdbId) return '';
      if (type === 'movie') {
        return `https://fmftp-player.hasansarker58.workers.dev/${tmdbId}`;
      } else if (type === 'tv') {
        if (!season || !episode) return '';
        return `https://fmftp-player.hasansarker58.workers.dev/${tmdbId}/${season}/${episode}`;
      }
      return '';
    },
    description: "VIP FMFTP - Premium 4K Anime Source",
    language: "Multi",
    isWorking: true,
    isApiBased: true,
    isVipSource: true,
    requiresTMDB: true,
    priority: 1
  },

  tmdb_vip_moviebox: {
    id: "tmdb_vip_moviebox",
    name: "VIP MovieBox (Anime)",
    type: "embed",
    quality: "4K",
    icon: "🎬",
    getUrl: (tmdbId, season, episode, type) => {
      if (!tmdbId) return '';
      if (type === 'movie') {
        return `https://moviebox.steep-bread-3c84.workers.dev/${tmdbId}`;
      } else if (type === 'tv') {
        if (!season || !episode) return '';
        return `https://moviebox.steep-bread-3c84.workers.dev/${tmdbId}/${season}/${episode}`;
      }
      return '';
    },
    description: "VIP MovieBox - Premium 4K Anime Source",
    language: "Multi",
    isWorking: true,
    isVipSource: true,
    requiresTMDB: true,
    priority: 2
  },

  tmdb_vip_roarzone: {
    id: "tmdb_vip_roarzone",
    name: "VIP RoarZone (Anime)",
    type: "api",
    quality: "4K",
    icon: "🦁",
    getApiUrl: (tmdbId, season, episode, type) => {
      if (!tmdbId) return '';
      if (type === 'movie') {
        return `https://roarzone-player.hasansarker58.workers.dev/${tmdbId}`;
      } else if (type === 'tv') {
        if (!season || !episode) return '';
        return `https://roarzone-player.hasansarker58.workers.dev/${tmdbId}/${season}/${episode}`;
      }
      return '';
    },
    description: "VIP RoarZone - Premium 4K Anime Source",
    language: "Multi",
    isWorking: true,
    isApiBased: true,
    isVipSource: true,
    requiresTMDB: true,
    priority: 3
  },

  tmdb_vip_crazyctg: {
    id: "tmdb_vip_crazyctg",
    name: "VIP CrazyCTG (Anime)",
    type: "api",
    quality: "4K",
    icon: "🎯",
    movieOnly: true,
    getApiUrl: (tmdbId, season, episode, type) => {
      if (!tmdbId) return '';
      if (type === 'movie') {
        return `https://crazyctg-player.hasansarker58.workers.dev/${tmdbId}`;
      }
      return '';
    },
    description: "VIP CrazyCTG - Premium 4K Anime Movies",
    language: "Multi",
    isWorking: true,
    isApiBased: true,
    isVipSource: true,
    requiresTMDB: true,
    priority: 4
  },

  tmdb_vip_binudon: {
    id: "tmdb_vip_binudon",
    name: "VIP Binudon (Anime)",
    type: "api",
    quality: "4K",
    icon: "🍜",
    movieOnly: true,
    getApiUrl: (tmdbId, season, episode, type) => {
      if (!tmdbId) return '';
      if (type === 'movie') {
        return `https://binudon-player.hasansarker58.workers.dev/${tmdbId}`;
      }
      return '';
    },
    description: "VIP Binudon - Premium 4K Anime Movies",
    language: "Multi",
    isWorking: true,
    isApiBased: true,
    isVipSource: true,
    requiresTMDB: true,
    priority: 5
  },

  tmdb_vip_spdx: {
    id: "tmdb_vip_spdx",
    name: "VIP SPDX (Anime)",
    type: "api",
    quality: "4K",
    icon: "⚡",
    movieOnly: true,
    getApiUrl: (tmdbId, season, episode, type) => {
      if (!tmdbId) return '';
      if (type === 'movie') {
        return `https://spdx.steep-bread-3c84.workers.dev/${tmdbId}`;
      }
      return '';
    },
    description: "VIP SPDX - Premium 4K Anime Movies",
    language: "Multi",
    isWorking: true,
    isApiBased: true,
    isVipSource: true,
    requiresTMDB: true,
    priority: 6
  },

  tmdb_vip_hydrahd_scrape: {
    id: "tmdb_vip_hydrahd_scrape",
    name: "VIP HydraHD Scrape (Anime)",
    type: "api",
    quality: "4K",
    icon: "🌊",
    getApiUrl: (tmdbId, season, episode, type) => {
      if (!tmdbId) return '';
      if (type === 'movie') {
        return `https://hydrahd-scrape.premiumhub.workers.dev/https://hyhd.org/embed/${tmdbId}`;
      } else if (type === 'tv') {
        if (!season || !episode) return '';
        return `https://hydrahd-scrape.premiumhub.workers.dev/https://hyhd.org/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return '';
    },
    description: "VIP HydraHD Scrape - Premium 4K Anime Source",
    language: "Multi",
    isWorking: true,
    isApiBased: true,
    isVipSource: true,
    requiresTMDB: true,
    priority: 7
  },

  // All Premium Sources for Anime (using TMDB ID)
  tmdb_videasy_premium: {
    id: "tmdb_videasy_premium",
    name: "Videasy Premium (Anime)",
    type: "embed",
    quality: "4K",
    icon: "📺",
    getUrl: (tmdbId, season, episode, type) => 
      type === "movie" 
        ? `https://player.videasy.net/movie/${tmdbId}`
        : `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}`,
    description: "Videasy Premium - 4K Anime Source",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    requiresTMDB: true,
    priority: 8
  },

  tmdb_vidjoy_premium: {
    id: "tmdb_vidjoy_premium",
    name: "VidJoy Premium (Anime)",
    type: "embed",
    quality: "HD",
    icon: "💡",
    getUrl: (tmdbId, season, episode, type) => 
      type === "movie"
        ? `https://vidjoy.pro/embed/movie/${tmdbId}`
        : `https://vidjoy.pro/embed/tv/${tmdbId}/${season}/${episode}`,
    description: "VidJoy Premium - HD Anime Source",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    requiresTMDB: true,
    priority: 9
  },

  tmdb_hydrahd_premium: {
    id: "tmdb_hydrahd_premium",
    name: "HydraHD Premium (Anime)",
    type: "embed",
    quality: "HD",
    icon: "🌊",
    getUrl: (tmdbId, season, episode, type) => 
      type === "movie"
        ? `https://hydrahd.net/embed/movie/${tmdbId}`
        : `https://hydrahd.net/embed/tv/${tmdbId}/${season}/${episode}`,
    description: "HydraHD Premium - HD Anime Source",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    requiresTMDB: true,
    priority: 10
  },

  tmdb_ridomovies_premium: {
    id: "tmdb_ridomovies_premium",
    name: "RidoMovies Premium (Anime)",
    type: "embed",
    quality: "HD",
    icon: "🎭",
    getUrl: (tmdbId, season, episode, type) => 
      type === "movie"
        ? `https://ridomovies.com/embed/movie/${tmdbId}`
        : `https://ridomovies.com/embed/tv/${tmdbId}/${season}/${episode}`,
    description: "RidoMovies Premium - HD Anime Source",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    requiresTMDB: true,
    priority: 11
  },

  tmdb_vidlink_premium: {
    id: "tmdb_vidlink_premium",
    name: "VidLink Premium (Anime)",
    type: "embed",
    quality: "HD",
    icon: "🔗",
    getUrl: (tmdbId, season, episode, type) => 
      type === "movie"
        ? `https://vidlink.to/embed/movie/${tmdbId}`
        : `https://vidlink.to/embed/tv/${tmdbId}/${season}/${episode}`,
    description: "VidLink Premium - HD Anime Source",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    requiresTMDB: true,
    priority: 12
  },

  tmdb_vidsrc_premium: {
    id: "tmdb_vidsrc_premium",
    name: "VidSrc Premium (Anime)",
    type: "embed",
    quality: "HD",
    icon: "🎬",
    getUrl: (tmdbId, season, episode, type) => 
      type === "movie"
        ? `https://vidsrc.cc/v2/embed/movie/${tmdbId}`
        : `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`,
    description: "VidSrc Premium - HD Anime Source",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    requiresTMDB: true,
    priority: 13
  },

  tmdb_vidsrc_v3_premium: {
    id: "tmdb_vidsrc_v3_premium",
    name: "VidSrc v3 Premium (Anime)",
    type: "embed",
    quality: "HD",
    icon: "🎬",
    getUrl: (tmdbId, season, episode, type) => 
      type === "movie"
        ? `https://vidsrc.cc/v3/embed/movie/${tmdbId}?autoPlay=false`
        : `https://vidsrc.cc/v3/embed/tv/${tmdbId}/${season}/${episode}?autoPlay=false`,
    description: "VidSrc v3 Premium - HD Anime Source",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    requiresTMDB: true,
    priority: 14
  },

  tmdb_xprime_premium: {
    id: "tmdb_xprime_premium",
    name: "XPrime Premium (Anime)",
    type: "embed",
    quality: "HD",
    icon: "⭐",
    getUrl: (tmdbId, season, episode, type) => 
      type === "movie"
        ? `https://xprime.tv/watch/${tmdbId}`
        : `https://xprime.tv/watch/${tmdbId}/${season}/${episode}`,
    description: "XPrime Premium - HD Anime Source",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    requiresTMDB: true,
    priority: 15
  },

  tmdb_vidrock_premium: {
    id: "tmdb_vidrock_premium",
    name: "VidRock Premium (Anime)",
    type: "embed",
    quality: "HD",
    icon: "🪨",
    getUrl: (tmdbId, season, episode, type) => 
      type === "movie"
        ? `https://vidrock.steep-bread-3c84.workers.dev/movie/${tmdbId}`
        : `https://vidrock.steep-bread-3c84.workers.dev/tv/${tmdbId}/${season}/${episode}`,
    description: "VidRock Premium - HD Anime Source",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    requiresTMDB: true,
    priority: 16
  },

  tmdb_spencerdevs_premium: {
    id: "tmdb_spencerdevs_premium",
    name: "SpencerDevs Premium (Anime)",
    type: "embed",
    quality: "HD",
    icon: "⚙️",
    getUrl: (tmdbId, season, episode, type, theme = 'dark') => 
      type === "movie"
        ? `https://spencerdevs.xyz/movie/${tmdbId}?theme=${theme}`
        : `https://spencerdevs.xyz/tv/${tmdbId}/${season}/${episode}?theme=${theme}`,
    description: "SpencerDevs Premium - HD Anime Source",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    requiresTMDB: true,
    priority: 17
  },

  tmdb_mappletv: {
    id: "tmdb_mappletv",
    name: "MappleTV (TMDB)",
    type: "embed",
    quality: "4K",
    icon: "🍁",
    getUrl: (tmdbId, season, episode, type) => 
      type === "movie"
        ? `https://mappletv.uk/watch/movie/${tmdbId}?autoPlay=true&theme=4f46e5&startAt=0`
        : `https://mappletv.uk/watch/tv/${tmdbId}-${season}-${episode}?autoPlay=true&autoNext=true&theme=4f46e5&startAt=0`,
    description: "MappleTV with TMDB ID",
    language: "Multi",
    isWorking: true,
    requiresTMDB: true,
  },
};

// Utility functions
export const getAvailableSources = (contentType, isAnime = false) => {
  const sources = isAnime ? ANIME_SOURCES : VIDEO_SOURCES;
  
  const filteredSources = Object.entries(sources).filter(([key, source]) => {
    // Filter based on content type
    if (contentType === 'movie' && source.tvOnly) return false;
    if (contentType === 'tv' && source.movieOnly) return false;
    return true;
  });
  
  // Sort sources to prioritize VIP sources first, then Premium sources
  return filteredSources.sort(([keyA, sourceA], [keyB, sourceB]) => {
    // VIP sources always come first
    if (sourceA.isVipSource && !sourceB.isVipSource) return -1;
    if (!sourceA.isVipSource && sourceB.isVipSource) return 1;
    
    // Premium sources come second
    if (sourceA.isPremiumSource && !sourceB.isPremiumSource && !sourceB.isVipSource) return -1;
    if (!sourceA.isPremiumSource && sourceB.isPremiumSource && !sourceA.isVipSource) return 1;
    
    // If both are VIP sources, sort by priority
    if (sourceA.isVipSource && sourceB.isVipSource) {
      return (sourceA.priority || 999) - (sourceB.priority || 999);
    }
    
    // If both are Premium sources, sort by priority
    if (sourceA.isPremiumSource && sourceB.isPremiumSource) {
      return (sourceA.priority || 999) - (sourceB.priority || 999);
    }
    
    // For other sources, maintain original order
    return 0;
  });
};

export const getDefaultSource = (contentType, isAnime = false) => {
  const sources = getAvailableSources(contentType, isAnime);
  
  // Always prefer VIP sources first
  const vipSource = sources.find(([id, source]) => source.isVipSource);
  if (vipSource) return vipSource[0];
  
  if (isAnime) {
    // For anime, prefer VidSrc sub as default
    const vidsrcSub = sources.find(([id]) => id === 'vidsrc_anime_sub');
    if (vidsrcSub) return vidsrcSub[0];
    
    // Fallback to first available anime source
    return sources[0] ? sources[0][0] : 'vidsrc_anime_sub';
  }
  
  return sources[0] ? sources[0][0] : null; // Return source ID
};

// Enhanced function to get available sources for anime
export const getAnimeSourcesWithTMDB = async (anilistAnime, tmdbMapping = null) => {
  const sources = { ...ANIME_SOURCES };
  
  // Try to convert AniList ID to TMDB if no mapping provided
  let tmdbData = tmdbMapping;
  if (!tmdbData && anilistAnime?.id) {
    console.log(`[Anime Sources] Attempting to convert AniList ID: ${anilistAnime.id}`);
    tmdbData = await convertAniListToTMDB(anilistAnime.id);
  }
  
  console.log(`[Anime Sources] TMDB Data:`, tmdbData);
  
  // Add TMDB sources if mapping is available
  if (tmdbData && tmdbData.tmdbId) {
    console.log(`[Anime Sources] Adding TMDB sources with ID: ${tmdbData.tmdbId}`);
    
    Object.entries(ENHANCED_ANIME_SOURCES).forEach(([key, source]) => {
      if (source.requiresTMDB) {
        sources[key] = {
          ...source,
          tmdbId: tmdbData.tmdbId,
          tmdbType: tmdbData.type || 'tv', // Default to TV for anime
        };
        console.log(`[Anime Sources] Added TMDB source: ${key} (${source.name})`);
      }
    });
    
    console.log(`[Anime Sources] Total sources after TMDB conversion: ${Object.keys(sources).length}`);
    console.log(`[Anime Sources] TMDB sources added:`, Object.keys(sources).filter(key => key.startsWith('tmdb_')));
    console.log(`[Anime Sources] VIP sources added:`, Object.keys(sources).filter(key => key.includes('vip')));
    console.log(`[Anime Sources] Premium sources added:`, Object.keys(sources).filter(key => key.includes('premium')));
  } else {
    console.log(`[Anime Sources] No TMDB data available, using regular anime sources only`);
  }
  
  return Object.entries(sources);
};

// Enhanced Video Sources with Cross-API Support

// Map AniList ID to other sources
export const getVideoSourcesByAnimeId = async (animeId, sourceType = 'anilist') => {
  try {
    let mappedId = animeId;
    
    // If we have a TMDB ID from unified search, use anime-specific sources
    if (sourceType === 'tmdb') {
      // TMDB anime can use same sources but might need different mapping
      mappedId = animeId;
    }
    
    // If we have MAL ID, convert to AniList equivalent if possible
    if (sourceType === 'mal') {
      // You could maintain a mapping database or use a service like
      // anime-offline-database or jikan for ID mapping
      mappedId = await convertMALtoAniListId(animeId);
    }

    return {
      anilist: mappedId,
      tmdb: sourceType === 'tmdb' ? animeId : null,
      mal: sourceType === 'mal' ? animeId : null
    };
  } catch (error) {
    console.error('ID mapping error:', error);
    return { anilist: animeId, tmdb: null, mal: null };
  }
};

// Convert MAL ID to AniList ID (you'd need a mapping service)
const convertMALtoAniListId = async (malId) => {
  try {
    // Option 1: Use anime-offline-database
    // This is a JSON file with ID mappings between different services
    const response = await fetch('https://raw.githubusercontent.com/manami-project/anime-offline-database/master/anime-offline-database.json');
    const database = await response.json();
    
    const entry = database.data.find(anime => 
      anime.sources.some(source => 
        source.includes(`myanimelist.net/anime/${malId}`)
      )
    );
    
    if (entry) {
      const anilistSource = entry.sources.find(source => 
        source.includes('anilist.co')
      );
      
      if (anilistSource) {
        const anilistId = anilistSource.split('/').pop();
        return parseInt(anilistId);
      }
    }
    
    // Option 2: Use Jikan API (unofficial MAL API) to get more data
    // and then search AniList with the title
    
    return malId; // Fallback to original ID
  } catch (error) {
    console.error('MAL to AniList conversion failed:', error);
    return malId;
  }
};
