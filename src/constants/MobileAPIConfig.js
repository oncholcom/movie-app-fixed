import {
  MOBILE_API_BASE_URL as ENV_MOBILE_API_BASE_URL,
  MOBILE_API_PROD_BASE_URL as ENV_MOBILE_API_PROD_BASE_URL,
  MOBILE_API_KEY as ENV_MOBILE_API_KEY,
  MOBILE_WEB_LOGIN_URL as ENV_MOBILE_WEB_LOGIN_URL,
} from '@env'

const FALLBACK_WEB_LOGIN_PROD_URL = 'https://robistream.com/mobile-login'

const resolveEnvValue = (primary, ...fallbacks) => {
  for (const candidate of [primary, ...fallbacks]) {
    if (candidate && typeof candidate === 'string' && candidate.trim().length > 0 && candidate !== 'undefined') {
      return candidate
    }
  }
  return undefined
}

let resolvedBaseUrl =
  resolveEnvValue(
    ENV_MOBILE_API_PROD_BASE_URL,
    ENV_MOBILE_API_BASE_URL,
    process.env.EXPO_PUBLIC_MOBILE_API_PROD_BASE_URL,
    process.env.EXPO_PUBLIC_MOBILE_API_BASE_URL,
    process.env.NEXT_PUBLIC_MOBILE_API_PROD_BASE_URL,
    process.env.NEXT_PUBLIC_MOBILE_API_BASE_URL,
    process.env.MOBILE_API_PROD_BASE_URL,
    process.env.MOBILE_API_BASE_URL,
  )

// Ensure /api/mobile is included
if (resolvedBaseUrl && !resolvedBaseUrl.endsWith('/api/mobile')) {
  resolvedBaseUrl = resolvedBaseUrl.replace(/\/*$/, '') + '/api/mobile'
}

const resolvedApiKey =
  resolveEnvValue(
    ENV_MOBILE_API_KEY,
    process.env.EXPO_PUBLIC_MOBILE_API_KEY,
    process.env.NEXT_PUBLIC_MOBILE_API_KEY,
    process.env.MOBILE_API_KEY,
  )

// Warn at runtime if base URL or API key are missing; helps diagnose release builds
if (!resolvedBaseUrl) {
  console.warn('[MobileAPIConfig] MOBILE_API_BASE_URL is not defined. Login requests will fail. Ensure .env is bundled.');
}
if (!resolvedApiKey) {
  console.warn('[MobileAPIConfig] MOBILE_API_KEY is not defined. API requests may be rejected.');
}

const resolvedProdWebLoginUrl =
  resolveEnvValue(
    ENV_MOBILE_WEB_LOGIN_URL,
    process.env.EXPO_PUBLIC_MOBILE_WEB_LOGIN_URL,
    process.env.NEXT_PUBLIC_MOBILE_WEB_LOGIN_URL,
    process.env.MOBILE_WEB_LOGIN_URL,
  ) || FALLBACK_WEB_LOGIN_PROD_URL

const resolvedWebLoginUrl = resolvedProdWebLoginUrl

export const MOBILE_API_CONFIG = {
  BASE_URL: resolvedBaseUrl,
  API_KEY: resolvedApiKey,
}

// Add ENCRYPTION_KEY from env if available
const ENCRYPTION_KEY = resolveEnvValue(
  process.env.ENCRYPTION_KEY,
  process.env.EXPO_PUBLIC_ENCRYPTION_KEY,
  process.env.NEXT_PUBLIC_ENCRYPTION_KEY,
)
export { ENCRYPTION_KEY }

export const MOBILE_API_ENDPOINTS = {
  baseUrl: resolvedBaseUrl,
}

export const MOBILE_WEB_LOGIN_URLS = {
  url: resolvedWebLoginUrl,
}

export const MOBILE_WEB_LOGIN_URL = resolvedWebLoginUrl

export const MOBILE_AUTH_STORAGE_KEYS = {
  TOKEN: 'mobile_token',
  USER: 'mobile_user',
}
