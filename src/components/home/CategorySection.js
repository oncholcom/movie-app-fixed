"use client"

import React, { useState, useEffect, memo } from "react"
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native"
import ContentCard from "./ContentCard"
import { Spacing } from "../../styles/GlobalStyles"
import Colors from "../../constants/Colors"
import { getMovies, getTVShows } from "../../services/api"
import { getMonthRanges, isWithinMonthRanges } from "../../utils/helpers"
import { useTodayIso, useRefreshToken } from "../../context/HomeContext"

const MAX_ITEMS = 15 // Changed from 12 to 15

const CategorySection = ({
  title,
  contentType = "movie",
  category = "popular",
  data,
  onItemPress,
  onViewAll,
  showSeeAll = false,
}) => {
  const isControlled = Array.isArray(data)
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const todayIso = useTodayIso()
  const refreshToken = useRefreshToken()

  useEffect(() => {
    if (isControlled) {
      setError(null)
      setLoading(false)
      const filtered = (data || []).slice(0, MAX_ITEMS)
      setContent(filtered)
      return
    }
    fetchContent()
  }, [contentType, category, isControlled, todayIso, refreshToken])

  const fetchContent = async () => {
    try {
      setLoading(true)
      setError(null)

      let response
      if (contentType === "movie") {
        switch (category) {
          case "popular":
            response = await getMovies.popular()
            break
          case "top_rated":
            response = await getMovies.topRated()
            break
          case "upcoming":
            response = await getMovies.upcoming()
            break
          case "trending":
          default:
            response = await getMovies.trending()
        }
      } else {
        switch (category) {
          case "popular":
            response = await getTVShows.popular()
            break
          case "top_rated":
            response = await getTVShows.topRated()
            break
          case "on_the_air":
            response = await getTVShows.onTheAir()
            break
          case "trending":
          default:
            response = await getTVShows.trending()
        }
      }

      const results = response.data.results || []
      
      // Filter by recency if todayIso available
      let filtered = results
      if (todayIso && category !== 'top_rated') { // Don't filter top_rated by recency
        const ranges = getMonthRanges(todayIso, 6)
        filtered = results.filter((item) => {
          const dateKey = contentType === "movie" ? "release_date" : "first_air_date"
          return isWithinMonthRanges(item[dateKey], ranges)
        })
      }

      // Filter out items without poster_path
      const withImages = filtered.filter((item) => item && item.poster_path)
      const selected = withImages.slice(0, MAX_ITEMS)
      setContent(selected)
    } catch (err) {
      console.error("CategorySection fetch error:", err)
      setError("Failed to load content")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  if (error || content.length === 0) {
    return null
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {showSeeAll && onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {content.map((item, index) => (
          <ContentCard
            key={item.id}
            item={item}
            index={index}
            onPress={() => onItemPress(item)}
            contentType={contentType}
          />
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.white,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
  },
  loadingText: {
    color: Colors.grayText,
    textAlign: "center",
    marginTop: Spacing.md,
  },
})

export default memo(CategorySection)
