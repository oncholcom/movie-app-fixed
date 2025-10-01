import { ApiClient } from './ApiClient'
import { AuthService } from './AuthService'

const ACCOUNT_CACHE_TTL_MS = 1000 * 30

const normalizeSubscription = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  return {
    planId: payload.planId || null,
    planName: payload.planName || null,
    status: payload.status || null,
    startDate: payload.startDate || null,
    endDate: payload.endDate || null,
    nextPayment: payload.nextPayment || null,
    price: typeof payload.price === 'number' ? payload.price : null,
    currency: payload.currency || null,
    maxDevices: typeof payload.maxDevices === 'number' ? payload.maxDevices : null,
    features: Array.isArray(payload.features) ? payload.features : [],
  }
}

const normalizeAccount = (data = {}) => ({
  user: data.user || null,
  subscription: normalizeSubscription(data.subscription || data),
})

export class UserService {
  static async getAccountOverview() {
    const cachedPayload = await AuthService.getStoredUser()
    const cachedAccount = cachedPayload?.data || {}
    const cachedAt = cachedPayload?.cachedAt || 0

    let normalizedAccount = normalizeAccount(cachedAccount)
    const isCacheFresh = cachedAt && Date.now() - cachedAt < ACCOUNT_CACHE_TTL_MS

    if (isCacheFresh) {
      return normalizedAccount
    }

    try {
      const remoteSubscription = await this.getSubscription()
      if (remoteSubscription) {
        normalizedAccount = normalizeAccount({
          ...(normalizedAccount || {}),
          subscription: remoteSubscription,
        })
      }

      await AuthService.storeUserProfile(normalizedAccount)
    } catch (error) {
      if (error?.shouldLogout) {
        throw error
      }

      console.warn('Failed to refresh subscription', error)
      await AuthService.storeUserProfile(normalizedAccount)
    }

    return normalizedAccount
  }

  static async getSubscription() {
    const response = await ApiClient.request('subscription')
    if (!response) return null

    if (response.success === false) {
      const error = new Error(response.error || 'Failed to load subscription')
      error.payload = response
      if (response.code) {
        error.code = response.code
      }
      throw error
    }

    if (response.data) {
      return normalizeSubscription(response.data)
    }

    return normalizeSubscription(response)
  }
}
