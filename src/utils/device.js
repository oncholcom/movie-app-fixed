import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const DEVICE_ID_KEY = 'mobile_device_id'

const generateDeviceId = () => {
  if (typeof crypto !== 'undefined' && crypto?.randomUUID) {
    return crypto.randomUUID()
  }

  const randomSegment = () => Math.random().toString(16).substring(2, 10)
  return `dev-${randomSegment()}-${randomSegment()}-${Date.now()}`
}

export const getDeviceId = async () => {
  try {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY)
    if (existing) {
      return existing
    }

    const deviceId = generateDeviceId()
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId)
    return deviceId
  } catch (error) {
    console.warn('Failed to obtain persistent device id, generating ephemeral one', error)
    return generateDeviceId()
  }
}

const inferDeviceName = () => {
  const constants = Platform?.constants || {}
  const model = constants?.deviceName || constants?.model

  if (typeof model === 'string' && model.trim().length > 0) {
    return model.trim()
  }

  const platformLabel = Platform.OS === 'ios' ? 'iOS Device' : Platform.OS === 'android' ? 'Android Device' : 'React Native Device'
  return platformLabel
}

export const getDeviceInfo = () => {
  const deviceName = inferDeviceName()
  const model = Platform?.constants?.model || deviceName
  const osVersion = Platform.Version?.toString?.() || 'unknown'

  return {
    platform: Platform.OS,
    version: '1.0.0',
    model,
    osVersion,
    deviceName,
  }
}
