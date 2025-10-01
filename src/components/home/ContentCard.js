import React, { useState, useEffect, useRef, memo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { GlobalStyles, Spacing, BorderRadius } from '../../styles/GlobalStyles'
import Colors from '../../constants/Colors'
import { getPosterUrl } from '../../services/api'

const ContentCard = ({ item, onPress, contentType = 'movie', index = 0 }) => {
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  const title = item.title || item.name || 'Untitled'
  const posterPath = item.poster_path
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null
  const year = item.release_date 
    ? new Date(item.release_date).getFullYear() 
    : item.first_air_date 
    ? new Date(item.first_air_date).getFullYear()
    : null
  
  const imageUrl = posterPath ? getPosterUrl(posterPath) : null

  // Staggered fade-in animation
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

  const handleImageLoad = () => {
    setImageLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
  }

  const renderPlaceholder = () => (
    <View style={styles.placeholderContainer}>
      <Ionicons name="film-outline" size={40} color={Colors.grayText} />
      <Text style={styles.placeholderText} numberOfLines={2}>
        {title}
      </Text>
    </View>
  )

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => onPress(item)}
        activeOpacity={0.85}
      >
        <View style={styles.imageContainer}>
          {imageUrl && !imageError ? (
            <>
              <Image
                source={{ uri: imageUrl }}
                style={styles.poster}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />

              {/* Gradient overlay for better badge visibility */}
              <LinearGradient
                colors={['rgba(0,0,0,0.7)', 'transparent', 'transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradientOverlay}
              />

              {/* Content Type Badge (TV/Movie) */}
              <View style={styles.typeBadge}>
                <Ionicons 
                  name={contentType === 'tv' ? 'tv' : 'film'} 
                  size={10} 
                  color={Colors.white} 
                />
                <Text style={styles.typeText}>
                  {contentType === 'tv' ? 'TV' : 'MOVIE'}
                </Text>
              </View>

              {/* Rating Badge */}
              {rating && (
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color={Colors.yellow} />
                  <Text style={styles.ratingText}>{rating}</Text>
                </View>
              )}
            </>
          ) : (
            renderPlaceholder()
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
            {title}
          </Text>
          {year && (
            <Text style={styles.year}>{year}</Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 140,
    marginRight: Spacing.md,
  },
  card: {
    width: '100%',
  },
  imageContainer: {
    width: 140,
    height: 210,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.darkGray,
    position: 'relative',
    // Enhanced shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.mediumGray,
    padding: Spacing.sm,
  },
  placeholderText: {
    color: Colors.grayText,
    fontSize: 12,
    textAlign: 'center',
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  typeBadge: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.95)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  typeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  ratingBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
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
    fontSize: 11,
    fontWeight: '700',
  },
  infoContainer: {
    marginTop: Spacing.xs,
    paddingHorizontal: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 2,
    lineHeight: 18,
  },
  year: {
    fontSize: 11,
    color: Colors.grayText,
    fontWeight: '500',
  },
})

export default memo(ContentCard)
