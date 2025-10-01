import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ComponentStyles } from '../../styles/ComponentStyles';
import Colors from '../../constants/Colors';

const CustomButton = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  disabled = false,
  style = {} 
}) => {
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return ComponentStyles.primaryButton;
      case 'secondary':
        return ComponentStyles.secondaryButton;
      case 'outline':
        return ComponentStyles.outlineButton;
      default:
        return ComponentStyles.primaryButton;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return Colors.white;
      case 'secondary':
        return Colors.white;
      case 'outline':
        return Colors.grayText;
      default:
        return Colors.white;
    }
  };

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        disabled && styles.disabledButton,
        style
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[
        styles.buttonText,
        { color: disabled ? Colors.darkText : getTextColor() }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default CustomButton;
