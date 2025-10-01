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
} from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
//import DetailHeader from '../components/detail/DetailHeader'
import VideoPlayerWithSources from '../components/detail/VideoPlayerWithSources'
import ContentCard from '../components/home/ContentCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import CustomButton from '../components/common/CustomButton'
import { GlobalStyles, Spacing, BorderRadius } from '../styles/GlobalStyles'
import Colors from '../constants/Colors'
import { getMovies, getVideos, getBackdropUrl, getPosterUrl } from '../services/api'
import { formatDate, formatCurrency } from '../utils/helpers'
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

const MovieDetailScreen = ({ route, navigation }) => {
  const { movieId } = route.params
  const scrollY = useRef(new Animated.Value(0)).current

  // State
  const [movie, setMovie] = useState(null)
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [videos, setVideos] = useState([])
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)
  const [playingTrailer, setPlayingTrailer] = useState(false)
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
    fetchMovieDetails()
  }, [movieId])

  useEffect(() => {
    if (hasActiveSubscription) {
      setPremiumModalVisible(false)
    }
  }, [hasActiveSubscription])

  useEffect(() => {
    if (movie) {
      checkWatchlistStatus()
    }
  }, [movie])

  const checkWatchlistStatus = useCallback(async () => {
    try {
      if (isAuthenticated) {
        const remoteItems = await WatchlistService.list({ type: 'movie', limit: 100 })
        const match = remoteItems.some((item) => String(item?.id) === String(movieId))
        setInWatchlist(match)
      } else {
        const status = await isInWatchlist(movieId, 'movie')
        setInWatchlist(status)
      }
    } catch (error) {
      console.error('Error checking watchlist status:', error)
    }
  }, [isAuthenticated, movieId])

  const fetchMovieDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const [detailsResponse, videosResponse] = await Promise.all([
        getMovies.details(movieId),
        getVideos.movie(movieId),
      ])

      setMovie(detailsResponse.data)
      setSimilar(detailsResponse.data.similar?.results || [])
      setVideos(videosResponse.data.results || [])
    } catch (err) {
      console.error('Error fetching movie details:', err)
      setError('Failed to load movie details')
    } finally {
      setLoading(false)
    }
  }

  const handleSimilarItemPress = (item) => {
    navigation.push('MovieDetail', { movieId: item.id })
  }

  const handlePlayPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    
    if (!hasActiveSubscription) {
      setPremiumModalVisible(true)
      return
    }

    navigation.navigate('VideoPlayer', {
      movieId: movie?.id,
      contentType: 'movie',
      title: movie?.title,
    })
  }

  const handleTrailerPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    
    if (videos.length === 0) {
      Alert.alert('No Trailer', 'No trailer available for this movie')
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
    if (!movie) return
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    try {
      if (isAuthenticated) {
        if (inWatchlist) {
          await WatchlistService.remove(String(movieId), 'movie')
          setInWatchlist(false)
        } else {
          const payload = {
            id: String(movieId),
            type: 'movie',
            title: movie.title,
            imageUrl: getPosterUrl(movie.poster_path),
          }
          await WatchlistService.add(payload)
          setInWatchlist(true)
        }
        return
      }

      if (inWatchlist) {
        await removeFromLocalWatchlist(movieId, 'movie')
        setInWatchlist(false)
      } else {
        await addToLocalWatchlist({
          id: movieId,
          type: 'movie',
          title: movie.title,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          overview: movie.overview,
        })
        setInWatchlist(true)
      }
    } catch (error) {
      console.error('Error updating watchlist:', error)
    }
  }

  // Memoized values
  const hasTrailer = useMemo(() => videos.length > 0, [videos])
  const rating = useMemo(() => movie?.vote_average?.toFixed(1), [movie])
  const releaseYear = useMemo(
    () => (movie?.release_date ? new Date(movie.release_date).getFullYear() : null),
    [movie]
  )
  const runtime = useMemo(() => {
    if (!movie?.runtime) return null
    const hours = Math.floor(movie.runtime / 60)
    const minutes = movie.runtime % 60
    return `${hours}h ${minutes}m`
  }, [movie])

  if (loading) {
    return <LoadingSpinner />
  }

  if (error || !movie) {
    return <ErrorMessage message={error || 'Movie not found'} onRetry={fetchMovieDetails} />
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
            source={{ uri: getBackdropUrl(movie.backdrop_path) }}
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
          <Text style={styles.title}>{movie.title}</Text>
          <View style={styles.metaRow}>
            {releaseYear && <Text style={styles.metaText}>{releaseYear}</Text>}
            {runtime && (
              <>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>{runtime}</Text>
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
        {movie.genres && movie.genres.length > 0 && (
          <View style={styles.genresContainer}>
            {movie.genres.map((genre) => (
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
          <Text style={styles.overview}>{movie.overview}</Text>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsContainer}>
            {movie.release_date && (
              <DetailRow label="Release Date" value={formatDate(movie.release_date)} />
            )}
            {movie.budget > 0 && (
              <DetailRow label="Budget" value={formatCurrency(movie.budget)} />
            )}
            {movie.revenue > 0 && (
              <DetailRow label="Revenue" value={formatCurrency(movie.revenue)} />
            )}
            {movie.status && <DetailRow label="Status" value={movie.status} />}
          </View>
        </View>

        {/* Cast */}
        {movie.credits?.cast && movie.credits.cast.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cast</Text>
            <Text style={styles.castList}>
              {movie.credits.cast
                .slice(0, 5)
                .map((actor) => actor.name)
                .join(', ')}
            </Text>
          </View>
        )}

        {/* Similar Movies */}
        {similar.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Similar Movies</Text>
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
                  contentType="movie"
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
        movieId={movie?.id}
        contentType="movie"
        title={movie?.title}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.mediumGray,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: 6,
  },
  trailerButtonText: {
    color: Colors.white,
    fontSize: 14,
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
  similarScrollContainer: {
    paddingRight: Spacing.md,
    gap: Spacing.sm,
  },
  bottomPadding: {
    height: Spacing.xl,
  },
})

export default MovieDetailScreen
