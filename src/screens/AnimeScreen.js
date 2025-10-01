import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  ScrollView,
  View,
  Text,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import AnimeSection from '../components/home/AnimeSection'  // ← FIXED PATH
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import SectionSkeleton from '../components/common/SectionSkeleton'
import { GlobalStyles, Spacing, BorderRadius } from '../styles/GlobalStyles'
import anilistApi from '../services/anilistApi'
import unifiedAnimeApi from '../services/unifiedAnimeApi'
import Colors from '../constants/Colors'


const { width, height } = Dimensions.get('window')
const FEATURED_HEIGHT = height * 0.45

const AnimeScreen = ({ navigation }) => {
  // Core state
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Content states
  const [featuredAnime, setFeaturedAnime] = useState(null)
  const [trendingAnime, setTrendingAnime] = useState([])
  const [popularAnime, setPopularAnime] = useState([])
  const [topRatedAnime, setTopRatedAnime] = useState([])
  const [thisSeasonAnime, setThisSeasonAnime] = useState([])
  const [upcomingAnime, setUpcomingAnime] = useState([])
  
  // Genre sections
  const [actionAnime, setActionAnime] = useState([])
  const [comedyAnime, setComedyAnime] = useState([])
  const [romanceAnime, setRomanceAnime] = useState([])
  const [fantasyAnime, setFantasyAnime] = useState([])
  const [sliceOfLifeAnime, setSliceOfLifeAnime] = useState([])
  const [dramaAnime, setDramaAnime] = useState([])
  
  // Search
  const [searchResults, setSearchResults] = useState([])
  
  const searchTimeoutRef = useRef(null)
  const scrollY = useRef(new Animated.Value(0)).current

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchQuery.length > 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchAnime()
      }, 500)
    } else {
      setSearchResults([])
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch main categories
      const [trending, popular, topRated, thisSeason, upcoming] = await Promise.all([
        anilistApi.getTrending(1, 20),
        anilistApi.getPopular(1, 20),
        anilistApi.getTopRated(1, 20),
        anilistApi.getThisSeason(1, 20),
        anilistApi.getUpcoming(1, 20),
      ])

      const trendingData = trending.Page?.media || []
      const popularData = popular.Page?.media || []
      const topRatedData = topRated.Page?.media || []
      const thisSeasonData = thisSeason.Page?.media || []
      const upcomingData = upcoming.Page?.media || []

      setTrendingAnime(trendingData)
      setPopularAnime(popularData)
      setTopRatedAnime(topRatedData)
      setThisSeasonAnime(thisSeasonData)
      setUpcomingAnime(upcomingData)
      setFeaturedAnime(trendingData[0])

      // Fetch genre sections
      fetchGenreSections()
    } catch (err) {
      console.error('Error fetching anime:', err)
      setError('Failed to load anime. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const fetchGenreSections = async () => {
    try {
      const [action, comedy, romance, fantasy, sliceOfLife, drama] = await Promise.all([
        anilistApi.getByGenre('Action', 1, 15),
        anilistApi.getByGenre('Comedy', 1, 15),
        anilistApi.getByGenre('Romance', 1, 15),
        anilistApi.getByGenre('Fantasy', 1, 15),
        anilistApi.getByGenre('Slice of Life', 1, 15),
        anilistApi.getByGenre('Drama', 1, 15),
      ])

      setActionAnime(action.Page?.media || [])
      setComedyAnime(comedy.Page?.media || [])
      setRomanceAnime(romance.Page?.media || [])
      setFantasyAnime(fantasy.Page?.media || [])
      setSliceOfLifeAnime(sliceOfLife.Page?.media || [])
      setDramaAnime(drama.Page?.media || [])
    } catch (err) {
      console.error('Error fetching genre sections:', err)
    }
  }

  const searchAnime = async () => {
    try {
      setSearchLoading(true)
      const results = await unifiedAnimeApi.searchAnime(searchQuery)
      setSearchResults(results.combined || [])
    } catch (err) {
      console.error('Error searching anime:', err)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchInitialData()
  }, [fetchInitialData])

  const handleItemPress = useCallback((anime) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    navigation.navigate('AnimeDetail', { animeId: anime.id })
  }, [navigation])

  const handleClearSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSearchQuery('')
    setSearchResults([])
  }

  // Get season badge
  const getSeasonBadge = (anime) => {
    if (anime?.season && anime?.seasonYear) {
      const season = anime.season.charAt(0) + anime.season.slice(1).toLowerCase()
      return `${season} ${anime.seasonYear}`
    }
    return null
  }

  // Animated header
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, FEATURED_HEIGHT - 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  })

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Anime</Text>
        </View>
        <ScrollView>
          <SectionSkeleton />
          <SectionSkeleton />
          <SectionSkeleton />
        </ScrollView>
      </SafeAreaView>
    )
  }

  if (error && !refreshing) {
    return <ErrorMessage message={error} onRetry={handleRefresh} />
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <Text style={styles.headerTitle}>Anime</Text>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.grayText} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search anime..."
              placeholderTextColor={Colors.grayText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={20} color={Colors.grayText} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Results */}
        {searchQuery.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {searchLoading ? 'Searching...' : `Search Results for "${searchQuery}"`}
            </Text>
            {!searchLoading && searchResults.length > 0 && (
              <AnimeSection
                animeList={searchResults}
                onItemPress={handleItemPress}
              />
            )}
            {!searchLoading && searchResults.length === 0 && searchQuery.length > 2 && (
              <Text style={styles.noResultsText}>No results found</Text>
            )}
          </View>
        ) : (
          <>
            {/* Featured Hero Section */}
            {featuredAnime && (
              <TouchableOpacity
                style={styles.featuredContainer}
                activeOpacity={0.95}
                onPress={() => handleItemPress(featuredAnime)}
              >
                <Image
                  source={{ 
                    uri: featuredAnime.bannerImage || featuredAnime.coverImage?.extraLarge 
                  }}
                  style={styles.featuredImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)', Colors.black]}
                  style={styles.featuredGradient}
                >
                  <View style={styles.featuredContent}>
                    <View style={styles.featuredBadges}>
                      <View style={styles.trendingBadge}>
                        <Ionicons name="trending-up" size={14} color={Colors.white} />
                        <Text style={styles.badgeText}>Trending #1</Text>
                      </View>
                      {getSeasonBadge(featuredAnime) && (
                        <View style={styles.seasonBadge}>
                          <Text style={styles.badgeText}>
                            {getSeasonBadge(featuredAnime)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.featuredTitle} numberOfLines={2}>
                      {featuredAnime.title?.english || featuredAnime.title?.romaji}
                    </Text>
                    {featuredAnime.averageScore && (
                      <View style={styles.featuredRating}>
                        <Ionicons name="star" size={16} color={Colors.yellow} />
                        <Text style={styles.ratingText}>
                          {(featuredAnime.averageScore / 10).toFixed(1)}
                        </Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Main Category Sections */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
              <AnimeSection
                animeList={trendingAnime}
                onItemPress={handleItemPress}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📺 This Season</Text>
              <AnimeSection
                animeList={thisSeasonAnime}
                onItemPress={handleItemPress}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⭐ Most Popular</Text>
              <AnimeSection
                animeList={popularAnime}
                onItemPress={handleItemPress}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🏆 Top Rated All Time</Text>
              <AnimeSection
                animeList={topRatedAnime}
                onItemPress={handleItemPress}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔜 Coming Soon</Text>
              <AnimeSection
                animeList={upcomingAnime}
                onItemPress={handleItemPress}
              />
            </View>

            {/* Genre Sections Header */}
            <View style={styles.genreHeader}>
              <Ionicons name="film-outline" size={24} color={Colors.primary} />
              <Text style={styles.genreHeaderTitle}>Browse by Genre</Text>
            </View>

            {/* Genre Sections */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚔️ Action</Text>
              <AnimeSection
                animeList={actionAnime}
                onItemPress={handleItemPress}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>😂 Comedy</Text>
              <AnimeSection
                animeList={comedyAnime}
                onItemPress={handleItemPress}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💕 Romance</Text>
              <AnimeSection
                animeList={romanceAnime}
                onItemPress={handleItemPress}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔮 Fantasy</Text>
              <AnimeSection
                animeList={fantasyAnime}
                onItemPress={handleItemPress}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🌸 Slice of Life</Text>
              <AnimeSection
                animeList={sliceOfLifeAnime}
                onItemPress={handleItemPress}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎭 Drama</Text>
              <AnimeSection
                animeList={dramaAnime}
                onItemPress={handleItemPress}
              />
            </View>
          </>
        )}

        <View style={styles.bottomPadding} />
      </Animated.ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.mediumGray,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  featuredContainer: {
    width,
    height: FEATURED_HEIGHT,
    marginBottom: Spacing.lg,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
    justifyContent: 'flex-end',
  },
  featuredContent: {
    padding: Spacing.lg,
  },
  featuredBadges: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  seasonBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  featuredTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  featuredRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: Colors.yellow,
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  genreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  genreHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.white,
  },
  noResultsText: {
    color: Colors.grayText,
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  bottomPadding: {
    height: Spacing.xl,
  },
})

export default AnimeScreen
