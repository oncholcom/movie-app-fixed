import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import SendIntentAndroid from 'react-native-send-intent';

const VLCPlayer = ({ m3u8Url, title, onError }) => {
  const handlePlayInVLC = async () => {
    try {
      console.log('[VLC Player] Launching VLC with URL:', m3u8Url);
      console.log('[VLC Player] Title:', title);
      console.log('[VLC Player] Platform:', Platform.OS);
      
      if (Platform.OS === 'android') {
        // Use send-intent to launch VLC
        SendIntentAndroid.openAppWithData('org.videolan.vlc', m3u8Url, 'video/*')
          .then(isOpened => {
            if (!isOpened) {
              console.log('[VLC Player] VLC not installed, opening Play Store');
              SendIntentAndroid.openAppStore('org.videolan.vlc');
              if (onError) onError('VLC not installed');
            } else {
              console.log('[VLC Player] Successfully launched VLC');
            }
          })
          .catch(error => {
            console.error('[VLC Player] Error launching VLC:', error);
            Alert.alert(
              'VLC Launch Error',
              'Could not launch VLC. Please ensure VLC is installed.',
              [
                { text: 'OK', onPress: () => onError && onError('VLC launch error') },
                { text: 'Install VLC', onPress: () => SendIntentAndroid.openAppStore('org.videolan.vlc') }
              ]
            );
          });
      } else {
        // iOS: Use direct URL
        const canOpen = await Linking.canOpenURL(m3u8Url);
        if (canOpen) {
          await Linking.openURL(m3u8Url);
          console.log('[VLC Player] Successfully opened URL on iOS');
        } else {
          throw new Error('No video player can handle this URL');
        }
      }
    } catch (error) {
      console.error('[VLC Player] Error launching VLC:', error);
      Alert.alert(
        'Video Player Not Found',
        'No compatible video player found to play this content. Please install VLC Media Player from Google Play Store.',
        [
          { text: 'OK', onPress: () => onError && onError('No video player found') },
          { text: 'Install VLC', onPress: () => Linking.openURL('market://details?id=org.videolan.vlc') }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="play-circle" size={80} color={Colors.primary} />
        <Text style={styles.title}>{title || 'Video Player'}</Text>
        <Text style={styles.subtitle}>M3U8 Stream Ready</Text>
        <Text style={styles.description}>
          This content will be played in VLC Media Player for the best streaming experience.
        </Text>
        
        <TouchableOpacity style={styles.playButton} onPress={handlePlayInVLC}>
          <Ionicons name="play" size={24} color="#fff" />
          <Text style={styles.playButtonText}>Play in VLC</Text>
        </TouchableOpacity>
        
        <Text style={styles.note}>
          Make sure VLC Media Player is installed on your device
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: Colors.primary,
    marginTop: 10,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 30,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  note: {
    fontSize: 14,
    color: '#888',
    marginTop: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default VLCPlayer; 