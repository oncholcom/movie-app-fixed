import React from 'react'
import { View, StyleSheet } from 'react-native'
import SkeletonLoader from './SkeletonLoader'
import { Spacing, BorderRadius } from '../../styles/GlobalStyles'

const ContentCardSkeleton = () => {
  return (
    <View style={styles.container}>
      <SkeletonLoader width={140} height={210} borderRadius={BorderRadius.md} />
      <View style={styles.textContainer}>
        <SkeletonLoader width={120} height={14} borderRadius={4} style={styles.titleSkeleton} />
        <SkeletonLoader width={80} height={12} borderRadius={4} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 140,
    marginRight: Spacing.md,
  },
  textContainer: {
    marginTop: Spacing.xs,
  },
  titleSkeleton: {
    marginBottom: Spacing.xs,
  },
})

export default ContentCardSkeleton
