"use client"

import { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius } from '../styles/GlobalStyles'
import { useAuth } from '../context/AuthContext'
import { ContinueWatchingService } from '../services/mobile'

const buildPosterUrl = (item) => {
  if (item.imageUrl) return item.imageUrl
  if (item.posterUrl) return item.posterUrl
  if (item.poster) return item.poster
  if (item.images?.poster) return item.images.poster
  if (item.poster_path) return `https://image.tmdb.org/t/p/w500${item.poster_path}`
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

const getProgressDisplay = (item) => {
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

const ContinueWatchingItem = ({ item, onPress, onRemove }) => {
  const posterUrl = buildPosterUrl(item)
  const { ratio, label } = getProgressDisplay(item)

  return (
    <TouchableOpacity style={styles.itemContainer} activeOpacity={0.85} onPress={() => onPress(item)}>
      {posterUrl ? (
        <Image source={{ uri: posterUrl }} style={styles.poster} />
      ) : (
        <View style={styles.posterPlaceholder}>
          <Ionicons name="film-outline" size={28} color={Colors.grayText} />
        </View>
      )}
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.title || item.name}
        </Text>
        {item.type === 'tv' && item.season && item.episode && (
          <Text style={styles.itemSubtitle}>S{item.season} · E{item.episode}</Text>
        )}
        <View style={styles.progressContainer}>
          {ratio != null ? (
            <>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${ratio * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>{label}</Text>
            </>
          ) : (
            <Text style={styles.progressText}>{label}</Text>
          )}
        </View>
        {onRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(item)}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={16} color={Colors.white} />
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )
}

const ContinueWatchingScreen = () => {
  const navigation = useNavigation()
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const limit = 20

  const loadData = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([])
      setLoading(false)
      setRefreshing(false)
      setError(null)
      return
    }

    try {
      setError(null)
      setLoading(true)
      const response = await ContinueWatchingService.list({ limit })

      if (response?.success === false) {
        setItems(response.items || [])
        setError(response.message || 'Unable to load continue watching items.')
      } else {
        setItems(response?.items || [])
      }
    } catch (err) {
      console.error('Error loading continue watching list', err)
      setError(err?.message || 'Unable to load continue watching items.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    setItems([])
    loadData()
  }, [loadData])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    loadData()
  }, [loadData])

  const handleItemPress = useCallback(
    (item) => {
      if (!item) return
      const type = item.type || item.contentType || item.mediaType
      const identifier = item.id || item.contentId || item.sourceId
      if (!identifier) {
        return
      }

      if (type === 'tv') {
        navigation.navigate('TVDetail', { tvId: identifier })
      } else {
        navigation.navigate('MovieDetail', { movieId: identifier })
      }
    },
    [navigation],
  )

  const handleRemove = useCallback(
    async (item) => {
      try {
        const contentType = item.type || item.contentType || item.mediaType
        const contentId = item.id || item.contentId || item.sourceId
        if (!contentId || !contentType) return

        const response = await ContinueWatchingService.remove(contentId, contentType)

        if (response?.success === false && !response?.notFound) {
          throw new Error(response?.message || response?.error || 'Failed to remove item')
        }

        setItems((prev) => prev.filter((entry) => (entry.id || entry.contentId) !== contentId))

        await loadData()
      } catch (err) {
        console.error('Failed to remove continue watching item', err)
      }
    },
    [loadData],
  )

  const renderItem = ({ item }) => (
    <ContinueWatchingItem item={item} onPress={handleItemPress} onRemove={handleRemove} />
  )

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Ionicons name="lock-closed" size={40} color={Colors.grayText} />
          <Text style={styles.message}>Sign in to see your continue watching list.</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.message}>Loading continue watching…</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.header}>Continue Watching</Text>
          </View>
        </View>
        {error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadData}>
              <Ionicons name="refresh" size={16} color={Colors.white} style={{ marginRight: Spacing.xs }} />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="play-circle-outline" size={48} color={Colors.grayText} />
            <Text style={styles.message}>No continue watching items yet.</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item, index) => String(item.id || item.sourceId || item.contentId || index)}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} tintColor={Colors.primary} onRefresh={handleRefresh} />
            }
          />
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.black,
    padding: Spacing.lg,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.darkGray,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  poster: {
    width: 110,
    height: 160,
  },
  posterPlaceholder: {
    width: 110,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.mediumGray,
  },
  itemContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  itemSubtitle: {
    fontSize: 13,
    color: Colors.grayText,
  },
  progressContainer: {
    marginTop: Spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.mediumGray,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: 12,
    color: Colors.grayText,
  },
  removeButton: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
  },
  removeButtonText: {
    color: Colors.grayText,
    fontSize: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  message: {
    color: Colors.grayText,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  retryText: {
    color: Colors.white,
    fontWeight: '600',
  },
})

export default ContinueWatchingScreen
