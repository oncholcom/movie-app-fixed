import React from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import SkeletonLoader from './SkeletonLoader'
import { Spacing, BorderRadius } from '../../styles/GlobalStyles'
import Colors from '../../constants/Colors'

const { width, height } = Dimensions.get('window')
const HERO_HEIGHT = height * 0.6

const HeroSkeleton = () => {
  return (
    <View style={styles.container}>
      <SkeletonLoader width={width} height={HERO_HEIGHT} borderRadius={0} />
      <View style={styles.overlay}>
        <View style={styles.bottomContent}>
          <SkeletonLoader width={200} height={28} borderRadius={4} style={styles.titleSkeleton} />
          <SkeletonLoader width={width - 100} height={16} borderRadius={4} style={styles.descSkeleton} />
          <View style={styles.buttonRow}>
            <SkeletonLoader width={100} height={44} borderRadius={BorderRadius.lg} />
            <SkeletonLoader width={100} height={44} borderRadius={BorderRadius.lg} style={{ marginLeft: 12 }} />
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width,
    height: HERO_HEIGHT,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.darkGray,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
  },
  bottomContent: {
    marginBottom: Spacing.md,
  },
  titleSkeleton: {
    marginBottom: Spacing.sm,
  },
  descSkeleton: {
    marginBottom: Spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})

export default HeroSkeleton
