"use client"

import { useState, useCallback } from "react"
import { useFocusEffect } from "@react-navigation/native"
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"

// Components
import HeroSlider from "../components/home/HeroSection"
import CategorySection from "../components/home/CategorySection"
import BollywoodSection from "../components/home/BollywoodSection"
import AnimationSection from "../components/home/AnimationSection"
import AnimeSection from "../components/home/AnimeSection"
import ContinueWatchingSection from "../components/home/ContinueWatchingSection"
import LoadingSpinner from "../components/common/LoadingSpinner"
import ErrorMessage from "../components/common/ErrorMessage"
import PremiumRequiredModal from "../components/common/PremiumRequiredModal"
import HeroSkeleton from "../components/common/HeroSkeleton"
import SectionSkeleton from "../components/common/SectionSkeleton"
import CustomFetchSection from "../components/home/CustomFetchSection"
import NewEpisodesSection from "../components/home/NewEpisodesSection"

// Styles & Constants
import { GlobalStyles, Spacing } from "../styles/GlobalStyles"
import Colors from "../constants/Colors"

// Context & Hooks
import { useAuth } from "../context/AuthContext"
import { 
  useHomeActions,
  useHeroData,
  useRefreshToken,
  useTodayIso,
} from "../context/HomeContext"
import { useHomeData } from "../hooks/useHomeData"
import { useContentNavigation } from "../hooks/useContentNavigation"

// Services
import { search as tmdbSearch, getRegionalContent, getPopularByLanguage } from "../services/api"
import unifiedAnimeApi from "../services/unifiedAnimeApi"

const HomeScreen = ({ navigation }) => {
  // ==================== CONTEXT & HOOKS ====================
  const { isAuthenticated } = useAuth()
  const heroData = useHeroData()
  const refreshToken = useRefreshToken()
  const todayIso = useTodayIso()
  const actions = useHomeActions()
  
  // Custom hooks
  const { loading, refreshing, error, handleRefresh } = useHomeData()
  const {
    handleItemPress,
    handlePlayPress,
    handleAnimeItemPress,
    handleViewAllMovies,
    handleViewAllTV,
    handleViewAllBollywood,
    handleViewAllAnimation,
    handleViewAllAnime,
  } = useContentNavigation()

  // ==================== LOCAL STATE ====================
  const [premiumModalVisible, setPremiumModalVisible] = useState(false)
  const [searchVisible, setSearchVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchTab, setSearchTab] = useState("movie")
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)

  // ==================== HANDLERS ====================
  
  // Handle play press with premium check
  const handlePlayPressWithModal = useCallback((item) => {
    const success = handlePlayPress(item, () => setPremiumModalVisible(true))
    if (!success) {
      setPremiumModalVisible(true)
    }
  }, [handlePlayPress])

  // Search functionality
  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearchLoading(true)
    setSearchError(null)
    
    try {
      if (searchTab === "movie") {
        const res = await tmdbSearch.movies(searchQuery)
        setSearchResults(res.data.results || [])
      } else if (searchTab === "tv") {
        const res = await tmdbSearch.tv(searchQuery)
        setSearchResults(res.data.results || [])
      } else if (searchTab === "anime") {
        const res = await unifiedAnimeApi.searchAnime(searchQuery)
        setSearchResults(res.combined || [])
      }
    } catch (err) {
      setSearchError("Failed to search. Please try again.")
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearchResultPress = (item) => {
    if (searchTab === "movie") {
      navigation.navigate("MovieDetail", { movieId: item.id })
    } else if (searchTab === "tv") {
      navigation.navigate("TVDetail", { tvId: item.id })
    } else if (searchTab === "anime") {
      navigation.navigate("AnimeDetail", { animeId: item.id })
    }
    setSearchVisible(false)
    setSearchQuery("")
    setSearchResults([])
  }

  // Increment refresh key on screen focus
  useFocusEffect(
    useCallback(() => {
      actions.incrementRefreshToken()
    }, [actions])
  )

  // ==================== RENDER METHODS ====================
  
  const renderContent = () => {
    const contentType = 'recommend'

    switch (contentType) {
      case "movie":
        return (
          <>
            <CategorySection
              title="Popular Movies"
              onItemPress={handleItemPress}
              contentType="movie"
              category="popular"
              showSeeAll
              onViewAll={() => handleViewAllMovies("popular")}
            />
            
            <CategorySection
              title="Top Rated Movies"
              onItemPress={handleItemPress}
              contentType="movie"
              category="top_rated"
              showSeeAll
              onViewAll={() => handleViewAllMovies("top_rated")}
            />
            
            <CategorySection
              title="Coming Soon"
              onItemPress={handleItemPress}
              contentType="movie"
              category="upcoming"
              showSeeAll
              onViewAll={() => handleViewAllMovies("upcoming")}
            />
          </>
        )

      case "tv":
        return (
          <>
            <CategorySection
              title="Popular TV Shows"
              onItemPress={handleItemPress}
              contentType="tv"
              category="popular"
              showSeeAll
              onViewAll={() => handleViewAllTV("popular")}
            />
            
            <CategorySection
              title="Top Rated TV Shows"
              onItemPress={handleItemPress}
              contentType="tv"
              category="top_rated"
              showSeeAll
              onViewAll={() => handleViewAllTV("top_rated")}
            />
            
            <CategorySection
              title="On Air Now"
              onItemPress={handleItemPress}
              contentType="tv"
              category="on_the_air"
              showSeeAll
              onViewAll={() => handleViewAllTV("on_the_air")}
            />
          </>
        )

      default: // recommend
        return (
          <>
            {/* Continue Watching - Only for authenticated users */}
            {isAuthenticated && (
              <ContinueWatchingSection 
                onItemPress={handleItemPress} 
                navigation={navigation} 
                key={refreshToken} 
              />
            )}

            {/* New Episodes Today */}
            <NewEpisodesSection
              onItemPress={handleItemPress}
              onViewAll={() => handleViewAllTV("airing_today")}
            />

            {/* Popular Movies */}
            <CategorySection
              title="Popular Movies"
              onItemPress={handleItemPress}
              contentType="movie"
              category="popular"
              showSeeAll
              onViewAll={() => handleViewAllMovies("popular")}
            />

            {/* Bollywood Section */}
            <BollywoodSection
              contentType="movie"
              onItemPress={handleItemPress}
              onViewAll={handleViewAllBollywood}
            />

            {/* Animation Section */}
            <AnimationSection
              contentType="movie"
              onItemPress={handleItemPress}
              sectionTitle="Animation"
              onViewAll={handleViewAllAnimation}
              refreshToken={refreshToken}
            />

            {/* Anime Section */}
            <AnimeSection
              onItemPress={handleAnimeItemPress}
              onViewAll={handleViewAllAnime}
              refreshToken={refreshToken}
            />

            {/* Regional Content Sections - SHORTER TITLES */}
            
            {/* Popular TV Shows (US) */}
            <CustomFetchSection
              title="Popular US TV" // SHORTENED
              contentType="tv"
              fetchFn={getRegionalContent.tvUSPopular}
              onItemPress={handleItemPress}
              todayIso={todayIso}
              onViewAll={() => handleViewAllTV("popular_us")}
              filterRecent={false}
              rotateWindow={false}
              refreshToken={refreshToken}
            />

            {/* Recent South Indian Movies */}
            <CustomFetchSection
              title="South Indian Movies" // SHORTENED
              contentType="movie"
              fetchFn={getRegionalContent.moviesSouthIndiaRecent}
              onItemPress={handleItemPress}
              todayIso={todayIso}
              onViewAll={() => handleViewAllMovies("south_recent")}
              filterRecent={false}
              rotateWindow={false}
              refreshToken={refreshToken}
            />

            {/* Recent Top IMDb Movies */}
            <CustomFetchSection
              title="Top IMDb Movies" // SHORTENED
              contentType="movie"
              fetchFn={getRegionalContent.moviesTopImdbRecent}
              onItemPress={handleItemPress}
              transform={(list) => {
                const yearNow = new Date(todayIso || new Date().toISOString().slice(0, 10)).getFullYear()
                const parseYear = (d) => parseInt((d || "").slice(0, 4)) || 0
                const currentYear = list.filter((m) => parseYear(m.release_date) === yearNow)
                const others = list.filter((m) => parseYear(m.release_date) !== yearNow)
                const sortFn = (a, b) => {
                  const yA = parseYear(a.release_date)
                  const yB = parseYear(b.release_date)
                  if (yB !== yA) return yB - yA
                  return (b.vote_average || 0) - (a.vote_average || 0)
                }
                return [...currentYear.sort(sortFn), ...others.sort(sortFn)]
              }}
              todayIso={todayIso}
              onViewAll={() => handleViewAllMovies("imdb_top_recent")}
              filterRecent={false}
              rotateWindow={false}
              refreshToken={refreshToken}
            />

            {/* Recent Hindi TV Shows */}
            <CustomFetchSection
              title="Hindi TV Shows" // SHORTENED
              contentType="tv"
              fetchFn={getRegionalContent.tvHindiRecent}
              onItemPress={handleItemPress}
              todayIso={todayIso}
              onViewAll={() => handleViewAllTV("hindi_recent")}
              filterRecent={false}
              rotateWindow={false}
              refreshToken={refreshToken}
            />

            {/* Recent Bengali Movies (Bangladesh) */}
            <CustomFetchSection
              title="🇧🇩 Bengali Movies" // SHORTENED
              contentType="movie"
              fetchFn={getRegionalContent.moviesBengaliBDRecent}
              onItemPress={handleItemPress}
              todayIso={todayIso}
              onViewAll={() => handleViewAllMovies("bengali_bd_recent")}
              filterRecent={false}
              rotateWindow={false}
              refreshToken={refreshToken}
            />

            {/* Recent Indian Bengali Movies */}
            <CustomFetchSection
              title="🇮🇳 Indian Bengali" // SHORTENED
              contentType="movie"
              fetchFn={getRegionalContent.moviesBengaliINRecent}
              onItemPress={handleItemPress}
              todayIso={todayIso}
              onViewAll={() => handleViewAllMovies("bengali_in_recent")}
              filterRecent={false}
              rotateWindow={false}
              refreshToken={refreshToken}
            />

            {/* Recent Bengali TV Shows */}
            <CustomFetchSection
              title="📺 Bengali TV Shows" // SHORTENED
              contentType="tv"
              fetchFn={getRegionalContent.tvBengaliBDINRecent}
              onItemPress={handleItemPress}
              todayIso={todayIso}
              onViewAll={() => handleViewAllTV("bengali_recent")}
              filterRecent={false}
              rotateWindow={false}
              refreshToken={refreshToken}
            />

            {/* Hollywood Newly Released */}
            <CustomFetchSection
              title="New Hollywood" // SHORTENED
              contentType="movie"
              fetchFn={getRegionalContent.hollywoodNewlyReleased}
              onItemPress={handleItemPress}
              todayIso={todayIso}
              onViewAll={() => handleViewAllMovies("hollywood_new")}
              filterRecent={false}
              rotateWindow={false}
              refreshToken={refreshToken}
            />

            {/* Bollywood Newly Released */}
            <CustomFetchSection
              title="New Bollywood" // SHORTENED
              contentType="movie"
              fetchFn={getRegionalContent.bollywoodHindiNewlyReleased}
              onItemPress={handleItemPress}
              todayIso={todayIso}
              onViewAll={() => handleViewAllMovies("bollywood_new")}
              filterRecent={false}
              rotateWindow={false}
              refreshToken={refreshToken}
            />

            {/* Tamil Newly Released */}
            <CustomFetchSection
              title="New Tamil Movies" // SHORTENED
              contentType="movie"
              fetchFn={getRegionalContent.tamilNewlyReleased}
              onItemPress={handleItemPress}
              todayIso={todayIso}
              onViewAll={() => handleViewAllMovies("tamil_new")}
              filterRecent={false}
              rotateWindow={false}
              refreshToken={refreshToken}
            />

            <CustomFetchSection
              title="🇰🇷 Korean Cinema"
              contentType="movie"
              fetchFn={async (_iso, page = 1) => getPopularByLanguage.movies.korean(page)}
              onItemPress={handleItemPress}
              todayIso={todayIso}
              filterRecent={false}
              rotateWindow={false}
              refreshToken={refreshToken}
            />

            <CustomFetchSection
              title="🇯🇵 Japanese Cinema"
              contentType="movie"
              fetchFn={async (_iso, page = 1) => getPopularByLanguage.movies.japanese(page)}
              onItemPress={handleItemPress}
              todayIso={todayIso}
              filterRecent={false}
              rotateWindow={false}
              refreshToken={refreshToken}
            />

            <CustomFetchSection
              title="🇪🇸 Spanish Movies"
              contentType="movie"
              fetchFn={async (_iso, page = 1) => getPopularByLanguage.movies.spanish(page)}
              onItemPress={handleItemPress}
              todayIso={todayIso}
              filterRecent={false}
              rotateWindow={false}
              refreshToken={refreshToken}
            />

            <CustomFetchSection
              title="🇫🇷 French Cinema"
              contentType="movie"
              fetchFn={async (_iso, page = 1) => getPopularByLanguage.movies.french(page)}
              onItemPress={handleItemPress}
              todayIso={todayIso}
              filterRecent={false}
              rotateWindow={false}
              refreshToken={refreshToken}
            />
          </>
        )
    }
  }

  // ==================== LOADING & ERROR STATES ====================
  
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={GlobalStyles.safeArea}>
        <View style={[styles.header, Platform.OS === 'android' && { paddingTop: 32 }]}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>M</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <HeroSkeleton />
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

  // ==================== MAIN RENDER ====================
  
  return (
    <SafeAreaView style={GlobalStyles.safeArea}>
      {/* Header */}
      <View style={[styles.header, Platform.OS === "android" && { paddingTop: 32 }]}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>M</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.searchButton} 
          onPress={() => setSearchVisible(true)}
        >
          <Ionicons name="search" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Search Modal */}
      <Modal
        visible={searchVisible}
        animationType="slide"
        onRequestClose={() => setSearchVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.black }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              backgroundColor: Colors.black,
            }}
          >
            <TextInput
              style={{
                flex: 1,
                backgroundColor: Colors.mediumGray,
                color: Colors.white,
                borderRadius: 8,
                paddingHorizontal: 16,
                height: 44,
              }}
              placeholder="Search movies, series, anime..."
              placeholderTextColor={Colors.grayText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoFocus
            />
            <TouchableOpacity
              onPress={() => setSearchVisible(false)}
              style={{ marginLeft: 12 }}
            >
              <Ionicons name="close" size={28} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Search Tabs */}
          <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 8 }}>
            {["movie", "tv", "anime"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 20,
                  borderBottomWidth: searchTab === tab ? 2 : 0,
                  borderBottomColor: Colors.primary,
                  marginHorizontal: 8,
                }}
                onPress={() => {
                  setSearchTab(tab)
                  setSearchResults([])
                  setSearchError(null)
                }}
              >
                <Text
                  style={{
                    color: searchTab === tab ? Colors.primary : Colors.grayText,
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  {tab === "movie" ? "Movies" : tab === "tv" ? "Series" : "Anime"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search Results */}
          <ScrollView
            style={{ flex: 1, backgroundColor: Colors.black }}
            contentContainerStyle={{ padding: 16 }}
          >
            {searchLoading && (
              <Text style={{ color: Colors.grayText, textAlign: "center", marginTop: 32 }}>
                Searching...
              </Text>
            )}
            {searchError && (
              <Text style={{ color: Colors.error, textAlign: "center", marginTop: 32 }}>
                {searchError}
              </Text>
            )}
            {!searchLoading &&
              !searchError &&
              searchResults.length === 0 &&
              searchQuery.length > 0 && (
                <Text style={{ color: Colors.grayText, textAlign: "center", marginTop: 32 }}>
                  No results found.
                </Text>
              )}
            {searchResults.map((item, idx) => (
              <TouchableOpacity
                key={item.id || item.sourceId || idx}
                style={{ flexDirection: "row", alignItems: "center", marginBottom: 18 }}
                onPress={() => handleSearchResultPress(item)}
              >
                <Ionicons
                  name="search"
                  size={22}
                  color={Colors.primary}
                  style={{ marginRight: 12 }}
                />
                <Text style={{ color: Colors.white, fontSize: 16, flex: 1 }} numberOfLines={1}>
                  {item.title?.english || item.title?.romaji || item.title || item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Main Content */}
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Tabs */}
        {/* Hero Slider */}
        {heroData.length > 0 && (
          <HeroSlider
            data={heroData}
            onItemPress={handleItemPress}
            onPlayPress={handlePlayPressWithModal}
          />
        )}

        {/* Dynamic Content */}
        {renderContent()}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Premium Modal */}
      <PremiumRequiredModal
        visible={premiumModalVisible}
        onClose={() => setPremiumModalVisible(false)}
        onLogin={() => {
          setPremiumModalVisible(false)
          navigation.navigate("Login")
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.black,
  },
  logoContainer: {
    flex: 1,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
  },
  searchButton: {
    padding: 8,
  },
  bottomSpacing: {
    height: 100,
  },
})

export default HomeScreen
