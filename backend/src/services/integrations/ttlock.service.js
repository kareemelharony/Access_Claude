const axios = require('axios');
const crypto = require('crypto');
const redis = require('../../config/redis');
const logger = require('../../utils/logger');
const { encryptionService } = require('../../utils/encryption');

/**
 * TTLock Cloud API Service
 *
 * Handles integration with TTLock smart locks:
 * - OAuth 2.0 authentication
 * - Lock management and control
 * - Passcode generation (temporary and permanent)
 * - Gateway management
 * - Lock status monitoring
 *
 * API Documentation: https://euapi.ttlock.com/doc
 */
class TTLockService {
  constructor() {
    this.baseURL = process.env.TTLOCK_API_URL || 'https://euapi.ttlock.com/v3';
    this.clientId = process.env.TTLOCK_CLIENT_ID;
    this.clientSecret = process.env.TTLOCK_CLIENT_SECRET;
    this.redirectUri = process.env.TTLOCK_REDIRECT_URI;
  }

  /**
   * Generate OAuth authorization URL
   * @param {string} state - Random state for CSRF protection
   * @returns {string} Authorization URL
   */
  getAuthorizationUrl(state) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state,
      response_type: 'code'
    });

    return `${this.baseURL}/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from OAuth callback
   * @returns {Promise<Object>} Token response with access_token, refresh_token, expires_in
   */
  async exchangeAuthorizationCode(code) {
    try {
      logger.info('Exchanging TTLock authorization code for tokens');

      const response = await axios.post(`${this.baseURL}/oauth2/token`, null, {
        params: {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri
        }
      });

      if (!response.data || !response.data.access_token) {
        throw new Error('Invalid token response from TTLock');
      }

      logger.info('TTLock tokens obtained successfully');

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in || 7776000, // 90 days default
        uid: response.data.uid,
        openid: response.data.openid
      };
    } catch (error) {
      logger.error('TTLock token exchange error:', error.response?.data || error.message);
      throw new Error(`Failed to exchange TTLock authorization code: ${error.message}`);
    }
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Encrypted refresh token
   * @returns {Promise<Object>} New token response
   */
  async refreshAccessToken(refreshToken) {
    try {
      const decryptedToken = encryptionService.decrypt(refreshToken);

      logger.info('Refreshing TTLock access token');

      const response = await axios.post(`${this.baseURL}/oauth2/token`, null, {
        params: {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: decryptedToken
        }
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in || 7776000
      };
    } catch (error) {
      logger.error('TTLock token refresh error:', error.response?.data || error.message);
      throw new Error(`Failed to refresh TTLock access token: ${error.message}`);
    }
  }

  /**
   * Get valid access token (from cache or refresh)
   * @param {string} accessToken - Current access token
   * @param {string} refreshToken - Encrypted refresh token
   * @param {string} uid - User ID from TTLock
   * @returns {Promise<string>} Valid access token
   */
  async getValidAccessToken(accessToken, refreshToken, uid) {
    const cacheKey = `ttlock:token:${uid}`;

    // Check cache first
    const cachedToken = await redis.get(cacheKey);
    if (cachedToken) {
      return cachedToken;
    }

    // Try existing token
    if (accessToken) {
      try {
        // Test token by making a simple API call
        await this.makeRequest('/lock/list', { accessToken, pageNo: 1, pageSize: 1 });

        // Token is valid, cache it (for 1 hour)
        await redis.setWithTTL(cacheKey, accessToken, 3600);
        return accessToken;
      } catch (error) {
        logger.info('TTLock access token expired, refreshing...');
      }
    }

    // Refresh token
    const tokens = await this.refreshAccessToken(refreshToken);
    await redis.setWithTTL(cacheKey, tokens.accessToken, 3600);

    return tokens.accessToken;
  }

  /**
   * Make authenticated request to TTLock API
   * @private
   */
  async makeRequest(endpoint, params) {
    try {
      const response = await axios.post(`${this.baseURL}${endpoint}`, null, {
        params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data.errcode !== 0 && response.data.errcode !== undefined) {
        throw new Error(`TTLock API error: ${response.data.errmsg || 'Unknown error'}`);
      }

      return response.data;
    } catch (error) {
      logger.error(`TTLock API request failed [${endpoint}]:`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * List all locks for the authenticated user
   * @param {string} accessToken - Valid access token
   * @param {Object} options - Pagination options
   * @returns {Promise<Array>} List of locks
   */
  async listLocks(accessToken, options = {}) {
    const { pageNo = 1, pageSize = 100 } = options;

    logger.info('Fetching TTLock locks list');

    const data = await this.makeRequest('/lock/list', {
      accessToken,
      pageNo,
      pageSize,
      date: Date.now()
    });

    return data.list || [];
  }

  /**
   * Get lock details
   * @param {string} accessToken - Valid access token
   * @param {number} lockId - Lock ID
   * @returns {Promise<Object>} Lock details
   */
  async getLockDetail(accessToken, lockId) {
    logger.info(`Fetching TTLock details for lock: ${lockId}`);

    const data = await this.makeRequest('/lock/detail', {
      accessToken,
      lockId,
      date: Date.now()
    });

    return data;
  }

  /**
   * Generate custom passcode
   * @param {string} accessToken - Valid access token
   * @param {number} lockId - Lock ID
   * @param {Object} passcodeData - Passcode configuration
   * @returns {Promise<Object>} Generated passcode details
   */
  async generatePasscode(accessToken, lockId, passcodeData) {
    const {
      passcodeType = 3, // 1: permanent, 2: one-time, 3: time-limited, 4: cyclic
      passcodeName,
      startDate,
      endDate,
      passcode // Optional: custom passcode (6-12 digits)
    } = passcodeData;

    logger.info(`Generating passcode for lock: ${lockId}`);

    const params = {
      accessToken,
      lockId,
      keyboardPwdType: passcodeType,
      keyboardPwdName: passcodeName,
      date: Date.now()
    };

    // Add time-limited parameters
    if (passcodeType === 3 && startDate && endDate) {
      params.startDate = new Date(startDate).getTime();
      params.endDate = new Date(endDate).getTime();
    }

    // Add custom passcode if provided
    if (passcode) {
      params.keyboardPwd = passcode;
    }

    const data = await this.makeRequest('/lock/addKeyboardPwd', params);

    return {
      passcodeId: data.keyboardPwdId,
      passcode: data.keyboardPwd,
      startDate: params.startDate,
      endDate: params.endDate,
      type: passcodeType
    };
  }

  /**
   * Generate guest passcode for booking
   * @param {string} accessToken - Valid access token
   * @param {number} lockId - Lock ID
   * @param {Object} bookingData - Booking information
   * @returns {Promise<Object>} Generated passcode
   */
  async generateGuestPasscode(accessToken, lockId, bookingData) {
    const {
      guestName,
      checkInDate,
      checkOutDate,
      bookingId
    } = bookingData;

    // Generate time-limited passcode valid from check-in to check-out
    const passcode = await this.generatePasscode(accessToken, lockId, {
      passcodeType: 3, // Time-limited
      passcodeName: `Guest: ${guestName} (${bookingId})`,
      startDate: new Date(checkInDate).getTime(),
      endDate: new Date(checkOutDate).getTime()
    });

    logger.info(`Guest passcode generated for booking ${bookingId}: ${passcode.passcode}`);

    return passcode;
  }

  /**
   * Delete passcode
   * @param {string} accessToken - Valid access token
   * @param {number} lockId - Lock ID
   * @param {number} passcodeId - Passcode ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deletePasscode(accessToken, lockId, passcodeId) {
    logger.info(`Deleting passcode ${passcodeId} for lock ${lockId}`);

    await this.makeRequest('/lock/deleteKeyboardPwd', {
      accessToken,
      lockId,
      keyboardPwdId: passcodeId,
      date: Date.now()
    });

    return true;
  }

  /**
   * List all passcodes for a lock
   * @param {string} accessToken - Valid access token
   * @param {number} lockId - Lock ID
   * @returns {Promise<Array>} List of passcodes
   */
  async listPasscodes(accessToken, lockId) {
    logger.info(`Fetching passcodes for lock: ${lockId}`);

    const data = await this.makeRequest('/lock/listKeyboardPwd', {
      accessToken,
      lockId,
      pageNo: 1,
      pageSize: 100,
      date: Date.now()
    });

    return data.list || [];
  }

  /**
   * Unlock remotely (requires gateway)
   * @param {string} accessToken - Valid access token
   * @param {number} lockId - Lock ID
   * @returns {Promise<boolean>} Success status
   */
  async unlock(accessToken, lockId) {
    logger.info(`Unlocking lock remotely: ${lockId}`);

    await this.makeRequest('/lock/unlock', {
      accessToken,
      lockId,
      date: Date.now()
    });

    return true;
  }

  /**
   * Lock remotely (requires gateway)
   * @param {string} accessToken - Valid access token
   * @param {number} lockId - Lock ID
   * @returns {Promise<boolean>} Success status
   */
  async lock(accessToken, lockId) {
    logger.info(`Locking lock remotely: ${lockId}`);

    await this.makeRequest('/lock/lock', {
      accessToken,
      lockId,
      date: Date.now()
    });

    return true;
  }

  /**
   * Get lock operation records
   * @param {string} accessToken - Valid access token
   * @param {number} lockId - Lock ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Operation records
   */
  async getLockRecords(accessToken, lockId, options = {}) {
    const {
      startDate = Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
      endDate = Date.now(),
      pageNo = 1,
      pageSize = 100
    } = options;

    logger.info(`Fetching operation records for lock: ${lockId}`);

    const data = await this.makeRequest('/lock/listOperationLog', {
      accessToken,
      lockId,
      startDate,
      endDate,
      pageNo,
      pageSize,
      date: Date.now()
    });

    return data.list || [];
  }

  /**
   * Get gateway list
   * @param {string} accessToken - Valid access token
   * @returns {Promise<Array>} List of gateways
   */
  async listGateways(accessToken) {
    logger.info('Fetching TTLock gateway list');

    const data = await this.makeRequest('/gateway/list', {
      accessToken,
      pageNo: 1,
      pageSize: 100,
      date: Date.now()
    });

    return data.list || [];
  }

  /**
   * Transform TTLock lock data to our format
   * @param {Object} ttlockData - Raw data from TTLock API
   * @returns {Object} Transformed device data
   */
  transformLockData(ttlockData) {
    return {
      deviceId: ttlockData.lockId.toString(),
      deviceType: 'ttlock',
      name: {
        en: ttlockData.lockAlias || ttlockData.lockName || 'Smart Lock',
        ar: ttlockData.lockAlias || ttlockData.lockName || 'قفل ذكي'
      },
      model: ttlockData.modelNum || 'Unknown',
      manufacturer: 'TTLock',
      firmwareVersion: ttlockData.firmwareRevision,
      status: ttlockData.lockData ? 'online' : 'offline',
      batteryLevel: ttlockData.electricQuantity || null,
      lastSeenAt: ttlockData.date ? new Date(ttlockData.date) : null,
      capabilities: {
        remoteUnlock: ttlockData.hasGateway === 1,
        passcodeSupport: true,
        fingerprintSupport: ttlockData.featureValue?.includes('10') || false,
        cardSupport: ttlockData.featureValue?.includes('20') || false
      },
      settings: {
        lockMac: ttlockData.lockMac,
        groupId: ttlockData.groupId,
        noKeyPwd: ttlockData.noKeyPwd,
        hasGateway: ttlockData.hasGateway === 1
      }
    };
  }

  /**
   * Validate webhook signature (if TTLock supports webhooks)
   * @param {Object} payload - Webhook payload
   * @param {string} signature - Webhook signature
   * @returns {boolean} Validation result
   */
  validateWebhook(payload, signature) {
    const expectedSignature = crypto
      .createHmac('sha256', this.clientSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return signature === expectedSignature;
  }
}

module.exports = new TTLockService();
