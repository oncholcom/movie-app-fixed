import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
  Platform,
  FlatList,
} from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import AsyncStorage from '@react-native-async-storage/async-storage'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import VideoPlayerWithSources from '../components/detail/VideoPlayerWithSources'
import { GlobalStyles, Spacing, BorderRadius } from '../styles/GlobalStyles'
import Colors from '../constants/Colors'
import anilistApi from '../services/anilistApi'
import { useAuth } from '../context/AuthContext'
import PremiumRequiredModal from '../components/common/PremiumRequiredModal'

const { width, height } = Dimensions.get('window')
const HEADER_MAX_HEIGHT = height * 0.5
const HEADER_MIN_HEIGHT = 100
const EPISODES_PER_PAGE = 50

const AnimeDetailScreen = ({ route, navigation }) => {
  const { animeId } = route.params
  const scrollY = useRef(new Animated.Value(0)).current

  // State
  const [anime, setAnime] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)
  const [selectedEpisode, setSelectedEpisode] = useState(null)
  const [lastWatchedEpisode, setLastWatchedEpisode] = useState(null)
  const [currentlyPlayingEpisode, setCurrentlyPlayingEpisode] = useState(null)
  const [episodeRange, setEpisodeRange] = useState(0) // 0 = 1-50, 1 = 51-100, etc.
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
    fetchAnimeDetails()
    loadWatchProgress()
  }, [animeId])

  useEffect(() => {
    if (hasActiveSubscription) {
      setPremiumModalVisible(false)
    }
  }, [hasActiveSubscription])

  const fetchAnimeDetails = async () => {
  try {
    setLoading(true)
    setError(null)

    // FIX: Use getDetails instead of getAnimeDetails
    const response = await anilistApi.getDetails(animeId)
    setAnime(response?.Media || response)
  } catch (err) {
    console.error('Error fetching anime details:', err)
    setError('Failed to load anime details')
  } finally {
    setLoading(false)
  }
}


  const loadWatchProgress = async () => {
    try {
      const key = `anime_progress_${animeId}`
      const progressData = await AsyncStorage.getItem(key)
      if (progressData) {
        const { lastWatched, currentlyPlaying } = JSON.parse(progressData)
        setLastWatchedEpisode(lastWatched)
        setCurrentlyPlayingEpisode(currentlyPlaying)
        
        // Auto-select range based on last watched
        if (lastWatched) {
          const rangeIndex = Math.floor((lastWatched - 1) / EPISODES_PER_PAGE)
          setEpisodeRange(rangeIndex)
        }
      }
    } catch (error) {
      console.error('Error loading watch progress:', error)
    }
  }

  const saveWatchProgress = async (episodeNumber, isCurrentlyPlaying = false) => {
    try {
      const key = `anime_progress_${animeId}`
      const progressData = {
        lastWatched: episodeNumber,
        currentlyPlaying: isCurrentlyPlaying ? episodeNumber : null,
        timestamp: Date.now(),
      }
      await AsyncStorage.setItem(key, JSON.stringify(progressData))
      setLastWatchedEpisode(episodeNumber)
      if (isCurrentlyPlaying) {
        setCurrentlyPlayingEpisode(episodeNumber)
      }
    } catch (error) {
      console.error('Error saving watch progress:', error)
    }
  }

  const handleEpisodePress = (episodeNumber) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    
    if (!hasActiveSubscription) {
      setPremiumModalVisible(true)
      return
    }

    saveWatchProgress(episodeNumber, true)
    setSelectedEpisode(episodeNumber)
    
    navigation.navigate('VideoPlayer', {
      animeId: anime?.id,
      season: 1,
      episode: episodeNumber,
      episodeNumber,
      contentType: 'anime',
      isAnime: true,
      title: `${getAnimeTitle()} - Episode ${episodeNumber}`,
    })
  }

  const handleContinueWatching = () => {
    if (lastWatchedEpisode) {
      const nextEpisode = lastWatchedEpisode + 1
      if (nextEpisode <= totalEpisodes) {
        handleEpisodePress(nextEpisode)
      } else {
        handleEpisodePress(lastWatchedEpisode)
      }
    } else {
      handleEpisodePress(1)
    }
  }

  // Memoized values
  const getAnimeTitle = useCallback(() => {
    return anime?.title?.english || anime?.title?.romaji || anime?.title?.native || 'Unknown'
  }, [anime])

  const totalEpisodes = useMemo(() => anime?.episodes || 0, [anime])
  
  const episodeRanges = useMemo(() => {
    if (!totalEpisodes) return []
    const ranges = []
    for (let i = 0; i < totalEpisodes; i += EPISODES_PER_PAGE) {
      const start = i + 1
      const end = Math.min(i + EPISODES_PER_PAGE, totalEpisodes)
      ranges.push({ start, end, index: ranges.length })
    }
    return ranges
  }, [totalEpisodes])

  const currentRangeEpisodes = useMemo(() => {
    const range = episodeRanges[episodeRange]
    if (!range) return []
    const episodes = []
    for (let i = range.start; i <= range.end; i++) {
      episodes.push(i)
    }
    return episodes
  }, [episodeRange, episodeRanges])

  const rating = useMemo(() => anime?.averageScore ? (anime.averageScore / 10).toFixed(1) : null, [anime])
  
  const genres = useMemo(() => anime?.genres || [], [anime])
  
  const bannerImage = useMemo(
    () => anime?.bannerImage || anime?.coverImage?.extraLarge || anime?.coverImage?.large,
    [anime]
  )

  if (loading) {
    return <LoadingSpinner />
  }

  if (error || !anime) {
    return <ErrorMessage message={error || 'Anime not found'} onRetry={fetchAnimeDetails} />
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
            source={{ uri: bannerImage }}
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
          <Text style={styles.title}>{getAnimeTitle()}</Text>
          <View style={styles.metaRow}>
            {anime.seasonYear && <Text style={styles.metaText}>{anime.seasonYear}</Text>}
            {anime.format && (
              <>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>{anime.format}</Text>
              </>
            )}
            {totalEpisodes > 0 && (
              <>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>{totalEpisodes} Episodes</Text>
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
        {genres.length > 0 && (
          <View style={styles.genresContainer}>
            {genres.map((genre, index) => (
              <View key={index} style={styles.genreChip}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Play/Continue Watching Button */}
        <View style={styles.actionSection}>
          {lastWatchedEpisode ? (
            // Continue Watching Button (if user has watch history)
            <TouchableOpacity style={styles.continueButton} onPress={handleContinueWatching}>
              <Ionicons name="play" size={24} color={Colors.white} />
              <Text style={styles.continueButtonText}>
                Continue Episode {lastWatchedEpisode + 1 <= totalEpisodes ? lastWatchedEpisode + 1 : lastWatchedEpisode}
              </Text>
            </TouchableOpacity>
          ) : totalEpisodes > 0 ? (
            // Default Play Button (starts from Episode 1)
            <TouchableOpacity style={styles.playButtonLarge} onPress={() => handleEpisodePress(1)}>
              <Ionicons name="play" size={24} color={Colors.white} />
              <Text style={styles.playButtonText}>Play Episode 1</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Overview/Description */}
        {anime.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Synopsis</Text>
            <Text style={styles.overview}>
              {anime.description.replace(/<[^>]*>/g, '')}
            </Text>
          </View>
        )}

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsContainer}>
            {anime.status && <DetailRow label="Status" value={anime.status} />}
            {anime.startDate && (
              <DetailRow
                label="Aired"
                value={`${anime.startDate.month}/${anime.startDate.year}`}
              />
            )}
            {anime.studios?.nodes?.[0] && (
              <DetailRow label="Studio" value={anime.studios.nodes[0].name} />
            )}
            {anime.source && <DetailRow label="Source" value={anime.source} />}
          </View>
        </View>

        {/* Episode Range Selector */}
        {episodeRanges.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Episode Range</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rangeSelector}
              nestedScrollEnabled
            >
              {episodeRanges.map((range) => (
                <TouchableOpacity
                  key={range.index}
                  style={[
                    styles.rangeButton,
                    episodeRange === range.index && styles.rangeButtonActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    setEpisodeRange(range.index)
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.rangeButtonText,
                      episodeRange === range.index && styles.rangeButtonTextActive,
                    ]}
                  >
                    {range.start}-{range.end}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Episodes Grid */}
        {totalEpisodes > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Episodes</Text>
            <View style={styles.episodesGrid}>
              {currentRangeEpisodes.map((episodeNum) => (
                <EpisodeNumberButton
                  key={episodeNum}
                  episodeNumber={episodeNum}
                  onPress={() => handleEpisodePress(episodeNum)}
                  isLastWatched={episodeNum === lastWatchedEpisode}
                  isCurrentlyPlaying={episodeNum === currentlyPlayingEpisode}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </Animated.ScrollView>

      {/* Video Player Modal */}
      <VideoPlayerWithSources
        visible={showVideoPlayer}
        onClose={() => {
          setShowVideoPlayer(false)
          setCurrentlyPlayingEpisode(null)
        }}
        animeId={anime?.id}
        episodeNumber={selectedEpisode}
        contentType="anime"
        title={getAnimeTitle()}
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

// Episode Number Button Component
const EpisodeNumberButton = ({ episodeNumber, onPress, isLastWatched, isCurrentlyPlaying }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start()
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.episodeButton,
          isCurrentlyPlaying && styles.episodeButtonPlaying,
          isLastWatched && !isCurrentlyPlaying && styles.episodeButtonWatched,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.episodeButtonText,
            (isCurrentlyPlaying || isLastWatched) && styles.episodeButtonTextActive,
          ]}
        >
          {episodeNumber}
        </Text>
        {isLastWatched && !isCurrentlyPlaying && (
          <View style={styles.watchedIndicator}>
            <Ionicons name="checkmark" size={12} color={Colors.white} />
          </View>
        )}
        {isCurrentlyPlaying && (
          <View style={styles.playingIndicator}>
            <Ionicons name="play" size={10} color={Colors.white} />
          </View>
        )}
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
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  playButtonLarge: {
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
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  continueButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
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
  rangeSelector: {
    paddingRight: Spacing.md,
    gap: Spacing.sm,
  },
  rangeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.mediumGray,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rangeButtonActive: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderColor: Colors.primary,
  },
  rangeButtonText: {
    fontSize: 14,
    color: Colors.grayText,
    fontWeight: '600',
  },
  rangeButtonTextActive: {
    color: Colors.primary,
  },
  episodesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  episodeButton: {
    width: (width - Spacing.md * 2 - Spacing.sm * 6) / 7,
    aspectRatio: 1,
    backgroundColor: Colors.mediumGray,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  episodeButtonWatched: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  episodeButtonPlaying: {
    backgroundColor: 'rgba(231, 76, 60, 0.3)',
    borderColor: Colors.primary,
  },
  episodeButtonText: {
    fontSize: 14,
    color: Colors.grayText,
    fontWeight: '700',
  },
  episodeButtonTextActive: {
    color: Colors.white,
  },
  watchedIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playingIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPadding: {
    height: Spacing.xl,
  },
})

export default AnimeDetailScreen
