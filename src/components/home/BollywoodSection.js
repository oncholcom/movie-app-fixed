"use client"

import React, { useState, useEffect, memo, useRef } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native"
import ContentCard from "./ContentCard"
import { GlobalStyles, Spacing } from "../../styles/GlobalStyles"
import Colors from "../../constants/Colors"
import { getBollywoodContent } from "../../services/api"
import { useRefreshToken } from "../../context/HomeContext"

const BollywoodSection = ({
  contentType,
  onItemPress,
  onViewAll,
}) => {
  const [bollywoodContent, setBollywoodContent] = useState([])
  const [loading, setLoading] = useState(true)
  const hasFetchedRef = useRef(false)
  
  const refreshToken = useRefreshToken()

  useEffect(() => {
    hasFetchedRef.current = false
  }, [refreshToken])

  useEffect(() => {
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true
    
    fetchBollywoodContent()
  }, [contentType, refreshToken])

  const fetchBollywoodContent = async () => {
    try {
      setLoading(true)

      // Use combined to get all Indian language content
      const response = await getBollywoodContent.combined()
      
      const results = response.data.results || []
      // Filter out items without poster_path
      const withImages = results.filter((item) => item && item.poster_path)
      const selected = withImages.slice(0, 15) // 15 items
      
      setBollywoodContent(selected)
    } catch (error) {
      console.error("Error fetching Bollywood content:", error)
      setBollywoodContent([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Bollywood</Text>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  if (bollywoodContent.length === 0) {
    return null
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bollywood</Text>
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
        {bollywoodContent.map((item, index) => (
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
  scrollContainer: {
    paddingHorizontal: Spacing.md,
  },
  loadingText: {
    color: Colors.grayText,
    textAlign: "center",
    marginTop: Spacing.md,
  },
})

export default memo(BollywoodSection)
