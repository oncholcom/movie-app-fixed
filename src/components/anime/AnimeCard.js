import React, { useState, useEffect, useRef, memo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Spacing, BorderRadius } from '../../styles/GlobalStyles'
import Colors from '../../constants/Colors'

const AnimeCard = ({
  anime,
  onPress,
  index = 0,
  style = {},
  cardWidth = 140,
  cardHeight = 210,
}) => {
  const [imageError, setImageError] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  const getTitle = () => {
    if (anime?.title) {
      return anime.title.english || anime.title.romaji || anime.title.native || 'Unknown Anime'
    }
    return 'Unknown Anime'
  }

  const imageUrl = anime?.coverImage?.large || anime?.coverImage?.medium || null
  const rating = anime?.averageScore ? (anime.averageScore / 10).toFixed(1) : null
  const format = anime?.format || null
  const episodes = anime?.episodes || null

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
  }, [fadeAnim, scaleAnim, index])

  const handleImageLoad = () => {
    setImageError(false)
  }

  const handleImageError = () => {
    setImageError(true)
  }

  const renderPlaceholder = () => (
    <View style={styles.placeholderContainer}>
      <Ionicons name="film-outline" size={40} color={Colors.grayText} />
      <Text style={styles.placeholderText} numberOfLines={2}>
        {getTitle()}
      </Text>
    </View>
  )

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        { width: cardWidth },
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity style={styles.card} onPress={() => onPress(anime)} activeOpacity={0.85}>
        <View style={[styles.imageContainer, { width: cardWidth, height: cardHeight }]}>
          {imageUrl && !imageError ? (
            <>
              <Image
                source={{ uri: imageUrl }}
                style={styles.coverImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                onLoad={handleImageLoad}
                onError={handleImageError}
                transition={200}
              />

              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gradientOverlay} />

              {format && (
                <View style={styles.formatBadge}>
                  <Text style={styles.formatText}>{format}</Text>
                </View>
              )}

              {rating && (
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color={Colors.yellow} />
                  <Text style={styles.ratingText}>{rating}</Text>
                </View>
              )}

              {episodes && (
                <View style={styles.episodeBadge}>
                  <Ionicons name="tv-outline" size={12} color={Colors.white} />
                  <Text style={styles.episodeText}>{episodes}ep</Text>
                </View>
              )}
            </>
          ) : (
            renderPlaceholder()
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
            {getTitle()}
          </Text>
          {anime?.seasonYear && <Text style={styles.year}>{anime.seasonYear}</Text>}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
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
  },
  formatBadge: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    backgroundColor: 'rgba(231, 76, 60, 0.95)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  formatText: {
    color: Colors.white,
    fontSize: 10,
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
    gap: 2,
  },
  ratingText: {
    color: Colors.yellow,
    fontSize: 11,
    fontWeight: '700',
  },
  episodeBadge: {
    position: 'absolute',
    bottom: Spacing.xs,
    right: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 3,
  },
  episodeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  infoContainer: {
    marginTop: Spacing.xs,
    paddingHorizontal: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
    lineHeight: 18,
    marginBottom: 2,
  },
  year: {
    fontSize: 11,
    color: Colors.grayText,
    fontWeight: '500',
  },
})

export default memo(AnimeCard)
