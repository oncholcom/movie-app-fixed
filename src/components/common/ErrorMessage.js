import React from 'react';
import { View, Text } from 'react-native';
import { ComponentStyles } from '../../styles/ComponentStyles';
import CustomButton from './CustomButton';

const ErrorMessage = ({ 
  message = 'Something went wrong', 
  onRetry = null,
  retryText = 'Try Again' 
}) => {
  return (
    <View style={ComponentStyles.errorContainer}>
      <Text style={ComponentStyles.errorText}>{message}</Text>
      {onRetry && (
        <CustomButton
          title={retryText}
          onPress={onRetry}
          variant="primary"
        />
      )}
    </View>
  );
};

export default ErrorMessage;
