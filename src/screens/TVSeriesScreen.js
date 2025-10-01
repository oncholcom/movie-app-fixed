import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  ScrollView,
  View,
  Text,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Modal,
  Dimensions,
} from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import CategorySection from '../components/home/CategorySection'
import CustomFetchSection from '../components/home/CustomFetchSection'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'
import SectionSkeleton from '../components/common/SectionSkeleton'
import { GlobalStyles, Spacing, BorderRadius } from '../styles/GlobalStyles'
import {
  getTVShows,
  getTVByGenre,
  getTVByYear,
  getPopularByLanguage,
  getBackdropUrl,
  TV_GENRES,
  POPULAR_LANGUAGES,
  RECENT_YEARS,
  getRegionalContent,
} from '../services/api'
import { getTodayIsoDate } from '../utils/helpers'
import Colors from '../constants/Colors'

const { width, height } = Dimensions.get('window')
const FEATURED_HEIGHT = height * 0.4

const FILTER_TYPES = [
  { id: 'genre', name: 'Genre', icon: 'film' },
  { id: 'language', name: 'Language', icon: 'globe' },
  { id: 'year', name: 'Year', icon: 'calendar' },
  { id: 'category', name: 'Category', icon: 'star' },
]

const CATEGORIES = [
  { id: 'popular', name: 'Popular', icon: 'flame' },
  { id: 'trending', name: 'Trending', icon: 'trending-up' },
  { id: 'top_rated', name: 'Top Rated', icon: 'trophy' },
  { id: 'on_the_air', name: 'On Air', icon: 'radio' },
]

const TVSeriesScreen = ({ navigation, route }) => {
  // Core state
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [todayIso, setTodayIso] = useState(null)
  
  // Filter state
  const [filterType, setFilterType] = useState('category')
  const [selectedGenre, setSelectedGenre] = useState('action')
  const [selectedLanguage, setSelectedLanguage] = useState('english')
  const [selectedYear, setSelectedYear] = useState(2024)
  const [selectedCategory, setSelectedCategory] = useState('popular')
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  
  // Content state
  const [allShows, setAllShows] = useState({
    popular: [],
    trending: [],
    topRated: [],
    onTheAir: [],
    featured: null,
  })
  
  const [filteredContent, setFilteredContent] = useState([])
  const scrollY = useRef(new Animated.Value(0)).current

  // Handle route params
  useEffect(() => {
    if (route.params?.category) {
      setFilterType('category')
      setSelectedCategory(route.params.category)
    }
  }, [route.params])

  // Initial data fetch
  useEffect(() => {
    fetchTodayIso()
    fetchInitialData()
  }, [])

  // Fetch filtered content when filter changes
  useEffect(() => {
    fetchFilteredContent()
  }, [filterType, selectedGenre, selectedLanguage, selectedYear, selectedCategory])

  const fetchTodayIso = async () => {
    try {
      const iso = await getTodayIsoDate()
      setTodayIso(iso)
    } catch (error) {
      console.error('Error fetching today ISO:', error)
    }
  }

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [popular, trending, topRated, onTheAir] = await Promise.all([
        getTVShows.popular(),
        getTVShows.trending(),
        getTVShows.topRated(),
        getTVShows.onTheAir(),
      ])

      const shows = {
        popular: popular.data.results || [],
        trending: trending.data.results || [],
        topRated: topRated.data.results || [],
        onTheAir: onTheAir.data.results || [],
        featured: popular.data.results?.[0] || null,
      }

      setAllShows(shows)
      setFilteredContent(shows.popular)
    } catch (err) {
      console.error('Error fetching TV shows:', err)
      setError('Failed to load TV shows. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const fetchFilteredContent = async () => {
    try {
      let content = []
      
      switch (filterType) {
        case 'genre':
          const genreRes = await getTVByGenre[selectedGenre]()
          content = genreRes.data.results || []
          break
        case 'language':
          const langRes = await getPopularByLanguage.tv[selectedLanguage]()
          content = langRes.data.results || []
          break
        case 'year':
          const yearRes = await getTVByYear(selectedYear)
          content = yearRes.data.results || []
          break
        case 'category':
          content = allShows[selectedCategory] || []
          break
      }
      
      setFilteredContent(content)
    } catch (err) {
      console.error('Error fetching filtered content:', err)
    }
  }

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchInitialData()
  }, [])

  const handleItemPress = useCallback((item) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    navigation.navigate('TVDetail', { tvId: item.id })
  }, [navigation])

  const handleFilterTypeChange = (type) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setFilterType(type)
  }

  const handleFilterChange = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    switch (filterType) {
      case 'genre': setSelectedGenre(id); break
      case 'language': setSelectedLanguage(id); break
      case 'year': setSelectedYear(id); break
      case 'category': setSelectedCategory(id); break
    }
    setFilterModalVisible(false)
  }

  // Get current filter options
  const currentFilterOptions = useMemo(() => {
    switch (filterType) {
      case 'genre': return TV_GENRES
      case 'language': return POPULAR_LANGUAGES
      case 'year': return RECENT_YEARS
      case 'category': return CATEGORIES
      default: return []
    }
  }, [filterType])

  // Get current active filter
  const currentActiveFilter = useMemo(() => {
    switch (filterType) {
      case 'genre': return selectedGenre
      case 'language': return selectedLanguage
      case 'year': return selectedYear
      case 'category': return selectedCategory
      default: return null
    }
  }, [filterType, selectedGenre, selectedLanguage, selectedYear, selectedCategory])

  // Get current section title
  const currentSectionTitle = useMemo(() => {
    switch (filterType) {
      case 'genre':
        return TV_GENRES.find(g => g.id === selectedGenre)?.name || 'TV Shows'
      case 'language':
        return `${POPULAR_LANGUAGES.find(l => l.id === selectedLanguage)?.name || ''} TV Shows`
      case 'year':
        return `${selectedYear} TV Shows`
      case 'category':
        return CATEGORIES.find(c => c.id === selectedCategory)?.name || 'TV Shows'
      default:
        return 'TV Shows'
    }
  }, [filterType, selectedGenre, selectedLanguage, selectedYear, selectedCategory])

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
          <Text style={styles.headerTitle}>TV Series</Text>
        </View>
        <ScrollView style={styles.scrollView}>
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
        <Text style={styles.headerTitle}>TV Series</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="options" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>
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
        {/* Featured TV Show Hero */}
        {allShows.featured && (
          <TouchableOpacity
            style={styles.featuredContainer}
            activeOpacity={0.95}
            onPress={() => handleItemPress(allShows.featured)}
          >
            <Image
              source={{ uri: getBackdropUrl(allShows.featured.backdrop_path) }}
              style={styles.featuredImage}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.9)']}
              style={styles.featuredGradient}
            >
              <View style={styles.featuredContent}>
                <View style={styles.featuredBadge}>
                  <Ionicons name="tv" size={14} color={Colors.white} />
                  <Text style={styles.featuredBadgeText}>Featured Series</Text>
                </View>
                <Text style={styles.featuredTitle} numberOfLines={2}>
                  {allShows.featured.name}
                </Text>
                <Text style={styles.featuredOverview} numberOfLines={3}>
                  {allShows.featured.overview}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Filter Type Selector */}
        <View style={styles.filterTypeContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {FILTER_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.filterTypeButton,
                  filterType === type.id && styles.filterTypeButtonActive,
                ]}
                onPress={() => handleFilterTypeChange(type.id)}
              >
                <Ionicons
                  name={type.icon}
                  size={18}
                  color={filterType === type.id ? Colors.white : Colors.grayText}
                />
                <Text
                  style={[
                    styles.filterTypeText,
                    filterType === type.id && styles.filterTypeTextActive,
                  ]}
                >
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Filtered Content Section */}
        <CategorySection
          title={currentSectionTitle}
          data={filteredContent}
          contentType="tv"
          onItemPress={handleItemPress}
        />

        {/* Always Show Popular Sections */}
        <CategorySection
          title="Popular TV Shows"
          data={allShows.popular}
          contentType="tv"
          onItemPress={handleItemPress}
        />

        <CategorySection
          title="Trending Now"
          data={allShows.trending}
          contentType="tv"
          onItemPress={handleItemPress}
        />

        <CategorySection
          title="Top Rated"
          data={allShows.topRated}
          contentType="tv"
          onItemPress={handleItemPress}
        />

        <CategorySection
          title="On Air Now"
          data={allShows.onTheAir}
          contentType="tv"
          onItemPress={handleItemPress}
        />

        {/* Regional Content Header */}
        {todayIso && (
          <>
            <View style={styles.regionalHeader}>
              <Ionicons name="globe-outline" size={24} color={Colors.primary} />
              <Text style={styles.regionalTitle}>Regional TV Shows</Text>
            </View>

            {/* Popular US TV Shows */}
            <CustomFetchSection
              title="🇺🇸 Popular US TV"
              contentType="tv"
              fetchFn={getRegionalContent.tvUSPopular}
              onItemPress={handleItemPress}
              todayIso={todayIso}
            />

            {/* Hindi TV Shows */}
            <CustomFetchSection
              title="🇮🇳 Hindi TV Shows"
              contentType="tv"
              fetchFn={getRegionalContent.tvHindiRecent}
              onItemPress={handleItemPress}
              todayIso={todayIso}
            />

            {/* Bengali TV Shows (BD + India) */}
            <CustomFetchSection
              title="📺 Bengali TV Shows"
              contentType="tv"
              fetchFn={getRegionalContent.tvBengaliBDINRecent}
              onItemPress={handleItemPress}
              todayIso={todayIso}
            />

            {/* Korean Drama */}
            <CustomFetchSection
              title="🇰🇷 Korean Drama"
              contentType="tv"
              fetchFn={async () => await getPopularByLanguage.tv.korean()}
              onItemPress={handleItemPress}
              todayIso={todayIso}
            />

            {/* Japanese Drama */}
            <CustomFetchSection
              title="🇯🇵 Japanese Drama"
              contentType="tv"
              fetchFn={async () => await getPopularByLanguage.tv.japanese()}
              onItemPress={handleItemPress}
              todayIso={todayIso}
            />

            {/* Spanish TV Shows */}
            <CustomFetchSection
              title="🇪🇸 Spanish TV Shows"
              contentType="tv"
              fetchFn={async () => await getPopularByLanguage.tv.spanish()}
              onItemPress={handleItemPress}
              todayIso={todayIso}
            />

            {/* British TV Shows */}
            <CustomFetchSection
              title="🇬🇧 British TV"
              contentType="tv"
              fetchFn={async () => await getPopularByLanguage.tv.english()}
              onItemPress={handleItemPress}
              todayIso={todayIso}
            />

            {/* Turkish Drama */}
            <CustomFetchSection
              title="🇹🇷 Turkish Drama"
              contentType="tv"
              fetchFn={async () => await getPopularByLanguage.tv.turkish()}
              onItemPress={handleItemPress}
              todayIso={todayIso}
            />
          </>
        )}

        <View style={styles.bottomPadding} />
      </Animated.ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {FILTER_TYPES.find(f => f.id === filterType)?.name}
              </Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={28} color={Colors.white} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {currentFilterOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.modalOption,
                    currentActiveFilter === option.id && styles.modalOptionActive,
                  ]}
                  onPress={() => handleFilterChange(option.id)}
                >
                  {option.icon && (
                    <Ionicons
                      name={option.icon}
                      size={20}
                      color={currentActiveFilter === option.id ? Colors.primary : Colors.grayText}
                    />
                  )}
                  <Text
                    style={[
                      styles.modalOptionText,
                      currentActiveFilter === option.id && styles.modalOptionTextActive,
                    ]}
                  >
                    {option.name}
                  </Text>
                  {currentActiveFilter === option.id && (
                    <Ionicons name="checkmark" size={24} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.black,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.mediumGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
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
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
    marginBottom: Spacing.sm,
  },
  featuredBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  featuredTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  featuredOverview: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    lineHeight: 20,
  },
  filterTypeContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  filterTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.mediumGray,
    marginRight: Spacing.sm,
    gap: 6,
  },
  filterTypeButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.grayText,
  },
  filterTypeTextActive: {
    color: Colors.white,
  },
  regionalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  regionalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.darkGray,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  modalScroll: {
    padding: Spacing.md,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: Colors.mediumGray,
  },
  modalOptionActive: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  modalOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  modalOptionTextActive: {
    color: Colors.primary,
  },
  bottomPadding: {
    height: Spacing.xl,
  },
})

export default TVSeriesScreen
