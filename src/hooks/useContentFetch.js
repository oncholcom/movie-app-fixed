import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Reusable hook for fetching content with loading, error, and retry logic
 * Can be used by any section component
 */
export const useContentFetch = (fetchFn, dependencies = [], options = {}) => {
  const {
    initialData = [],
    transform = null,
    onSuccess = null,
    onError = null,
    enabled = true,
  } = options

  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isMountedRef = useRef(true)
  const retryCountRef = useRef(0)
  const maxRetries = 3

  const fetchData = useCallback(async () => {
    if (!enabled || !fetchFn) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetchFn()
      let resultData = response?.data?.results || response?.data || []

      // Apply transformation if provided
      if (transform && typeof transform === 'function') {
        resultData = transform(resultData)
      }

      if (isMountedRef.current) {
        setData(resultData)
        retryCountRef.current = 0

        // Call success callback
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess(resultData)
        }
      }
    } catch (err) {
      console.error('useContentFetch error:', err)

      if (isMountedRef.current) {
        const errorMessage = err?.message || 'Failed to fetch content'
        setError(errorMessage)

        // Call error callback
        if (onError && typeof onError === 'function') {
          onError(err)
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [fetchFn, transform, onSuccess, onError, enabled])

  // Retry logic with exponential backoff
  const retry = useCallback(() => {
    if (retryCountRef.current < maxRetries) {
      retryCountRef.current += 1
      const delay = Math.pow(2, retryCountRef.current) * 1000 // 2s, 4s, 8s

      setTimeout(() => {
        if (isMountedRef.current) {
          fetchData()
        }
      }, delay)
    }
  }, [fetchData])

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchData()
  }, [fetchData, ...dependencies])

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    retry,
  }
}
