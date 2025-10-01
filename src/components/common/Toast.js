import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import Colors from '../../constants/Colors'
import { Spacing, BorderRadius } from '../../styles/GlobalStyles'

const { width } = Dimensions.get('window')

const Toast = ({ visible, message, type = 'success', onHide }) => {
  const translateY = useRef(new Animated.Value(-100)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()

      // Auto hide after 3 seconds
      const timer = setTimeout(() => {
        hideToast()
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [visible])

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide?.()
    })
  }

  if (!visible) return null

  const config = {
    success: {
      icon: 'checkmark-circle',
      colors: ['#4CAF50', '#388E3C'],
      iconColor: Colors.white,
    },
    error: {
      icon: 'close-circle',
      colors: [Colors.error, '#C62828'],
      iconColor: Colors.white,
    },
    info: {
      icon: 'information-circle',
      colors: [Colors.primary, '#C0392B'],
      iconColor: Colors.white,
    },
  }

  const { icon, colors, iconColor } = config[type] || config.success

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.toast}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={24} color={iconColor} />
        </View>
        <Text style={styles.message}>{message}</Text>
      </LinearGradient>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 9999,
    elevation: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  message: {
    flex: 1,
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
})

export default Toast
