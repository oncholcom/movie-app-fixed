import { ApiClient } from './ApiClient'

const normalizeDevices = (payload) => {
  const list = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.devices) ? payload.devices : []

  return list.map((entry) => ({
    id: entry.id || entry.deviceId || entry.identifier,
    deviceId: entry.deviceId || entry.id,
    name: entry.name || entry.deviceName || entry.model || 'Unknown device',
    model: entry.model,
    type: entry.type || entry.deviceType,
    platform: entry.platform || entry.os || entry.type,
    osVersion: entry.osVersion || entry.version || entry.os,
    lastUsed: entry.lastUsed || entry.lastActive,
    ipAddress: entry.ipAddress || entry.ip,
    location: entry.location,
    isCurrent: Boolean(entry.isCurrent || entry.current),
    isActive: entry.isActive !== undefined ? entry.isActive : true,
    canRemove: entry.canRemove !== undefined ? entry.canRemove : true,
    raw: entry,
  }))
}

export class DeviceService {
  static async getDevices() {
    const data = await ApiClient.request('devices')

    return {
      devices: normalizeDevices(data),
      limits: data?.limits || data?.meta?.limits || null,
      success: data?.success !== undefined ? data.success : true,
      message: data?.message,
    }
  }

  static async registerDevice(deviceId, deviceName) {
    if (!deviceId) {
      throw new Error('deviceId is required to register a device')
    }

    return ApiClient.request('devices', {
      method: 'POST',
      body: JSON.stringify({
        deviceId,
        deviceName,
      }),
    })
  }

  static async removeDevice(deviceId) {
    if (!deviceId) {
      throw new Error('deviceId is required to remove a device')
    }

    try {
      return await ApiClient.request(`devices/${encodeURIComponent(deviceId)}`, {
        method: 'DELETE',
      })
    } catch (error) {
      if (error?.status === 404) {
        return {
          success: false,
          notFound: true,
          message: error?.payload?.error || 'Device not found',
        }
      }

      throw error
    }
  }
}
