"use client"

import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { GlobalStyles, Spacing, BorderRadius } from '../../styles/GlobalStyles'
import Colors from '../../constants/Colors'
import { getBackdropUrl } from '../../services/api'

const { width, height } = Dimensions.get('window')
const HERO_HEIGHT = height * 0.6

const HeroSlider = ({ data, onItemPress, onPlayPress }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const flatListRef = useRef(null)
  const scrollX = useRef(new Animated.Value(0)).current
  const autoScrollTimer = useRef(null)

  // Auto-scroll functionality
  useEffect(() => {
    if (data.length <= 1) return

    autoScrollTimer.current = setInterval(() => {
      setActiveIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % data.length
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        })
        return nextIndex
      })
    }, 5000) // Auto-scroll every 5 seconds

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current)
      }
    }
  }, [data.length])

  const handleMomentumScrollEnd = (event) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width)
    setActiveIndex(newIndex)
  }

  const handleManualScroll = () => {
    // Reset auto-scroll timer when user manually scrolls
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current)
    }
  }

  const renderHeroItem = ({ item, index }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ]

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    })

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    })

    return (
      <Animated.View style={[styles.heroItem, { transform: [{ scale }], opacity }]}>
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => onItemPress(item)}
          style={styles.heroTouchable}
        >
          <Image
            source={{ uri: getBackdropUrl(item.backdrop_path) }}
            style={styles.heroImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={300}
          />

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)']}
            style={styles.gradient}
          >
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {item.title || item.name}
              </Text>

              {item.overview && (
                <Text style={styles.heroDescription} numberOfLines={3}>
                  {item.overview}
                </Text>
              )}

              <View style={styles.heroActions}>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => onPlayPress(item)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="play" size={20} color={Colors.white} />
                  <Text style={styles.playButtonText}>Play</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.infoButton}
                  onPress={() => onItemPress(item)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="information-circle-outline" size={20} color={Colors.white} />
                  <Text style={styles.infoButtonText}>More Info</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  if (!data || data.length === 0) {
    return null
  }

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderHeroItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollBeginDrag={handleManualScroll}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        decelerationRate="fast"
        snapToInterval={width}
        snapToAlignment="center"
      />

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {data.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index && styles.activeDot,
            ]}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: HERO_HEIGHT,
    marginBottom: Spacing.lg,
  },
  heroItem: {
    width,
    height: HERO_HEIGHT,
  },
  heroTouchable: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: HERO_HEIGHT * 0.7,
    justifyContent: 'flex-end',
  },
  heroContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroDescription: {
    fontSize: 14,
    color: Colors.white,
    marginBottom: Spacing.md,
    opacity: 0.9,
    lineHeight: 20,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  playButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  infoButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  pagination: {
    position: 'absolute',
    bottom: Spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeDot: {
    width: 24,
    backgroundColor: Colors.primary,
  },
})

export default HeroSlider
