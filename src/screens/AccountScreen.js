import { useCallback, useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Animated,
  RefreshControl,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius } from '../styles/GlobalStyles'
import { useAuth } from '../context/AuthContext'

const InfoRow = ({ label, value, icon }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoLabelContainer}>
      {icon && <Ionicons name={icon} size={16} color={Colors.grayText} style={{ marginRight: 6 }} />}
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue}>{value || '—'}</Text>
  </View>
)

const FeaturesList = ({ features }) => (
  <View style={styles.featuresContainer}>
    {features?.map((feature, index) => (
      <View key={index} style={styles.featureChip}>
        <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
        <Text style={styles.featureText}>{feature}</Text>
      </View>
    ))}
  </View>
)

const AccountScreen = ({ navigation }) => {
  const {
    account,
    user,
    subscription,
    refreshAccount,
    logout,
    isAuthenticated,
  } = useAuth()
  
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState(null)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const fetchAccount = useCallback(async () => {
    if (!refreshAccount) return

    setRefreshing(true)
    setRefreshError(null)

    try {
      await refreshAccount()
    } catch (err) {
      if (err?.shouldLogout) {
        await logout()
        return
      }

      console.error('Account refresh failed', err)
      setRefreshError(err?.message || 'Failed to load your account. Please try again shortly.')
    } finally {
      setRefreshing(false)
    }
  }, [refreshAccount, logout])

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchAccount()
      }
    }, [fetchAccount, isAuthenticated]),
  )

  const handleRetry = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    fetchAccount()
  }, [fetchAccount])

  const handleLogout = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    logout()
  }, [logout])

  // Not authenticated view
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.centered, { flex: 1 }]}>
          <View style={styles.lockIconContainer}>
            <LinearGradient
              colors={['rgba(231, 76, 60, 0.2)', 'rgba(231, 76, 60, 0.05)']}
              style={styles.lockIconGradient}
            >
              <Ionicons name="lock-closed" size={48} color={Colors.primary} />
            </LinearGradient>
          </View>
          <Text style={styles.emptyTitle}>Sign In Required</Text>
          <Text style={styles.emptySubtitle}>
            Sign in from the web to link your account and access premium features
          </Text>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
              navigation.navigate('Login')
            }}
          >
            <LinearGradient
              colors={[Colors.primary, '#C0392B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Ionicons name="log-in-outline" size={20} color={Colors.white} />
              <Text style={styles.primaryButtonText}>Sign In</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // Error view
  if (refreshError && !account) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.centered, { flex: 1, paddingHorizontal: Spacing.lg }]}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="cloud-offline" size={48} color={Colors.error} />
          </View>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>{refreshError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Ionicons name="refresh" size={18} color={Colors.white} />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // Loading view
  if ((!account && refreshing) || (!account && !refreshError)) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.centered, { flex: 1 }]}> 
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your account...</Text>
        </View>
      </SafeAreaView>
    )
  }

  const accountSubscription = subscription || account?.subscription || null
  const displayName =
    user?.displayName || user?.name || user?.username || account?.user?.displayName || 'Member'
  const email = user?.email || account?.user?.email || 'Email not available'

  const hasSubscription = Boolean(
    accountSubscription?.planId ||
      accountSubscription?.planName ||
      accountSubscription?.status,
  )

  const planLabel =
    accountSubscription?.planName || accountSubscription?.planId || (hasSubscription ? 'Subscription' : 'Free Plan')

  const statusLabel = accountSubscription?.status
    ? accountSubscription.status.charAt(0).toUpperCase() + accountSubscription.status.slice(1)
    : hasSubscription
      ? 'Active'
      : 'Inactive'

  const isActiveSubscription = statusLabel === 'Active'

  const formattedDate = (value) => {
    if (!value) return undefined
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return undefined
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formattedPrice = (() => {
    if (typeof accountSubscription?.price !== 'number') return null
    const currency = accountSubscription?.currency || 'USD'
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(accountSubscription.price)
    } catch (err) {
      return `${accountSubscription.price} ${currency}`
    }
  })()

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchAccount}
            tintColor={Colors.primary}
          />
        }
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Environment Banner (Dev Mode) */}

          {/* Error Banner */}
          {refreshError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorBannerText}>{refreshError}</Text>
              <TouchableOpacity onPress={handleRetry} style={styles.errorRetryButton}>
                <Text style={styles.errorRetryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Profile Header Card */}
          <View style={styles.headerCard}>
            <LinearGradient
              colors={['rgba(231, 76, 60, 0.15)', 'transparent']}
              style={styles.headerGradient}
            />
            
            <View style={styles.profileSection}>
              <LinearGradient
                colors={[Colors.primary, '#C0392B']}
                style={styles.avatar}
              >
                <Text style={styles.avatarInitials}>
                  {displayName?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </LinearGradient>
              
              <View style={styles.profileInfo}>
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.email}>{email}</Text>
                <View style={styles.planBadge}>
                  <Ionicons 
                    name={hasSubscription ? 'star' : 'star-outline'} 
                    size={14} 
                    color={hasSubscription ? '#FFD700' : Colors.grayText} 
                  />
                  <Text style={[styles.planText, { color: hasSubscription ? '#FFD700' : Colors.grayText }]}>
                    {planLabel}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Subscription Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="card" size={20} color={Colors.white} />
              <Text style={styles.sectionTitle}>Subscription Details</Text>
            </View>

            {hasSubscription ? (
              <>
                <View style={styles.statusCard}>
                  <View style={[
                    styles.statusIndicator,
                    { backgroundColor: isActiveSubscription ? '#4CAF50' : Colors.warning }
                  ]} />
                  <Text style={styles.statusText}>{statusLabel}</Text>
                </View>

                <InfoRow label="Plan" value={planLabel} icon="pricetag" />
                {formattedPrice && <InfoRow label="Price" value={formattedPrice} icon="cash" />}
                <InfoRow label="Start Date" value={formattedDate(accountSubscription?.startDate)} icon="calendar" />
                <InfoRow label="End Date" value={formattedDate(accountSubscription?.endDate)} icon="calendar-outline" />
                <InfoRow label="Next Payment" value={formattedDate(accountSubscription?.nextPayment)} icon="time" />
                <InfoRow
                  label="Devices"
                  value={
                    accountSubscription?.maxDevices != null
                      ? `${accountSubscription.maxDevices} device${accountSubscription.maxDevices !== 1 ? 's' : ''}`
                      : 'Unlimited'
                  }
                  icon="phone-portrait"
                />

                {Array.isArray(accountSubscription?.features) &&
                  accountSubscription.features.length > 0 && (
                    <>
                      <Text style={styles.featuresTitle}>Features</Text>
                      <FeaturesList features={accountSubscription.features} />
                    </>
                  )}
              </>
            ) : (
              <View style={styles.emptySubscription}>
                <Ionicons name="star-outline" size={32} color={Colors.grayText} />
                <Text style={styles.emptySubscriptionTitle}>No Active Subscription</Text>
                <Text style={styles.emptySubscriptionSubtitle}>
                  Subscribe on the web to unlock premium content and sync across devices
                </Text>
              </View>
            )}
          </View>

          {/* Navigation Buttons */}
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              navigation.navigate('Devices')
            }}
          >
            <View style={styles.navButtonContent}>
              <View style={styles.navIconContainer}>
                <Ionicons name="phone-portrait" size={22} color={Colors.white} />
              </View>
              <View style={styles.navTextContainer}>
                <Text style={styles.navTitle}>Manage Devices</Text>
                <Text style={styles.navSubtitle}>See where you're signed in</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.grayText} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <View style={styles.navButtonContent}>
              <View style={[styles.navIconContainer, styles.logoutIconContainer]}>
                <Ionicons name="log-out-outline" size={22} color={Colors.error} />
              </View>
              <Text style={styles.logoutText}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
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
  // Environment Banner
  environmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    gap: Spacing.sm,
  },
  environmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  environmentHint: {
    fontSize: 11,
    color: Colors.grayText,
    marginLeft: 'auto',
  },
  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: 13,
    flex: 1,
    fontWeight: '500',
  },
  errorRetryButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  errorRetryText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  // Header Card
  headerCard: {
    backgroundColor: Colors.darkGray,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.grayText,
    marginBottom: 8,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  planText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Section
  section: {
    backgroundColor: Colors.darkGray,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  // Info Row
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.grayText,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
  },
  // Features
  featuresTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  featureText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  // Empty Subscription
  emptySubscription: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptySubscriptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  emptySubscriptionSubtitle: {
    fontSize: 13,
    color: Colors.grayText,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  // Navigation Buttons
  navButton: {
    backgroundColor: Colors.darkGray,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  navButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  navTextContainer: {
    flex: 1,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 2,
  },
  navSubtitle: {
    fontSize: 13,
    color: Colors.grayText,
  },
  // Logout Button
  logoutButton: {
    backgroundColor: 'transparent',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 59, 48, 0.4)',
  },
  logoutIconContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.error,
    flex: 1,
  },
  // Primary Button
  primaryButton: {
    width: '80%',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginTop: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  // Empty States
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  lockIconContainer: {
    marginBottom: Spacing.md,
  },
  lockIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.grayText,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Error States
  errorIconContainer: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.grayText,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  // Loading
  loadingText: {
    color: Colors.grayText,
    fontSize: 15,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
})

export default AccountScreen
