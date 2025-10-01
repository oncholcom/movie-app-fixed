"use client"

import { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius } from '../styles/GlobalStyles'
import { DeviceService } from '../services/mobile'
import { useAuth } from '../context/AuthContext'

const DeviceRow = ({ device, onRemove }) => {
  const lastActive = device.lastUsed ? new Date(device.lastUsed).toLocaleString() : 'Unknown'
  const identifier = device.deviceId || device.id
  const platformLabel = device.platform || device.type || 'Unknown platform'
  const osLabel = device.osVersion || 'Unknown OS'

  return (
    <View style={[styles.deviceCard, device.isCurrent && styles.currentDevice]}> 
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm }}>
        <View style={styles.iconContainer}>
          <Ionicons name="phone-portrait" size={22} color={Colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.deviceName}>{device.name || device.model || platformLabel}</Text>
          <Text style={styles.deviceMeta}>{platformLabel} • {osLabel}</Text>
        </View>
        {device.isCurrent && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>This Device</Text>
          </View>
        )}
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Last Active</Text>
        <Text style={styles.infoValue}>{lastActive}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Status</Text>
        <Text style={styles.infoValue}>{device.isActive ? 'Active' : 'Inactive'}</Text>
      </View>
      {device.canRemove && identifier && (
        <TouchableOpacity style={styles.removeButton} onPress={() => onRemove(identifier)}>
          <Ionicons name="trash" size={18} color={Colors.error} />
          <Text style={styles.removeText}>Remove Device</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const DevicesScreen = () => {
  const { account, subscription, isAuthenticated, isDevEnvironment } = useAuth()
  const [devices, setDevices] = useState([])
  const [limits, setLimits] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const loadDevices = useCallback(async () => {
    try {
      setError(null)
      const data = await DeviceService.getDevices()

      if (data?.success === false) {
        setDevices(data?.devices || [])
        setLimits(data?.limits || null)
        setError(data?.message || 'Unable to fetch devices. Pull to retry.')
        return
      }

      setDevices(data?.devices || [])
      setLimits(data?.limits || null)
    } catch (err) {
      console.error('Failed to load devices', err)
      setError('Unable to fetch devices. Pull to retry.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadDevices()
      }
    }, [isAuthenticated, loadDevices]),
  )

  const confirmRemove = useCallback(
    (deviceId) => {
      Alert.alert('Remove Device', 'Are you sure you want to remove this device?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!deviceId) {
              Alert.alert('Error', 'Missing device identifier. Please refresh and try again.')
              return
            }
            try {
              const response = await DeviceService.removeDevice(deviceId)

              if (response?.success === false) {
                throw new Error(response?.message || response?.error || 'Failed to remove device')
              }

              loadDevices()

              if (response?.message) {
                Alert.alert('Device removed', response.message)
              }
            } catch (err) {
              console.error('Device removal failed', {
                error: err,
                deviceId,
              })
              const message = err?.payload?.error || err?.message || 'Failed to remove device. Please try again.'
              Alert.alert('Error', message)
            }
          },
        },
      ])
    },
    [loadDevices],
  )

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    loadDevices()
  }, [loadDevices])

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.centered, { flex: 1 }]}>
          <Ionicons name="lock-closed" size={32} color={Colors.grayText} />
          <Text style={styles.loadingText}>Sign in to manage your devices.</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.centered, { flex: 1 }]}> 
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading devices...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Your Devices</Text>
          {limits && (
            <Text style={styles.subtitle}>
              {devices.length}/{limits.maxDevices || subscription?.maxDevices || account?.subscription?.maxDevices || '∞'} devices used
            </Text>
          )}
        </View>

        {isDevEnvironment && (
          <View style={styles.devBanner}>
            <Ionicons name="construct" size={16} color={Colors.warning} style={{ marginRight: Spacing.sm }} />
            <Text style={styles.devBannerText}>Development Mode</Text>
          </View>
        )}

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {devices.length === 0 && !error && (
          <View style={[styles.centered, { paddingVertical: 80 }]}>
            <Ionicons name="cloud-outline" size={36} color={Colors.grayText} />
            <Text style={styles.emptyTitle}>No devices linked</Text>
            <Text style={styles.emptySubtitle}>Sign in from another device to see it here.</Text>
          </View>
        )}

        {devices.map((device) => (
          <DeviceRow key={device.deviceId || device.id} device={device} onRemove={confirmRemove} />
        ))}
      </ScrollView>
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
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  devBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 204, 0, 0.1)',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  devBannerText: {
    color: Colors.warning,
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.grayText,
    marginTop: 4,
  },
  errorText: {
    color: Colors.error,
    marginBottom: Spacing.md,
  },
  deviceCard: {
    backgroundColor: Colors.darkGray,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  currentDevice: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  deviceMeta: {
    fontSize: 13,
    color: Colors.grayText,
  },
  currentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
  },
  currentBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    color: Colors.grayText,
    fontSize: 13,
  },
  infoValue: {
    color: Colors.white,
    fontSize: 13,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.md,
  },
  removeText: {
    color: Colors.error,
    fontWeight: '600',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.grayText,
  },
  emptyTitle: {
    marginTop: Spacing.md,
    color: Colors.white,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: Colors.grayText,
    marginTop: 4,
  },
})

export default DevicesScreen
