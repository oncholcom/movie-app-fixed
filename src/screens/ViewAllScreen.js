import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import ContentCard from '../components/home/ContentCard'
import AnimeCard from '../components/anime/AnimeCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import { GlobalStyles, Spacing, BorderRadius } from '../styles/GlobalStyles'
import { getMovies, getTVShows, getBollywoodContent, getAnimationContent, getRegionalContent } from '../services/api'
import { getTodayIsoDate } from '../utils/helpers'
import unifiedAnimeApi from '../services/unifiedAnimeApi'
import Colors from '../constants/Colors'

const { width } = Dimensions.get('window')
const CARD_WIDTH = (width - (Spacing.md * 3)) / 2 // 2 columns with proper spacing

const ViewAllScreen = ({ navigation, route }) => {
  const { contentType, category, title } = route.params || {}
  
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [content, setContent] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [todayIso, setTodayIso] = useState(null)
  
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const init = async () => {
      const iso = await getTodayIsoDate()
      setTodayIso(iso)
      fetchContent(1, false, iso)
    }
    init()
  }, [contentType, category])

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start()
  }, [])

  const fetchContent = useCallback(async (pageNum = 1, append = false, isoOverride) => {
    try {
      if (pageNum === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      setError(null)
      let response
      const params = { page: pageNum }
      const iso = isoOverride || todayIso

      // Movies
      if (contentType === 'movie') {
        switch (category) {
          case 'trending':
            response = await getMovies.trending(params)
            break
          case 'top_rated':
            response = await getMovies.topRated(params)
            break
          case 'upcoming':
            response = await getMovies.upcoming(params)
            break
          case 'bollywood':
            response = await getBollywoodContent.hindi(params)
            break
          case 'animation':
            response = await getAnimationContent.all(params)
            break
          case 'popular':
          default:
            response = await getMovies.popular(params)
            break
        }
      } 
      // TV Shows
      else if (contentType === 'tv') {
        switch (category) {
          case 'trending':
            response = await getTVShows.trending(params)
            break
          case 'top_rated':
            response = await getTVShows.topRated(params)
            break
          case 'on_the_air':
            response = await getTVShows.onTheAir(params)
            break
          case 'airing_today':
            response = await getTVShows.airingToday(params)
            break
          case 'popular':
          default:
            response = await getTVShows.popular(params)
            break
        }
      } 
      // Anime
      else if (contentType === 'anime') {
        const animeResults = await unifiedAnimeApi.searchAnime('popular')
        const animeData = animeResults.combined || animeResults.anilist || []
        response = { data: { results: animeData, total_pages: 1 } }
      }


      // Regional Content
      if (!response) {
        if (contentType === 'tv') {
          if (category === 'popular_us') response = await getRegionalContent.tvUSPopular(iso, pageNum)
          else if (category === 'hindi_recent') response = await getRegionalContent.tvHindiRecent(iso, pageNum)
          else if (category === 'bengali_recent') response = await getRegionalContent.tvBengaliBDINRecent(iso, pageNum)
        } else if (contentType === 'movie') {
          if (category === 'south_recent') response = await getRegionalContent.moviesSouthIndiaRecent(iso, pageNum)
          else if (category === 'imdb_top_recent') response = await getRegionalContent.moviesTopImdbRecent(iso, pageNum)
          else if (category === 'bengali_bd_recent') response = await getRegionalContent.moviesBengaliBDRecent(iso, pageNum)
          else if (category === 'bengali_in_recent') response = await getRegionalContent.moviesBengaliINRecent(iso, pageNum)
          else if (category === 'hollywood_new') response = await getRegionalContent.hollywoodNewlyReleased(iso, pageNum)
          else if (category === 'bollywood_new') response = await getRegionalContent.bollywoodHindiNewlyReleased(iso, pageNum)
          else if (category === 'tamil_new') response = await getRegionalContent.tamilNewlyReleased(iso, pageNum)
        }
      }

      let newContent = response.data.results || []

      // Custom sorting for IMDb top recent
      if (contentType === 'movie' && category === 'imdb_top_recent') {
        const yearNow = new Date(iso || new Date().toISOString().slice(0, 10)).getFullYear()
        const parseYear = (d) => parseInt((d || '').slice(0, 4)) || 0
        const sortFn = (a, b) => {
          const yA = parseYear(a.release_date)
          const yB = parseYear(b.release_date)
          if (yB !== yA) return yB - yA
          return (b.vote_average || 0) - (a.vote_average || 0)
        }

        const currentYear = newContent.filter(m => parseYear(m.release_date) === yearNow).sort(sortFn)
        const others = newContent.filter(m => parseYear(m.release_date) !== yearNow).sort(sortFn)
        newContent = [...currentYear, ...others]
      }

      if (append) {
        setContent(prev => [...prev, ...newContent])
      } else {
        setContent(newContent)
      }

      setHasMore(pageNum < response.data.total_pages)
      setPage(pageNum)
    } catch (err) {
      console.error(`Error fetching ${contentType} ${category}:`, err)
      setError('Failed to load content. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }, [contentType, category, todayIso])

  const handleRefresh = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setRefreshing(true)
    setPage(1)
    setHasMore(true)
    fetchContent(1, false, todayIso)
  }, [fetchContent, todayIso])

  const handleLoadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      fetchContent(page + 1, true, todayIso)
    }
  }, [loading, loadingMore, hasMore, page, fetchContent, todayIso])

  const handleItemPress = useCallback((item) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (contentType === 'anime') {
      navigation.navigate('AnimeDetail', { animeId: item.id || item.unifiedId })
    } else {
      const screenName = item.first_air_date ? 'TVDetail' : 'MovieDetail'
      const paramName = item.first_air_date ? 'tvId' : 'movieId'
      navigation.navigate(screenName, { [paramName]: item.id })
    }
  }, [navigation, contentType])

  const renderItem = ({ item, index }) => {
    if (contentType === 'anime') {
      return (
        <View style={styles.cardWrapper}>
          <AnimeCard 
            anime={item} 
            onPress={() => handleItemPress(item)}
            index={index}
          />
        </View>
      )
    }

    return (
      <View style={styles.cardWrapper}>
        <ContentCard
          item={item}
          onPress={() => handleItemPress(item)}
          contentType={contentType}
          index={index}
        />
      </View>
    )
  }

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingMoreText}>Loading more...</Text>
        </View>
      )
    }

    if (!hasMore && content.length > 0) {
      return (
        <View style={styles.endMessage}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
          <Text style={styles.endMessageText}>You've reached the end</Text>
        </View>
      )
    }

    return null
  }

  const renderEmptyComponent = () => {
    if (loading) return null
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="film-outline" size={64} color={Colors.grayText} />
        <Text style={styles.emptyTitle}>No Content Found</Text>
        <Text style={styles.emptySubtitle}>Try refreshing or check back later</Text>
      </View>
    )
  }

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              navigation.goBack()
            }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title || 'Browse'}</Text>
          <View style={styles.placeholder} />
        </View>
        <LoadingSpinner />
      </SafeAreaView>
    )
  }

  if (error && !refreshing && content.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              navigation.goBack()
            }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title || 'Browse'}</Text>
          <View style={styles.placeholder} />
        </View>
        <ErrorMessage message={error} onRetry={handleRefresh} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            navigation.goBack()
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title || 'Browse'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content Grid */}
      <Animated.View style={[styles.listContainer, { opacity: fadeAnim }]}>
        <FlatList
          data={content}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${contentType}-${item.id}-${index}`}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyComponent}
          showsVerticalScrollIndicator={false}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
          initialNumToRender={10}
        />
      </Animated.View>

      {/* Result Count */}
      {content.length > 0 && (
        <View style={styles.resultCount}>
          <Text style={styles.resultCountText}>
            {content.length} item{content.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.black,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  placeholder: {
    width: 44,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginBottom: Spacing.lg,
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  loadingMoreText: {
    color: Colors.grayText,
    fontSize: 14,
    fontWeight: '500',
  },
  endMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  endMessageText: {
    color: Colors.grayText,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 3,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.grayText,
    textAlign: 'center',
  },
  resultCount: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  resultCountText: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
})

export default ViewAllScreen
