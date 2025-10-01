import React, { useState, useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { getBackdropUrl } from '../../services/api'
import { Spacing, BorderRadius } from '../../styles/GlobalStyles'
import Colors from '../../constants/Colors'

const EpisodeThumbnailCard = ({ item, onPress, index = 0 }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.95)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 50,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  if (!item) return null

  const title = item.name || item.title || 'Unknown'
  const subtitle = item.first_air_date 
    ? new Date(item.first_air_date).getFullYear() 
    : item.release_date 
    ? new Date(item.release_date).getFullYear()
    : null

  const rating = item.vote_average ? item.vote_average.toFixed(1) : null

  const imageUrl = getBackdropUrl(item.backdrop_path || item.still_path)

  const handleImageLoad = () => {
    setImageLoaded(true)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageLoaded(false)
    setImageError(true)
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => onPress(item)} 
        activeOpacity={0.85}
      >
        <View style={styles.thumbContainer}>
          {imageUrl && !imageError ? (
            <>
              <Image
                source={{ uri: imageUrl }}
                style={styles.thumbnail}
                contentFit="cover"
                cachePolicy="memory-disk"
                onLoad={handleImageLoad}
                onError={handleImageError}
                transition={200}
              />
              
              {/* Gradient overlay for better text readability */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.gradientOverlay}
              />

              {/* Play icon overlay */}
              <View style={styles.playIconOverlay}>
                <View style={styles.playIconCircle}>
                  <Ionicons name="play" size={24} color={Colors.white} />
                </View>
              </View>

              {/* Rating badge */}
              {rating && (
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color={Colors.yellow} />
                  <Text style={styles.ratingText}>{rating}</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.loadingPlaceholder}>
              <Ionicons name="image-outline" size={32} color={Colors.grayText} />
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
        </View>

        {/* Info section */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginRight: Spacing.md,
  },
  card: {
    width: 280,
  },
  thumbContainer: {
    width: 280,
    height: 158, // 16:9 ratio
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.mediumGray,
    position: 'relative',
    marginBottom: Spacing.sm,
    // Add subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  ratingBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 3,
  },
  ratingText: {
    color: Colors.yellow,
    fontSize: 12,
    fontWeight: '700',
  },
  loadingPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.mediumGray,
  },
  placeholderText: {
    color: Colors.grayText,
    fontSize: 12,
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  info: {
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
    lineHeight: 20,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.grayText,
    fontWeight: '500',
  },
})

export default EpisodeThumbnailCard
