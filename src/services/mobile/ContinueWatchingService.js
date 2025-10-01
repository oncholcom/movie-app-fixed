import { ApiClient } from './ApiClient'

const normalizeItems = (items) => {
  if (!Array.isArray(items)) return []

  return items.map((item) => ({
    ...item,
    id: item.id || item.contentId,
    type: item.type || item.contentType,
    title: item.title,
    imageUrl: item.imageUrl || item.poster || item.posterUrl,
    season: item.season ?? null,
    episode: item.episode ?? null,
    episodeTitle: item.episodeTitle || item.titleEpisode || null,
    positionSeconds: item.positionSeconds ?? item.position ?? null,
    durationSeconds: item.durationSeconds ?? item.duration ?? null,
    lastWatched: item.lastWatched || item.updatedAt || null,
  }))
}

const extractItems = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.continueWatching)) return payload.continueWatching
  return []
}

export class ContinueWatchingService {
  static async list(options = {}) {
    const params = new URLSearchParams()

    if (options.limit != null) {
      params.set('limit', String(options.limit))
    }

    if (options.type) {
      params.set('type', options.type)
    }

    const query = params.toString()
    const response = await ApiClient.request(query ? `continue-watching?${query}` : 'continue-watching')

    const items = normalizeItems(extractItems(response))

    return {
      items,
      success: response?.success !== undefined ? response.success : true,
      message: response?.message,
    }
  }

  static async save(payload) {
    if (!payload?.id || !payload?.type) {
      throw new Error('id and type are required to save continue watching progress')
    }

    const response = await ApiClient.request('continue-watching', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    if (response?.success === false) {
      const error = new Error(response?.message || response?.error || 'Failed to save progress')
      error.payload = response
      throw error
    }

    return response?.data ?? response
  }

  static async remove(id, type) {
    if (!id) {
      throw new Error('id is required to delete continue watching entry')
    }

    let path = `continue-watching/${encodeURIComponent(id)}`
    if (type) {
      path += `?type=${encodeURIComponent(type)}`
    }

    try {
      const response = await ApiClient.request(path, {
        method: 'DELETE',
      })

      if (response?.success === false) {
        return response
      }

      return response
    } catch (error) {
      if (error?.status === 404) {
        if (type) {
          try {
            const fallbackResponse = await ApiClient.request(
              `continue-watching/${encodeURIComponent(id)}`,
              {
                method: 'DELETE',
              },
            )

            if (fallbackResponse?.success === false) {
              return fallbackResponse
            }

            return fallbackResponse
          } catch (fallbackError) {
            if (fallbackError?.status === 404) {
              return {
                success: false,
                message:
                  fallbackError?.payload?.error || 'Item not found in continue watching',
                notFound: true,
                status: fallbackError.status,
              }
            }

            throw fallbackError
          }
        }

        return {
          success: false,
          message: error?.payload?.error || 'Item not found in continue watching',
          notFound: true,
          status: error.status,
        }
      }

      throw error
    }
  }
}
