import React from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import AnimeCard from '../anime/AnimeCard'
import { Spacing } from '../../styles/GlobalStyles'

const AnimeSection = ({ animeList = [], onItemPress }) => {
  // Don't render if no data
  if (!animeList || animeList.length === 0) {
    return null
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        nestedScrollEnabled={true}
      >
        {animeList.map((item, index) => (
          <AnimeCard
            key={item.id}
            anime={item}
            index={index}
            onPress={() => onItemPress(item)}
          />
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  scrollContainer: {
    paddingHorizontal: Spacing.md,
  },
})

export default AnimeSection
