import React, { useEffect, useRef } from 'react'
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Linking,
  Animated,
  Dimensions,
} from 'react-native'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Colors from '../../constants/Colors'
import { Spacing, BorderRadius } from '../../styles/GlobalStyles'

const { width } = Dimensions.get('window')
const SUBSCRIBE_URL = 'https://robistream.com'

const PremiumRequiredModal = ({ visible, onClose, onLogin }) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const crownRotate = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (visible) {
      // Card entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()

      // Crown rotation animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(crownRotate, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(crownRotate, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start()

      // Pulse animation for icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start()
    } else {
      // Reset animations
      scaleAnim.setValue(0.8)
      fadeAnim.setValue(0)
    }
  }, [visible])

  const rotate = crownRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-10deg', '10deg'],
  })

  const handleSubscribe = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    Linking.openURL(SUBSCRIBE_URL).catch(() => {})
  }

  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onLogin()
  }

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onClose()
  }

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="fade" 
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Premium gradient background */}
          <LinearGradient
            colors={['rgba(231, 76, 60, 0.1)', 'rgba(0, 0, 0, 0)']}
            style={styles.gradientBg}
          />

          {/* Animated crown icon */}
          <Animated.View 
            style={[
              styles.iconContainer,
              { 
                transform: [
                  { rotate },
                  { scale: pulseAnim }
                ] 
              }
            ]}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.iconCircle}
            >
              <Ionicons name="crown" size={36} color={Colors.black} />
            </LinearGradient>
          </Animated.View>

          {/* Sparkle decorations */}
          <View style={styles.sparkle1}>
            <Ionicons name="sparkles" size={16} color="#FFD700" />
          </View>
          <View style={styles.sparkle2}>
            <Ionicons name="sparkles" size={12} color="#FFD700" />
          </View>

          {/* Title */}
          <Text style={styles.title}>✨ Premium Access Required</Text>
          
          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Unlock unlimited movies, TV shows, and anime with RobiStream Premium
          </Text>

          {/* Benefits list */}
          <View style={styles.benefitsList}>
            <BenefitItem icon="checkmark-circle" text="4K Ultra HD Quality" />
            <BenefitItem icon="checkmark-circle" text="Ad-Free Experience" />
            <BenefitItem icon="checkmark-circle" text="Download & Watch Offline" />
            <BenefitItem icon="checkmark-circle" text="Watch on Any Device" />
          </View>

          {/* Subscribe button */}
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleSubscribe} 
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Colors.primary, '#C0392B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Ionicons name="star" size={20} color={Colors.white} />
              <Text style={styles.primaryButtonText}>Subscribe Now</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Login button */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleLogin}
            activeOpacity={0.85}
          >
            <Ionicons name="log-in-outline" size={18} color={Colors.primary} />
            <Text style={styles.secondaryButtonText}>Already have Premium? Log In</Text>
          </TouchableOpacity>

          {/* Dismiss button */}
          <TouchableOpacity 
            style={styles.dismissButton} 
            onPress={handleClose} 
            activeOpacity={0.7}
          >
            <Text style={styles.dismissText}>Maybe Later</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  )
}

// Benefit item component
const BenefitItem = ({ icon, text }) => (
  <View style={styles.benefitItem}>
    <Ionicons name={icon} size={18} color="#4CAF50" />
    <Text style={styles.benefitText}>{text}</Text>
  </View>
)

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.darkGray,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
    position: 'relative',
    overflow: 'hidden',
  },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  iconContainer: {
    marginBottom: Spacing.md,
    zIndex: 1,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  sparkle1: {
    position: 'absolute',
    top: 60,
    right: 40,
  },
  sparkle2: {
    position: 'absolute',
    top: 80,
    left: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.grayText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  benefitsList: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  benefitText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '500',
  },
  primaryButton: {
    width: '100%',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
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
  secondaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  dismissButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  dismissText: {
    fontSize: 14,
    color: Colors.grayText,
    fontWeight: '500',
  },
})

export default PremiumRequiredModal
