import { getMovies, getTVShows, search } from './api';

// Video Sources Configuration
export const VIDEO_SOURCES = {
  // VIP Sources (Always on top)
  vip_fmftp: {
    id: "vip_fmftp",
    name: "Royal Cinema",
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
    description: "Royal Cinema - Premium 4K Source",
    language: "Multi",
    isWorking: true,
    isApiBased: true,
    isVipSource: true,
    priority: 1
  },

  vip_moviebox: {
    id: "vip_moviebox",
    name: "Platinum Theater",
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
    description: "Platinum Theater - Premium 4K Source",
    language: "Multi",
    isWorking: true,
    isVipSource: true,
    priority: 2
  },

  vip_roarzone: {
    id: "vip_roarzone",
    name: "Golden Stream",
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
    description: "Golden Stream - Premium 4K Source",
    language: "Multi",
    isWorking: true,
    isApiBased: true,
    isVipSource: true,
    priority: 3
  },

  vip_crazyctg: {
    id: "vip_crazyctg",
    name: "Diamond Play",
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
    description: "Diamond Play - Premium 4K Movies Only",
    language: "Multi",
    isWorking: true,
    isApiBased: true,
    isVipSource: true,
    priority: 4
  },

  vip_binudon: {
    id: "vip_binudon",
    name: "Elite Vision",
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
    description: "Elite Vision - Premium 4K Movies Only",
    language: "Multi",
    isWorking: true,
    isApiBased: true,
    isVipSource: true,
    priority: 5
  },

  vip_spdx: {
    id: "vip_spdx",
    name: "Lightning Max",
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
    description: "Lightning Max - Premium 4K Movies Only",
    language: "Multi",
    isWorking: true,
    isApiBased: true,
    isVipSource: true,
    priority: 6
  },

  vip_hydrahd_scrape: {
    id: "vip_hydrahd_scrape",
    name: "Crystal Wave",
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
    description: "Crystal Wave - Premium 4K Source",
    language: "Multi",
    isWorking: true,
    isApiBased: true,
    isVipSource: true,
    priority: 7
  },

  vip_ridomovies: {
    id: "vip_ridomovies",
    name: "Silver Screen",
    type: "api",
    quality: "HD",
    icon: "🎭",
    movieOnly: true,
    getApiUrl: (id, season, episode, type) => {
      if (!id) return '';
      if (type === 'movie') {
        return `https://ridomovies.premiumhub.workers.dev/tmdb?id=${id}`;
      }
      return '';
    },
    description: "Silver Screen - Premium HD Movies Only",
    language: "Multi",
    isWorking: true,
    isApiBased: true,
    isVipSource: true,
    priority: 8
  },

  // Top Priority Sources (1-9)
  videasy: {
    id: "videasy",
    name: "Ocean Stream",
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
    priority: 9
  },

  vidsrc: {
    id: "vidsrc",
    name: "Thunder Play",
    type: "embed",
    quality: "HD",
    icon: "🎬",
    getUrl: (id, season, episode, type) => 
      type === "movie"
        ? `https://vidsrc.cc/v2/embed/movie/${id}`
        : `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}`,
    description: "Thunder Play - Multi Server",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    priority: 10
  },

  vidsrc_v3: {
    id: "vidsrc_v3",
    name: "Thunder Pro",
    type: "embed",
    quality: "HD",
    icon: "🎬",
    getUrl: (id, season, episode, type) => 
      type === "movie"
        ? `https://vidsrc.cc/v3/embed/movie/${id}?autoPlay=false`
        : `https://vidsrc.cc/v3/embed/tv/${id}/${season}/${episode}?autoPlay=false`,
    description: "Thunder Pro - Enhanced Player",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    priority: 11
  },

  xprime: {
    id: "xprime",
    name: "Stellar Watch",
    type: "embed",
    quality: "HD",
    icon: "⭐",
    getUrl: (id, season, episode, type) => 
      type === "movie"
        ? `https://xprime.tv/watch/${id}`
        : `https://xprime.tv/watch/${id}/${season}/${episode}`,
    description: "Stellar Watch - Multi Server",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    priority: 12
  },

  vidrock: {
    id: "vidrock",
    name: "Mountain View",
    type: "embed",
    quality: "HD",
    icon: "🪨",
    getUrl: (id, season, episode, type) => 
      type === "movie"
        ? `https://vidrock.steep-bread-3c84.workers.dev/movie/${id}`
        : `https://vidrock.steep-bread-3c84.workers.dev/tv/${id}/${season}/${episode}`,
    description: "Mountain View - Premium HD Source",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    priority: 13
  },

  spencerdevs: {
    id: "spencerdevs",
    name: "Tech Hub",
    type: "embed",
    quality: "HD",
    icon: "⚙️",
    getUrl: (id, season, episode, type, theme = 'dark') => 
      type === "movie"
        ? `https://spencerdevs.xyz/movie/${id}?theme=${theme}`
        : `https://spencerdevs.xyz/tv/${id}/${season}/${episode}?theme=${theme}`,
    description: "Tech Hub - Premium HD Source",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    priority: 14
  },

  nhdapi: {
    id: "nhdapi",
    name: "Nexus Player",
    type: "embed",
    quality: "HD",
    icon: "🎯",
    getUrl: (id, season, episode, type) => 
      type === "movie"
        ? `https://nhdapi.xyz/movie/${id}`
        : `https://nhdapi.xyz/tv/${id}/${season}/${episode}`,
    description: "Nexus Player - Premium HD Source",
    language: "Multi",
    isWorking: true,
    isPremiumSource: true,
    priority: 15
  },

  // Other Sources (8+)

  vidify: {
    id: "vidify",
    name: "Cinema Magic",
    type: "embed",
    quality: "4K",
    icon: "🎪",
    getUrl: (id, season, episode, type) => 
      type === "movie"
        ? `https://vidify.top/embed/movie/${id}`
        : `https://vidify.top/embed/tv/${id}/${season}/${episode}`,
    description: "Cinema Magic - 4K+ Multi Audio",
    language: "Multi",
    isWorking: true
  },



  movies111: {
    id: "movies111",
    name: "Triple Cinema",
    type: "embed",
    quality: "HD",
    icon: "🎬",
    getUrl: (id, season, episode, type) => 
      type === "movie"
        ? `https://111movies.com/movie/${id}`
        : `https://111movies.com/tv/${id}/${season}/${episode}`,
    description: "Triple Cinema - Multi Server",
    language: "Multi",
    isWorking: true
  },

  qstream: {
    id: "qstream",
    name: "Quick Watch",
    type: "embed",
    quality: "HD",
    icon: "🎬",
    getUrl: (id, season, episode, type) => 
      type === "movie"
        ? `https://qstream-scrape.premiumhub.workers.dev/movie/${id}`
        : `https://qstream-scrape.premiumhub.workers.dev/episode/${id}`,
    description: "Quick Watch - Ad-Free Embed Player",
    language: "Multi",
    isWorking: true
  },

  godrive: {
    id: "godrive",
    name: "Space Drive",
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
    name: "Alpha Stream",
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
    name: "Buzz Player",
    type: "embed",
    quality: "HD",
    icon: "🎬",
    getUrl: (id, season, episode, type) => 
      type === "movie"
        ? `https://player.vidzee.wtf/embed/movie/${id}`
        : `https://player.vidzee.wtf/embed/tv/${id}/${season}/${episode}`,
    description: "Buzz Player - Multi Audio Server",
    language: "Multi",
    isWorking: true
  },

  vidzee_4k: {
    id: "vidzee_4k",
    name: "Ultra Buzz",
    type: "embed",
    quality: "4K",
    icon: "🎬",
    getUrl: (id, season, episode, type) => 
      type === "movie"
        ? `https://player.vidzee.wtf/embed/movie/4k/${id}`
        : `https://player.vidzee.wtf/embed/tv/${id}/${season}/${episode}`,
    description: "Ultra Buzz - Ultra HD Quality",
    language: "Multi",
    isWorking: true
  },
  
};

// Anime Sources
export const ANIME_SOURCES = {
  vidsrc_anime_sub: {
    id: "vidsrc_anime_sub",
    name: "Thunder Stream • Sub",
    type: "embed",
    quality: "HD",
    icon: "🎌",
    getUrl: (id, season, episode) => {
      const episodeNum = episode || 1;
      // Thunder Stream anime format: v2/embed/anime/{id}/{episode}/{type}
      // AniList ID must have 'ani' prefix
      return `https://vidsrc.cc/v2/embed/anime/ani${id}/${episodeNum}/sub?autoPlay=false&autoSkipIntro=true`;
    },
    description: "Thunder Stream - Japanese with Subtitles",
    language: "Japanese (Sub)",
    isWorking: true,
    isNativeAnimeSource: true // Flag for native anime support with AniList ID
  },

  vidsrc_anime_dub: {
    id: "vidsrc_anime_dub",
    name: "Thunder Stream • Dub",
    type: "embed",
    quality: "HD",
    icon: "🎌",
    getUrl: (id, season, episode) => {
      const episodeNum = episode || 1;
      // Thunder Stream anime format: v2/embed/anime/{id}/{episode}/{type}
      // AniList ID must have 'ani' prefix
      return `https://vidsrc.cc/v2/embed/anime/ani${id}/${episodeNum}/dub?autoPlay=false&autoSkipIntro=true`;
    },
    description: "Thunder Stream - English Dubbed",
    language: "English (Dub)",
    isWorking: true,
    isNativeAnimeSource: true // Flag for native anime support with AniList ID
  },

  videasy_anime_sub: {
    id: "videasy_anime_sub",
    name: "Ocean Wave • Sub",
    type: "embed",
    quality: "HD",
    icon: "🎯",
    getUrl: (id, season, episode) => {
      const episodeNum = episode || 1;
      // Ocean Wave anime format: https://player.videasy.net/anime/anilist_id/episode
      // Default is sub, no dub parameter needed
      return `https://player.videasy.net/anime/${id}/${episodeNum}`;
    },
    description: "Ocean Wave - Japanese with Subtitles",
    language: "Japanese (Sub)",
    isWorking: true,
    isNativeAnimeSource: true // Flag for native anime support with AniList ID
  },

  videasy_anime_dub: {
    id: "videasy_anime_dub",
    name: "Ocean Wave • Dub",
    type: "embed",
    quality: "HD",
    icon: "🎯",
    getUrl: (id, season, episode) => {
      const episodeNum = episode || 1;
      // Ocean Wave anime format: https://player.videasy.net/anime/anilist_id/episode?dub=true
      return `https://player.videasy.net/anime/${id}/${episodeNum}?dub=true`;
    },
    description: "Ocean Wave - English Dubbed",
    language: "English (Dub)",
    isWorking: true,
    isNativeAnimeSource: true // Flag for native anime support with AniList ID
  },



};

// Enhanced Anime Sources with TMDB Support
export const ENHANCED_ANIME_SOURCES = {
  tmdb_vip_fmftp: {
    id: "tmdb_vip_fmftp",
    name: "Royal Anime • FMFTP VIP",
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
    description: "VIP FMFTP - Premium 4K Anime Source (Uses TMDB ID)",
    language: "Multi",
    isWorking: true,
    isApiBased: true,
    isVipSource: true,
    requiresTMDB: true,
    isAnimeVipSource: true,
    priority: 1,
  },

  tmdb_vip_moviebox: {
    id: "tmdb_vip_moviebox",
    name: "Royal Anime • MovieBox VIP",
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
    description: "VIP MovieBox - Premium 4K Anime Source (Uses TMDB ID)",
    language: "Multi",
    isWorking: true,
    isVipSource: true,
    requiresTMDB: true,
    isAnimeVipSource: true,
    priority: 2,
  },

  videasy: {
    ...VIDEO_SOURCES.videasy,
    name: "Ocean Stream TV",
    description: "Ocean Stream TV player (requires TMDB ID)",
    requiresTMDB: true,
  },

  vidsrc: {
    ...VIDEO_SOURCES.vidsrc,
    name: "Thunder Stream TV",
    description: "Thunder Stream TV player (requires TMDB ID)",
    requiresTMDB: true,
  },

  vidsrc_v3: {
    ...VIDEO_SOURCES.vidsrc_v3,
    name: "Thunder Stream TV Pro",
    description: "Thunder Stream TV Pro player (requires TMDB ID)",
    requiresTMDB: true,
  },

  vidrock: {
    ...VIDEO_SOURCES.vidrock,
    name: "Summit Stream TV",
    description: "Summit Stream TV player (requires TMDB ID)",
    requiresTMDB: true,
  },

  nhdapi: {
    ...VIDEO_SOURCES.nhdapi,
    name: "Nexus Stream TV",
    description: "Nexus Stream TV player (requires TMDB ID)",
    requiresTMDB: true,
  },

  tmdb_videasy: {
    id: "tmdb_videasy",
    name: "Ocean Stream TV (TMDB)",
    type: "embed",
    quality: "4K",
    icon: "📺",
    getUrl: (tmdbId, season, episode, type) =>
      type === 'movie'
        ? `https://player.videasy.net/movie/${tmdbId}`
        : `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}`,
    description: "Ocean Stream TV TMDB backup",
    language: "Multi",
    isWorking: true,
    requiresTMDB: true,
  },

  tmdb_vidsrc: {
    id: "tmdb_vidsrc",
    name: "Thunder Stream TV (TMDB)",
    type: "embed",
    quality: "HD",
    icon: "🎨",
    getUrl: (tmdbId, season, episode, type) =>
      type === 'movie'
        ? `https://vidsrc.cc/v2/embed/movie/${tmdbId}`
        : `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season}/${episode}`,
    description: "Thunder Stream TV TMDB backup",
    language: "Multi",
    isWorking: true,
    requiresTMDB: true,
  },

  tmdb_vidsrc_v3: {
    id: "tmdb_vidsrc_v3",
    name: "Thunder Stream TV Pro (TMDB)",
    type: "embed",
    quality: "HD",
    icon: "🎯",
    getUrl: (tmdbId, season, episode, type) =>
      type === 'movie'
        ? `https://vidsrc.cc/v3/embed/movie/${tmdbId}?autoPlay=false`
        : `https://vidsrc.cc/v3/embed/tv/${tmdbId}/${season}/${episode}?autoPlay=false`,
    description: "Thunder Stream TV Pro TMDB backup",
    language: "Multi",
    isWorking: true,
    requiresTMDB: true,
  },
};

const ANIME_SOURCE_ORDER = [
  'tmdb_vip_fmftp',
  'tmdb_vip_moviebox',
  'videasy_anime_dub',
  'vidsrc_anime_dub',
  'videasy_anime_sub',
  'vidsrc_anime_sub',
  'videasy',
  'vidsrc',
  'vidsrc_v3',
  'vidrock',
  'nhdapi',
  'tmdb_videasy',
  'tmdb_vidsrc',
  'tmdb_vidsrc_v3',
];
// Utility functions
export const getAvailableSources = (contentType, isAnime = false, customSources = null) => {
  const sources = customSources || (isAnime ? ANIME_SOURCES : VIDEO_SOURCES);
  const normalizedType = contentType === 'anime' ? 'tv' : contentType;
  
  const filteredSources = Object.entries(sources).filter(([key, source]) => {
    // Filter based on content type
    if (normalizedType === 'movie' && source.tvOnly) return false;
    if (normalizedType === 'tv' && source.movieOnly) return false;
    return true;
  });
  
  if (customSources) {
    return filteredSources;
  }

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
    // For anime, prefer Thunder Stream • Sub as default
    const vidsrcSub = sources.find(([id]) => id === 'vidsrc_anime_sub');
    if (vidsrcSub) return vidsrcSub[0];
    
    // Fallback to first available anime source
    return sources[0] ? sources[0][0] : 'vidsrc_anime_sub';
  }
  
  return sources[0] ? sources[0][0] : null; // Return source ID
};

// Enhanced function to get available sources for anime with proper TMDB conversion
export const getAnimeSourcesWithTMDB = async (anilistAnime, tmdbMapping = null) => {
  console.log(`[Anime Sources] Processing anime: ${anilistAnime?.title?.english || anilistAnime?.title?.romaji} (AniList ID: ${anilistAnime?.id})`);
  
  // Start with native anime sources (support AniList ID directly)
  const sources = { ...ANIME_SOURCES };
  console.log(`[Anime Sources] Starting with ${Object.keys(sources).length} native anime sources`);
  
  // Try to convert AniList ID to TMDB if no mapping provided
  const tmdbData = await findBestTmdbMapping(anilistAnime, tmdbMapping);
  
  // Add TMDB-based sources if mapping is available
  if (tmdbData && tmdbData.tmdbId) {
    console.log(`[Anime Sources] Adding TMDB-based sources with ID: ${tmdbData.tmdbId}`);
    
    let tmdbSourcesAdded = 0;
    let vipSourcesAdded = 0;
    let premiumSourcesAdded = 0;
    
    Object.entries(ENHANCED_ANIME_SOURCES).forEach(([key, source]) => {
      if (source.requiresTMDB) {
        sources[key] = {
          ...source,
          tmdbId: tmdbData.tmdbId,
          tmdbType: determineAnimeType(anilistAnime, tmdbData), // Better type detection
          anilistId: anilistAnime.id, // Keep reference to original AniList ID
        };
        
        tmdbSourcesAdded++;
        if (source.isVipSource) vipSourcesAdded++;
        if (source.isPremiumSource) premiumSourcesAdded++;
        
        console.log(`[Anime Sources] Added TMDB source: ${key} (${source.name})`);
      }
    });
    
    console.log(`[Anime Sources] TMDB sources summary:`, {
      totalTmdbSources: tmdbSourcesAdded,
      vipSources: vipSourcesAdded,
      premiumSources: premiumSourcesAdded,
      tmdbId: tmdbData.tmdbId,
      tmdbType: determineAnimeType(anilistAnime, tmdbData)
    });
  } else {
    console.log(`[Anime Sources] No TMDB mapping - using native anime sources only`);
  }
  
  const totalSources = Object.keys(sources).length;
  const nativeAnimeSources = Object.values(sources).filter(s => s.isNativeAnimeSource).length;
  const tmdbBasedSources = Object.values(sources).filter(s => s.requiresTMDB).length;
  
  console.log(`[Anime Sources] Final source summary:`, {
    totalSources,
    nativeAnimeSources,
    tmdbBasedSources,
    hasVipSources: Object.values(sources).some(s => s.isVipSource),
    hasPremiumSources: Object.values(sources).some(s => s.isPremiumSource)
  });
  
  const orderedEntries = ANIME_SOURCE_ORDER
    .filter((key) => sources[key])
    .map((key) => [key, sources[key]]);

  Object.keys(sources).forEach((key) => {
    if (!ANIME_SOURCE_ORDER.includes(key)) {
      orderedEntries.push([key, sources[key]]);
    }
  });

  return orderedEntries;
};

// Helper function to determine anime type (movie vs TV)
const determineAnimeType = (anilistAnime, tmdbData) => {
  // Check AniList format first
  if (anilistAnime?.format) {
    if (anilistAnime.format === 'MOVIE') return 'movie';
    if (['TV', 'TV_SHORT', 'OVA', 'ONA', 'SPECIAL'].includes(anilistAnime.format)) return 'tv';
  }
  
  // Check episode count
  if (anilistAnime?.episodes === 1) return 'movie';
  if (anilistAnime?.episodes > 1) return 'tv';
  
  // Fallback to TMDB type or default to TV for anime
  return tmdbData?.type || 'tv';
};

const normalizeTitle = (title) =>
  typeof title === 'string' ? title.toLowerCase().replace(/[^a-z0-9]+/g, '') : null;

const extractYear = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return null;
  const match = dateString.match(/^(\d{4})/);
  return match ? Number(match[1]) : null;
};

const seasonRegex = /\b(season|part)\s*([0-9]+)/i;

const collectAnimeTitles = (anilistAnime) => {
  const titles = [];
  const addTitle = (value) => {
    if (typeof value === 'string' && value.trim()) {
      titles.push(value);
    }
  };

  addTitle(anilistAnime?.title?.english);
  addTitle(anilistAnime?.title?.romaji);
  addTitle(anilistAnime?.title?.native);

  if (Array.isArray(anilistAnime?.synonyms)) {
    anilistAnime.synonyms.forEach(addTitle);
  }

  return titles;
};

const scoreTmdbCandidate = ({
  candidate,
  details,
  detailsType,
  releaseYear,
  targetYear,
  normalizedTitles,
  animeHasSeasonLabel,
  animeEpisodes,
  preferredType,
}) => {
  let score = 0;

  // Prefer matching content type
  if (detailsType === preferredType) {
    score += 30;
  } else {
    score += 18;
  }

  // Year proximity scoring
  if (releaseYear && targetYear) {
    const diff = Math.abs(releaseYear - targetYear);
    score += Math.max(0, 20 - diff * 5);
  } else if (releaseYear) {
    score += 5;
  } else {
    score -= 5;
  }

  const candidateTitle = details?.name || details?.title || candidate.title || candidate.originalTitle;
  const normalizedCandidateTitle = normalizeTitle(candidateTitle);

  if (normalizedCandidateTitle) {
    if (normalizedTitles.has(normalizedCandidateTitle)) {
      score += 24;
    } else {
      for (const title of normalizedTitles) {
        if (normalizedCandidateTitle.includes(title) || title.includes(normalizedCandidateTitle)) {
          score += 15;
          break;
        }
      }
    }

    const seasonMatch = seasonRegex.exec(candidateTitle || '');
    if (seasonMatch && !animeHasSeasonLabel) {
      const seasonNumber = Number(seasonMatch[2]);
      if (!Number.isNaN(seasonNumber) && seasonNumber >= 2) {
        score -= 18; // Penalize mismatched season entries (e.g., Season 2)
      }
    }

    if (preferredType === 'tv') {
      const sequelKeywords = ['shippuden', 'finalseason', 'season2', 'season3'];
      if (sequelKeywords.some((keyword) => normalizedCandidateTitle.includes(keyword)) && !animeHasSeasonLabel) {
        score -= 12;
      }
    }
  }

  if (animeEpisodes && details?.number_of_episodes) {
    if (details.number_of_episodes >= animeEpisodes) {
      const ratio = details.number_of_episodes / animeEpisodes;
      if (ratio <= 1.1) {
        score += 10;
      } else if (ratio <= 1.8) {
        score += 6;
      } else {
        score -= 6;
      }
    } else {
      const deficit = animeEpisodes - details.number_of_episodes;
      if (deficit <= 3) {
        score += 8;
      } else if (deficit <= 10) {
        score += 2;
      } else {
        score -= 10;
      }
    }
  }

  const originalLanguage = details?.original_language || candidate.rawResult?.original_language;
  if (originalLanguage && originalLanguage !== 'ja') {
    score -= 6;
  }

  if (!details) {
    score -= 10; // Could not verify details
  }

  // Slight preference for direct matches (provided mapping) over derived ones in tie cases
  if (candidate.source === 'provided') {
    score += 1;
  }

  return score;
};

const preferredContentType = (anilistAnime) => {
  const format = anilistAnime?.format;
  if (format === 'MOVIE') return 'movie';
  if (format === 'SPECIAL') {
    const episodes = anilistAnime?.episodes || 0;
    if (episodes <= 2) {
      return 'movie';
    }
  }
  return 'tv';
};

const stripSeasonIndicators = (title) =>
  title
    .replace(/\b(season|part|cour|chapter)\s*[0-9]+/gi, '')
    .replace(/\bS0*[0-9]+\b/gi, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[-:–].*$/, '')
    .trim();

const buildSearchQueries = (titles) => {
  const queries = [];
  const addQuery = (value) => {
    const normalized = value.trim();
    if (!normalized) return;
    if (!queries.some((existing) => existing.toLowerCase() === normalized.toLowerCase())) {
      queries.push(normalized);
    }
  };

  titles.forEach(addQuery);
  titles.forEach((title) => {
    const stripped = stripSeasonIndicators(title);
    if (stripped && stripped.length >= 3) {
      addQuery(stripped);
    }
    if (title.includes(':')) {
      addQuery(title.split(':')[0]);
    }
  });

  return queries.slice(0, 8);
};

const looksLikeAnimeResult = (result) => {
  if (!result) return false;
  if (result.genre_ids?.includes(16)) return true;
  if (result.original_language === 'ja') return true;
  const title = (result.name || result.title || '').toLowerCase();
  return title.includes('anime');
};

const findBestTmdbMappingInternal = async (anilistAnime, initialMapping = null) => {
  const targetYear =
    anilistAnime?.startDate?.year ||
    anilistAnime?.seasonYear ||
    anilistAnime?.startDate?.year ||
    null;
  const animeEpisodes = anilistAnime?.episodes || null;
  const animeTitles = collectAnimeTitles(anilistAnime);
  const normalizedTitles = new Set(animeTitles.map(normalizeTitle).filter(Boolean));
  const animeHasSeasonLabel = animeTitles.some((title) => seasonRegex.test(title));
  const preferredType = preferredContentType(anilistAnime);

  const candidateMap = new Map();
  const addCandidate = (mapping, source, rawResult = null) => {
    if (!mapping) return;
    const tmdbId = String(mapping.tmdbId || mapping.tmdb_id || mapping.id || '');
    if (!tmdbId) return;

    if (!candidateMap.has(tmdbId)) {
      candidateMap.set(tmdbId, {
        tmdbId,
        type: mapping.type || mapping.media_type || preferredType,
        title: mapping.title || mapping.name || mapping.originalTitle || mapping.original_name || null,
        source,
        rawResult,
      });
    }
  };

  addCandidate(initialMapping, 'provided');

  const queries = buildSearchQueries(animeTitles);
  const candidateLimit = 20;

  const fetchSearchResults = async (query, searchFn, typeLabel) => {
    try {
      const response = await searchFn(query);
      const results = response?.data?.results || [];
      results
        .filter((result) => result?.id)
        .slice(0, 6)
        .forEach((result) => {
          if (candidateMap.size >= candidateLimit && candidateMap.has(String(result.id))) return;
          if (looksLikeAnimeResult(result) || candidateMap.size < 6) {
            addCandidate(
              {
                tmdbId: result.id,
                type: typeLabel,
                title: result.name || result.title || result.original_title || result.original_name,
              },
              `${typeLabel}-search:${query}`,
              result
            );
          }
        });
    } catch (error) {
      console.warn(`TMDB ${typeLabel} search failed for "${query}"`, error?.message);
    }
  };

  for (const query of queries) {
    await fetchSearchResults(query, search.tv, 'tv');

    if (preferredType === 'movie' || (animeEpisodes && animeEpisodes <= 2)) {
      await fetchSearchResults(query, search.movies, 'movie');
    } else if (candidateMap.size < 6) {
      // Still check movies as fallback for special cases
      await fetchSearchResults(query, search.movies, 'movie');
    }

    if (candidateMap.size >= candidateLimit) {
      break;
    }
  }

  if (candidateMap.size === 0) {
    return null;
  }

  let bestCandidate = null;

  for (const candidate of candidateMap.values()) {
    let details = null;
    let releaseYear = null;
    let detailsType = candidate.type || 'tv';

    try {
      if (!candidate.type || candidate.type === 'tv') {
        const response = await getTVShows.details(candidate.tmdbId);
        const tvData = response?.data || response;
        if (tvData) {
          details = tvData;
          detailsType = 'tv';
          releaseYear = extractYear(tvData.first_air_date);
        }
      } else if (candidate.type === 'movie') {
        const response = await getMovies.details(candidate.tmdbId);
        const movieData = response?.data || response;
        if (movieData) {
          details = movieData;
          detailsType = 'movie';
          releaseYear = extractYear(movieData.release_date);
        }
      }
    } catch (error) {
      console.warn('TMDB details lookup failed for', candidate.tmdbId, error?.message);
    }

    const score = scoreTmdbCandidate({
      candidate,
      details,
      detailsType,
      releaseYear,
      targetYear,
      normalizedTitles,
      animeHasSeasonLabel,
      animeEpisodes,
      preferredType,
    });

    if (!bestCandidate || score > bestCandidate.score) {
      bestCandidate = {
        mapping: {
          tmdbId: candidate.tmdbId,
          type: detailsType,
          title: details?.name || details?.title || candidate.title,
          firstAirDate: details?.first_air_date || details?.release_date || null,
        },
        score,
      };
    }
  }

  return bestCandidate?.mapping || null;
};

export const findBestTmdbMapping = (anilistAnime, initialMapping = null) =>
  findBestTmdbMappingInternal(anilistAnime, initialMapping);

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
