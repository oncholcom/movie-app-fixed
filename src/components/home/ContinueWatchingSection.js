"use client"

import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { GlobalStyles, Spacing, BorderRadius } from '../../styles/GlobalStyles'
import Colors from '../../constants/Colors'
import { getContinueWatchingData, addToWatchlist as addToLocalWatchlist } from '../../utils/watchlist'
import { ContinueWatchingService } from '../../services/mobile'
import { useAuth } from '../../context/AuthContext'
import { useNavigation } from '@react-navigation/native'

const buildPosterUrl = (item) => {
  if (item.imageUrl) return item.imageUrl
  if (item.poster) return item.poster
  if (item.poster_path) return `https://image.tmdb.org/t/p/w500${item.poster_path}`
  if (item.images?.poster) return item.images.poster
  return null
}

const formatSeconds = (value) => {
  if (!Number.isFinite(value) || value <= 0) return null
  const totalSeconds = Math.round(value)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

const resolveProgressDisplay = (item) => {
  const position = Number(item?.positionSeconds)
  const duration = Number(item?.durationSeconds)

  if (Number.isFinite(position) && Number.isFinite(duration) && duration > 0) {
    const ratio = Math.min(Math.max(position / duration, 0), 1)
    const percentage = Math.round(ratio * 100)
    const positionLabel = formatSeconds(position)
    const durationLabel = formatSeconds(duration)

    if (positionLabel && durationLabel) {
      return { ratio, label: `${percentage}% • ${positionLabel} of ${durationLabel}` }
    }

    return { ratio, label: `${percentage}% watched` }
  }

  const legacyProgress = item?.progress || {}
  if (typeof legacyProgress === 'number') {
    const ratio = Math.min(Math.max(legacyProgress, 0), 1)
    return { ratio, label: `${Math.round(ratio * 100)}% watched` }
  }
  if (legacyProgress.percentage != null) {
    const ratio = Math.min(Math.max(legacyProgress.percentage / 100, 0), 1)
    return { ratio, label: `${Math.round(legacyProgress.percentage)}% watched` }
  }

  if (
    typeof legacyProgress.watched === 'number' &&
    typeof legacyProgress.total === 'number' &&
    legacyProgress.total > 0
  ) {
    const ratio = Math.min(Math.max(legacyProgress.watched / legacyProgress.total, 0), 1)
    return { ratio, label: `${legacyProgress.watched}/${legacyProgress.total}` }
  }

  if (typeof legacyProgress.watched === 'string') {
    return { ratio: null, label: legacyProgress.watched }
  }

  return { ratio: null, label: 'Continue watching' }
}

const ContinueWatchingCard = ({ item, onPress, onRemove }) => {
  const { ratio: progressRatio, label: progressLabel } = resolveProgressDisplay(item)
  const posterUrl = buildPosterUrl(item)
  const title = item.title || item.name

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={() => onPress(item)} activeOpacity={0.85}>
      <View style={styles.imageContainer}>
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={styles.poster} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="film-outline" size={32} color={Colors.grayText} />
          </View>
        )}

        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.progressOverlay}>
          <View style={styles.progressContainer}>
            {progressRatio != null ? (
              <>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progressRatio * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>{progressLabel}</Text>
              </>
            ) : (
              <Text style={styles.progressText}>{progressLabel}</Text>
            )}
          </View>
        </LinearGradient>

        <View style={styles.playButtonContainer}>
          <View style={styles.playButton}>
            <Ionicons name="play" size={16} color={Colors.white} />
          </View>
        </View>

        <TouchableOpacity style={styles.removeButton} onPress={() => onRemove(item)}>
          <Ionicons name="close" size={16} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.contentInfo}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {item.type === 'tv' && item.season && item.episode && (
          <Text style={styles.episodeInfo}>
            S{item.season} · E{item.episode}
          </Text>
        )}

        <Text style={styles.continueText}>Continue Watching</Text>
      </View>
    </TouchableOpacity>
  )
}

const ContinueWatchingSection = ({ onItemPress }) => {
  const navigation = useNavigation()
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)

      if (isAuthenticated) {
        const response = await ContinueWatchingService.list({ limit: 10 })
        if (response?.success === false) {
          setItems(response.items || [])
          setError(response.message || 'Unable to load continue watching right now.')
        } else {
          setItems(response?.items || [])
        }
      } else {
        const localItems = await getContinueWatchingData()
        setItems(localItems)
      }
    } catch (err) {
      console.error('Failed to load continue watching items', err)
      setError('Unable to load continue watching right now.')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    setItems([])
    loadData()
  }, [loadData])

  const handleRemoveItem = async (item) => {
    try {
      if (isAuthenticated) {
        const contentType = item.type || item.contentType || item.mediaType
        const contentId = item.id || item.contentId || item.sourceId
        if (!contentId || !contentType) {
          console.warn('Missing identifiers for removing continue watching item', item)
          return
        }
        const response = await ContinueWatchingService.remove(contentId, contentType)
        if (response?.success === false && !response?.notFound) {
          throw new Error(response?.message || response?.error || 'Failed to remove item')
        }
        await loadData()
      } else {
        const updated = items.filter((watchItem) => !(watchItem.id === item.id && watchItem.type === item.type))
        setItems(updated)
      }
    } catch (err) {
      console.error('Failed to remove item from continue watching', err)
    }
  }

  const handleAddTestData = async () => {
    if (isAuthenticated) return

    await Promise.all(
      [
        {
          id: 550,
          type: 'movie',
          title: 'Fight Club',
          progress: 0.65,
          timestamp: Date.now(),
        },
        {
          id: 1399,
          type: 'tv',
          title: 'Game of Thrones',
          season: 1,
          episode: 3,
          progress: 0.45,
          timestamp: Date.now(),
        },
      ].map((item) => addToLocalWatchlist(item)),
    )

    loadData()
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Continue Watching</Text>
          {isAuthenticated && (
            <Ionicons name="refresh" size={18} color="transparent" />
          )}
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loadingText}>Fetching your progress...</Text>
        </View>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Continue Watching</Text>
          <TouchableOpacity onPress={loadData}>
            <Ionicons name="refresh" size={18} color={Colors.grayText} />
          </TouchableOpacity>
        </View>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  if (!items || items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Continue Watching</Text>
          {!isAuthenticated && (
            <TouchableOpacity onPress={handleAddTestData}>
              <Text style={styles.addTestText}>Add Demo Data</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="play-circle-outline" size={48} color={Colors.grayText} />
          <Text style={styles.emptyText}>Nothing to continue yet</Text>
          <Text style={styles.emptySubtext}>Start watching to build your queue.</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Continue Watching</Text>
        {isAuthenticated && items.length > 0 ? (
          <TouchableOpacity onPress={() => navigation.navigate('ContinueWatching')}>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={loadData}>
            <Ionicons name="refresh" size={18} color={Colors.grayText} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        bounces={false}
      >
        {items.map((item, index) => (
          <ContinueWatchingCard
            key={`${item.type}-${item.id}-${index}`}
            item={item}
            onPress={onItemPress}
            onRemove={handleRemoveItem}
          />
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  header: {
    ...GlobalStyles.rowBetween,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.grayText,
  },
  addTestText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  scrollContainer: {
    paddingHorizontal: Spacing.md,
  },
  cardContainer: {
    width: 140,
    marginRight: Spacing.md,
  },
  imageContainer: {
    width: 140,
    height: 210,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.mediumGray,
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  poster: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'flex-end',
    padding: Spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
    minWidth: 30,
    textAlign: 'right',
  },
  playButtonContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -18 }, { translateY: -18 }],
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  removeButton: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentInfo: {
    paddingHorizontal: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    lineHeight: 18,
    marginBottom: 2,
  },
  episodeInfo: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.grayText,
    marginBottom: 2,
  },
  continueText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.primary,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.grayText,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.grayText,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.grayText,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.error,
    paddingHorizontal: Spacing.md,
  },
})

export default ContinueWatchingSection
