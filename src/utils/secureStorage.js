import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'

let secureStoreSupported

const isSecureStoreAvailable = async () => {
  if (secureStoreSupported !== undefined) {
    return secureStoreSupported
  }

  try {
    if (SecureStore?.isAvailableAsync) {
      secureStoreSupported = await SecureStore.isAvailableAsync()
    } else {
      secureStoreSupported = false
    }
  } catch (error) {
    console.warn('SecureStore availability check failed, falling back to AsyncStorage:', error)
    secureStoreSupported = false
  }

  return secureStoreSupported
}

export const setSecureItem = async (key, value) => {
  if (value === undefined || value === null) {
    await removeSecureItem(key)
    return
  }

  try {
    if (await isSecureStoreAvailable()) {
      await SecureStore.setItemAsync(key, value)
      return
    }
  } catch (error) {
    console.warn(`SecureStore setItemAsync failed for key ${key}, falling back to AsyncStorage`, error)
  }

  await AsyncStorage.setItem(key, value)
}

export const getSecureItem = async (key) => {
  try {
    if (await isSecureStoreAvailable()) {
      const value = await SecureStore.getItemAsync(key)
      if (value !== null && value !== undefined) {
        return value
      }
    }
  } catch (error) {
    console.warn(`SecureStore getItemAsync failed for key ${key}, falling back to AsyncStorage`, error)
  }

  return AsyncStorage.getItem(key)
}

export const removeSecureItem = async (key) => {
  try {
    if (await isSecureStoreAvailable()) {
      await SecureStore.deleteItemAsync(key)
    }
  } catch (error) {
    console.warn(`SecureStore deleteItemAsync failed for key ${key}`, error)
  }

  await AsyncStorage.removeItem(key)
}

export const clearSecureAuthState = async (keys) => {
  if (!Array.isArray(keys)) {
    return
  }

  await Promise.all(keys.map((key) => removeSecureItem(key)))
}
