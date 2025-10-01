import { MOBILE_API_CONFIG, MOBILE_API_ENDPOINTS } from '../../constants/MobileAPIConfig'
import { AuthService } from './AuthService'

const sanitizePath = (path) => String(path || '').replace(/^\/+/, '')

const buildUrl = (endpoint) => {
  const base = MOBILE_API_CONFIG.BASE_URL.replace(/\/+$/, '')
  return `${base}/${sanitizePath(endpoint)}`
}

export class ActivationService {
  static async createActivation({ deviceId, deviceInfo }) {
    const url = buildUrl('activation')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': MOBILE_API_CONFIG.API_KEY,
      },
      body: JSON.stringify({ deviceId, deviceInfo }),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      const error = new Error(data?.message || 'Failed to generate activation code')
      error.status = response.status
      error.payload = data
      throw error
    }

    return data
  }

  static async getActivationStatus(sessionId) {
    if (!sessionId) {
      throw new Error('sessionId is required to check activation status')
    }

    const url = `${buildUrl('activation')}?sessionId=${encodeURIComponent(sessionId)}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': MOBILE_API_CONFIG.API_KEY,
      },
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      const error = new Error(data?.message || 'Failed to check activation status')
      error.status = response.status
      error.payload = data
      throw error
    }

    return data
  }

  static async completeActivationSession(result, options = {}) {
    if (!result?.token) {
      throw new Error('Activation result is missing token')
    }

    return AuthService.initializeSession(result.token, result.user, options)
  }
}
