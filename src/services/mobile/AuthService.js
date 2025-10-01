import { Platform } from 'react-native'
import {
  MOBILE_API_CONFIG,
  MOBILE_API_ENDPOINTS,
  MOBILE_AUTH_STORAGE_KEYS,
} from '../../constants/MobileAPIConfig'
import { getSecureItem, setSecureItem, removeSecureItem } from '../../utils/secureStorage'

const BASE_URLS = {
  default: MOBILE_API_CONFIG.BASE_URL,
}

const REQUEST_TIMEOUT = 30000 // 30 seconds

const activeEnvironment = 'default'

// Rate limiting
const rateLimiter = {
  attempts: {},
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes

  canAttempt(key) {
    const now = Date.now()
    const record = this.attempts[key]

    if (!record) {
      this.attempts[key] = { count: 1, firstAttempt: now }
      return true
    }

    if (now - record.firstAttempt > this.windowMs) {
      this.attempts[key] = { count: 1, firstAttempt: now }
      return true
    }

    if (record.count >= this.maxAttempts) {
      return false
    }

    record.count++
    return true
  },

  reset(key) {
    delete this.attempts[key]
  },
}

const sanitizePath = (path) => String(path || '').replace(/^\/+/, '')

const buildUrl = (base, path) => {
  const normalizedBase = (base || BASE_URLS.default || '').replace(/\/+$/, '')
  return `${normalizedBase}/${sanitizePath(path)}`
}

// Simple device ID generation
const getDeviceId = async () => {
  try {
    let deviceId = await getSecureItem('device_id')
    if (deviceId) return deviceId

    // Generate unique device ID
    deviceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    await setSecureItem('device_id', deviceId)
    return deviceId
  } catch (error) {
    console.warn('Failed to get device ID:', error)
    return `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

const buildDeviceInfo = async (overrides = {}) => {
  const deviceId = overrides.deviceId || await getDeviceId()
  const inferredName = overrides.deviceName || overrides.name || overrides.model || Platform?.constants?.model || 'Mobile Device'

  return {
    deviceId,
    platform: Platform.OS,
    model: overrides.model || Platform?.constants?.model || inferredName,
    deviceName: inferredName,
    osVersion: overrides.osVersion || Platform.Version?.toString?.() || 'unknown',
    appVersion: overrides.appVersion || overrides.version || '1.0.0',
    ...overrides,
  }
}

// Fetch with timeout
const fetchWithTimeout = (url, options = {}, timeout = REQUEST_TIMEOUT) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    ),
  ])
}

// Generic error for security
const createSecureError = (message, status, code) => {
  const error = new Error(message || 'An error occurred. Please try again.')
  error.status = status
  error.code = code
  return error
}

const handleResponse = async (response) => {
  let data
  try {
    data = await response.json()
  } catch (error) {
    data = null
  }

  if (!response.ok) {
    const userMessage = response.status === 401 
      ? 'Invalid credentials. Please try again.'
      : response.status === 429
      ? 'Too many attempts. Please try again later.'
      : response.status >= 500
      ? 'Server error. Please try again later.'
      : data?.error || data?.message || 'An error occurred. Please try again.'

    throw createSecureError(userMessage, response.status, data?.code)
  }

  return data
}


// Token expiry check
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp * 1000
    return Date.now() >= exp
  } catch (error) {
    return true
  }
}

export class AuthService {
  static getBaseUrl() {
    return BASE_URLS.default
  }

  static async initializeSession(token, session = {}, options = {}) {
    if (!token) {
      throw createSecureError('Authentication required', 401)
    }

    const normalizedToken = token.trim()

    if (isTokenExpired(normalizedToken)) {
      throw createSecureError('Session expired. Please login again.', 401)
    }

    await setSecureItem(MOBILE_AUTH_STORAGE_KEYS.TOKEN, normalizedToken)

    if (session && Object.keys(session).length > 0) {
      await this.storeUserProfile(session)
    }

    return { token: normalizedToken, session }
  }

  static async login({ email, password, deviceId, deviceName, deviceInfo = {} } = {}) {
    if (!email || !password) {
      throw createSecureError('Email and password are required', 400)
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw createSecureError('Please enter a valid email address', 400)
    }

    if (password.length < 6) {
      throw createSecureError('Password must be at least 6 characters', 400)
    }

    const rateLimitKey = `login:${email.toLowerCase()}`
    if (!rateLimiter.canAttempt(rateLimitKey)) {
      throw createSecureError('Too many login attempts. Please try again later.', 429)
    }

    const baseUrl = this.getBaseUrl()
    const fullDeviceInfo = await buildDeviceInfo({ deviceId, deviceName, ...deviceInfo })

    const payload = {
      email: email.trim().toLowerCase(),
      password,
      deviceId: fullDeviceInfo.deviceId,
      deviceName: fullDeviceInfo.deviceName,
    }

    try {
      const response = await fetchWithTimeout(
        buildUrl(baseUrl, 'auth/login'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': MOBILE_API_CONFIG.API_KEY,
          },
          body: JSON.stringify(payload),
        },
        REQUEST_TIMEOUT
      )

      const data = await handleResponse(response)
      const sessionData = data?.data || data

      if (sessionData?.token) {
        await this.initializeSession(sessionData.token, {
          user: sessionData.user || null,
          subscription: sessionData.subscription || null,
        })
        
        rateLimiter.reset(rateLimitKey)
      }

      return sessionData
    } catch (error) {
      console.error('Login error:', error.code || error.status)
      throw error
    }
  }

  static async logoutRemote() {
    const token = await this.getStoredToken()
    if (!token) return null

    try {
      const response = await fetchWithTimeout(
        buildUrl(BASE_URLS.default, 'auth/logout'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': MOBILE_API_CONFIG.API_KEY,
            Authorization: `Bearer ${token}`,
          },
        },
        10000
      )

      return await handleResponse(response)
    } catch (error) {
      console.warn('Remote logout failed:', error.code)
      return null
    }
  }

  static async getStoredToken() {
    const token = await getSecureItem(MOBILE_AUTH_STORAGE_KEYS.TOKEN)
    
    if (token && isTokenExpired(token)) {
      await this.logout()
      return null
    }
    
    return token
  }

  static async getStoredUser() {
    const raw = await getSecureItem(MOBILE_AUTH_STORAGE_KEYS.USER)
    if (!raw) return null

    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && Object.prototype.hasOwnProperty.call(parsed, 'data')) {
        return parsed
      }

      return {
         parsed,
        cachedAt: null,
      }
    } catch (error) {
      console.warn('Failed to parse stored account data, clearing cache')
      await removeSecureItem(MOBILE_AUTH_STORAGE_KEYS.USER)
      return null
    }
  }

  static async storeUserProfile(account) {
    if (!account) {
      await removeSecureItem(MOBILE_AUTH_STORAGE_KEYS.USER)
      return
    }

    const payload = {
       account,
      cachedAt: Date.now(),
    }

    await setSecureItem(MOBILE_AUTH_STORAGE_KEYS.USER, JSON.stringify(payload))
  }

  static async logout() {
    await Promise.all([
      removeSecureItem(MOBILE_AUTH_STORAGE_KEYS.TOKEN),
      removeSecureItem(MOBILE_AUTH_STORAGE_KEYS.USER),
    ])
  }

  static async validateSession() {
    const token = await this.getStoredToken()
    return !!token && !isTokenExpired(token)
  }
}
