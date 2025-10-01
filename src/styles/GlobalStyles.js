import { StyleSheet, Dimensions } from "react-native"
import Colors from "../constants/Colors"

const { width, height } = Dimensions.get("window")

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const BorderRadius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 50,
}

export const Sizes = {
  // Screen dimensions
  screenWidth: width,
  screenHeight: height,

  // Card dimensions
  cardWidth: 140,
  cardHeight: 210,

  // Hero section
  heroHeight: height * 0.32, // Half of original

  // Continue watching
  continueWatchingWidth: 160,
  continueWatchingHeight: 240,

  // Header
  headerHeight: 60,

  // Bottom navigation
  bottomNavHeight: 80,
}

export const GlobalStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  shadow: {
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  // Typography
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.white,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
    color: Colors.white,
    lineHeight: 22,
  },
  caption: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.grayText,
  },
  small: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.grayText,
  },
})
