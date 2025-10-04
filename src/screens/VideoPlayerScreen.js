import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
import {
  VIDEO_SOURCES,
  ANIME_SOURCES,
  getAvailableSources as getBaseAvailableSources,
  getDefaultSource,
  getAnimeSourcesWithTMDB,
  findBestTmdbMapping,
} from '../services/videoSources';
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
    season: routeSeason = 1,
    episode: routeEpisode,
    episodeNumber,
    contentType = 'movie',
    title = '',
    isAnime: routeIsAnime = false,
    tmdbMapping: routeTmdbMapping = null,
  } = route.params;

  const season = routeSeason ?? 1;
  const episode = episodeNumber ?? routeEpisode ?? 1;
  const isAnimeContent =
    contentType === 'anime' || routeIsAnime || (!!animeId && contentType !== 'movie' && contentType !== 'tv');

  const [selectedSource, setSelectedSource] = useState(
    getDefaultSource(contentType, isAnimeContent) || (isAnimeContent ? 'vidsrc_anime_sub' : 'videasy')
  );
  const [currentUrl, setCurrentUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSources, setShowSources] = useState(false);
  const [overlayControlsVisible, setOverlayControlsVisible] = useState(true);
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
  const sourcesScrollViewRef = useRef(null);
  const autoSelectedSourceRef = useRef(false);
  const overlayHideTimerRef = useRef(null);
  const id = contentType === 'movie' ? movieId : isAnimeContent ? animeId : tvId;
  const sources = isAnimeContent ? ANIME_SOURCES : VIDEO_SOURCES;

  const resolvedSources = useMemo(() => {
    if (isAnimeContent) {
      return Object.keys(availableSources).length > 0 ? availableSources : ANIME_SOURCES;
    }

    return VIDEO_SOURCES;
  }, [availableSources, isAnimeContent]);

  const prioritizedSources = useMemo(() => {
    if (isAnimeContent) {
      return getBaseAvailableSources(contentType, true, resolvedSources);
    }
    return getBaseAvailableSources(contentType, false);
  }, [contentType, isAnimeContent, resolvedSources]);

  const selectedSourceEntry = useMemo(
    () => prioritizedSources.find(([id]) => id === selectedSource),
    [prioritizedSources, selectedSource]
  );

  const selectedSourceDetails = selectedSourceEntry ? selectedSourceEntry[1] : resolvedSources[selectedSource];

  const lockLandscape = useCallback(async () => {
    try {
      const currentLock = await ScreenOrientation.getOrientationLockAsync();
      const landscapeLocks = [
        ScreenOrientation.OrientationLock.LANDSCAPE,
        ScreenOrientation.OrientationLock.LANDSCAPE_LEFT,
        ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT,
      ];

      if (!landscapeLocks.includes(currentLock)) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      }
    } catch (orientationError) {
      console.warn('Failed to maintain landscape lock', orientationError);
    }
  }, []);

  const showOverlayControls = useCallback(() => {
    setOverlayControlsVisible(true);
    if (overlayHideTimerRef.current) {
      clearTimeout(overlayHideTimerRef.current);
    }
    overlayHideTimerRef.current = setTimeout(() => {
      setOverlayControlsVisible(false);
    }, 5000);
  }, []);

  useEffect(() => {
    if (!hasActiveSubscription) return;

    const setupScreen = async () => {
      // Lock to landscape
      await lockLandscape();
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
      isAnime: isAnimeContent,
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
    };
  }, [hasActiveSubscription, selectedSource, id, lockLandscape]);

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
    autoSelectedSourceRef.current = false;
    showOverlayControls();
  }, [id, showOverlayControls]);

  useEffect(() => {
    if (id && selectedSource) {
      loadSource(selectedSource);
    }
  }, [id, selectedSource, loadSource]);

  useEffect(() => {
    if (!isAnimeContent || !id) {
      return;
    }

    if (!prioritizedSources.length) {
      return;
    }

    const preferredVipEntry = prioritizedSources.find(([, source]) => source.isVipSource);
    if (!preferredVipEntry) {
      return;
    }

    const [preferredVipId] = preferredVipEntry;

    if (selectedSourceDetails?.isVipSource) {
      autoSelectedSourceRef.current = true;
      return;
    }

    if (!autoSelectedSourceRef.current && preferredVipId && preferredVipId !== selectedSource) {
      autoSelectedSourceRef.current = true;
      setSelectedSource(preferredVipId);
    }
  }, [
    isAnimeContent,
    id,
    prioritizedSources,
    selectedSource,
    selectedSourceDetails,
  ]);

  // Fetch TMDB mapping for anime
  useEffect(() => {
    if (isAnimeContent && id) {
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
  }, [isAnimeContent, id, routeTmdbMapping]);

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
      const mapping = await findBestTmdbMapping(anilistAnime);
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

  const loadSource = useCallback(async (sourceId) => {
    try {
      await lockLandscape();

      // Reset states when source changes
      setCurrentUrl('');
      setError(null);
      setLoading(true);
      setM3u8Sources([]);
      setShowLanguageOverlay(false);
      setSelectedAudioTrack(null);
      showOverlayControls();
      
      const source = resolvedSources[sourceId] || sources[sourceId];
      console.log(`Loading source ${sourceId}:`, {
        source: source,
        requiresMAL: source?.requiresMAL,
        malData: source?.malData,
        malId: source?.malId,
        requiresTMDB: source?.requiresTMDB
      });
      
      if (!source) return;

      if (source.movieOnly && contentType !== 'movie') {
        console.log(`[${sourceId}] Movie-only source encountered for non-movie content, attempting auto-skip`);
        const currentIndex = prioritizedSources.findIndex(([id]) => id === sourceId);
        if (currentIndex !== -1 && currentIndex < prioritizedSources.length - 1) {
          const nextSource = prioritizedSources[currentIndex + 1];
          const nextSourceName = nextSource?.[1]?.name;
          const nextSourceId = nextSource?.[0];
          console.log(
            `[${sourceId}] Auto-skipping movie-only source to ${nextSourceId} (${nextSourceName})`
          );
          setSelectedSource(nextSourceId);
          return;
        } else {
          console.log(`[${sourceId}] No compatible fallback after movie-only restriction`);
          setError('No compatible sources available for this content.');
        }
        return;
      }

      if (source.tvOnly && contentType !== 'tv') {
        console.log(`[${sourceId}] TV-only source encountered for non-TV content, attempting auto-skip`);
        const currentIndex = prioritizedSources.findIndex(([id]) => id === sourceId);
        if (currentIndex !== -1 && currentIndex < prioritizedSources.length - 1) {
          const nextSource = prioritizedSources[currentIndex + 1];
          const nextSourceName = nextSource?.[1]?.name;
          const nextSourceId = nextSource?.[0];
          console.log(
            `[${sourceId}] Auto-skipping TV-only source to ${nextSourceId} (${nextSourceName})`
          );
          setSelectedSource(nextSourceId);
          return;
        } else {
          console.log(`[${sourceId}] No compatible fallback after TV-only restriction`);
          setError('No compatible sources available for this content.');
        }
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
        
        // Check HTTP response status first
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`[${sourceId}] HTTP Error ${response.status}: ${errorText}`);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Check for API-level error responses
        if (data.error || data.status === 'error' || data.status === 'failed') {
          console.log(`[${sourceId}] API Error Response:`, data);
          throw new Error(data.error || data.message || 'API returned error status');
        }
        
        if (sourceId === 'vip_fmftp' || sourceId === 'tmdb_vip_fmftp') {
          console.log('[VIP FMFTP] Full API response:', data);
          
          // Check if content is available
          if (data.status === 'down' || data.status === 'inactive' || data.status === 'error') {
            throw new Error(data.error || data.message || 'Content not found or origin server is down');
          }
          
          if (!data.embed_url && !data.embedUrl) {
            throw new Error('No embed URL found in VIP FMFTP response');
          }
          
          // Use the embed URL for WebView
          const embedUrl = data.embed_url || data.embedUrl;
          console.log('[VIP FMFTP] Using embed URL:', embedUrl);
          
          setCurrentUrl(embedUrl);
          setLoading(false);
          return;
        } else if (sourceId === 'vip_roarzone' || sourceId === 'tmdb_vip_roarzone') {
          console.log('[VIP RoarZone] Full API response:', data);
          
          // Check if content is available
          if (data.status === 'error' || data.status === 'failed' || data.status === 'inactive') {
            throw new Error(data.message || data.error || 'No playable sources found');
          }
          
          if (data.status !== 'active' && data.status !== 'success') {
            throw new Error('Content not available or server is down');
          }
          
          if (!data.embed_url && !data.embedUrl) {
            throw new Error('No embed URL found in VIP RoarZone response');
          }
          
          // Use the embed URL for WebView
          const embedUrl = data.embed_url || data.embedUrl;
          console.log('[VIP RoarZone] Using embed URL:', embedUrl);
          
          setCurrentUrl(embedUrl);
          setLoading(false);
          return;
        } else if (sourceId === 'vip_crazyctg' || sourceId === 'tmdb_vip_crazyctg') {
          console.log('[VIP CrazyCTG] Full API response:', data);
          
          // Check if content is available
          if (data.status === 'error' || data.status === 'failed' || data.status === 'inactive') {
            throw new Error(data.message || data.error || 'Media not found or the origin server is down');
          }
          
          if (data.status !== 'active' && data.status !== 'success') {
            throw new Error('Content not available or server is down');
          }
          
          if (!data.embed_url && !data.embedUrl) {
            throw new Error('No embed URL found in VIP CrazyCTG response');
          }
          
          // Use the embed URL for WebView
          const embedUrl = data.embed_url || data.embedUrl;
          console.log('[VIP CrazyCTG] Using embed URL:', embedUrl);
          
          setCurrentUrl(embedUrl);
          setLoading(false);
          return;
        } else if (sourceId === 'vip_binudon' || sourceId === 'tmdb_vip_binudon') {
          console.log('[VIP Binudon] Full API response:', data);
          
          // Check if content is available
          if (data.status === 'error' || data.status === 'failed' || data.status === 'inactive') {
            throw new Error(data.message || data.error || 'No playable sources found for this content');
          }
          
          if (data.status !== 'active' && data.status !== 'success') {
            throw new Error('Content not available or server is down');
          }
          
          if (!data.embed_url && !data.embedUrl) {
            throw new Error('No embed URL found in VIP Binudon response');
          }
          
          // Use the embed URL for WebView
          const embedUrl = data.embed_url || data.embedUrl;
          console.log('[VIP Binudon] Using embed URL:', embedUrl);
          
          setCurrentUrl(embedUrl);
          setLoading(false);
          return;
        } else if (sourceId === 'vip_spdx' || sourceId === 'tmdb_vip_spdx') {
          console.log('[VIP SPDX] Full API response:', data);
          
          // Check if content is available
          if (data.status === 'error' || data.status === 'failed' || data.status === 'inactive') {
            throw new Error(data.message || data.error || 'Media not found or source is unavailable');
          }
          
          if (data.status !== 'active' && data.status !== 'success') {
            throw new Error('Content not available or server is down');
          }
          
          if (!data.embed_url && !data.embedUrl) {
            throw new Error('No embed URL found in VIP SPDX response');
          }
          
          // Use the embed URL for WebView
          const embedUrl = data.embed_url || data.embedUrl;
          console.log('[VIP SPDX] Using embed URL:', embedUrl);
          
          setCurrentUrl(embedUrl);
          setLoading(false);
          return;
        } else if (sourceId === 'vip_hydrahd_scrape' || sourceId === 'tmdb_vip_hydrahd_scrape') {
          console.log('[VIP HydraHD Scrape] Full API response:', data);
          
          // Check if content is available
          if (data.error || data.status === 'error' || data.status === 'failed') {
            throw new Error(data.error || data.message || 'Content not found in HydraHD');
          }
          
          if (!data.embedUrl && !data.embed_url) {
            throw new Error('No embed URL found in VIP HydraHD Scrape response');
          }
          
          // Use the embed URL for WebView
          const embedUrl = data.embedUrl || data.embed_url;
          console.log('[VIP HydraHD Scrape] Using embed URL:', embedUrl);
          
          setCurrentUrl(embedUrl);
          setLoading(false);
          return;
        } else if (sourceId === 'vip_ridomovies' || sourceId === 'tmdb_vip_ridomovies') {
          console.log('[VIP RidoMovies] Full API response:', data);
          
          // Check if request was successful
          if (!data.success && data.error) {
            if (data.error === 'Invalid movie ID format') {
              throw new Error('Movie ID format is invalid for RidoMovies');
            } else if (data.error === 'Movie not found' || data.error.includes('not found')) {
              throw new Error('Movie not found in RidoMovies database');
            } else {
              throw new Error(data.error || 'RidoMovies API error');
            }
          }
          
          // Check if response indicates error status
          if (data.status === 'error' || data.status === 'failed') {
            throw new Error(data.message || data.error || 'RidoMovies API returned error status');
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
            const currentIdx = prioritizedSources.findIndex(([key]) => key === sourceId);
            if (currentIdx !== -1 && prioritizedSources.length > currentIdx + 1) {
              const nextSourceId = prioritizedSources[currentIdx + 1][0];
              console.log('No embed URL from ridomovies, moving to next source:', nextSourceId);
              setSelectedSource(nextSourceId);
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
      showOverlayControls();
      
      // Enhanced auto-skip logic for anime sources
      const vipSources = [
        'vip_fmftp', 'vip_moviebox', 'vip_roarzone', 'vip_crazyctg', 'vip_binudon',
        'vip_spdx', 'vip_hydrahd_scrape', 'vip_ridomovies',
        'tmdb_vip_fmftp', 'tmdb_vip_moviebox', 'tmdb_vip_roarzone',
        'tmdb_vip_crazyctg', 'tmdb_vip_binudon', 'tmdb_vip_spdx',
        'tmdb_vip_hydrahd_scrape', 'tmdb_vip_ridomovies'
      ];

      const currentSourceEntry = prioritizedSources.find(([id]) => id === sourceId);
      const currentSourceDetails = currentSourceEntry ? currentSourceEntry[1] : resolvedSources[sourceId];

      // Check if current source should auto-skip (VIP sources + native anime sources)
      const shouldAutoSkip =
        vipSources.includes(sourceId) ||
        (isAnimeContent && (currentSourceDetails?.isNativeAnimeSource || currentSourceDetails?.isAnimeVipSource));

      if (shouldAutoSkip) {
        const sourceType = vipSources.includes(sourceId)
          ? 'VIP'
          : currentSourceDetails?.isAnimeVipSource
            ? 'Anime VIP'
            : currentSourceDetails?.isNativeAnimeSource
              ? 'Native Anime'
              : 'Unknown';

        console.log(`[${sourceId}] ${sourceType} source failed, auto-skipping to next source`);
        const currentIndex = prioritizedSources.findIndex(([id]) => id === sourceId);

        if (currentIndex !== -1 && currentIndex < prioritizedSources.length - 1) {
            const nextSource = prioritizedSources[currentIndex + 1];
            const nextSourceDetails = nextSource?.[1];
            const nextSourceType = vipSources.includes(nextSource[0])
              ? 'VIP'
              : nextSourceDetails?.isAnimeVipSource
                ? 'Anime VIP'
                : nextSourceDetails?.isNativeAnimeSource
                  ? 'Native Anime'
                  : nextSourceDetails?.isPremiumSource
                    ? 'Premium'
                    : 'Regular';

            console.log(
              `[${sourceId}] Auto-skipping from ${sourceType} to ${nextSourceType}: ${nextSource[0]} (${nextSourceDetails?.name})`
            );
            setSelectedSource(nextSource[0]);
            return;
          } else {
            console.log(`[${sourceId}] No more sources available for auto-skip`);
          }
        }
      
      setError('Failed to load video. Try another source.');
    } finally {
      setLoading(false);
    }
  }, [contentType, id, isAnimeContent, lockLandscape, prioritizedSources, resolvedSources, selectedSource, showOverlayControls, tmdbMapping, sources]);

  // Scroll to selected source in the sources list
  const scrollToSelectedSource = () => {
    if (sourcesScrollViewRef.current) {
      const selectedIndex = prioritizedSources.findIndex(([sourceId]) => sourceId === selectedSource);
      
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
      showOverlayControls();
    }
    
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

  useEffect(() => {
    return () => {
      if (overlayHideTimerRef.current) {
        clearTimeout(overlayHideTimerRef.current);
      }
    };
  }, []);

  const handleWebViewMessage = useCallback(
    async (event, data) => {
      try {
        const payload = data || JSON.parse(event?.nativeEvent?.data || '{}');
    if (payload?.type === 'video-playing') {
      showOverlayControls();
    } else if (payload?.type === 'user-interaction') {
      showOverlayControls();
    } else if (payload?.type === 'fullscreen-change') {
      await lockLandscape();
    }
      } catch (messageError) {
        console.warn('Failed to handle WebView message', messageError);
      }
    },
    [lockLandscape, showOverlayControls]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View 
        style={styles.container}
      >
      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading {selectedSourceDetails?.name || sources[selectedSource]?.name}...</Text>
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
          onMessage={handleWebViewMessage}
          onError={(errorMessage, suggestedSources) => {
            console.warn('SmartWebView error for', selectedSource, ':', errorMessage);
            showOverlayControls();
            
            // Enhanced auto-skip for anime sources with different priorities
            const vipSources = [
              'vip_fmftp', 'vip_moviebox', 'vip_roarzone', 'vip_crazyctg', 'vip_binudon', 
              'vip_spdx', 'vip_hydrahd_scrape', 'vip_ridomovies',
              'tmdb_vip_fmftp', 'tmdb_vip_moviebox', 'tmdb_vip_roarzone', 
              'tmdb_vip_crazyctg', 'tmdb_vip_binudon', 'tmdb_vip_spdx', 
              'tmdb_vip_hydrahd_scrape', 'tmdb_vip_ridomovies'
            ];
            
            const currentSourceEntry = prioritizedSources.find(([id]) => id === selectedSource);
            const currentSource = currentSourceEntry ? currentSourceEntry[1] : resolvedSources[selectedSource];
            
            // Check if should auto-skip (VIP, Anime VIP, or Native Anime sources)
            const shouldAutoSkip =
              vipSources.includes(selectedSource) ||
              (isAnimeContent && (currentSource?.isAnimeVipSource || currentSource?.isNativeAnimeSource));
            
            if (shouldAutoSkip) {
              const sourceType = vipSources.includes(selectedSource) ? 'VIP' :
                                currentSource?.isAnimeVipSource ? 'Anime VIP (TMDB)' :
                                currentSource?.isNativeAnimeSource ? 'Native Anime (AniList)' : 'Auto-Skip';
              
              console.log(`[${selectedSource}] ${sourceType} WebView failed, attempting auto-skip...`);
              const currentIndex = prioritizedSources.findIndex(([id]) => id === selectedSource);
              
              if (currentIndex !== -1 && currentIndex < prioritizedSources.length - 1) {
                const nextSource = prioritizedSources[currentIndex + 1];
                const nextSourceType = vipSources.includes(nextSource[0]) ? 'VIP' :
                                      nextSource[1]?.isAnimeVipSource ? 'Anime VIP (TMDB)' :
                                      nextSource[1]?.isNativeAnimeSource ? 'Native Anime (AniList)' :
                                      nextSource[1]?.isPremiumSource ? 'Premium' : 'Regular';
                
                console.log(`[${selectedSource}] Auto-skipping from ${sourceType} WebView error to ${nextSourceType}: ${nextSource[0]} (${nextSource[1]?.name})`);
                setSelectedSource(nextSource[0]);
                loadSource(nextSource[0]);
                return;
              } else {
                console.log(`[${selectedSource}] No more sources available for WebView auto-skip`);
              }
            }
            
            setError(errorMessage || 'Failed to load video player. Try another source.');
          }}
          onLoadEnd={() => {
            console.log('SmartWebView load ended successfully for', selectedSource);
            setLoading(false);
            // Track playback progress once the player is ready
            trackPlaybackProgress();
          }}
        />
      )}

      {/* Always Visible Back & Sources Buttons */}
      {/* Place back button in top-left, sources button in top-right, leave center-top empty */}
      <View
        style={[
          styles.controlsContainer,
          !overlayControlsVisible && styles.controlsContainerHidden,
        ]}
        pointerEvents={overlayControlsVisible ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={[
            styles.backButton, 
            styles.topLeftButton,
            {
              left: Math.max(10, insets.left), // Move closer to edge, respect safe area
            }
          ]}
          onPress={handleClose}
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
            showOverlayControls();
            setShowSources(true);
            // Scroll to selected source after modal opens
            setTimeout(() => {
              scrollToSelectedSource();
            }, 300); // Wait for modal animation to complete
          }}
        >
          <Ionicons name="layers-outline" size={20} color={Colors.white} />
          <Text style={[
            styles.sourcesButtonText,
            selectedSourceDetails?.isVipSource && styles.vipSourceButtonText,
            selectedSourceDetails?.isPremiumSource && styles.premiumSourceButtonText
          ]}>
            {selectedSourceDetails?.name || 'Sources'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Removed auto-hide overlays - no title or source info overlays */}

      {/* Source Selection Modal */}
      <Modal
        visible={showSources}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowSources(false);
          showOverlayControls();
        }}
        supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
      >
        <View style={styles.sourcesModal}>
          <View style={styles.sourcesHeader}>
            <Text style={styles.sourcesTitle}>Select Video Source</Text>
            <TouchableOpacity
              onPress={() => {
                setShowSources(false);
                showOverlayControls();
              }}
            >
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            ref={sourcesScrollViewRef}
            style={styles.sourcesList}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.sourcesListContent}
          >
            {prioritizedSources.map(([sourceId, source]) => (
              <TouchableOpacity
                key={sourceId}
                style={[
                  styles.sourceItem,
                  selectedSource === sourceId && styles.selectedSourceItem,
                  !source.isWorking && styles.disabledSourceItem,
                  source.isVipSource && styles.vipSourceItem,
                  source.isPremiumSource && styles.premiumSourceItem,
                  source.isNativeAnimeSource && !source.isVipSource && !source.isPremiumSource && styles.nativeAnimeSourceItem,
                  source.isAnimeVipSource && styles.animeVipSourceItem,
                  isAnimeContent && !source.isVipSource && !source.isPremiumSource && !source.isNativeAnimeSource && styles.animeSourceItem
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
                      source.isNativeAnimeSource && !source.isVipSource && !source.isPremiumSource && styles.nativeAnimeSourceName,
                      source.isAnimeVipSource && styles.animeVipSourceName,
                      isAnimeContent && !source.isVipSource && !source.isPremiumSource && !source.isNativeAnimeSource && styles.animeSourceName
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
                      {source.isNativeAnimeSource && !source.isVipSource && !source.isPremiumSource && (
                        <Text style={styles.nativeAnimeBadge}>NATIVE ANIME</Text>
                      )}
                      {source.isAnimeVipSource && (
                        <Text style={styles.animeVipBadge}>VIP ANIME</Text>
                      )}
                      {isAnimeContent && !source.isVipSource && !source.isPremiumSource && !source.isNativeAnimeSource && !source.isAnimeVipSource && (
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
    paddingTop: Platform.OS === 'android' ? 20 : 30,
  },
  controlsContainerHidden: {
    opacity: 0,
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
    backgroundColor: '#0d1929',
    borderWidth: 1,
    borderColor: '#4a90e2',
    shadowColor: '#4a90e2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  // Native Anime Source Styling (AniList ID support)
  nativeAnimeSourceItem: {
    backgroundColor: '#1a0d29',
    borderWidth: 1,
    borderColor: '#ff6b6b',
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
  },
  nativeAnimeSourceName: {
    color: '#ff9999',
    fontWeight: 'bold',
  },
  nativeAnimeBadge: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    textTransform: 'uppercase',
  },
  // Anime VIP Source Styling (TMDB conversion required)
  animeVipSourceItem: {
    backgroundColor: '#2d1a0d',
    borderWidth: 2,
    borderColor: '#ff8c00',
    shadowColor: '#ff8c00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  animeVipSourceName: {
    color: '#ffb347',
    fontWeight: 'bold',
  },
  animeVipBadge: {
    color: '#000',
    fontSize: 9,
    fontWeight: 'bold',
    backgroundColor: '#ff8c00',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  animeSourceName: {
    color: '#87ceeb',
    fontWeight: '600',
  },
  animeBadge: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    backgroundColor: '#4a90e2',
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
