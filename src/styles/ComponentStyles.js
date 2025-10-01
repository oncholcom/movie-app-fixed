import { StyleSheet } from 'react-native';
import Colors from '../constants/Colors';
import { Spacing, BorderRadius, Sizes } from './GlobalStyles';

export const ComponentStyles = StyleSheet.create({
  // Card Styles
  card: {
    backgroundColor: Colors.mediumGray,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  cardShadow: {
    backgroundColor: Colors.mediumGray,
    borderRadius: BorderRadius.lg,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // Button Styles
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: Colors.lightGray,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: Colors.grayText,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Input Styles
  input: {
    backgroundColor: Colors.mediumGray,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.white,
    fontSize: 16,
  },
  
  // Image Styles
  poster: {
    width: Sizes.posterWidth,
    height: Sizes.posterHeight,
    borderRadius: BorderRadius.md,
  },
  backdrop: {
    width: '100%',
    height: Sizes.heroHeight,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  
  // Badge Styles
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // Loading Styles
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.black,
  },
  
  // Error Styles
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
});
