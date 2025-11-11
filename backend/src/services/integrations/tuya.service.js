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
