import * as FileSystem from 'expo-file-system';
import { Platform, Alert, Linking } from 'react-native';
import axios from 'axios';

const GITHUB_REPO = 'hasansarkar/movie-app-fixed'; // Updated with actual repo
const CURRENT_VERSION = '1.0.0'; // Should match app.json version

// Simple semver comparison function
const compareVersions = (version1, version2) => {
  const v1parts = version1.split('.').map(Number);
  const v2parts = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;
    
    if (v1part < v2part) return -1;
    if (v1part > v2part) return 1;
  }
  return 0;
};

class UpdateService {
  constructor() {
    this.updateCheckInterval = null;
  }

  /**
   * Check if a new version is available on GitHub Releases
   */
  async checkForUpdates() {
    try {
      console.log('🔍 Checking for updates...');
      
      const response = await axios.get(
        `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          },
          timeout: 10000,
        }
      );

      const latestRelease = response.data;
      const latestVersion = latestRelease.tag_name.replace('v', ''); // "v1.0.2" -> "1.0.2"
      
      console.log(`📱 Current version: ${CURRENT_VERSION}`);
      console.log(`🆕 Latest version: ${latestVersion}`);

      // Compare versions using custom comparison
      if (compareVersions(latestVersion, CURRENT_VERSION) > 0) {
        console.log('✅ New version available!');
        
        // Find APK asset in release
        const apkAsset = latestRelease.assets.find(
          asset => asset.name.endsWith('.apk')
        );

        if (apkAsset) {
          return {
            available: true,
            version: latestVersion,
            downloadUrl: apkAsset.browser_download_url,
            releaseNotes: latestRelease.body,
            releaseDate: latestRelease.published_at,
          };
        }
      } else {
        console.log('✅ App is up to date');
        return { available: false };
      }
    } catch (error) {
      console.error('❌ Error checking for updates:', error.message);
      return { available: false, error: error.message };
    }
  }

  /**
   * Download and install APK update
   */
  async downloadAndInstall(downloadUrl) {
    try {
      console.log('📥 Downloading update...');
      
      const fileUri = `${FileSystem.documentDirectory}RObiStream-update.apk`;
      
      // Show loading alert
      Alert.alert(
        '📥 Downloading Update',
        'Please wait while we download the latest version...',
        [],
        { cancelable: false }
      );
      
      // Download APK
      const downloadResumable = FileSystem.createDownloadResumable(
        downloadUrl,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          console.log(`📥 Download progress: ${(progress * 100).toFixed(1)}%`);
          // You can emit events here to update UI progress bar
        }
      );

      const { uri } = await downloadResumable.downloadAsync();
      console.log('✅ Download complete:', uri);

      // Install APK (Android only)
      if (Platform.OS === 'android') {
        await this.installAPK(uri);
      }
    } catch (error) {
      console.error('❌ Error downloading update:', error);
      Alert.alert(
        '❌ Download Failed',
        'Failed to download the update. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
      throw error;
    }
  }

  /**
   * Install APK on Android
   */
  async installAPK(fileUri) {
    try {
      // First try to get content URI
      let contentUri;
      try {
        contentUri = await FileSystem.getContentUriAsync(fileUri);
      } catch (error) {
        console.log('Content URI failed, trying file URI directly');
        contentUri = fileUri;
      }
      
      // Open APK for installation
      const canOpen = await Linking.canOpenURL(contentUri);
      if (canOpen) {
        await Linking.openURL(contentUri);
        console.log('📲 APK installation initiated');
        
        Alert.alert(
          '📲 Install Update',
          'The installer has been opened. Please follow the prompts to install the update.',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('Cannot open APK file');
      }
    } catch (error) {
      console.error('❌ Error installing APK:', error);
      Alert.alert(
        '❌ Installation Failed',
        'Failed to open the APK installer. Please check if you have enabled installation from unknown sources in your device settings.',
        [{ text: 'OK' }]
      );
      throw error;
    }
  }

  /**
   * Show update dialog to user
   */
  promptUpdate(updateInfo) {
    Alert.alert(
      '🎉 New Update Available!',
      `Version ${updateInfo.version} is now available.\n\n` +
      `What's New:\n${updateInfo.releaseNotes || 'Bug fixes and improvements'}`,
      [
        {
          text: 'Later',
          style: 'cancel',
        },
        {
          text: 'Update Now',
          onPress: () => this.downloadAndInstall(updateInfo.downloadUrl),
        },
      ]
    );
  }

  /**
   * Start automatic update checking (every 6 hours)
   */
  startAutoUpdateCheck() {
    // Check immediately on app start
    this.checkForUpdates().then(updateInfo => {
      if (updateInfo.available) {
        this.promptUpdate(updateInfo);
      }
    });

    // Then check every 6 hours
    this.updateCheckInterval = setInterval(async () => {
      const updateInfo = await this.checkForUpdates();
      if (updateInfo.available) {
        this.promptUpdate(updateInfo);
      }
    }, 6 * 60 * 60 * 1000); // 6 hours
  }

  /**
   * Stop automatic update checking
   */
  stopAutoUpdateCheck() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }
}

export default new UpdateService();
