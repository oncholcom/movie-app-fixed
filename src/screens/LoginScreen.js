import { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  Animated,
} from 'react-native'
import { CommonActions } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius } from '../styles/GlobalStyles'
import { useAuth } from '../context/AuthContext'
import Toast from '../components/common/Toast'  // <-- Import Toast

const validateEmail = (value) => {
  if (!value) return false
  return /.+@.+\..+/.test(value.trim())
}

const LoginScreen = ({ navigation }) => {  // <-- Add navigation prop
  const { login, authenticating, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState('success')
  
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const logoScale = useRef(new Animated.Value(0.8)).current
  const logoRotate = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Card entrance animation
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
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start()

    // Logo rotation animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  const rotate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const showToast = (message, type = 'success') => {
    setToastMessage(message)
    setToastType(type)
    setToastVisible(true)
  }

  const hideToast = () => {
    setToastVisible(false)
  }

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    clearError?.()
    setLocalError(null)

    if (!validateEmail(email)) {
      setLocalError('Please enter a valid email address')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }

    if (!password || password.length < 6) {
      setLocalError('Password must be at least 6 characters')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }

    try {
      await login({ email, password })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      
      // Show success toast
      showToast('🎉 Login successful! Welcome back', 'success')
      
      // Navigate to Home after toast shows
      setTimeout(() => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }], // Change to your home screen name
          })
        )
      }, 1500) // Wait 1.5s to show toast before navigating
      
    } catch (authError) {
      const message =
        authError?.payload?.error || authError?.message || 'Authentication failed. Please try again.'
      setLocalError(message)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      showToast(message, 'error')
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Toast Component */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={hideToast}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Gradient Background */}
            <LinearGradient
              colors={['rgba(231, 76, 60, 0.1)', 'transparent']}
              style={styles.cardGradient}
            />

            {/* Logo Section */}
            <View style={styles.logoContainer}>
              <Animated.View 
                style={{ 
                  transform: [
                    { scale: logoScale },
                    { rotate }
                  ] 
                }}
              >
                <LinearGradient
                  colors={[Colors.primary, '#C0392B']}
                  style={styles.logo}
                >
                  <Ionicons name="videocam" size={32} color={Colors.white} />
                </LinearGradient>
              </Animated.View>
              
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue watching</Text>
            </View>

            {/* Email Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[
                styles.inputContainer,
                emailFocused && styles.inputContainerFocused,
                localError && !emailFocused && styles.inputContainerError,
              ]}>
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color={emailFocused ? Colors.primary : Colors.grayText} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.grayText}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[
                styles.inputContainer,
                passwordFocused && styles.inputContainerFocused,
                localError && !passwordFocused && styles.inputContainerError,
              ]}>
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={passwordFocused ? Colors.primary : Colors.grayText} 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.grayText}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity
                  style={styles.toggleVisibility}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    setShowPassword((prev) => !prev)
                  }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Colors.grayText}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Message */}
            {(localError || error) && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color={Colors.error} />
                <Text style={styles.errorText}>{localError || error?.message}</Text>
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.primaryButton, authenticating && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={authenticating}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={authenticating ? [Colors.mediumGray, Colors.darkGray] : [Colors.primary, '#C0392B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {authenticating ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={20} color={Colors.white} />
                    <Text style={styles.buttonText}>Sign In</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Helper Information */}
            <View style={styles.helperContainer}>
              <View style={styles.helperIcon}>
                <Ionicons name="information-circle" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.helperText}>
                Use your web account credentials. Stay connected to the same network to maintain your session.
              </Text>
            </View>

            {/* Security Notice */}
            <View style={styles.securityNotice}>
              <Ionicons name="shield-checkmark-outline" size={16} color={Colors.success} />
              <Text style={styles.securityText}>Your connection is secure and encrypted</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.black,
  },
  scroll: {
    flex: 1,
    alignSelf: 'stretch',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.darkGray,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: Colors.grayText,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  environmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    gap: 6,
  },
  environmentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.black,
    height: 52,
  },
  inputContainerFocused: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(231, 76, 60, 0.05)',
  },
  inputContainerError: {
    borderColor: Colors.error,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.white,
    fontSize: 15,
    fontWeight: '500',
  },
  toggleVisibility: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  errorText: {
    flex: 1,
    color: Colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    height: 54,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0.2,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  helperIcon: {
    marginTop: 2,
  },
  helperText: {
    flex: 1,
    fontSize: 13,
    color: Colors.grayText,
    lineHeight: 19,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  securityText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600',
  },
})

export default LoginScreen
