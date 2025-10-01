import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { ComponentStyles } from '../../styles/ComponentStyles';
import Colors from '../../constants/Colors';

const LoadingSpinner = ({ size = 'large', color = Colors.primary }) => {
  return (
    <View style={ComponentStyles.loadingContainer}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

export default LoadingSpinner;
