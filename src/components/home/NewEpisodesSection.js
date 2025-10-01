"use client"

import React, { useState, useEffect, memo, useRef } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native"
import EpisodeThumbnailCard from "./EpisodeThumbnailCard"
import { GlobalStyles, Spacing } from "../../styles/GlobalStyles"
import Colors from "../../constants/Colors"
import { getTVShows } from "../../services/api"
import { useRefreshToken } from "../../context/HomeContext"

const NewEpisodesSection = ({ onItemPress, onViewAll }) => {
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(true)
  const hasFetchedRef = useRef(false)
  
  const refreshToken = useRefreshToken()

  useEffect(() => {
    hasFetchedRef.current = false
  }, [refreshToken])

  useEffect(() => {
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true
    
    fetchNewEpisodes()
  }, [refreshToken])

  const fetchNewEpisodes = async () => {
    try {
      setLoading(true)
      
      const response = await getTVShows.airingToday()
      const results = response.data.results || []
      const selected = results.slice(0, 15) // 15 items
      
      setEpisodes(selected)
    } catch (error) {
      console.error("Error fetching new episodes:", error)
      setEpisodes([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>New Episodes Today</Text>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  if (episodes.length === 0) {
    return null
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>New Episodes Today</Text>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {episodes.map((item) => (
          <EpisodeThumbnailCard
            key={item.id}
            item={item}
            onPress={onItemPress}
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
  scrollContainer: {
    paddingHorizontal: Spacing.md,
  },
  loadingText: {
    color: Colors.grayText,
    textAlign: "center",
    marginTop: Spacing.md,
  },
})

export default memo(NewEpisodesSection)
