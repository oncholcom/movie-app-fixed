"use client"

import React, { useState, useEffect, memo, useRef } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native"
import ContentCard from "./ContentCard"
import { GlobalStyles, Spacing } from "../../styles/GlobalStyles"
import Colors from "../../constants/Colors"
import { getAnimationContent } from "../../services/api"
import { useRefreshToken } from "../../context/HomeContext"

const AnimationSection = ({ 
  contentType, 
  onItemPress, 
  sectionTitle = "Animation", 
  onViewAll,
  refreshToken: externalRefreshToken 
}) => {
  const [animationContent, setAnimationContent] = useState([])
  const [loading, setLoading] = useState(true)
  const hasFetchedRef = useRef(false)
  
  const contextRefreshToken = useRefreshToken()
  const refreshToken = externalRefreshToken !== undefined ? externalRefreshToken : contextRefreshToken

  useEffect(() => {
    hasFetchedRef.current = false
  }, [refreshToken])

  useEffect(() => {
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true
    
    fetchAnimationContent()
  }, [contentType, refreshToken])

  const fetchAnimationContent = async () => {
    try {
      setLoading(true)

      // Fetch all animation (English + Japanese)
      const response = await getAnimationContent.all()
      
      const results = response.data.results || []
      // Filter out items without poster_path
      const withImages = results.filter((item) => item && item.poster_path)
      const selected = withImages.slice(0, 15) // 15 items
      
      setAnimationContent(selected)
    } catch (error) {
      console.error("Error fetching animation content:", error)
      setAnimationContent([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{sectionTitle}</Text>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  if (animationContent.length === 0) {
    return null
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{sectionTitle}</Text>
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
        {animationContent.map((item, index) => (
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

export default memo(AnimationSection)
