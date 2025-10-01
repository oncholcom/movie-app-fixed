"use client"

import React, { useState, useEffect, memo, useRef } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native"
import ContentCard from "./ContentCard"
import { GlobalStyles, Spacing } from "../../styles/GlobalStyles"
import Colors from "../../constants/Colors"
import { useTodayIso, useRefreshToken } from "../../context/HomeContext"

const CustomFetchSection = ({
  title,
  fetchFn,
  contentType = "movie",
  onItemPress,
  onViewAll,
  transform,
  filterRecent = true,
  rotateWindow = true,
  todayIso: todayIsoOverride,
}) => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const hasFetchedRef = useRef(false)
  
  const contextTodayIso = useTodayIso()
  const refreshToken = useRefreshToken()
  const todayIso = todayIsoOverride || contextTodayIso

  useEffect(() => {
    hasFetchedRef.current = false
  }, [refreshToken])

  useEffect(() => {
    if (!todayIso || hasFetchedRef.current) return
    
    hasFetchedRef.current = true
    let mounted = true

    const run = async () => {
      try {
        setLoading(true)
        setError(null)

        let accumulated = []
        let page = 1

        // Fetch up to 3 pages to ensure we get 15 items (increased from 2)
        while (accumulated.length < 15 && page <= 3) {
          try {
            const res = await fetchFn(todayIso, page)
            let results = res.data.results || []

            if (transform) {
              results = transform(results)
            }

            // Filter out items without poster_path
            results = results.filter(item => item && item.poster_path)

            accumulated = [...accumulated, ...results]

            if (results.length === 0) break
            page++
          } catch (pageError) {
            console.error(`Error fetching page ${page}:`, pageError)
            break
          }
        }

        const selected = accumulated.slice(0, 15)

        if (mounted) {
          setItems(selected)
        }
      } catch (err) {
        console.error(`CustomFetchSection ${title} error:`, err)
        if (mounted) {
          setError("Failed to load content")
          setItems([])
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      mounted = false
    }
  }, [todayIso, refreshToken])

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  if (error || items.length === 0) {
    return null
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
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
        {items.map((item, index) => (
          <ContentCard
            key={item.id}
            item={item}
            index={index}
            onPress={() => onItemPress(item)}
            contentType={contentType}
          />
        ))}
      </ScrollView>
      {items.length < 15 && (
        <Text style={styles.itemCountText}>
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </Text>
      )}
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
    flex: 1,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
    marginLeft: Spacing.sm,
  },
  scrollContainer: {
    paddingHorizontal: Spacing.md,
  },
  loadingText: {
    color: Colors.grayText,
    textAlign: "center",
    marginTop: Spacing.md,
  },
  itemCountText: {
    color: Colors.grayText,
    fontSize: 11,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
})

export default memo(CustomFetchSection)
