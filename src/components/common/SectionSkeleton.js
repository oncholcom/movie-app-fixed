import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import ContentCardSkeleton from './ContentCardSkeleton'
import SkeletonLoader from './SkeletonLoader'
import { GlobalStyles, Spacing } from '../../styles/GlobalStyles'
import Colors from '../../constants/Colors'

const SectionSkeleton = ({ title }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {title ? (
          <Text style={styles.title}>{title}</Text>
        ) : (
          <SkeletonLoader width={150} height={20} borderRadius={4} />
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {[1, 2, 3, 4, 5, 6, 7].map((item) => (
          <ContentCardSkeleton key={item} />
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  scrollContainer: {
    paddingHorizontal: Spacing.md,
  },
})

export default SectionSkeleton
