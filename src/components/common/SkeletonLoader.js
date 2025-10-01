import React from 'react'
import { View, StyleSheet, Animated } from 'react-native'
import { Spacing, BorderRadius } from '../../styles/GlobalStyles'
import Colors from '../../constants/Colors'

class SkeletonLoader extends React.Component {
  constructor(props) {
    super(props)
    this.animatedValue = new Animated.Value(0)
  }

  componentDidMount() {
    this.animate()
  }

  animate = () => {
    this.animatedValue.setValue(0)
    Animated.loop(
      Animated.sequence([
        Animated.timing(this.animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(this.animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }

  render() {
    const { width, height, borderRadius = BorderRadius.md, style } = this.props

    const opacity = this.animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    })

    return (
      <Animated.View
        style={[
          styles.skeleton,
          {
            width,
            height,
            borderRadius,
            opacity,
          },
          style,
        ]}
      />
    )
  }
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.mediumGray,
  },
})

export default SkeletonLoader
