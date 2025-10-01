import { ApiClient } from './ApiClient'

const ensureArray = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.watchlist)) return payload.watchlist
  return []
}

export class WatchlistService {
  static async list(options = {}) {
    const params = new URLSearchParams()

    if (options.type) {
      params.set('type', options.type)
    }

    if (options.limit != null) {
      params.set('limit', String(options.limit))
    }

    if (options.offset != null) {
      params.set('offset', String(options.offset))
    }

    const query = params.toString()
    const data = await ApiClient.request(query ? `watchlist?${query}` : 'watchlist')
    return ensureArray(data)
  }

  static async add(item) {
    if (!item || !item.id || !item.type) {
      throw new Error('Item with id and type is required to add to watchlist')
    }

    return ApiClient.request('watchlist', {
      method: 'POST',
      body: JSON.stringify(item),
    })
  }

  static async remove(contentId, contentType) {
    if (!contentId || !contentType) {
      throw new Error('contentId and contentType are required to remove from watchlist')
    }

    const path = `watchlist/${encodeURIComponent(contentId)}?type=${encodeURIComponent(contentType)}`
    return ApiClient.request(path, {
      method: 'DELETE',
    })
  }
}
