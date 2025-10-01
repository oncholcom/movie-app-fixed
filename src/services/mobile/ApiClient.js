import { MOBILE_API_CONFIG } from '../../constants/MobileAPIConfig'
import { AuthService } from './AuthService'

const defaultHeaders = {
  'Content-Type': 'application/json',
  'x-api-key': MOBILE_API_CONFIG.API_KEY,
}

const parseJson = async (response) => {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch (error) {
    console.warn('Failed to parse API response JSON', error)
    return null
  }
}

const sanitizePath = (path) => String(path || '').replace(/^\/+/, '')

export class ApiClient {
  static async request(endpoint, options = {}) {
    const token = await AuthService.getStoredToken()
    const headers = {
      ...defaultHeaders,
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    const baseUrl = AuthService.getBaseUrl()
    const url = `${(baseUrl || MOBILE_API_CONFIG.BASE_URL).replace(/\/+$/, '')}/${sanitizePath(endpoint)}`

    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await parseJson(response)

    if (response.status === 401) {
      const error = new Error(data?.error || data?.message || 'Unauthorized')
      error.status = response.status
      error.payload = data
      error.code = data?.code

      if (['ip_mismatch', 'invalid_token', 'missing_token'].includes(error.code)) {
        await AuthService.logout()
        error.shouldLogout = true
      }

      throw error
    }

    if (!response.ok) {
      const error = new Error(data?.error || data?.message || `API Error: ${response.status}`)
      error.status = response.status
      error.payload = data
      error.url = url
      error.method = options.method || 'GET'
      error.environment = AuthService.getEnvironment?.() || 'unknown'
      error.code = data?.code

      if (response.status !== 404) {
        console.error('Mobile API request failed', {
          url,
          method: options.method || 'GET',
          status: response.status,
          environment: error.environment,
          payload: data,
        })
      }

      throw error
    }

    return data
  }
}
