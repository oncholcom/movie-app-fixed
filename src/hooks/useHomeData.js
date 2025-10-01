import { useEffect, useCallback, useRef, useState } from 'react'
import { useHomeContext } from '../context/HomeContext'
import { getMovies, getTVShows, getRegionalContent } from '../services/api'
import { getTodayIsoDate } from '../utils/helpers'

export const useHomeData = () => {
  const { state, actions } = useHomeContext()
  const fetchTimeoutRef = useRef(null)
  const isMountedRef = useRef(true)
  const hasInitializedRef = useRef(false)
  const [criticalLoaded, setCriticalLoaded] = useState(false)

  // Fetch CRITICAL content first (hero + trending)
  const fetchCriticalData = useCallback(async () => {
    try {
      const [trendingMoviesRes, trendingTVRes] = await Promise.all([
        getMovies.trending(),
        getTVShows.trending(),
      ])

      if (isMountedRef.current) {
        // Set hero data immediately
        const trendingMovies = trendingMoviesRes.data.results || []
        const trendingTV = trendingTVRes.data.results || []
        
        actions.setHeroData(trendingMovies.slice(0, 5))
        
        // Set trending data for initial sections
        actions.setMovieData({
          trending: trendingMovies,
          popular: [],
          topRated: [],
          upcoming: [],
        })
        
        actions.setTVData({
          trending: trendingTV,
          popular: [],
          topRated: [],
          onTheAir: [],
        })

        setCriticalLoaded(true)
        actions.setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching critical ', error)
      if (isMountedRef.current) {
        actions.setError('Failed to load content. Please try again.')
        actions.setLoading(false)
      }
      throw error
    }
  }, [actions])

  // Fetch remaining movie and TV data
  const fetchRemainingMovieTV = useCallback(async () => {
    try {
      const [popular, topRated, upcoming, popularTV, topRatedTV, onTheAirTV] = await Promise.all([
        getMovies.popular(),
        getMovies.topRated(),
        getMovies.upcoming(),
        getTVShows.popular(),
        getTVShows.topRated(),
        getTVShows.onTheAir(),
      ])

      if (isMountedRef.current) {
        actions.setMovieData({
          popular: popular.data.results || [],
          topRated: topRated.data.results || [],
          upcoming: upcoming.data.results || [],
        })
        
        actions.setTVData({
          popular: popularTV.data.results || [],
          topRated: topRatedTV.data.results || [],
          onTheAir: onTheAirTV.data.results || [],
        })
      }
    } catch (error) {
      console.error('Error fetching remaining movie/TV ', error)
    }
  }, [actions])

  // Fetch regional content (lowest priority)
  const fetchRegionalData = useCallback(async (isoDate) => {
    try {
      const [
        usPopularTV,
        southRecentMovies,
        topImdbRecentMovies,
        hindiRecentTV,
        bdBengaliRecentMovies,
        inBengaliRecentMovies,
        bengaliRecentTV,
        hollywoodNew,
        bollywoodNew,
        tamilNew,
      ] = await Promise.all([
        getRegionalContent.tvUSPopular(isoDate),
        getRegionalContent.moviesSouthIndiaRecent(isoDate),
        getRegionalContent.moviesTopImdbRecent(isoDate),
        getRegionalContent.tvHindiRecent(isoDate),
        getRegionalContent.moviesBengaliBDRecent(isoDate),
        getRegionalContent.moviesBengaliINRecent(isoDate),
        getRegionalContent.tvBengaliBDINRecent(isoDate),
        getRegionalContent.hollywoodNewlyReleased(isoDate),
        getRegionalContent.bollywoodHindiNewlyReleased(isoDate),
        getRegionalContent.tamilNewlyReleased(isoDate),
      ])

      const imdbSorted = (topImdbRecentMovies.data.results || []).slice().sort((a, b) => {
        const yearA = parseInt((a.release_date || '').slice(0, 4)) || 0
        const yearB = parseInt((b.release_date || '').slice(0, 4)) || 0
        if (yearB !== yearA) return yearB - yearA
        return (b.vote_average || 0) - (a.vote_average || 0)
      })

      if (isMountedRef.current) {
        actions.setRegionalData({
          usPopularTV: usPopularTV.data.results || [],
          southRecentMovies: southRecentMovies.data.results || [],
          topImdbRecentMovies: imdbSorted,
          hindiRecentTV: hindiRecentTV.data.results || [],
          bdBengaliRecentMovies: bdBengaliRecentMovies.data.results || [],
          inBengaliRecentMovies: inBengaliRecentMovies.data.results || [],
          bengaliRecentTV: bengaliRecentTV.data.results || [],
          hollywoodNew: hollywoodNew.data.results || [],
          bollywoodNew: bollywoodNew.data.results || [],
          tamilNew: tamilNew.data.results || [],
        })
      }
    } catch (error) {
      console.error('Error fetching regional ', error)
    }
  }, [actions])

  // PROGRESSIVE LOADING: Load in stages
  const fetchAllData = useCallback(async (isoOverride) => {
    try {
      actions.setError(null)
      actions.setUsedIds([])

      const isoDate = isoOverride || state.todayIso

      // STAGE 1: Load critical content (hero + trending) - FAST
      await fetchCriticalData()

      // STAGE 2: Load remaining movie/TV content - MEDIUM PRIORITY
      setTimeout(() => {
        if (isMountedRef.current) {
          fetchRemainingMovieTV()
        }
      }, 100)

      // STAGE 3: Load regional content - LOW PRIORITY
      setTimeout(() => {
        if (isMountedRef.current) {
          fetchRegionalData(isoDate)
          actions.incrementRefreshToken()
        }
      }, 500)

    } catch (err) {
      console.error('Error fetching ', err)
      if (isMountedRef.current) {
        actions.setError('Failed to load content. Please try again.')
        actions.setLoading(false)
      }
    } finally {
      if (isMountedRef.current) {
        actions.setRefreshing(false)
      }
    }
  }, [state.todayIso, actions, fetchCriticalData, fetchRemainingMovieTV, fetchRegionalData])

  // Initialize today's ISO date
  const initializeTodayIso = useCallback(async () => {
    try {
      const iso = await getTodayIsoDate()
      if (isMountedRef.current) {
        actions.setTodayIso(iso)
      }
      return iso
    } catch (error) {
      console.error('Error getting today ISO:', error)
      return null
    }
  }, [actions])

  // Refresh handler
  const handleRefresh = useCallback(() => {
    actions.setRefreshing(true)
    setCriticalLoaded(false)
    fetchAllData(state.todayIso)
  }, [actions, fetchAllData, state.todayIso])

  // Initial data fetch
  useEffect(() => {
    if (hasInitializedRef.current) return
    hasInitializedRef.current = true

    const init = async () => {
      const iso = await initializeTodayIso()
      await fetchAllData(iso)
    }
    init()
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (fetchTimeoutRef.current) {
        clearInterval(fetchTimeoutRef.current)
      }
    }
  }, [])

  return {
    loading: state.loading,
    refreshing: state.refreshing,
    error: state.error,
    criticalLoaded,
    handleRefresh,
    refetch: fetchAllData,
  }
}
