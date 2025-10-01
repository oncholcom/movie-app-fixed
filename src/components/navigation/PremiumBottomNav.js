import React, { useEffect, useRef } from 'react'
import { View, TouchableOpacity, Text, StyleSheet, Animated, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Colors from '../../constants/Colors'
import { Spacing, BorderRadius } from '../../styles/GlobalStyles'

const PremiumBottomNav = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets()

  const getIconName = (routeName, isFocused) => {
    const icons = {
      Home: isFocused ? 'home' : 'home-outline',
      Movies: isFocused ? 'film' : 'film-outline',
      Series: isFocused ? 'tv' : 'tv-outline',
      Anime: isFocused ? 'color-palette' : 'color-palette-outline',
      Profile: isFocused ? 'person' : 'person-outline',
    }
    return icons[routeName] || 'help-circle-outline'
  }

  const getLabel = (routeName) => {
    const labels = {
      Home: 'Home',
      Movies: 'Movies',
      Series: 'Series',
      Anime: 'Anime',
      Profile: 'Profile',
    }
    return labels[routeName] || routeName
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || Spacing.sm }]}>
      <View style={styles.navBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const isFocused = state.index === index

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            })

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name)
            }
          }

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            })
          }

          return (
            <NavItem
              key={route.key}
              routeName={route.name}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              iconName={getIconName(route.name, isFocused)}
              label={getLabel(route.name)}
            />
          )
        })}
      </View>
    </View>
  )
}

const NavItem = ({ routeName, isFocused, onPress, onLongPress, iconName, label }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const translateY = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isFocused ? 1.1 : 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: isFocused ? -4 : 0,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start()
  }, [isFocused])

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.navItem}
      activeOpacity={0.7}
    >
      <Animated.View
        style={[
          styles.iconContainer,
          isFocused && styles.iconContainerActive,
          {
            transform: [{ scale: scaleAnim }, { translateY }],
          },
        ]}
      >
        <Ionicons
          name={iconName}
          size={24}
          color={isFocused ? Colors.primary : Colors.grayText}
        />
      </Animated.View>
      <Animated.Text
        style={[
          styles.label,
          isFocused && styles.labelActive,
          { opacity: isFocused ? 1 : 0.7 },
        ]}
      >
        {label}
      </Animated.Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.black,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
  },
  iconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.xl,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.grayText,
    marginTop: 2,
  },
  labelActive: {
    color: Colors.primary,
  },
})

export default PremiumBottomNav
