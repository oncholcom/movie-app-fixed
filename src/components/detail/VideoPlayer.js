import React from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { getYouTubeEmbedUrl } from '../../services/api';

const { width, height } = Dimensions.get('window');

const VideoPlayer = ({ visible, videoKey, onClose }) => {
  if (!videoKey) return null;

  const embedUrl = getYouTubeEmbedUrl(videoKey);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color={Colors.white} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.videoContainer}>
          <WebView
            source={{ uri: embedUrl }}
            style={styles.webview}
            allowsFullscreenVideo={true}
            mediaPlaybackRequiresUserAction={false}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              Alert.alert('Error', 'Failed to load video');
              console.warn('WebView error: ', nativeEvent);
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  webview: {
    flex: 1,
  },
});

export default VideoPlayer;
