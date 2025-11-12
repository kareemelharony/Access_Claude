const axios = require('axios');
const crypto = require('crypto');
const redis = require('../../config/redis');
const logger = require('../../utils/logger');
const { encryptionService } = require('../../utils/encryption');

/**
 * Tuya Cloud API Service
 *
 * Handles integration with Tuya Smart Home Platform:
 * - OAuth 2.0 authentication
 * - Device discovery and management
 * - Device control (lights, thermostats, plugs, sensors)
 * - Scene automation
 * - Real-time status monitoring
 *
 * API Documentation: https://developer.tuya.com/en/docs/cloud
 */
class TuyaService {
  constructor() {
    this.baseURL = process.env.TUYA_API_URL || 'https://openapi.tuyaeu.com';
    this.clientId = process.env.TUYA_CLIENT_ID;
    this.clientSecret = process.env.TUYA_CLIENT_SECRET;
    this.redirectUri = process.env.TUYA_REDIRECT_URI;
  }

  /**
   * Generate request signature for Tuya API
   * @private
   */
  generateSignature(method, path, params, body, timestamp, accessToken = '') {
    // Sign string format: client_id + access_token + timestamp + method + path + body
    const contentHash = crypto
      .createHash('sha256')
      .update(body || '')
      .digest('hex');

    const stringToSign = [
      this.clientId,
      accessToken,
      timestamp,
      method.toUpperCase(),
      contentHash,
      '',
      path
    ].join('\n');

    const sign = crypto
      .createHmac('sha256', this.clientSecret)
      .update(stringToSign)
      .digest('hex')
      .toUpperCase();

    return sign;
  }

  /**
   * Make authenticated request to Tuya API
   * @private
   */
  async makeRequest(method, path, options = {}) {
    const { params = {}, body = {}, accessToken = '' } = options;
    const timestamp = Date.now().toString();
    const bodyString = Object.keys(body).length > 0 ? JSON.stringify(body) : '';

    const signature = this.generateSignature(method, path, params, bodyString, timestamp, accessToken);

    const headers = {
      'client_id': this.clientId,
      'sign': signature,
      'sign_method': 'HMAC-SHA256',
      't': timestamp,
      'Content-Type': 'application/json'
    };

    if (accessToken) {
      headers['access_token'] = accessToken;
    }

    try {
      const response = await axios({
        method,
        url: `${this.baseURL}${path}`,
        params,
        data: bodyString || undefined,
        headers
      });

      if (!response.data.success) {
        throw new Error(`Tuya API error: ${response.data.msg || 'Unknown error'}`);
      }

      return response.data.result;
    } catch (error) {
      logger.error(`Tuya API request failed [${method} ${path}]:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get access token using client credentials
   * @returns {Promise<Object>} Token response
   */
  async getAccessToken() {
    const cacheKey = 'tuya:access_token';

    // Check cache first
    const cachedToken = await redis.get(cacheKey);
    if (cachedToken) {
      return JSON.parse(cachedToken);
    }

    logger.info('Obtaining Tuya access token');

    const result = await this.makeRequest('GET', '/v1.0/token', {
      params: { grant_type: 1 }
    });

    const tokenData = {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      expiresIn: result.expire_time,
      uid: result.uid
    };

    // Cache token (expires_in - 5 minutes buffer)
    await redis.setWithTTL(cacheKey, JSON.stringify(tokenData), result.expire_time - 300);

    return tokenData;
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New token response
   */
  async refreshAccessToken(refreshToken) {
    logger.info('Refreshing Tuya access token');

    const result = await this.makeRequest('GET', '/v1.0/token', {
      params: {
        grant_type: 1,
        refresh_token: refreshToken
      }
    });

    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      expiresIn: result.expire_time
    };
  }

  /**
   * Get user homes (for user-linked devices)
   * @param {string} accessToken - Access token
   * @param {string} userId - Tuya user ID
   * @returns {Promise<Array>} List of homes
   */
  async getUserHomes(accessToken, userId) {
    logger.info(`Fetching Tuya homes for user: ${userId}`);

    const result = await this.makeRequest('GET', `/v1.0/users/${userId}/homes`, {
      accessToken
    });

    return result || [];
  }

  /**
   * Get devices in a home
   * @param {string} accessToken - Access token
   * @param {string} homeId - Home ID
   * @returns {Promise<Array>} List of devices
   */
  async getHomeDevices(accessToken, homeId) {
    logger.info(`Fetching devices for Tuya home: ${homeId}`);

    const result = await this.makeRequest('GET', `/v1.0/homes/${homeId}/devices`, {
      accessToken
    });

    return result || [];
  }

  /**
   * Get device details
   * @param {string} accessToken - Access token
   * @param {string} deviceId - Device ID
   * @returns {Promise<Object>} Device details
   */
  async getDeviceDetails(accessToken, deviceId) {
    logger.info(`Fetching Tuya device details: ${deviceId}`);

    const result = await this.makeRequest('GET', `/v1.0/devices/${deviceId}`, {
      accessToken
    });

    return result;
  }

  /**
   * Get device status
   * @param {string} accessToken - Access token
   * @param {string} deviceId - Device ID
   * @returns {Promise<Array>} Device status (array of code-value pairs)
   */
  async getDeviceStatus(accessToken, deviceId) {
    logger.info(`Fetching status for device: ${deviceId}`);

    const result = await this.makeRequest('GET', `/v1.0/devices/${deviceId}/status`, {
      accessToken
    });

    return result || [];
  }

  /**
   * Send command to device
   * @param {string} accessToken - Access token
   * @param {string} deviceId - Device ID
   * @param {Array} commands - Array of {code, value} commands
   * @returns {Promise<boolean>} Success status
   */
  async sendDeviceCommand(accessToken, deviceId, commands) {
    logger.info(`Sending command to device ${deviceId}:`, commands);

    await this.makeRequest('POST', `/v1.0/devices/${deviceId}/commands`, {
      accessToken,
      body: { commands }
    });

    return true;
  }

  /**
   * Turn device on/off
   * @param {string} accessToken - Access token
   * @param {string} deviceId - Device ID
   * @param {boolean} turnOn - true to turn on, false to turn off
   * @returns {Promise<boolean>} Success status
   */
  async toggleDevice(accessToken, deviceId, turnOn) {
    logger.info(`Turning ${turnOn ? 'on' : 'off'} device: ${deviceId}`);

    return this.sendDeviceCommand(accessToken, deviceId, [
      { code: 'switch', value: turnOn }
    ]);
  }

  /**
   * Set thermostat temperature
   * @param {string} accessToken - Access token
   * @param {string} deviceId - Device ID
   * @param {number} temperature - Target temperature
   * @returns {Promise<boolean>} Success status
   */
  async setThermostatTemperature(accessToken, deviceId, temperature) {
    logger.info(`Setting thermostat ${deviceId} to ${temperature}°C`);

    return this.sendDeviceCommand(accessToken, deviceId, [
      { code: 'temp_set', value: Math.round(temperature * 10) } // Tuya uses temp * 10
    ]);
  }

  /**
   * Set light brightness
   * @param {string} accessToken - Access token
   * @param {string} deviceId - Device ID
   * @param {number} brightness - Brightness (0-100)
   * @returns {Promise<boolean>} Success status
   */
  async setLightBrightness(accessToken, deviceId, brightness) {
    logger.info(`Setting light ${deviceId} brightness to ${brightness}%`);

    return this.sendDeviceCommand(accessToken, deviceId, [
      { code: 'bright_value', value: Math.round(brightness * 10) } // 0-1000 scale
    ]);
  }

  /**
   * Set light color
   * @param {string} accessToken - Access token
   * @param {string} deviceId - Device ID
   * @param {Object} color - {h: hue (0-360), s: saturation (0-100), v: value (0-100)}
   * @returns {Promise<boolean>} Success status
   */
  async setLightColor(accessToken, deviceId, color) {
    logger.info(`Setting light ${deviceId} color:`, color);

    // Convert HSV to Tuya format: 14-char hex string
    const h = Math.round((color.h / 360) * 360).toString(16).padStart(4, '0');
    const s = Math.round((color.s / 100) * 1000).toString(16).padStart(4, '0');
    const v = Math.round((color.v / 100) * 1000).toString(16).padStart(4, '0');
    const colorValue = `${h}${s}${v}`;

    return this.sendDeviceCommand(accessToken, deviceId, [
      { code: 'colour_data', value: colorValue }
    ]);
  }

  /**
   * Get device specifications
   * @param {string} accessToken - Access token
   * @param {string} deviceId - Device ID
   * @returns {Promise<Object>} Device specifications
   */
  async getDeviceSpecifications(accessToken, deviceId) {
    logger.info(`Fetching specifications for device: ${deviceId}`);

    const result = await this.makeRequest('GET', `/v1.0/devices/${deviceId}/specifications`, {
      accessToken
    });

    return result;
  }

  /**
   * Create scene automation
   * @param {string} accessToken - Access token
   * @param {string} homeId - Home ID
   * @param {Object} sceneData - Scene configuration
   * @returns {Promise<Object>} Created scene
   */
  async createScene(accessToken, homeId, sceneData) {
    const { name, actions, triggers = [] } = sceneData;

    logger.info(`Creating Tuya scene: ${name}`);

    const result = await this.makeRequest('POST', `/v1.0/homes/${homeId}/scenes`, {
      accessToken,
      body: {
        name,
        background: 'https://images.tuyaeu.com/smart/rule/cover/starry.png',
        actions,
        match_type: 1, // Match all conditions
        preconditions: triggers
      }
    });

    return result;
  }

  /**
   * Trigger scene
   * @param {string} accessToken - Access token
   * @param {string} homeId - Home ID
   * @param {string} sceneId - Scene ID
   * @returns {Promise<boolean>} Success status
   */
  async triggerScene(accessToken, homeId, sceneId) {
    logger.info(`Triggering Tuya scene: ${sceneId}`);

    await this.makeRequest('POST', `/v1.0/homes/${homeId}/scenes/${sceneId}/trigger`, {
      accessToken
    });

    return true;
  }

  /**
   * Delete scene
   * @param {string} accessToken - Access token
   * @param {string} homeId - Home ID
   * @param {string} sceneId - Scene ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteScene(accessToken, homeId, sceneId) {
    logger.info(`Deleting Tuya scene: ${sceneId}`);

    await this.makeRequest('DELETE', `/v1.0/homes/${homeId}/scenes/${sceneId}`, {
      accessToken
    });

    return true;
  }

  /**
   * Get device logs
   * @param {string} accessToken - Access token
   * @param {string} deviceId - Device ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Device logs
   */
  async getDeviceLogs(accessToken, deviceId, options = {}) {
    const {
      startTime = Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
      endTime = Date.now(),
      type = 1, // 1: online/offline, 7: DP report
      size = 100
    } = options;

    logger.info(`Fetching logs for device: ${deviceId}`);

    const result = await this.makeRequest('GET', `/v1.0/devices/${deviceId}/logs`, {
      accessToken,
      params: {
        start_time: startTime,
        end_time: endTime,
        type,
        size
      }
    });

    return result?.logs || [];
  }

  /**
   * Transform Tuya device data to our format
   * @param {Object} tuyaDevice - Raw device data from Tuya
   * @returns {Object} Transformed device data
   */
  transformDeviceData(tuyaDevice) {
    // Map Tuya categories to our device types
    const categoryMap = {
      'wk': 'tuya_thermostat',
      'dj': 'tuya_light',
      'cz': 'tuya_plug',
      'ms': 'tuya_sensor',
      'kg': 'tuya_switch',
      'cl': 'tuya_curtain',
      'cs': 'tuya_sensor'
    };

    const deviceType = categoryMap[tuyaDevice.category] || `tuya_${tuyaDevice.category}`;

    return {
      deviceId: tuyaDevice.id,
      deviceType,
      name: {
        en: tuyaDevice.name,
        ar: tuyaDevice.name
      },
      category: tuyaDevice.category,
      model: tuyaDevice.model || tuyaDevice.product_name,
      manufacturer: 'Tuya',
      firmwareVersion: tuyaDevice.update_time?.toString(),
      status: tuyaDevice.online ? 'online' : 'offline',
      batteryLevel: null, // Tuya doesn't provide battery info in main device object
      lastSeenAt: tuyaDevice.active_time ? new Date(tuyaDevice.active_time * 1000) : null,
      capabilities: {
        remoteControl: true,
        localControl: tuyaDevice.local_key ? true : false,
        voiceControl: tuyaDevice.icon ? true : false
      },
      settings: {
        productId: tuyaDevice.product_id,
        uuid: tuyaDevice.uuid,
        ownerId: tuyaDevice.owner_id,
        homeId: tuyaDevice.home_id,
        ip: tuyaDevice.ip,
        localKey: tuyaDevice.local_key,
        sub: tuyaDevice.sub
      }
    };
  }

  /**
   * Map device category to friendly name
   * @param {string} category - Tuya category code
   * @returns {string} Friendly category name
   */
  getCategoryName(category) {
    const names = {
      'wk': 'Thermostat',
      'dj': 'Light',
      'cz': 'Socket/Plug',
      'ms': 'Door Sensor',
      'kg': 'Switch',
      'cl': 'Curtain',
      'cs': 'Contact Sensor',
      'pir': 'Motion Sensor',
      'ywbj': 'Smoke Detector',
      'rqbj': 'Gas Detector',
      'sj': 'Water Leak Detector'
    };

    return names[category] || category.toUpperCase();
  }

  /**
   * ============================================
   * SMART LOCK METHODS
   * Tuya powers 300,000+ smart lock SKUs from hundreds of brands
   * including Aqara, Yale, Samsung, Schlage, August, etc.
   * ============================================
   */

  /**
   * Get smart locks from devices
   * @param {string} accessToken - Access token
   * @param {string} homeId - Home ID
   * @returns {Promise<Array>} List of smart locks
   */
  async getSmartLocks(accessToken, homeId) {
    logger.info(`Fetching Tuya smart locks for home: ${homeId}`);

    const devices = await this.getHomeDevices(accessToken, homeId);

    // Filter devices by lock category codes
    // Common Tuya lock categories: 'ms' (door lock), 'jtmspro' (smart lock pro), 'mk' (lock)
    const lockCategories = ['ms', 'jtmspro', 'mk', 'lock'];
    const locks = devices.filter(device =>
      lockCategories.includes(device.category) ||
      device.product_name?.toLowerCase().includes('lock')
    );

    return locks;
  }

  /**
   * Get lock status and details
   * @param {string} accessToken - Access token
   * @param {string} lockId - Lock device ID
   * @returns {Promise<Object>} Lock status
   */
  async getLockStatus(accessToken, lockId) {
    logger.info(`Fetching Tuya lock status: ${lockId}`);

    const status = await this.getDeviceStatus(accessToken, lockId);
    const details = await this.getDeviceDetails(accessToken, lockId);

    return {
      ...details,
      status: status
    };
  }

  /**
   * Lock/Unlock door
   * @param {string} accessToken - Access token
   * @param {string} lockId - Lock device ID
   * @param {boolean} lock - true to lock, false to unlock
   * @returns {Promise<boolean>} Success status
   */
  async lockControl(accessToken, lockId, lock) {
    logger.info(`${lock ? 'Locking' : 'Unlocking'} Tuya lock: ${lockId}`);

    // Most Tuya locks use 'unlock' or 'lock' data point
    return this.sendDeviceCommand(accessToken, lockId, [
      { code: lock ? 'lock' : 'unlock', value: true }
    ]);
  }

  /**
   * Generate temporary passcode for Tuya smart lock
   * @param {string} accessToken - Access token
   * @param {string} lockId - Lock device ID
   * @param {Object} passcodeData - Passcode configuration
   * @returns {Promise<Object>} Generated passcode details
   */
  async generateLockPasscode(accessToken, lockId, passcodeData) {
    const {
      name,
      passcode, // Optional: custom 6-12 digit code
      startTime, // Unix timestamp in seconds
      endTime, // Unix timestamp in seconds
      type = 'temporary' // 'temporary', 'permanent', 'one-time'
    } = passcodeData;

    logger.info(`Generating Tuya lock passcode for: ${lockId}`);

    // Generate random passcode if not provided
    const generatedPasscode = passcode || this.generateRandomPasscode();

    // Tuya lock passcode command format
    const passcodeCommand = {
      code: 'temporary_password',
      value: JSON.stringify({
        password: generatedPasscode,
        password_type: type === 'permanent' ? 1 : (type === 'one-time' ? 2 : 0),
        effective_time: startTime,
        invalid_time: endTime,
        name: name || `Guest ${Date.now()}`
      })
    };

    await this.sendDeviceCommand(accessToken, lockId, [passcodeCommand]);

    logger.info(`Tuya lock passcode generated: ${generatedPasscode}`);

    return {
      passcode: generatedPasscode,
      name: name || `Guest ${Date.now()}`,
      startTime,
      endTime,
      type
    };
  }

  /**
   * Generate guest passcode for booking
   * @param {string} accessToken - Access token
   * @param {string} lockId - Lock device ID
   * @param {Object} bookingData - Booking information
   * @returns {Promise<Object>} Generated passcode
   */
  async generateGuestLockPasscode(accessToken, lockId, bookingData) {
    const {
      guestName,
      checkInDate,
      checkOutDate,
      bookingId
    } = bookingData;

    // Convert dates to Unix timestamps (seconds)
    const startTime = Math.floor(new Date(checkInDate).getTime() / 1000);
    const endTime = Math.floor(new Date(checkOutDate).getTime() / 1000);

    const passcode = await this.generateLockPasscode(accessToken, lockId, {
      name: `Guest: ${guestName} (${bookingId})`,
      startTime,
      endTime,
      type: 'temporary'
    });

    logger.info(`Guest passcode generated for booking ${bookingId}: ${passcode.passcode}`);

    return passcode;
  }

  /**
   * Delete lock passcode
   * @param {string} accessToken - Access token
   * @param {string} lockId - Lock device ID
   * @param {string} passcodeId - Passcode ID or code to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteLockPasscode(accessToken, lockId, passcodeId) {
    logger.info(`Deleting Tuya lock passcode: ${passcodeId} for lock ${lockId}`);

    // Delete temporary password command
    await this.sendDeviceCommand(accessToken, lockId, [
      {
        code: 'delete_temporary_password',
        value: passcodeId
      }
    ]);

    return true;
  }

  /**
   * Get lock passcodes
   * @param {string} accessToken - Access token
   * @param {string} lockId - Lock device ID
   * @returns {Promise<Array>} List of passcodes
   */
  async getLockPasscodes(accessToken, lockId) {
    logger.info(`Fetching passcodes for Tuya lock: ${lockId}`);

    // Get device specifications which include passcode info
    const specs = await this.getDeviceSpecifications(accessToken, lockId);

    // Query passcode status data point
    const status = await this.getDeviceStatus(accessToken, lockId);

    // Find password-related status codes
    const passcodes = status
      .filter(s => s.code.includes('password') || s.code.includes('temp_password'))
      .map(s => ({
        id: s.code,
        code: s.value,
        name: s.name || 'Temporary Password'
      }));

    return passcodes;
  }

  /**
   * Get lock access logs/records
   * @param {string} accessToken - Access token
   * @param {string} lockId - Lock device ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Lock operation records
   */
  async getLockRecords(accessToken, lockId, options = {}) {
    const {
      startTime = Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
      endTime = Date.now(),
      size = 100
    } = options;

    logger.info(`Fetching lock records for Tuya lock: ${lockId}`);

    // Get device logs with type 7 (DP report) to see lock/unlock events
    const logs = await this.getDeviceLogs(accessToken, lockId, {
      startTime,
      endTime,
      type: 7,
      size
    });

    // Filter for lock-related events
    const lockRecords = logs
      .filter(log =>
        log.event_data?.includes('lock') ||
        log.event_data?.includes('unlock') ||
        log.event_data?.includes('password')
      )
      .map(log => ({
        timestamp: log.event_time,
        action: this.parseLockAction(log.event_data),
        method: this.parseLockMethod(log.event_data)
      }));

    return lockRecords;
  }

  /**
   * Parse lock action from event data
   * @private
   */
  parseLockAction(eventData) {
    if (!eventData) return 'unknown';

    const data = typeof eventData === 'string' ? eventData : JSON.stringify(eventData);

    if (data.includes('unlock')) return 'unlock';
    if (data.includes('lock')) return 'lock';
    if (data.includes('password')) return 'passcode_used';

    return 'unknown';
  }

  /**
   * Parse lock method from event data
   * @private
   */
  parseLockMethod(eventData) {
    if (!eventData) return 'unknown';

    const data = typeof eventData === 'string' ? eventData : JSON.stringify(eventData);

    if (data.includes('password') || data.includes('temp_password')) return 'passcode';
    if (data.includes('fingerprint')) return 'fingerprint';
    if (data.includes('card')) return 'card';
    if (data.includes('remote')) return 'remote';
    if (data.includes('key')) return 'key';
    if (data.includes('app')) return 'app';

    return 'unknown';
  }

  /**
   * Generate random passcode
   * @private
   * @param {number} length - Passcode length (default 6)
   * @returns {string} Random numeric passcode
   */
  generateRandomPasscode(length = 6) {
    let passcode = '';
    for (let i = 0; i < length; i++) {
      passcode += Math.floor(Math.random() * 10);
    }
    return passcode;
  }

  /**
   * Transform Tuya smart lock data to standardized format
   * @param {Object} tuyaLock - Raw lock data from Tuya
   * @returns {Object} Transformed lock data
   */
  transformLockData(tuyaLock) {
    return {
      deviceId: tuyaLock.id,
      deviceType: 'tuya_lock',
      name: {
        en: tuyaLock.name,
        ar: tuyaLock.name
      },
      category: tuyaLock.category,
      model: tuyaLock.model || tuyaLock.product_name,
      manufacturer: 'Tuya', // Brand could be Aqara, Yale, Samsung, etc.
      firmwareVersion: tuyaLock.update_time?.toString(),
      status: tuyaLock.online ? 'online' : 'offline',
      batteryLevel: this.extractBatteryLevel(tuyaLock.status),
      lastSeenAt: tuyaLock.active_time ? new Date(tuyaLock.active_time * 1000) : null,
      capabilities: {
        remoteUnlock: true,
        passcodeSupport: true,
        fingerprintSupport: this.hasCapability(tuyaLock, 'fingerprint'),
        cardSupport: this.hasCapability(tuyaLock, 'card')
      },
      settings: {
        productId: tuyaLock.product_id,
        uuid: tuyaLock.uuid,
        ownerId: tuyaLock.owner_id,
        homeId: tuyaLock.home_id,
        ip: tuyaLock.ip,
        localKey: tuyaLock.local_key
      }
    };
  }

  /**
   * Extract battery level from device status
   * @private
   */
  extractBatteryLevel(status) {
    if (!Array.isArray(status)) return null;

    const batteryStatus = status.find(s =>
      s.code === 'battery_percentage' ||
      s.code === 'battery' ||
      s.code === 'battery_state'
    );

    return batteryStatus ? parseInt(batteryStatus.value) : null;
  }

  /**
   * Check if device has specific capability
   * @private
   */
  hasCapability(device, capability) {
    if (!device.status || !Array.isArray(device.status)) return false;

    return device.status.some(s =>
      s.code.toLowerCase().includes(capability.toLowerCase())
    );
  }

  /**
   * Validate webhook signature
   * @param {string} signature - Signature from webhook header
   * @param {string} timestamp - Timestamp from webhook header
   * @param {string} body - Raw request body
   * @returns {boolean} Validation result
   */
  validateWebhookSignature(signature, timestamp, body) {
    const stringToSign = `${this.clientId}${timestamp}${body}`;

    const expectedSignature = crypto
      .createHmac('sha256', this.clientSecret)
      .update(stringToSign)
      .digest('hex')
      .toUpperCase();

    return signature === expectedSignature;
  }
}

module.exports = new TuyaService();
