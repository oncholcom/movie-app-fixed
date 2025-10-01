import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import UpdateService from '../services/UpdateService';
import Colors from '../constants/Colors';

export default function SettingsScreen() {
  const [checking, setChecking] = useState(false);

  const handleCheckUpdates = async () => {
    setChecking(true);
    try {
      const updateInfo = await UpdateService.checkForUpdates();
      setChecking(false);

      if (updateInfo.available) {
        UpdateService.promptUpdate(updateInfo);
      } else {
        Alert.alert(
          '✅ Up to Date',
          'You are using the latest version of RObiStream!',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      setChecking(false);
      Alert.alert(
        '❌ Check Failed',
        'Failed to check for updates. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const showAbout = () => {
    Alert.alert(
      'About RObiStream',
      `RObiStream v1.0.0

Your premium entertainment streaming app with auto-update functionality.

Developed with ❤️`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Updates</Text>
        
        <TouchableOpacity 
          style={[styles.button, checking && styles.buttonDisabled]} 
          onPress={handleCheckUpdates}
          disabled={checking}
        >
          <View style={styles.buttonContent}>
            {checking ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Check for Updates</Text>
            )}
          </View>
        </TouchableOpacity>
        
        <Text style={styles.description}>
          RObiStream automatically checks for updates every 6 hours. 
          You can also manually check for updates using the button above.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        
        <TouchableOpacity style={styles.button} onPress={showAbout}>
          <Text style={styles.buttonText}>About RObiStream</Text>
        </TouchableOpacity>
        
        <View style={styles.versionInfo}>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.buildInfo}>Auto-update enabled</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray + '20',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
  },
  section: {
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray + '10',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: Colors.gray,
    shadowOpacity: 0.1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 20,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  description: {
    color: Colors.grayText,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  versionInfo: {
    alignItems: 'center',
    marginTop: 15,
  },
  version: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  buildInfo: {
    color: Colors.grayText,
    fontSize: 12,
  },
});