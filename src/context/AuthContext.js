import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { AuthService, UserService, DeviceService } from '../services/mobile'
import { getDeviceId, getDeviceInfo } from '../utils/device'

const AuthContext = createContext({})

const ACCOUNT_CACHE_TTL_MS = 1000 * 30

const hydrateCachedAccount = async (setAccount) => {
  const cached = await AuthService.getStoredUser()
  if (cached?.data) {
    setAccount(cached.data)
  }
  return cached
}

export const AuthProvider = ({ children }) => {
  const [account, setAccount] = useState(null)
  const [token, setToken] = useState(null)
  const [initializing, setInitializing] = useState(true)
  const [authenticating, setAuthenticating] = useState(false)
  const [error, setError] = useState(null)

  const refreshAccount = useCallback(async () => {
    const overview = await UserService.getAccountOverview()
    if (overview) {
      setAccount(overview)
    }
    return overview
  }, [])

  const bootstrap = useCallback(async () => {
    try {
      const storedToken = await AuthService.getStoredToken()
      if (!storedToken) {
        await AuthService.logout()
        setToken(null)
        setAccount(null)
        return
      }

      setToken(storedToken)
      const cachedPayload = await hydrateCachedAccount(setAccount)

      const cachedAt = cachedPayload?.cachedAt || 0
      const isCacheFresh = cachedAt && Date.now() - cachedAt < ACCOUNT_CACHE_TTL_MS

      if (!isCacheFresh) {
        try {
          await refreshAccount()
        } catch (overviewError) {
          if (overviewError?.shouldLogout) {
            await AuthService.logout()
            setToken(null)
            setAccount(null)
            return
          }

          console.warn('Failed to refresh account overview during bootstrap', overviewError)
        }
      }
    } finally {
      setInitializing(false)
    }
  }, [refreshAccount])

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  const login = useCallback(
    async ({ email, password } = {}) => {
      setAuthenticating(true)
      setError(null)

      try {
        const deviceId = await getDeviceId()
        const deviceInfo = getDeviceInfo()

        const session = await AuthService.login({
          email,
          password,
          deviceId,
          deviceInfo: { ...deviceInfo, deviceId },
        })

        const nextToken = session?.token || (await AuthService.getStoredToken())
        if (nextToken) {
          setToken(nextToken)
        }

        const nextAccount = {
          user: session?.user || null,
          subscription: session?.subscription || null,
        }

        if (nextAccount.user || nextAccount.subscription) {
          setAccount(nextAccount)
          await AuthService.storeUserProfile(nextAccount)
        } else {
          await hydrateCachedAccount(setAccount)
        }

        try {
          await refreshAccount()
        } catch (overviewError) {
          if (overviewError?.shouldLogout) {
            await AuthService.logout()
            setToken(null)
            setAccount(null)
            throw overviewError
          }

          console.warn('Failed to refresh account overview after login', overviewError)
        }

        return session
      } catch (err) {
        await AuthService.logout()
        setToken(null)
        setAccount(null)
        setError(err)
        throw err
      } finally {
        setAuthenticating(false)
      }
    },
    [refreshAccount],
  )

  const logout = useCallback(async () => {
    try {
      try {
        const existingToken = await AuthService.getStoredToken()
        if (existingToken) {
          const deviceId = await getDeviceId()
          if (deviceId) {
            await DeviceService.removeDevice(deviceId)
          }
        }
      } catch (deviceError) {
        console.warn('Failed to deregister device during logout', deviceError)
      }

      await AuthService.logoutRemote()
    } catch (remoteError) {
      console.warn('Remote logout failed', remoteError)
    } finally {
      await AuthService.logout()
      setToken(null)
      setAccount(null)
      setError(null)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value = useMemo(
    () => ({
      account,
      user: account?.user || null,
      subscription: account?.subscription || null,
      token,
      initializing,
      authenticating,
      error,
      login,
      logout,
      refreshAccount,
      clearError,
      isAuthenticated: !!token,
    }),
    [
      account,
      token,
      initializing,
      authenticating,
      error,
      login,
      logout,
      refreshAccount,
      clearError,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
