import api from './api';

/**
 * Device Service
 * Handles device-related API calls
 */
class DeviceService {
  /**
   * Get all devices
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} List of devices
   */
  async getDevices(filters = {}) {
    const params = {};

    if (filters.propertyId) {
      params.propertyId = filters.propertyId;
    }

    if (filters.deviceType) {
      params.deviceType = filters.deviceType;
    }

    if (filters.status) {
      params.status = filters.status;
    }

    const response = await api.get('/devices', { params });
    return response.data.data;
  }

  /**
   * Get device by ID
   * @param {string} deviceId - Device ID
   * @returns {Promise<Object>} Device details
   */
  async getDevice(deviceId) {
    const response = await api.get(`/devices/${deviceId}`);
    return response.data.data;
  }

  /**
   * Create a device
   * @param {Object} deviceData - Device data
   * @returns {Promise<Object>} Created device
   */
  async createDevice(deviceData) {
    const response = await api.post('/devices', deviceData);
    return response.data.data;
  }

  /**
   * Update device
   * @param {string} deviceId - Device ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated device
   */
  async updateDevice(deviceId, updates) {
    const response = await api.patch(`/devices/${deviceId}`, updates);
    return response.data.data;
  }

  /**
   * Delete device
   * @param {string} deviceId - Device ID
   * @returns {Promise<void>}
   */
  async deleteDevice(deviceId) {
    await api.delete(`/devices/${deviceId}`);
  }

  /**
   * Get device status
   * @param {string} deviceId - Device ID
   * @returns {Promise<Object>} Device status
   */
  async getDeviceStatus(deviceId) {
    const response = await api.get(`/devices/${deviceId}/status`);
    return response.data.data;
  }

  /**
   * Control device
   * @param {string} deviceId - Device ID
   * @param {Object} command - Command data
   * @returns {Promise<Object>} Command result
   */
  async controlDevice(deviceId, command) {
    const response = await api.post(`/devices/${deviceId}/control`, command);
    return response.data.data;
  }

  /**
   * Get TTLock authorization URL
   * @returns {Promise<Object>} Authorization URL and state
   */
  async getTTLockAuthUrl() {
    const response = await api.get('/devices/ttlock/auth-url');
    return response.data.data;
  }

  /**
   * Handle TTLock OAuth callback
   * @param {string} code - Authorization code
   * @param {string} propertyId - Property ID
   * @returns {Promise<Object>} Connection result
   */
  async connectTTLock(code, propertyId) {
    const response = await api.post('/devices/ttlock/callback', {
      code,
      propertyId
    });
    return response.data.data;
  }

  /**
   * Sync TTLock devices
   * @param {string} propertyId - Property ID
   * @returns {Promise<Object>} Sync result
   */
  async syncTTLockDevices(propertyId) {
    const response = await api.post('/devices/ttlock/sync', {
      propertyId
    });
    return response.data.data;
  }

  /**
   * Connect Tuya home to property
   * @param {string} propertyId - Property ID
   * @param {string} homeId - Tuya home ID
   * @returns {Promise<Object>} Connection result
   */
  async connectTuyaHome(propertyId, homeId) {
    const response = await api.post('/devices/tuya/connect', {
      propertyId,
      homeId
    });
    return response.data.data;
  }

  /**
   * Sync Tuya devices
   * @param {string} propertyId - Property ID
   * @returns {Promise<Object>} Sync result
   */
  async syncTuyaDevices(propertyId) {
    const response = await api.post('/devices/tuya/sync', {
      propertyId
    });
    return response.data.data;
  }

  /**
   * Get device statistics
   * @returns {Promise<Object>} Device statistics
   */
  async getDeviceStats() {
    const response = await api.get('/devices/stats');
    return response.data.data;
  }

  /**
   * Generate passcode for TTLock
   * @param {string} deviceId - Device ID
   * @param {Object} passcodeData - Passcode configuration
   * @returns {Promise<Object>} Generated passcode
   */
  async generatePasscode(deviceId, passcodeData) {
    const response = await api.post(`/devices/${deviceId}/passcode`, passcodeData);
    return response.data.data;
  }

  /**
   * List passcodes for TTLock
   * @param {string} deviceId - Device ID
   * @returns {Promise<Array>} List of passcodes
   */
  async listPasscodes(deviceId) {
    const response = await api.get(`/devices/${deviceId}/passcodes`);
    return response.data.data;
  }

  /**
   * Delete passcode from TTLock
   * @param {string} deviceId - Device ID
   * @param {string} passcodeId - Passcode ID
   * @returns {Promise<void>}
   */
  async deletePasscode(deviceId, passcodeId) {
    await api.delete(`/devices/${deviceId}/passcode/${passcodeId}`);
  }

  /**
   * Toggle device (for switches, lights, plugs)
   * @param {string} deviceId - Device ID
   * @param {boolean} turnOn - true to turn on, false to turn off
   * @returns {Promise<Object>} Command result
   */
  async toggleDevice(deviceId, turnOn) {
    return this.controlDevice(deviceId, {
      action: 'toggle',
      turnOn
    });
  }

  /**
   * Set thermostat temperature
   * @param {string} deviceId - Device ID
   * @param {number} temperature - Target temperature
   * @returns {Promise<Object>} Command result
   */
  async setTemperature(deviceId, temperature) {
    return this.controlDevice(deviceId, {
      action: 'set_temperature',
      temperature
    });
  }

  /**
   * Set light brightness
   * @param {string} deviceId - Device ID
   * @param {number} brightness - Brightness (0-100)
   * @returns {Promise<Object>} Command result
   */
  async setBrightness(deviceId, brightness) {
    return this.controlDevice(deviceId, {
      action: 'set_brightness',
      brightness
    });
  }

  /**
   * Set light color
   * @param {string} deviceId - Device ID
   * @param {Object} color - {h, s, v}
   * @returns {Promise<Object>} Command result
   */
  async setColor(deviceId, color) {
    return this.controlDevice(deviceId, {
      action: 'set_color',
      color
    });
  }

  /**
   * Lock device (TTLock)
   * @param {string} deviceId - Device ID
   * @returns {Promise<Object>} Command result
   */
  async lock(deviceId) {
    return this.controlDevice(deviceId, {
      action: 'lock'
    });
  }

  /**
   * Unlock device (TTLock)
   * @param {string} deviceId - Device ID
   * @returns {Promise<Object>} Command result
   */
  async unlock(deviceId) {
    return this.controlDevice(deviceId, {
      action: 'unlock'
    });
  }
}

export default new DeviceService();
