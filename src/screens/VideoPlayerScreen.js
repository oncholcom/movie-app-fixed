import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  Text,
  ScrollView,
  Modal,
  BackHandler,
  Platform,
  Alert,
} from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as SystemUI from 'expo-system-ui';
import { Ionicons } from '@expo/vector-icons';
import SmartWebView from '../components/common/SmartWebView';
import Colors from '../constants/Colors';
import { Spacing, BorderRadius } from '../styles/GlobalStyles';
import { VIDEO_SOURCES, ANIME_SOURCES, getAvailableSources, getDefaultSource, getAnimeSourcesWithTMDB, ENHANCED_ANIME_SOURCES } from '../services/videoSources';
import tmdbAnimeMapper from '../services/tmdbAnimeMapping';
import anilistApi from '../services/anilistApi';
import { addToWatchlist as addToLocalWatchlist, updateTVShowEpisode } from '../utils/watchlist';
import { getMovies, getTVShows, convertTMDBtoIMDB } from '../services/api';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { ContinueWatchingService, WatchlistService } from '../services/mobile';
import { useAuth } from '../context/AuthContext';
import PremiumRequiredModal from '../components/common/PremiumRequiredModal';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const VideoPlayerScreen = ({ route, navigation }) => {
  const { 
    movieId, 
    tvId, 
    animeId,
    season = 1, 
    episode = 1, 
    contentType = 'movie',
    title = '',
    isAnime = false,
    tmdbMapping: routeTmdbMapping = null
  } = route.params;

  const [selectedSource, setSelectedSource] = useState(
    getDefaultSource(contentType, isAnime) || (isAnime ? 'vidsrc_anime_sub' : 'videasy')
  );
  const [currentUrl, setCurrentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSources, setShowSources] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showLanguageOverlay, setShowLanguageOverlay] = useState(true);
  
  // TMDB mapping state
  const [tmdbMapping, setTmdbMapping] = useState(null);
  const [availableSources, setAvailableSources] = useState({});
  const [m3u8Sources, setM3u8Sources] = useState([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState(null);
  const { isAuthenticated, subscription } = useAuth();
  const hasActiveSubscription = isAuthenticated && subscription?.status === 'active';
  const [premiumModalVisible, setPremiumModalVisible] = useState(!hasActiveSubscription);
  const progressSavedRef = useRef(false);
  const metadataRef = useRef(null);
  const [animeDetails, setAnimeDetails] = useState(null);
  const webViewRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const sourcesScrollViewRef = useRef(null);
  const id = contentType === 'movie' ? movieId : (isAnime ? animeId : tvId);
  const sources = isAnime ? ANIME_SOURCES : VIDEO_SOURCES;

  useEffect(() => {
    if (!hasActiveSubscription) return;

    const setupScreen = async () => {
      // Lock to landscape
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      // Always hide status bar
      StatusBar.setHidden(true, 'none');
      // Set transparent system UI background to prevent dark overlay
      SystemUI.setBackgroundColorAsync('transparent');
      // Use edge-to-edge mode instead of immersive to preserve navigation access
      if (SystemUI.setLayoutModeAsync) {
        SystemUI.setLayoutModeAsync('edge-to-edge');
      }
    };

    setupScreen();
    
    console.log('VideoPlayerScreen setup:', {
      id,
      contentType,
      isAnime,
      selectedSource,
      routeParams: route.params
    });
    
    if (id) {
      loadSource(selectedSource);
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      StatusBar.setHidden(false, 'slide');
      SystemUI.setBackgroundColorAsync('#000000');
      backHandler.remove();
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [hasActiveSubscription, selectedSource, id]);

  if (!hasActiveSubscription) {
    return (
      <View style={styles.premiumContainer}>
        <PremiumRequiredModal
          visible={premiumModalVisible}
          onClose={() => {
            setPremiumModalVisible(false);
            if (navigation?.canGoBack?.()) {
              navigation.goBack();
            }
          }}
          onLogin={() => {
            setPremiumModalVisible(false);
            navigation.navigate('Login');
          }}
        />
      </View>
    );
  }

  useEffect(() => {
    setPremiumModalVisible(!hasActiveSubscription);
  }, [hasActiveSubscription]);

  useEffect(() => {
    if (id && selectedSource) {
      loadSource(selectedSource);
    }
  }, [selectedSource]);

  // Fetch TMDB mapping for anime
  useEffect(() => {
    if (isAnime && id) {
      if (routeTmdbMapping) {
        // Use TMDB mapping from route params
        setTmdbMapping(routeTmdbMapping);
        console.log('Using TMDB mapping from route:', routeTmdbMapping);
        
        // Get AniList anime details for source generation
        fetchAnimeDetailsForSources();
      } else {
        // Fetch TMDB mapping if not provided
        fetchTMDBMapping();
      }
    }
  }, [isAnime, id, routeTmdbMapping]);

  const fetchAnimeDetailsForSources = async () => {
    try {
      const anilistResponse = await anilistApi.getDetails(id);
      const anilistAnime = anilistResponse.Media;
      setAnimeDetails(anilistAnime);
      
      // Update available sources with TMDB mapping (now async)
      const sources = await getAnimeSourcesWithTMDB(anilistAnime, routeTmdbMapping);
      const sourcesObject = Object.fromEntries(sources);
      setAvailableSources(sourcesObject);
      
      console.log('Updated sources with TMDB mapping:', Object.keys(sourcesObject));
      console.log('TMDB sources available:', Object.keys(sourcesObject).filter(key => key.startsWith('tmdb_')));
      console.log('VIP sources available:', Object.keys(sourcesObject).filter(key => key.includes('vip')));
      console.log('Premium sources available:', Object.keys(sourcesObject).filter(key => key.includes('premium')));
      console.log('All available sources:', Object.keys(sourcesObject));
      console.log('Source details:', Object.entries(sourcesObject).map(([key, source]) => ({
        key,
        name: source.name,
        isVipSource: source.isVipSource,
        isPremiumSource: source.isPremiumSource,
        priority: source.priority
      })));
      
    } catch (error) {
      console.error('Error fetching anime details for sources:', error);
      setAvailableSources(ANIME_SOURCES);
    }
  };

  const fetchTMDBMapping = async () => {
    try {
      // Get AniList anime details first
      const anilistResponse = await anilistApi.getDetails(id);
      const anilistAnime = anilistResponse.Media;
      setAnimeDetails(anilistAnime);
      
      // Find TMDB mapping
      const mapping = await tmdbAnimeMapper.findTMDBId(anilistAnime);
      setTmdbMapping(mapping);
      
      // Update available sources (now async)
      const sources = await getAnimeSourcesWithTMDB(anilistAnime, mapping);
      const sourcesObject = Object.fromEntries(sources);
      setAvailableSources(sourcesObject);
      
      console.log('TMDB Mapping found:', mapping);
      console.log('Updated sources with TMDB mapping:', Object.keys(sourcesObject));
      console.log('TMDB sources available:', Object.keys(sourcesObject).filter(key => key.startsWith('tmdb_')));
      console.log('VIP sources available:', Object.keys(sourcesObject).filter(key => key.includes('vip')));
      console.log('Premium sources available:', Object.keys(sourcesObject).filter(key => key.includes('premium')));
      console.log('All available sources:', Object.keys(sourcesObject));
      
    } catch (error) {
      console.error('Error fetching TMDB mapping:', error);
      // Fallback to regular anime sources
      setAvailableSources(ANIME_SOURCES);
    }
  };

  const resetControlsTimer = () => {
    // Disabled - no auto-showing controls
  };

  const handleBackPress = () => {
    handleClose();
    return true;
  };

  const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

  const buildTmdbImageUrl = (path) => (path ? `${TMDB_IMAGE_BASE_URL}${path}` : null);

  const getPlaybackMetadata = async () => {
    if (metadataRef.current) {
      return metadataRef.current;
    }

    try {
      if (contentType === 'movie' && movieId) {
        const movieResponse = await getMovies.details(movieId);
        const movieData = movieResponse?.data || {};
        const metadata = {
          contentId: movieId,
          contentType: 'movie',
          title: movieData.title || movieData.name || title || '',
          posterPath: movieData.poster_path || null,
          posterUrl: buildTmdbImageUrl(movieData.poster_path),
          backdropPath: movieData.backdrop_path || null,
          overview: movieData.overview || null,
          season: null,
          episode: null,
          episodeTitle: null,
        };

        metadataRef.current = metadata;
        return metadata;
      }

      if (contentType === 'tv' && tvId) {
        const tvResponse = await getTVShows.details(tvId);
        const tvData = tvResponse?.data || {};
        const numericSeason = season != null ? Number(season) : null;
        const numericEpisode = episode != null ? Number(episode) : null;

        const metadata = {
          contentId: tvId,
          contentType: 'tv',
          title: tvData.name || tvData.original_name || title || '',
          posterPath: tvData.poster_path || null,
          posterUrl: buildTmdbImageUrl(tvData.poster_path),
          backdropPath: tvData.backdrop_path || null,
          overview: tvData.overview || null,
          season: numericSeason,
          episode: numericEpisode,
          episodeTitle: null,
        };

        const fallbackEpisodeTitle =
          typeof title === 'string' && title.includes(' - ')
            ? title.split(' - ').slice(1).join(' - ').trim()
            : null;

        if (!metadata.episodeTitle && fallbackEpisodeTitle) {
          metadata.episodeTitle = fallbackEpisodeTitle;
        }

        metadataRef.current = metadata;
        return metadata;
      }

      if (contentType === 'anime' && animeId) {
        let anime = animeDetails;
        if (!anime) {
          const animeResponse = await anilistApi.getDetails(animeId);
          anime = animeResponse?.Media;
          if (anime) {
            setAnimeDetails(anime);
          }
        }

        const titleFromDetails =
          anime?.title?.english ||
          anime?.title?.romaji ||
          anime?.title?.native ||
          title ||
          '';

        const posterUrl =
          anime?.coverImage?.extraLarge ||
          anime?.coverImage?.large ||
          anime?.coverImage?.medium ||
          null;

        const metadata = {
          contentId: animeId,
          contentType: 'anime',
          title: titleFromDetails,
          posterPath: posterUrl,
          posterUrl,
          backdropPath: anime?.bannerImage || null,
          overview: anime?.description || null,
          season: season != null ? Number(season) : null,
          episode: episode != null ? Number(episode) : null,
          episodeTitle: null,
        };

        const fallbackEpisodeTitle =
          typeof title === 'string' && title.includes(' - ')
            ? title.split(' - ').slice(1).join(' - ').trim()
            : null;
        if (fallbackEpisodeTitle) {
          metadata.episodeTitle = fallbackEpisodeTitle;
        }

        metadataRef.current = metadata;
        return metadata;
      }
    } catch (metadataError) {
      console.error('Failed to load metadata for playback tracking', metadataError);
    }

    const fallbackMetadata = {
      contentId: id,
      contentType,
      title: title || '',
      posterPath: null,
      posterUrl: null,
      backdropPath: null,
      overview: null,
      season: season != null ? Number(season) : null,
      episode: episode != null ? Number(episode) : null,
      episodeTitle:
        typeof title === 'string' && title.includes(' - ')
          ? title.split(' - ').slice(1).join(' - ').trim()
          : null,
    };

    metadataRef.current = fallbackMetadata;
    return fallbackMetadata;
  };

  const saveLocalFallback = async (metadata) => {
    if (!metadata) return;

    if (contentType === 'movie') {
      await addToLocalWatchlist({
        id: metadata.contentId,
        type: 'movie',
        title: metadata.title || title || '',
        poster_path: metadata.posterPath,
        backdrop_path: metadata.backdropPath,
        overview: metadata.overview,
      });
    } else if (contentType === 'tv') {
      const targetSeason = metadata.season ?? (season != null ? Number(season) : 1);
      const targetEpisode = metadata.episode ?? (episode != null ? Number(episode) : 1);
      await updateTVShowEpisode(tvId, targetSeason, targetEpisode, {
        title: metadata.title || title || '',
        poster_path: metadata.posterPath,
        backdrop_path: metadata.backdropPath,
        overview: metadata.overview,
      });
    } else if (contentType === 'anime') {
      await addToLocalWatchlist({
        id: metadata.contentId,
        type: 'anime',
        title: metadata.title || title || '',
        poster_path: metadata.posterUrl || metadata.posterPath,
        backdrop_path: metadata.backdropPath,
        overview: metadata.overview,
        season: metadata.season,
        episode: metadata.episode,
      });
    }

    console.log('Content tracked locally for continue watching');
  };

  const trackPlaybackProgress = async () => {
    if (progressSavedRef.current) {
      return;
    }

    const metadata = await getPlaybackMetadata();
    if (!metadata) {
      return;
    }

    if (hasActiveSubscription) {
      try {
        try {
          await WatchlistService.add({
            id: String(metadata.contentId),
            type: metadata.contentType,
            title: metadata.title || title || '',
            imageUrl: metadata.posterUrl,
          })
        } catch (watchlistError) {
          console.warn('Failed to ensure watchlist entry during playback', watchlistError)
        }

        const payload = {
          id: String(metadata.contentId),
          type: metadata.contentType,
          title: metadata.title || title || '',
          imageUrl: metadata.posterUrl,
          positionSeconds: metadata.positionSeconds ?? 0,
          durationSeconds: metadata.durationSeconds ?? null,
        };

        if (metadata.season != null) {
          payload.season = metadata.season;
        }
        if (metadata.episode != null) {
          payload.episode = metadata.episode;
        }
        if (metadata.episodeTitle) {
          payload.episodeTitle = metadata.episodeTitle;
        }

        await ContinueWatchingService.save(payload);
        progressSavedRef.current = true;
        console.log('Saved playback progress to mobile API', payload);
        return;
      } catch (apiError) {
        console.error('Failed to save remote progress, attempting local fallback', apiError);
      }
    }

    try {
      await saveLocalFallback(metadata);
      progressSavedRef.current = true;
    } catch (fallbackError) {
      console.error('Failed to store playback progress locally', fallbackError);
    }
  };

  const loadSource = async (sourceId) => {
    try {
      // Reset states when source changes
      setCurrentUrl('');
      setError(null);
      setLoading(true);
      setM3u8Sources([]);
      setShowLanguageOverlay(false);
      setSelectedAudioTrack(null);
      
      const source = availableSources[sourceId] || sources[sourceId];
      console.log(`Loading source ${sourceId}:`, {
        source: source,
        requiresMAL: source?.requiresMAL,
        malData: source?.malData,
        malId: source?.malId,
        requiresTMDB: source?.requiresTMDB
      });
      
      if (!source) return;

      if (source.movieOnly && contentType !== 'movie') {
        setError('This source only supports movies');
        return;
      }

      if (source.tvOnly && contentType !== 'tv') {
        setError('This source only supports TV series');
        return;
      }

      if (!source.isWorking) {
        setError('This source is currently down');
        return;
      }

      if (source.type === 'embed') {
        let url;
        
        // Filmku requires IMDB ID, so convert TMDB to IMDB
        if (sourceId === 'filmku') {
          const tmdbId = contentType === 'movie' ? movieId : tvId;
          const conversion = await convertTMDBtoIMDB(tmdbId, contentType);
          if (!conversion || !conversion.imdb_id) {
            setError('Could not convert TMDB ID to IMDB ID for Filmku source.');
            setLoading(false);
            return;
          }
          url = source.getUrl(conversion.imdb_id, season, episode, contentType);
          console.log(`Filmku source: TMDB ID ${tmdbId} -> IMDB ID ${conversion.imdb_id}, URL: ${url}`);
        } else if (source.requiresTMDB && source.tmdbId) {
          // Use TMDB ID for URL generation (for anime VIP/Premium sources)
          url = source.getUrl(
            source.tmdbId, 
            season, 
            episode, 
            source.tmdbType || contentType
          );
          console.log(`Using TMDB source ${sourceId} with TMDB ID ${source.tmdbId}, URL: ${url}`);
        } else if (source.requiresTMDB && tmdbMapping) {
          // Use TMDB ID for URL generation
          url = source.getUrl(
            tmdbMapping.tmdbId, 
            season, 
            episode, 
            tmdbMapping.type
          );
          console.log(`Using TMDB source ${sourceId} with TMDB ID ${tmdbMapping.tmdbId}`);
        } else {
          // Use original AniList ID
          url = source.getUrl(id, season, episode, contentType);
          console.log(`Using regular source ${sourceId} with AniList ID ${id}, URL: ${url}`);
        }
        
        if (!url) {
          setError('This source doesn\'t support this content type');
          return;
        }
        setCurrentUrl(url);
      } else if (source.type === 'api' || source.isApiBased) {
        let apiUrl;
        
        if (source.requiresTMDB && source.tmdbId) {
          // Use TMDB ID for anime VIP/Premium sources
          apiUrl = source.getApiUrl(
            source.tmdbId, 
            season, 
            episode, 
            source.tmdbType || contentType
          );
          console.log(`Using TMDB API source ${sourceId} with TMDB ID ${source.tmdbId}, API URL: ${apiUrl}`);
        } else if (source.requiresTMDB && tmdbMapping) {
          // Use TMDB ID for regular sources
          apiUrl = source.getApiUrl(
            tmdbMapping.tmdbId, 
            season, 
            episode, 
            tmdbMapping.type
          );
          console.log(`Using TMDB API source ${sourceId} with TMDB ID ${tmdbMapping.tmdbId}, API URL: ${apiUrl}`);
        } else {
          // Use original ID
          apiUrl = source.getApiUrl(id, season, episode, contentType);
          console.log(`Using regular API source ${sourceId} with ID ${id}, API URL: ${apiUrl}`);
        }
        
        if (!apiUrl) {
          setError('This source doesn\'t support this content type');
          return;
        }
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (sourceId === 'vip_fmftp' || sourceId === 'tmdb_vip_fmftp') {
          console.log('[VIP FMFTP] Full API response:', data);
          
          // Check if content is available
          if (data.status === 'down' || data.status === 'inactive') {
            throw new Error(data.error || 'Content not found or origin server is down');
          }
          
          if (!data.embed_url) {
            throw new Error('No embed URL found in VIP FMFTP response');
          }
          
          // Use the embed URL for WebView
          const embedUrl = data.embed_url;
          console.log('[VIP FMFTP] Using embed URL:', embedUrl);
          
          setCurrentUrl(embedUrl);
          setLoading(false);
          return;
        } else if (sourceId === 'vip_roarzone' || sourceId === 'tmdb_vip_roarzone') {
          console.log('[VIP RoarZone] Full API response:', data);
          
          // Check if content is available
          if (data.status === 'error') {
            throw new Error(data.message || 'No playable sources found');
          }
          
          if (data.status !== 'active') {
            throw new Error('Content not available or server is down');
          }
          
          if (!data.embed_url) {
            throw new Error('No embed URL found in VIP RoarZone response');
          }
          
          // Use the embed URL for WebView
          const embedUrl = data.embed_url;
          console.log('[VIP RoarZone] Using embed URL:', embedUrl);
          
          setCurrentUrl(embedUrl);
          setLoading(false);
          return;
        } else if (sourceId === 'vip_crazyctg' || sourceId === 'tmdb_vip_crazyctg') {
          console.log('[VIP CrazyCTG] Full API response:', data);
          
          // Check if content is available
          if (data.status === 'error') {
            throw new Error(data.message || 'Media not found or the origin server is down');
          }
          
          if (data.status !== 'active') {
            throw new Error('Content not available or server is down');
          }
          
          if (!data.embed_url) {
            throw new Error('No embed URL found in VIP CrazyCTG response');
          }
          
          // Use the embed URL for WebView
          const embedUrl = data.embed_url;
          console.log('[VIP CrazyCTG] Using embed URL:', embedUrl);
          
          setCurrentUrl(embedUrl);
          setLoading(false);
          return;
        } else if (sourceId === 'vip_binudon' || sourceId === 'tmdb_vip_binudon') {
          console.log('[VIP Binudon] Full API response:', data);
          
          // Check if content is available
          if (data.status === 'error') {
            throw new Error(data.message || 'No playable sources found for this content');
          }
          
          if (data.status !== 'active') {
            throw new Error('Content not available or server is down');
          }
          
          if (!data.embed_url) {
            throw new Error('No embed URL found in VIP Binudon response');
          }
          
          // Use the embed URL for WebView
          const embedUrl = data.embed_url;
          console.log('[VIP Binudon] Using embed URL:', embedUrl);
          
          setCurrentUrl(embedUrl);
          setLoading(false);
          return;
        } else if (sourceId === 'vip_spdx' || sourceId === 'tmdb_vip_spdx') {
          console.log('[VIP SPDX] Full API response:', data);
          
          // Check if content is available
          if (data.status === 'error') {
            throw new Error(data.message || 'Media not found or source is unavailable');
          }
          
          if (data.status !== 'active') {
            throw new Error('Content not available or server is down');
          }
          
          if (!data.embed_url) {
            throw new Error('No embed URL found in VIP SPDX response');
          }
          
          // Use the embed URL for WebView
          const embedUrl = data.embed_url;
          console.log('[VIP SPDX] Using embed URL:', embedUrl);
          
          setCurrentUrl(embedUrl);
          setLoading(false);
          return;
        } else if (sourceId === 'vip_hydrahd_scrape' || sourceId === 'tmdb_vip_hydrahd_scrape') {
          console.log('[VIP HydraHD Scrape] Full API response:', data);
          
          // Check if content is available
          if (!data.embedUrl) {
            throw new Error('No embed URL found in VIP HydraHD Scrape response');
          }
          
          // Use the embed URL for WebView
          const embedUrl = data.embedUrl;
          console.log('[VIP HydraHD Scrape] Using embed URL:', embedUrl);
          
          setCurrentUrl(embedUrl);
          setLoading(false);
          return;
        } else if (sourceId === 'vip_ridomovies' || sourceId === 'tmdb_vip_ridomovies') {
          console.log('[VIP RidoMovies] Full API response:', data);
          
          // Check if request was successful
          if (!data.success) {
            if (data.error === 'Invalid movie ID format') {
              throw new Error('Movie ID format is invalid for RidoMovies');
            } else if (data.error === 'Movie not found') {
              throw new Error('Movie not found in RidoMovies database');
            } else {
              throw new Error(data.error || 'RidoMovies API error');
            }
          }
          
          // Check if we have embed codes
          if (!data.embedCode || !Array.isArray(data.embedCode) || data.embedCode.length === 0) {
            throw new Error('No embed codes found in VIP RidoMovies response');
          }
          
          // Use the first available embed URL
          const firstEmbed = data.embedCode[0];
          if (!firstEmbed.embedUrl) {
            throw new Error('No embed URL found in VIP RidoMovies embed code');
          }
          
          const embedUrl = firstEmbed.embedUrl;
          console.log('[VIP RidoMovies] Using embed URL:', embedUrl);
          console.log('[VIP RidoMovies] Quality:', firstEmbed.quality);
          console.log('[VIP RidoMovies] Language:', firstEmbed.lang);
          
          setCurrentUrl(embedUrl);
          setLoading(false);
          return;
        } else if (sourceId === 'ftpbd_hindi') {
          console.log('[FTPBD Hindi] Full API response:', data);
          
          // Check if we have streaming data
          if (!data.streaming || !data.streaming.direct || !data.streaming.direct.url) {
            throw new Error('No direct streaming URL found in FTPBD response');
          }
          
          // Use the direct URL for best quality
          const directUrl = data.streaming.direct.url;
          console.log('[FTPBD Hindi] Using direct URL:', directUrl);
          
          // Create a single source object for VLC player
          const ftpbdSource = {
            id: 'ftpbd_direct',
            title: 'Hindi Dubbed (Direct)',
            file: directUrl,
            quality: data.streaming.direct.container || 'mp4'
          };
          
          setM3u8Sources([ftpbdSource]);
          setSelectedAudioTrack(ftpbdSource);
          setShowLanguageOverlay(false);
          await trackPlaybackProgress();

          setLoading(false);
          return;
        }
        if (data.embedUrl || data.url) {
          setCurrentUrl(data.embedUrl || data.url);
        } else if (sourceId === 'ridomovies') {
          // Try to use the first embedUrl from embedCode array
          if (Array.isArray(data.embedCode) && data.embedCode.length > 0 && data.embedCode[0].embedUrl) {
            setCurrentUrl(data.embedCode[0].embedUrl);
          } else {
            // Move to next source if ridomovies fails
            const available = getAvailableSources();
            const currentIdx = available.findIndex(([key]) => key === sourceId);
            if (currentIdx !== -1 && available.length > currentIdx + 1) {
              const nextSourceId = available[currentIdx + 1][0];
              console.log('No embed URL from ridomovies, moving to next source:', nextSourceId);
              loadSource(nextSourceId);
              return;
            }
            // If no next source, do nothing (no error)
          }
        } else {
          throw new Error('No embed URL found in API response');
        }
      }
    } catch (err) {
      console.error('Error loading video source:', err);
      
      // Auto-skip VIP sources if they fail
      if (sourceId === 'vip_fmftp' || sourceId === 'vip_moviebox' || sourceId === 'vip_roarzone' || sourceId === 'vip_crazyctg' || sourceId === 'vip_binudon' || sourceId === 'vip_spdx' || sourceId === 'vip_hydrahd_scrape' || sourceId === 'vip_ridomovies' ||
          sourceId === 'tmdb_vip_fmftp' || sourceId === 'tmdb_vip_moviebox' || sourceId === 'tmdb_vip_roarzone' || sourceId === 'tmdb_vip_crazyctg' || sourceId === 'tmdb_vip_binudon' || sourceId === 'tmdb_vip_spdx' || sourceId === 'tmdb_vip_hydrahd_scrape' || sourceId === 'tmdb_vip_ridomovies') {
        console.log(`[${sourceId}] Source failed, auto-skipping to next source`);
        const availableSources = getAvailableSources(contentType, isAnime);
        const currentIndex = availableSources.findIndex(([id]) => id === sourceId);
        
        if (currentIndex !== -1 && currentIndex < availableSources.length - 1) {
          const nextSource = availableSources[currentIndex + 1];
          console.log(`[${sourceId}] Auto-skipping to next source: ${nextSource[0]}`);
          setSelectedSource(nextSource[0]);
          loadSource(nextSource[0]);
          return;
        }
      }
      
      setError('Failed to load video. Try another source.');
    } finally {
      setLoading(false);
    }
  };

  // Update getAvailableSources to use enhanced sources
  const getAvailableSources = () => {
    const sourcesToUse = Object.keys(availableSources).length > 0 
      ? availableSources 
      : (isAnime ? ANIME_SOURCES : VIDEO_SOURCES);

    const filteredSources = Object.entries(sourcesToUse).filter(([key, source]) => {
      if (contentType === 'movie' && source.tvOnly) return false;
      if (contentType === 'tv' && source.movieOnly) return false;
      return true;
    });

    return filteredSources;
  };

  // Scroll to selected source in the sources list
  const scrollToSelectedSource = () => {
    if (sourcesScrollViewRef.current) {
      const availableSources = getAvailableSources(contentType, isAnime);
      const selectedIndex = availableSources.findIndex(([sourceId]) => sourceId === selectedSource);
      
      if (selectedIndex !== -1) {
        // Calculate scroll position (each item is approximately 80px height + 8px margin)
        const itemHeight = 88; // 80px height + 8px margin
        const scrollPosition = selectedIndex * itemHeight;
        
        // Scroll to the selected source with some offset to center it
        const scrollOffset = Math.max(0, scrollPosition - 100); // 100px offset from top
        
        sourcesScrollViewRef.current.scrollTo({
          y: scrollOffset,
          animated: true
        });
      }
    }
  };

  // Handle source selection
  const handleSourceSelect = (sourceId) => {
    setSelectedSource(sourceId);
    setShowSources(false);
    setError(null);
    
    // Reset language overlay state based on source type
    if (sourceId === 'ftpbd_hindi') {
      // For API-based sources, we'll set showLanguageOverlay based on response
      // This will be handled in loadSource after we get the API response
      setLoading(true); // Set loading for API call
    } else {
      setShowLanguageOverlay(false);
      setLoading(true); // Set loading for regular sources
    }
    
    loadSource(sourceId);
  };

  const handleClose = async () => {
    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      // Restore status bar and system UI
      StatusBar.setHidden(false, 'slide');
      SystemUI.setBackgroundColorAsync('#000000');
    } catch (error) {
      console.warn('Error restoring orientation:', error);
    }
    navigation.goBack();
  };

  // Get safe area insets
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View 
        style={styles.container}
      >
      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading {(availableSources[selectedSource] || sources[selectedSource])?.name}...</Text>
        </View>
      )}
      
      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.errorButtons}>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => loadSource(selectedSource)}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.changeSourceButton}
              onPress={() => setShowSources(true)}
            >
              <Text style={styles.changeSourceButtonText}>Change Source</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Video Player */}
      {selectedSource === 'ftpbd_hindi' && m3u8Sources.length > 0 && !loading && !error ? (
        <View style={styles.webview}>
          {/* Language Selection Overlay - Only show if multiple audio tracks */}
          {m3u8Sources.length > 1 && showLanguageOverlay && (
            <View style={styles.languageOverlay}>
              <View style={styles.languageContainer}>
                <Text style={styles.languageTitle}>Select Audio Language</Text>
                {m3u8Sources.map((source, index) => (
                  <TouchableOpacity
                    key={source.id || index}
                    style={styles.languageOption}
                    onPress={() => {
                      console.log('[Language Selection] Selected:', {
                        title: source.title,
                        index: index,
                        url: source.file,
                        id: source.id
                      });
                      
                      // Set the selected audio track and hide overlay
                      setSelectedAudioTrack(source);
                      setShowLanguageOverlay(false);
                    }}
                  >
                    <Text style={styles.languageText}>{source.title}</Text>
                    <Ionicons name="play-circle" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          
          {/* VLC Player for ftpbd_hindi */}
          {!showLanguageOverlay && (
            <View style={styles.webview}>
              {/* Language Change Button for Multiple Audio Tracks */}
              {m3u8Sources.length > 1 && (
                <TouchableOpacity
                  style={styles.languageChangeButton}
                  onPress={() => setShowLanguageOverlay(true)}
                >
                  <Ionicons name="language" size={20} color="#fff" />
                  <Text style={styles.languageChangeText}>
                    Change Language ({selectedAudioTrack?.title || m3u8Sources[0].title})
                  </Text>
                </TouchableOpacity>
              )}
              
              {/* VLCPlayer removed - will implement clean player later */}
              <View style={styles.webview}>
                <Text style={{ color: 'white', textAlign: 'center', marginTop: 50 }}>
                  M3U8 Player Coming Soon
                </Text>
              </View>
            </View>
          )}
        </View>
      ) : currentUrl && !loading && !error && (
        console.log(`Rendering WebView with URL: ${currentUrl}, source: ${selectedSource}`),
        <SmartWebView
          uri={currentUrl}
          sourceId={selectedSource}
          style={styles.webview}
          onError={(errorMessage, suggestedSources) => {
            setError(errorMessage || 'Failed to load video player. Try another source.');
            console.warn('SmartWebView error: ', errorMessage);
          }}
          onLoadEnd={() => {
            console.log('SmartWebView load ended successfully');
            setLoading(false);
            // Track playback progress once the player is ready
            trackPlaybackProgress();
          }}
        />
      )}

      {/* Always Visible Back & Sources Buttons */}
      {/* Place back button in top-left, sources button in top-right, leave center-top empty */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[
            styles.backButton, 
            styles.topLeftButton,
            {
              left: Math.max(10, insets.left), // Move closer to edge, respect safe area
            }
          ]}
          onPress={handleClose}
          pointerEvents="auto"
        >
          <Ionicons name="arrow-back" size={28} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.sourcesButton, 
            styles.topRightButton,
            {
              right: Math.max(10, insets.right), // Move closer to edge, respect safe area
            }
          ]}
          onPress={() => {
            setShowSources(true);
            // Scroll to selected source after modal opens
            setTimeout(() => {
              scrollToSelectedSource();
            }, 300); // Wait for modal animation to complete
          }}
          pointerEvents="auto"
        >
          <Ionicons name="layers-outline" size={20} color={Colors.white} />
          <Text style={[
            styles.sourcesButtonText,
            (availableSources[selectedSource] || getAvailableSources(contentType, isAnime).find(([id]) => id === selectedSource)?.[1])?.isVipSource && styles.vipSourceButtonText,
            (availableSources[selectedSource] || getAvailableSources(contentType, isAnime).find(([id]) => id === selectedSource)?.[1])?.isPremiumSource && styles.premiumSourceButtonText
          ]}>
            {(availableSources[selectedSource] || getAvailableSources(contentType, isAnime).find(([id]) => id === selectedSource)?.[1])?.name || 'Sources'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Removed auto-hide overlays - no title or source info overlays */}

      {/* Source Selection Modal */}
      <Modal
        visible={showSources}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSources(false)}
        supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
      >
        <View style={styles.sourcesModal}>
          <View style={styles.sourcesHeader}>
            <Text style={styles.sourcesTitle}>Select Video Source</Text>
            <TouchableOpacity onPress={() => setShowSources(false)}>
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            ref={sourcesScrollViewRef}
            style={styles.sourcesList}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.sourcesListContent}
          >
            {getAvailableSources(contentType, isAnime).map(([sourceId, source]) => (
              <TouchableOpacity
                key={sourceId}
                style={[
                  styles.sourceItem,
                  selectedSource === sourceId && styles.selectedSourceItem,
                  !source.isWorking && styles.disabledSourceItem,
                  source.isVipSource && styles.vipSourceItem,
                  source.isPremiumSource && styles.premiumSourceItem,
                  isAnime && !source.isVipSource && !source.isPremiumSource && styles.animeSourceItem
                ]}
                onPress={() => source.isWorking ? handleSourceSelect(sourceId) : null}
                disabled={!source.isWorking}
              >
                <Text style={styles.sourceIcon}>{source.icon}</Text>
                <View style={styles.sourceInfo}>
                  <View style={styles.sourceNameRow}>
                    <Text style={[
                      styles.sourceName,
                      !source.isWorking && styles.disabledText,
                      source.isVipSource && styles.vipSourceName,
                      source.isPremiumSource && styles.premiumSourceName,
                      isAnime && !source.isVipSource && !source.isPremiumSource && styles.animeSourceName
                    ]}>
                      {source.name}
                    </Text>
                    <View style={styles.sourceBadges}>
                      {source.isVipSource && (
                        <Text style={styles.vipBadge}>VIP</Text>
                      )}
                      {source.isPremiumSource && (
                        <Text style={styles.premiumBadge}>PREMIUM</Text>
                      )}
                      {isAnime && !source.isVipSource && !source.isPremiumSource && (
                        <Text style={styles.animeBadge}>ANIME</Text>
                      )}
                      <Text style={styles.sourceQuality}>{source.quality}</Text>
                      {selectedSource === sourceId && (
                        <Text style={styles.currentlyPlayingIndicator}>NOW PLAYING</Text>
                      )}
                      {!source.isWorking && (
                        <Text style={styles.downIndicator}>DOWN</Text>
                      )}
                    </View>
                  </View>
                  <Text style={[
                    styles.sourceDescription,
                    !source.isWorking && styles.disabledText
                  ]}>
                    {source.description}
                  </Text>
                </View>
                {selectedSource === sourceId && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  controlsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'android' ? 120 : 140,
    zIndex: 1000,
    pointerEvents: 'box-none',
    paddingTop: Platform.OS === 'android' ? 20 : 30,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  // Always Visible Controls (Back & Sources)
  alwaysVisibleControls: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 20 : 40, // Account for different devices
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
  },
  backButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 8,
    minWidth: 60,
    minHeight: 60,
  },
  sourcesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 8,
    minHeight: 60,
    minWidth: 120,
  },
  sourcesButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  vipSourceButtonText: {
    color: '#ffd700',
    fontWeight: 'bold',
  },
  premiumSourceButtonText: {
    color: '#e1bee7',
    fontWeight: '600',
  },
  
  // Auto-hide Controls (Title & Bottom Info)
  autoHideControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    pointerEvents: 'none',
  },
  titleSection: {
    alignItems: 'center',
    paddingTop: 100, // Below the always-visible buttons
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingBottom: 20,
  },
  videoTitle: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  episodeInfo: {
    color: Colors.grayText,
    fontSize: 14,
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomInfo: {
    alignItems: 'center',
    paddingBottom: 40, // Extra padding for phone navigation area
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingTop: 10,
  },
  sourceText: {
    color: Colors.grayText,
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.black,
    gap: 16,
  },
  loadingText: {
    color: Colors.grayText,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.black,
    paddingHorizontal: 40,
    gap: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  changeSourceButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  changeSourceButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Source Modal Styles
  sourcesModal: {
    flex: 1,
    backgroundColor: Colors.darkGray,
  },
  sourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  sourcesTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  sourcesList: {
    flex: 1,
  },
  sourcesListContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: Colors.mediumGray,
    borderRadius: 8,
    gap: 12,
    minHeight: 60,
  },
  selectedSourceItem: {
    backgroundColor: Colors.primary + '30',
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  disabledSourceItem: {
    opacity: 0.5,
    backgroundColor: Colors.lightGray,
  },
  sourceIcon: {
    fontSize: 20,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sourceName: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  sourceBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceDescription: {
    color: Colors.grayText,
    fontSize: 12,
    lineHeight: 16,
  },
  sourceQuality: {
    color: Colors.accent,
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: Colors.accent + '20',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  downIndicator: {
    color: Colors.error,
    fontSize: 9,
    fontWeight: 'bold',
    backgroundColor: Colors.error + '20',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 4,
  },
  currentlyPlayingIndicator: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: 'bold',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  disabledText: {
    color: Colors.darkText,
  },
  // VIP Source Styling
  vipSourceItem: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#ffd700',
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  vipSourceName: {
    color: '#ffd700',
    fontWeight: 'bold',
  },
  vipBadge: {
    color: '#000',
    fontSize: 9,
    fontWeight: 'bold',
    backgroundColor: '#ffd700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  // Premium Source Styling
  premiumSourceItem: {
    backgroundColor: '#2d1b69',
    borderWidth: 1,
    borderColor: '#9c27b0',
    shadowColor: '#9c27b0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  premiumSourceName: {
    color: '#e1bee7',
    fontWeight: '600',
  },
  premiumBadge: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    backgroundColor: '#9c27b0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  // Anime-specific styling
  animeSourceItem: {
    backgroundColor: '#1a0d2e',
    borderWidth: 1,
    borderColor: '#ff6b9d',
    shadowColor: '#ff6b9d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  animeSourceName: {
    color: '#ff6b9d',
    fontWeight: '600',
  },
  animeBadge: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    backgroundColor: '#ff6b9d',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  topLeftButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 50 : 60,
    zIndex: 1000,
  },
  topRightButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 50 : 60,
    zIndex: 1000,
  },
  languageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  languageContainer: {
    backgroundColor: Colors.darkGray,
    borderRadius: 10,
    padding: 15,
    width: '80%',
    alignItems: 'center',
  },
  languageTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: Colors.mediumGray,
  },
  languageText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  languageChangeButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  premiumContainer: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  languageChangeText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default VideoPlayerScreen;
