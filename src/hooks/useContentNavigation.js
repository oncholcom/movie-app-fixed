import { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../context/AuthContext'

/**
 * Custom hook for handling all content navigation logic
 * Consolidates navigation handlers into a single reusable hook
 */
export const useContentNavigation = () => {
  const navigation = useNavigation()
  const { isAuthenticated, subscription } = useAuth()
  const hasActiveSubscription = isAuthenticated && subscription?.status === 'active'

  // Handle item press - navigate to detail screen
  const handleItemPress = useCallback((item) => {
    // Handle Continue Watching items that have a 'type' property
    if (item.type) {
      if (item.type === 'tv') {
        navigation.navigate('TVDetail', { tvId: item.id })
      } else if (item.type === 'movie') {
        navigation.navigate('MovieDetail', { movieId: item.id })
      }
      return
    }

    // Handle regular items from API that have first_air_date
    const screenName = item.first_air_date ? 'TVDetail' : 'MovieDetail'
    const paramName = item.first_air_date ? 'tvId' : 'movieId'
    navigation.navigate(screenName, { [paramName]: item.id })
  }, [navigation])

  // Handle play press - navigate to video player or show premium modal
  const handlePlayPress = useCallback((item, onShowPremiumModal) => {
    if (!hasActiveSubscription) {
      if (onShowPremiumModal) {
        onShowPremiumModal()
      }
      return false
    }

    const contentType = item.first_air_date ? 'tv' : 'movie'
    const title = item.title || item.name

    navigation.navigate('VideoPlayer', {
      movieId: contentType === 'movie' ? item.id : null,
      tvId: contentType === 'tv' ? item.id : null,
      contentType: contentType,
      title: title,
      season: 1,
      episode: 1,
    })

    return true
  }, [hasActiveSubscription, navigation])

  // Handle anime item press
  const handleAnimeItemPress = useCallback((anime) => {
    navigation.navigate('AnimeDetail', { animeId: anime.id })
  }, [navigation])

  // View All handlers
  const handleViewAllMovies = useCallback((category) => {
    const categoryTitles = {
      popular: 'Popular Movies',
      trending: 'Trending Movies',
      top_rated: 'Top Rated Movies',
      upcoming: 'Coming Soon',
      south_recent: 'Recent South Indian Movies',
      imdb_top_recent: 'Recent Top IMDb Movies',
      bengali_bd_recent: '🇧🇩 Recent Bengali Movies (BD)',
      bengali_in_recent: '🇮🇳 Recent Indian Bengali Movies',
      hollywood_new: 'Hollywood – Newly Released',
      bollywood_new: 'Bollywood (Hindi) – Newly Released',
      tamil_new: 'Tamil – Newly Released',
    }

    navigation.navigate('ViewAll', {
      contentType: 'movie',
      category: category,
      title: categoryTitles[category] || 'Movies',
    })
  }, [navigation])

  const handleViewAllTV = useCallback((category) => {
    const categoryTitles = {
      popular: 'Popular TV Shows',
      trending: 'Trending TV Shows',
      top_rated: 'Top Rated TV Shows',
      on_the_air: 'On Air Now',
      airing_today: 'New Episodes Today',
      popular_us: 'Popular TV Shows (US)',
      hindi_recent: 'Recent Hindi TV Shows',
      bengali_recent: '📺 Recent Bengali TV Shows (BD + Indian)',
    }

    navigation.navigate('ViewAll', {
      contentType: 'tv',
      category: category,
      title: categoryTitles[category] || 'TV Shows',
    })
  }, [navigation])

  const handleViewAllBollywood = useCallback(() => {
    navigation.navigate('ViewAll', {
      contentType: 'movie',
      category: 'bollywood',
      title: 'Bollywood Movies',
    })
  }, [navigation])

  const handleViewAllAnimation = useCallback(() => {
    navigation.navigate('ViewAll', {
      contentType: 'movie',
      category: 'animation',
      title: 'Animation Movies',
    })
  }, [navigation])

  const handleViewAllAnime = useCallback(() => {
    navigation.navigate('ViewAll', {
      contentType: 'anime',
      category: 'popular',
      title: 'Popular Anime',
    })
  }, [navigation])

  return {
    handleItemPress,
    handlePlayPress,
    handleAnimeItemPress,
    handleViewAllMovies,
    handleViewAllTV,
    handleViewAllBollywood,
    handleViewAllAnimation,
    handleViewAllAnime,
  }
}
