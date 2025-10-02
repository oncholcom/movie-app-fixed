"use client"

import { useEffect, useMemo } from 'react'
import { SecurityChecker } from './src/utils/securityCheck'
import UpdateService from './src/services/UpdateService'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native'
import * as Linking from 'expo-linking'
import HomeScreen from './src/screens/HomeScreen'
import MoviesScreen from './src/screens/MoviesScreen'
import SeriesScreen from './src/screens/TVSeriesScreen'
import AnimeScreen from './src/screens/AnimeScreen'
import MovieDetailScreen from './src/screens/MovieDetailScreen'
import TVDetailScreen from './src/screens/TVDetailScreen'
import AnimeDetailScreen from './src/screens/AnimeDetailScreen'
import VideoPlayerScreen from './src/screens/VideoPlayerScreen'
import ViewAllScreen from './src/screens/ViewAllScreen'
import LoginScreen from './src/screens/LoginScreen'
import ProfileScreen from './src/screens/AccountScreen'
import DevicesScreen from './src/screens/DevicesScreen'
import ContinueWatchingScreen from './src/screens/ContinueWatchingScreen'
import Colors from './src/constants/Colors'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import { HomeProvider } from './src/context/HomeContext'
import PremiumBottomNav from './src/components/navigation/PremiumBottomNav'

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

function BottomTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <PremiumBottomNav {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Movies" component={MoviesScreen} />
      <Tab.Screen name="Series" component={SeriesScreen} />
      <Tab.Screen name="Anime" component={AnimeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyle: { backgroundColor: Colors.black },
      }}
    >
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      <Stack.Screen name="MovieDetail" component={MovieDetailScreen} />
      <Stack.Screen name="TVDetail" component={TVDetailScreen} />
      <Stack.Screen name="AnimeDetail" component={AnimeDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="VideoPlayer"
        component={VideoPlayerScreen}
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="ViewAll" component={ViewAllScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Devices" component={DevicesScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ContinueWatching" component={ContinueWatchingScreen} options={{ title: 'Continue Watching' }} />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  )
}

function RootNavigator() {
  const { initializing } = useAuth()

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Preparing your experience...</Text>
      </View>
    )
  }

  return <MainNavigator />
}

export default function App() {
  useEffect(() => {
    // Start checking for updates
    UpdateService.startAutoUpdateCheck();

    return () => {
      // Cleanup on unmount
      UpdateService.stopAutoUpdateCheck();
    };
  }, []);

  useEffect(() => {
    // Check security on app start
    const checkSecurity = async () => {
      const isSecure = await SecurityChecker.enforce()
      if (!isSecure && !__DEV__) {
        // Handle security violation
        console.warn('Security check failed')
      }
    }
    
    checkSecurity()
    
    // Periodic check every 30 seconds
    const interval = setInterval(checkSecurity, 30000)
    return () => clearInterval(interval)
  }, [])



  const linking = useMemo(
    () => ({
      prefixes: [Linking.createURL('/'), 'robistream://'],
      config: {
        screens: {
          Login: 'auth',
          MainTabs: {
            screens: {
              Home: 'home',
              Movies: 'movies',
              Series: 'tv',
              Anime: 'anime',
              Profile: 'account',
            },
          },
          MovieDetail: 'movie/:movieId',
          TVDetail: 'tv/:tvId',
          AnimeDetail: 'anime/:animeId',
          VideoPlayer: 'player',
          ViewAll: 'view-all',
          Devices: 'devices',
        },
      },
    }),
    [],
  )

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <HomeProvider>
          <NavigationContainer linking={linking}>
            <StatusBar style="light" barStyle="light-content" />
            <View style={styles.statusBarBackground} />
            <RootNavigator />
          </NavigationContainer>
        </HomeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.black,
    paddingBottom: 80,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.grayText,
  },
})
