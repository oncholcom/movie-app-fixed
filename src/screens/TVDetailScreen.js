import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
  Platform,
  ScrollView,
} from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import ContentCard from '../components/home/ContentCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import VideoPlayerWithSources from '../components/detail/VideoPlayerWithSources'
import { GlobalStyles, Spacing, BorderRadius } from '../styles/GlobalStyles'
import Colors from '../constants/Colors'
import { getTVShows, getTVSeasons, getVideos, getBackdropUrl, getPosterUrl } from '../services/api'
import { formatDate } from '../utils/helpers'
import {
  addToWatchlist as addToLocalWatchlist,
  isInWatchlist,
  removeFromWatchlist as removeFromLocalWatchlist,
} from '../utils/watchlist'
import { WatchlistService } from '../services/mobile'
import { useAuth } from '../context/AuthContext'
import PremiumRequiredModal from '../components/common/PremiumRequiredModal'

const { width, height } = Dimensions.get('window')
const HEADER_MAX_HEIGHT = height * 0.5
const HEADER_MIN_HEIGHT = 100

const TVDetailScreen = ({ route, navigation }) => {
  const { tvId } = route.params
  const scrollY = useRef(new Animated.Value(0)).current

  // State
  const [tvShow, setTvShow] = useState(null)
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [videos, setVideos] = useState([])
  const [selectedSeason, setSelectedSeason] = useState(1)
  const [episodes, setEpisodes] = useState([])
  const [loadingEpisodes, setLoadingEpisodes] = useState(false)
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)
  const [playingTrailer, setPlayingTrailer] = useState(false)
  const [selectedEpisode, setSelectedEpisode] = useState(null)
  const [inWatchlist, setInWatchlist] = useState(false)
  const [premiumModalVisible, setPremiumModalVisible] = useState(false)

  const { isAuthenticated, subscription } = useAuth()
  const hasActiveSubscription = isAuthenticated && subscription?.status === 'active'

  // Animated values
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  })

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  })

  const imageTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  })

  // Fetch data
  useEffect(() => {
    fetchTVDetails()
  }, [tvId])

  useEffect(() => {
    if (hasActiveSubscription) {
      setPremiumModalVisible(false)
    }
  }, [hasActiveSubscription])

  useEffect(() => {
    if (tvShow) {
      checkWatchlistStatus()
    }
  }, [tvShow])

  useEffect(() => {
    if (tvShow && selectedSeason) {
      fetchEpisodes(selectedSeason)
    }
  }, [selectedSeason, tvShow])

  const checkWatchlistStatus = useCallback(async () => {
    try {
      if (isAuthenticated) {
        const remoteItems = await WatchlistService.list({ type: 'tv', limit: 100 })
        const match = remoteItems.some((item) => String(item?.id) === String(tvId))
        setInWatchlist(match)
      } else {
        const status = await isInWatchlist(tvId, 'tv')
        setInWatchlist(status)
      }
    } catch (error) {
      console.error('Error checking watchlist status:', error)
    }
  }, [isAuthenticated, tvId])

  const fetchTVDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      setEpisodes([])
      setSelectedEpisode(null)

      const [detailsResponse, videosResponse] = await Promise.all([
        getTVShows.details(tvId),
        getVideos.tv(tvId),
      ])

      setTvShow(detailsResponse.data)
      setSimilar(detailsResponse.data.similar?.results || [])
      setVideos(videosResponse.data.results || [])

      // Auto-select first season
      if (detailsResponse.data.seasons && detailsResponse.data.seasons.length > 0) {
        const firstValidSeason = detailsResponse.data.seasons.find(s => s.season_number > 0)
        if (firstValidSeason) {
          setSelectedSeason(firstValidSeason.season_number)
        }
      }
    } catch (err) {
      console.error('Error fetching TV details:', err)
      setError('Failed to load TV show details')
    } finally {
      setLoading(false)
    }
  }

  const fetchEpisodes = async (seasonNumber) => {
    try {
      setLoadingEpisodes(true)
      const response = await getTVSeasons.episodes(tvId, seasonNumber)
      const nextEpisodes = response.data.episodes || []
      setEpisodes(nextEpisodes)

      if (nextEpisodes.length > 0) {
        setSelectedEpisode(nextEpisodes[0])
      } else {
        setSelectedEpisode(null)
      }
    } catch (err) {
      console.error('Error fetching episodes:', err)
      setEpisodes([])
      setSelectedEpisode(null)
    } finally {
      setLoadingEpisodes(false)
    }
  }

  const handleSeasonSelect = (seasonNumber) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedEpisode(null)
    setSelectedSeason(seasonNumber)
  }

  const handlePlayPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    if (!hasActiveSubscription) {
      setPremiumModalVisible(true)
      return
    }

    const episodeToPlay = episodes[0]
    if (!episodeToPlay) {
      Alert.alert('No Episodes', 'Episodes are not available for this season yet')
      return
    }

    setSelectedEpisode(episodeToPlay)
    setPlayingTrailer(false)
    setShowVideoPlayer(true)
  }

  const handleEpisodePress = (episode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    
    if (!hasActiveSubscription) {
      setPremiumModalVisible(true)
      return
    }

    setSelectedEpisode(episode)
    setPlayingTrailer(false)
    setShowVideoPlayer(true)
  }

  const handleSimilarItemPress = (item) => {
    navigation.push('TVDetail', { tvId: item.id })
  }

  const handleTrailerPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    
    if (videos.length === 0) {
      Alert.alert('No Trailer', 'No trailer available for this show')
      return
    }

    const trailer = videos.find(
      (video) =>
        video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
    ) || videos[0]

    if (trailer && trailer.site === 'YouTube') {
      setPlayingTrailer(true)
      setShowVideoPlayer(true)
    } else {
      Alert.alert('Error', 'Unable to play trailer')
    }
  }

  const handleAddToWatchlist = async () => {
    if (!tvShow) return
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    try {
      if (isAuthenticated) {
        if (inWatchlist) {
          await WatchlistService.remove(String(tvId), 'tv')
          setInWatchlist(false)
        } else {
          const payload = {
            id: String(tvId),
            type: 'tv',
            title: tvShow.name,
            imageUrl: getPosterUrl(tvShow.poster_path),
          }
          await WatchlistService.add(payload)
          setInWatchlist(true)
        }
        return
      }

      if (inWatchlist) {
        await removeFromLocalWatchlist(tvId, 'tv')
        setInWatchlist(false)
      } else {
        await addToLocalWatchlist({
          id: tvId,
          type: 'tv',
          title: tvShow.name,
          poster_path: tvShow.poster_path,
          backdrop_path: tvShow.backdrop_path,
          overview: tvShow.overview,
        })
        setInWatchlist(true)
      }
    } catch (error) {
      console.error('Error updating watchlist:', error)
    }
  }

  // Memoized values
  const hasTrailer = useMemo(() => videos.length > 0, [videos])
  const rating = useMemo(() => tvShow?.vote_average?.toFixed(1), [tvShow])
  const firstAirYear = useMemo(
    () => (tvShow?.first_air_date ? new Date(tvShow.first_air_date).getFullYear() : null),
    [tvShow]
  )
  const validSeasons = useMemo(
    () => (tvShow?.seasons || []).filter(s => s.season_number > 0),
    [tvShow]
  )

  if (loading) {
    return <LoadingSpinner />
  }

  if (error || !tvShow) {
    return <ErrorMessage message={error || 'TV show not found'} onRetry={fetchTVDetails} />
  }

  return (
    <View style={styles.container}>
      {/* Parallax Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <Animated.View
          style={[
            styles.backdropContainer,
            {
              opacity: imageOpacity,
              transform: [{ translateY: imageTranslate }],
            },
          ]}
        >
          <Image
            source={{ uri: getBackdropUrl(tvShow.backdrop_path) }}
            style={styles.backdrop}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)', Colors.black]}
            style={styles.gradient}
          />
        </Animated.View>
      </Animated.View>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          navigation.goBack()
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={24} color={Colors.white} />
      </TouchableOpacity>

      {/* Scrollable Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
      >
        {/* Spacer for parallax */}
        <View style={{ height: HEADER_MAX_HEIGHT - 60 }} />

        {/* Title & Meta */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{tvShow.name}</Text>
          <View style={styles.metaRow}>
            {firstAirYear && <Text style={styles.metaText}>{firstAirYear}</Text>}
            {tvShow.number_of_seasons && (
              <>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>
                  {tvShow.number_of_seasons} {tvShow.number_of_seasons === 1 ? 'Season' : 'Seasons'}
                </Text>
              </>
            )}
            {rating && (
              <>
                <Text style={styles.metaDot}>•</Text>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color={Colors.yellow} />
                  <Text style={styles.ratingText}>{rating}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Genres */}
        {tvShow.genres && tvShow.genres.length > 0 && (
          <View style={styles.genresContainer}>
            {tvShow.genres.map((genre) => (
              <View key={genre.id} style={styles.genreChip}>
                <Text style={styles.genreText}>{genre.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.playButtonLarge} onPress={handlePlayPress}>
            <Ionicons name="play" size={24} color={Colors.white} />
            <Text style={styles.playButtonText}>Play Now</Text>
          </TouchableOpacity>

          {hasTrailer && (
            <TouchableOpacity style={styles.trailerButton} onPress={handleTrailerPress}>
              <Ionicons name="play-circle-outline" size={20} color={Colors.white} />
              <Text style={styles.trailerButtonText}>Trailer</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.iconButton} onPress={handleAddToWatchlist}>
            <Ionicons
              name={inWatchlist ? 'checkmark' : 'add'}
              size={24}
              color={Colors.white}
            />
          </TouchableOpacity>
        </View>

        {/* Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.overview}>{tvShow.overview}</Text>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsContainer}>
            {tvShow.first_air_date && (
              <DetailRow label="First Air Date" value={formatDate(tvShow.first_air_date)} />
            )}
            {tvShow.last_air_date && (
              <DetailRow label="Last Air Date" value={formatDate(tvShow.last_air_date)} />
            )}
            {tvShow.status && <DetailRow label="Status" value={tvShow.status} />}
            {tvShow.number_of_episodes && (
              <DetailRow label="Total Episodes" value={String(tvShow.number_of_episodes)} />
            )}
          </View>
        </View>

        {/* Cast */}
        {tvShow.credits?.cast && tvShow.credits.cast.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cast</Text>
            <Text style={styles.castList}>
              {tvShow.credits.cast
                .slice(0, 5)
                .map((actor) => actor.name)
                .join(', ')}
            </Text>
          </View>
        )}

        {/* Season Selector */}
        {validSeasons.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seasons</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.seasonTabs}
              nestedScrollEnabled
            >
              {validSeasons.map((season) => (
                <TouchableOpacity
                  key={season.id}
                  style={[
                    styles.seasonTab,
                    selectedSeason === season.season_number && styles.seasonTabActive,
                  ]}
                  onPress={() => handleSeasonSelect(season.season_number)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.seasonTabText,
                      selectedSeason === season.season_number && styles.seasonTabTextActive,
                    ]}
                  >
                    Season {season.season_number}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Episodes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Episodes</Text>
          {loadingEpisodes ? (
            <Text style={styles.loadingText}>Loading episodes...</Text>
          ) : episodes.length > 0 ? (
            <View style={styles.episodesContainer}>
              {episodes.map((episode, index) => (
                <EpisodeCard
                  key={episode.id}
                  episode={episode}
                  index={index}
                  onPress={() => handleEpisodePress(episode)}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.noEpisodesText}>No episodes available</Text>
          )}
        </View>

        {/* Similar Shows */}
        {similar.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Similar Shows</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarScrollContainer}
              nestedScrollEnabled
            >
              {similar.slice(0, 15).map((item, index) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  index={index}
                  onPress={() => handleSimilarItemPress(item)}
                  contentType="tv"
                />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </Animated.ScrollView>

      {/* Video Player Modal */}
      <VideoPlayerWithSources
        visible={showVideoPlayer}
        onClose={() => {
          setShowVideoPlayer(false)
          setPlayingTrailer(false)
        }}
        tvId={tvShow?.id}
        seasonNumber={selectedSeason}
        episodeNumber={selectedEpisode?.episode_number}
        contentType="tv"
        title={
          selectedEpisode
            ? `${tvShow?.name} - S${selectedSeason}E${selectedEpisode.episode_number}`
            : tvShow?.name
        }
        isTrailer={playingTrailer}
        videoKey={playingTrailer ? videos[0]?.key : null}
        navigation={navigation}
      />

      {/* Premium Modal */}
      <PremiumRequiredModal
        visible={premiumModalVisible}
        onClose={() => setPremiumModalVisible(false)}
        onLogin={() => {
          setPremiumModalVisible(false)
          navigation.navigate('Login')
        }}
      />
    </View>
  )
}

// Episode Card Component
const EpisodeCard = ({ episode, index, onPress }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start()
  }, [])

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity style={styles.episodeCard} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.episodeThumbnailContainer}>
          {episode.still_path ? (
            <Image
              source={{ uri: `https://image.tmdb.org/t/p/w300${episode.still_path}` }}
              style={styles.episodeThumbnail}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.episodePlaceholder}>
              <Ionicons name="tv-outline" size={32} color={Colors.grayText} />
            </View>
          )}
          <View style={styles.playIconOverlay}>
            <Ionicons name="play-circle" size={40} color="rgba(255,255,255,0.9)" />
          </View>
        </View>
        <View style={styles.episodeInfo}>
          <Text style={styles.episodeNumber}>
            Episode {episode.episode_number}
          </Text>
          <Text style={styles.episodeName} numberOfLines={2}>
            {episode.name}
          </Text>
          {episode.runtime && (
            <Text style={styles.episodeRuntime}>{episode.runtime} min</Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value || 'N/A'}</Text>
  </View>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 1,
  },
  backdropContainer: {
    width: '100%',
    height: '100%',
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  titleSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 14,
    color: Colors.grayText,
    fontWeight: '500',
  },
  metaDot: {
    fontSize: 14,
    color: Colors.grayText,
    marginHorizontal: Spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: Colors.yellow,
    fontWeight: '600',
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  genreChip: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.4)',
  },
  genreText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  actionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  playButtonLarge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  playButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  trailerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.mediumGray,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    gap: 6,
  },
  trailerButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.mediumGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  overview: {
    fontSize: 15,
    color: Colors.grayText,
    lineHeight: 24,
  },
  detailsContainer: {
    backgroundColor: Colors.mediumGray,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailLabel: {
    color: Colors.grayText,
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: Spacing.sm,
  },
  castList: {
    fontSize: 15,
    color: Colors.grayText,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  seasonTabs: {
    paddingHorizontal: Spacing.md,
  },
  seasonTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.mediumGray,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: Spacing.sm,
  },
  seasonTabActive: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderColor: Colors.primary,
  },
  seasonTabText: {
    fontSize: 14,
    color: Colors.grayText,
    fontWeight: '600',
  },
  seasonTabTextActive: {
    color: Colors.primary,
  },
  episodesContainer: {
    gap: Spacing.md,
  },
  similarScrollContainer: {
    paddingRight: Spacing.md,
    gap: Spacing.sm,
  },
  episodeCard: {
    flexDirection: 'row',
    backgroundColor: Colors.mediumGray,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  episodeThumbnailContainer: {
    width: 140,
    height: 80,
    position: 'relative',
  },
  episodeThumbnail: {
    width: '100%',
    height: '100%',
  },
  episodePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.darkGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodeInfo: {
    flex: 1,
    padding: Spacing.sm,
    justifyContent: 'center',
  },
  episodeNumber: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
    marginBottom: 2,
  },
  episodeName: {
    fontSize: 15,
    color: Colors.white,
    fontWeight: '600',
    marginBottom: 4,
  },
  episodeRuntime: {
    fontSize: 12,
    color: Colors.grayText,
  },
  loadingText: {
    color: Colors.grayText,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  noEpisodesText: {
    color: Colors.grayText,
    textAlign: 'center',
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
  bottomPadding: {
    height: Spacing.xl,
  },
})

export default TVDetailScreen
