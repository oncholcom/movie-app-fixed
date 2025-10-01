import React, { createContext, useContext, useReducer, useMemo, useRef } from 'react'

// Action Types
const ACTION_TYPES = {
  SET_LOADING: 'SET_LOADING',
  SET_REFRESHING: 'SET_REFRESHING',
  SET_ERROR: 'SET_ERROR',
  SET_CONTENT_TYPE: 'SET_CONTENT_TYPE',
  SET_HERO_DATA: 'SET_HERO_DATA',
  SET_MOVIE_DATA: 'SET_MOVIE_DATA',
  SET_TV_DATA: 'SET_TV_DATA',
  SET_REGIONAL_DATA: 'SET_REGIONAL_DATA',
  SET_TODAY_ISO: 'SET_TODAY_ISO',
  SET_USED_IDS: 'SET_USED_IDS',
  ADD_USED_IDS: 'ADD_USED_IDS',
  INCREMENT_REFRESH_TOKEN: 'INCREMENT_REFRESH_TOKEN',
  RESET_STATE: 'RESET_STATE',
}

// Initial State
const initialState = {
  // UI State
  loading: true,
  refreshing: false,
  error: null,
  contentType: 'recommend',
  
  // Content State
  heroData: [],
  
  // Movie Data
  movieData: {
    trending: [],
    popular: [],
    topRated: [],
    upcoming: [],
  },
  
  // TV Data
  tvData: {
    trending: [],
    popular: [],
    topRated: [],
    onTheAir: [],
  },
  
  // Regional Content
  regionalData: {
    usPopularTV: [],
    southRecentMovies: [],
    topImdbRecentMovies: [],
    hindiRecentTV: [],
    bdBengaliRecentMovies: [],
    inBengaliRecentMovies: [],
    bengaliRecentTV: [],
    hollywoodNew: [],
    bollywoodNew: [],
    tamilNew: [],
  },
  
  // Metadata
  todayIso: null,
  usedIds: [],
  refreshToken: 0,
  sectionRefreshToken: 0,
}

// Reducer
const homeReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_LOADING:
      return { ...state, loading: action.payload }
      
    case ACTION_TYPES.SET_REFRESHING:
      return { ...state, refreshing: action.payload }
      
    case ACTION_TYPES.SET_ERROR:
      return { ...state, error: action.payload, loading: false }
      
    case ACTION_TYPES.SET_CONTENT_TYPE:
      return { ...state, contentType: action.payload }
      
    case ACTION_TYPES.SET_HERO_DATA:
      return { ...state, heroData: action.payload }
      
    case ACTION_TYPES.SET_MOVIE_DATA:
      return { 
        ...state, 
        movieData: { ...state.movieData, ...action.payload }
      }
      
    case ACTION_TYPES.SET_TV_DATA:
      return { 
        ...state, 
        tvData: { ...state.tvData, ...action.payload }
      }
      
    case ACTION_TYPES.SET_REGIONAL_DATA:
      return { 
        ...state, 
        regionalData: { ...state.regionalData, ...action.payload }
      }
      
    case ACTION_TYPES.SET_TODAY_ISO:
      return { ...state, todayIso: action.payload }
      
    case ACTION_TYPES.SET_USED_IDS:
      return { ...state, usedIds: action.payload }
      
    case ACTION_TYPES.ADD_USED_IDS:
      return { 
        ...state, 
        usedIds: Array.from(new Set([...state.usedIds, ...action.payload]))
      }
      
    case ACTION_TYPES.INCREMENT_REFRESH_TOKEN:
      return { 
        ...state, 
        refreshToken: state.refreshToken + 1,
        sectionRefreshToken: state.sectionRefreshToken + 1,
      }
      
    case ACTION_TYPES.RESET_STATE:
      return { ...initialState, todayIso: state.todayIso }
      
    default:
      return state
  }
}

// Context
const HomeContext = createContext(undefined)

// Provider Component
export const HomeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(homeReducer, initialState)
  const isMountedRef = useRef(true)
  
  // CRITICAL: Create actions ONCE using useMemo - prevents infinite loops
  const actions = useMemo(() => ({
    setLoading: (loading) => {
      if (isMountedRef.current) {
        dispatch({ type: ACTION_TYPES.SET_LOADING, payload: loading })
      }
    },
    
    setRefreshing: (refreshing) => {
      if (isMountedRef.current) {
        dispatch({ type: ACTION_TYPES.SET_REFRESHING, payload: refreshing })
      }
    },
    
    setError: (error) => {
      if (isMountedRef.current) {
        dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error })
      }
    },
    
    setContentType: (contentType) => {
      if (isMountedRef.current) {
        dispatch({ type: ACTION_TYPES.SET_CONTENT_TYPE, payload: contentType })
      }
    },
    
    setHeroData: (data) => {
      if (isMountedRef.current) {
        dispatch({ type: ACTION_TYPES.SET_HERO_DATA, payload: data })
      }
    },
    
    setMovieData: (data) => {
      if (isMountedRef.current) {
        dispatch({ type: ACTION_TYPES.SET_MOVIE_DATA, payload: data })
      }
    },
    
    setTVData: (data) => {
      if (isMountedRef.current) {
        dispatch({ type: ACTION_TYPES.SET_TV_DATA, payload: data })
      }
    },
    
    setRegionalData: (data) => {
      if (isMountedRef.current) {
        dispatch({ type: ACTION_TYPES.SET_REGIONAL_DATA, payload: data })
      }
    },
    
    setTodayIso: (iso) => {
      if (isMountedRef.current) {
        dispatch({ type: ACTION_TYPES.SET_TODAY_ISO, payload: iso })
      }
    },
    
    setUsedIds: (ids) => {
      if (isMountedRef.current) {
        dispatch({ type: ACTION_TYPES.SET_USED_IDS, payload: ids })
      }
    },
    
    addUsedIds: (ids) => {
      if (isMountedRef.current) {
        dispatch({ type: ACTION_TYPES.ADD_USED_IDS, payload: ids })
      }
    },
    
    incrementRefreshToken: () => {
      if (isMountedRef.current) {
        dispatch({ type: ACTION_TYPES.INCREMENT_REFRESH_TOKEN })
      }
    },
    
    resetState: () => {
      if (isMountedRef.current) {
        dispatch({ type: ACTION_TYPES.RESET_STATE })
      }
    },
  }), []) // EMPTY array - actions never change
  
  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])
  
  // CRITICAL: Use useMemo to prevent value object from changing
  const value = useMemo(() => ({
    state,
    actions,
  }), [state, actions])
  
  return <HomeContext.Provider value={value}>{children}</HomeContext.Provider>
}

// Custom Hook to use Home Context
export const useHomeContext = () => {
  const context = useContext(HomeContext)
  if (context === undefined) {
    throw new Error('useHomeContext must be used within a HomeProvider')
  }
  return context
}

// Selector Hooks for Optimized Re-renders
export const useHomeState = () => {
  const { state } = useHomeContext()
  return state
}

export const useHomeActions = () => {
  const { actions } = useHomeContext()
  return actions
}

export const useContentType = () => {
  const { state } = useHomeContext()
  return state.contentType
}

export const useHeroData = () => {
  const { state } = useHomeContext()
  return state.heroData
}

export const useMovieData = () => {
  const { state } = useHomeContext()
  return state.movieData
}

export const useTVData = () => {
  const { state } = useHomeContext()
  return state.tvData
}

export const useRegionalData = () => {
  const { state } = useHomeContext()
  return state.regionalData
}

export const useRefreshToken = () => {
  const { state } = useHomeContext()
  return state.sectionRefreshToken
}

export const useTodayIso = () => {
  const { state } = useHomeContext()
  return state.todayIso
}

export const useUsedIds = () => {
  const { state } = useHomeContext()
  return state.usedIds
}
