const axios = require('axios');
const { cacheHelpers } = require('../config/redis');
const { IntegrationError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Beds24 API Service
 * Handles all interactions with Beds24 API
 * Documentation: https://api.beds24.com/v2/
 */
class Beds24Service {
  constructor() {
    this.baseURL = process.env.BEDS24_BASE_URL || 'https://api.beds24.com/v2';
    this.clientId = process.env.BEDS24_CLIENT_ID;
    this.clientSecret = process.env.BEDS24_CLIENT_SECRET;

    if (!this.clientId || !this.clientSecret) {
      logger.warn('Beds24 credentials not configured');
    }
  }

  /**
   * Exchange invite code for refresh token (Step 1 of OAuth)
   * User generates invite code in Beds24 Control Panel
   * @param {string} inviteCode - Invite code from Beds24
   * @returns {Promise<Object>} - { refreshToken, accessToken, expiresIn }
   */
  async exchangeInviteCode(inviteCode) {
    try {
      logger.info('Exchanging Beds24 invite code');

      const response = await axios.post(
        `${this.baseURL}/authentication/setup`,
        {
          inviteCode: inviteCode,
          code: inviteCode,
          grantType: 'invite_code'
        }
      );

      const { refreshToken, accessToken, expiresIn } = response.data;

      logger.info('Beds24 invite code exchanged successfully');

      return {
        refreshToken,
        accessToken,
        expiresIn,
        expiresAt: Date.now() + (expiresIn * 1000)
      };
    } catch (error) {
      logger.error('Beds24 invite code exchange failed:', error);
      throw new IntegrationError('Beds24', error.response?.data?.message || error.message);
    }
  }

  /**
   * Get access token (valid for 24 hours)
   * Uses refresh token to get new access token
   * @param {string} refreshToken - Refresh token from initial setup
   * @returns {Promise<string>} - Access token
   */
  async getAccessToken(refreshToken) {
    try {
      // Check cache first
      const cacheKey = `beds24:token:${refreshToken.substring(0, 10)}`;
      const cachedToken = await cacheHelpers.get(cacheKey);

      if (cachedToken && cachedToken.expiresAt > Date.now()) {
        return cachedToken.accessToken;
      }

      // Refresh token
      logger.info('Refreshing Beds24 access token');

      const response = await axios.post(
        `${this.baseURL}/authentication/token`,
        {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret
        }
      );

      const { access_token, expires_in } = response.data;

      // Cache token
      await cacheHelpers.set(
        cacheKey,
        {
          accessToken: access_token,
          expiresAt: Date.now() + (expires_in * 1000)
        },
        expires_in - 300 // Cache for 5 minutes less than expiry
      );

      logger.info('Beds24 access token refreshed successfully');

      return access_token;
    } catch (error) {
      logger.error('Beds24 token refresh failed:', error);
      throw new IntegrationError('Beds24', 'Failed to refresh access token');
    }
  }

  /**
   * Make authenticated API request to Beds24
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   * @param {string} refreshToken - Beds24 refresh token
   * @returns {Promise<Object>}
   */
  async request(endpoint, method = 'GET', data = null, refreshToken = null) {
    try {
      const accessToken = await this.getAccessToken(refreshToken);

      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'token': accessToken,
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        if (method === 'GET') {
          config.params = data;
        } else {
          config.data = data;
        }
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      logger.error(`Beds24 API request failed: ${method} ${endpoint}`, error);
      throw new IntegrationError('Beds24', error.response?.data?.message || error.message);
    }
  }

  // ==================== BOOKINGS ====================

  /**
   * Get bookings from Beds24
   * @param {Object} filters - Filter options
   * @param {string} refreshToken - Beds24 refresh token
   * @returns {Promise<Array>}
   */
  async getBookings(filters = {}, refreshToken) {
    const queryParams = {
      propertyId: filters.propertyId,
      from: filters.startDate,
      to: filters.endDate,
      includeInvoice: 'true',
      ...filters
    };

    const response = await this.request('/bookings', 'GET', queryParams, refreshToken);
    return response.data || [];
  }

  /**
   * Get single booking by ID
   * @param {string} bookingId - Beds24 booking ID
   * @param {string} refreshToken - Beds24 refresh token
   * @returns {Promise<Object>}
   */
  async getBooking(bookingId, refreshToken) {
    const response = await this.request(`/bookings/${bookingId}`, 'GET', null, refreshToken);
    return response.data;
  }

  /**
   * Create booking in Beds24
   * @param {Object} bookingData - Booking data
   * @param {string} refreshToken - Beds24 refresh token
   * @returns {Promise<Object>}
   */
  async createBooking(bookingData, refreshToken) {
    const payload = {
      propertyId: bookingData.propertyId,
      roomId: bookingData.roomId,
      arrival: bookingData.checkIn,
      departure: bookingData.checkOut,
      guestFirstName: bookingData.guestFirstName,
      guestName: bookingData.guestLastName,
      guestEmail: bookingData.guestEmail,
      guestPhone: bookingData.guestPhone,
      price: bookingData.totalPrice,
      numAdult: bookingData.adults,
      numChild: bookingData.children || 0
    };

    const response = await this.request('/bookings', 'POST', payload, refreshToken);
    return response.data;
  }

  /**
   * Update booking in Beds24
   * @param {string} bookingId - Beds24 booking ID
   * @param {Object} updates - Update data
   * @param {string} refreshToken - Beds24 refresh token
   * @returns {Promise<Object>}
   */
  async updateBooking(bookingId, updates, refreshToken) {
    const response = await this.request(`/bookings/${bookingId}`, 'PATCH', updates, refreshToken);
    return response.data;
  }

  // ==================== PROPERTIES ====================

  /**
   * Get properties from Beds24
   * @param {string} refreshToken - Beds24 refresh token
   * @returns {Promise<Array>}
   */
  async getProperties(refreshToken) {
    const response = await this.request('/properties', 'GET', null, refreshToken);
    return response.data || [];
  }

  /**
   * Get single property by ID
   * @param {string} propertyId - Beds24 property ID
   * @param {string} refreshToken - Beds24 refresh token
   * @returns {Promise<Object>}
   */
  async getProperty(propertyId, refreshToken) {
    const response = await this.request(`/properties/${propertyId}`, 'GET', null, refreshToken);
    return response.data;
  }

  // ==================== INVENTORY ====================

  /**
   * Get inventory/calendar data
   * @param {string} roomId - Room ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {string} refreshToken - Beds24 refresh token
   * @returns {Promise<Object>}
   */
  async getInventory(roomId, startDate, endDate, refreshToken) {
    const params = {
      roomId,
      from: startDate,
      to: endDate
    };

    const response = await this.request('/inventory/rooms/calendar', 'GET', params, refreshToken);
    return response.data;
  }

  /**
   * Update inventory (rates and availability)
   * @param {Object} updates - Inventory updates
   * @param {string} refreshToken - Beds24 refresh token
   * @returns {Promise<Object>}
   */
  async updateInventory(updates, refreshToken) {
    const payload = [
      {
        roomId: updates.roomId,
        calendar: [
          {
            from: updates.startDate,
            to: updates.endDate,
            price1: updates.nightlyRate,
            minStay: updates.minNights,
            available: updates.availableUnits
          }
        ]
      }
    ];

    const response = await this.request('/inventory/rooms/calendar', 'POST', payload, refreshToken);
    return response.data;
  }

  // ==================== MESSAGES ====================

  /**
   * Get messages for booking
   * @param {string} bookingId - Beds24 booking ID
   * @param {string} refreshToken - Beds24 refresh token
   * @returns {Promise<Array>}
   */
  async getMessages(bookingId, refreshToken) {
    const response = await this.request('/bookings/messages', 'GET', { bookId: bookingId }, refreshToken);
    return response.data || [];
  }

  /**
   * Send message to guest
   * @param {string} bookingId - Beds24 booking ID
   * @param {string} message - Message text
   * @param {string} channel - Channel (email or sms)
   * @param {string} refreshToken - Beds24 refresh token
   * @returns {Promise<Object>}
   */
  async sendMessage(bookingId, message, channel = 'email', refreshToken) {
    const payload = {
      bookId: bookingId,
      message: message,
      type: channel,
      markAsRead: false
    };

    const response = await this.request('/bookings/messages', 'POST', payload, refreshToken);
    return response.data;
  }

  // ==================== WEBHOOK VALIDATION ====================

  /**
   * Validate webhook payload from Beds24
   * @param {Object} payload - Webhook payload
   * @returns {boolean}
   */
  validateWebhookPayload(payload) {
    // Basic validation
    if (!payload || !payload.bookId || !payload.propertyId) {
      return false;
    }

    return true;
  }

  /**
   * Transform Beds24 webhook data to our booking format
   * @param {Object} webhookData - Data from Beds24 webhook
   * @returns {Object} - Normalized booking data
   */
  transformWebhookData(webhookData) {
    return {
      beds24BookingId: webhookData.bookId.toString(),
      propertyId: webhookData.propertyId.toString(),
      checkInDate: webhookData.arrival,
      checkOutDate: webhookData.departure,
      guestFirstName: webhookData.guestFirstName || 'Guest',
      guestLastName: webhookData.guestName || '',
      guestEmail: webhookData.guestEmail || '',
      guestPhone: webhookData.guestPhone || '',
      numberOfAdults: webhookData.numAdult || 1,
      numberOfChildren: webhookData.numChild || 0,
      totalPrice: parseFloat(webhookData.price) || 0,
      status: this.mapBeds24Status(webhookData.status),
      bookingSource: webhookData.infoSource || 'beds24'
    };
  }

  /**
   * Map Beds24 status to our status
   * @param {number} beds24Status - Status from Beds24
   * @returns {string}
   */
  mapBeds24Status(beds24Status) {
    const statusMap = {
      1: 'confirmed',  // New booking
      2: 'confirmed',  // Modified
      3: 'cancelled'   // Cancelled
    };

    return statusMap[beds24Status] || 'confirmed';
  }
}

module.exports = new Beds24Service();
