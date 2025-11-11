const { Property, Device, Booking } = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');
const beds24Service = require('./integrations/beds24.service');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Property Service
 * Handles property management operations
 */
class PropertyService {
  /**
   * Create new property
   * @param {string} userId - Owner user ID
   * @param {Object} propertyData - Property data
   * @returns {Promise<Object>}
   */
  async createProperty(userId, propertyData) {
    try {
      const property = await Property.create({
        ownerId: userId,
        ...propertyData
      });

      logger.info(`Property created: ${property.id}`);

      return property.toJSON();
    } catch (error) {
      logger.error('Property creation failed:', error);
      throw error;
    }
  }

  /**
   * Get all properties for user
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>}
   */
  async getUserProperties(userId, filters = {}) {
    const where = { ownerId: userId };

    // Apply filters
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.city) {
      where.city = filters.city;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    const properties = await Property.findAll({
      where,
      include: [
        {
          model: Device,
          as: 'devices',
          where: { deletedAt: null },
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return properties.map(p => p.toJSON());
  }

  /**
   * Get single property by ID
   * @param {string} propertyId - Property ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>}
   */
  async getProperty(propertyId, userId) {
    const property = await Property.findOne({
      where: {
        id: propertyId,
        ownerId: userId
      },
      include: [
        {
          model: Device,
          as: 'devices',
          where: { deletedAt: null },
          required: false
        },
        {
          model: Booking,
          as: 'bookings',
          where: {
            status: {
              [Op.in]: ['confirmed', 'checked_in']
            }
          },
          required: false,
          limit: 10,
          order: [['checkInDate', 'ASC']]
        }
      ]
    });

    if (!property) {
      throw new NotFoundError('Property');
    }

    return property.toJSON();
  }

  /**
   * Update property
   * @param {string} propertyId - Property ID
   * @param {string} userId - User ID (for authorization)
   * @param {Object} updates - Property updates
   * @returns {Promise<Object>}
   */
  async updateProperty(propertyId, userId, updates) {
    const property = await Property.findOne({
      where: {
        id: propertyId,
        ownerId: userId
      }
    });

    if (!property) {
      throw new NotFoundError('Property');
    }

    await property.update(updates);

    logger.info(`Property updated: ${propertyId}`);

    return property.toJSON();
  }

  /**
   * Delete property (soft delete)
   * @param {string} propertyId - Property ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<void>}
   */
  async deleteProperty(propertyId, userId) {
    const property = await Property.findOne({
      where: {
        id: propertyId,
        ownerId: userId
      }
    });

    if (!property) {
      throw new NotFoundError('Property');
    }

    // Check for active bookings
    const activeBookings = await Booking.count({
      where: {
        propertyId,
        status: {
          [Op.in]: ['confirmed', 'checked_in']
        },
        checkOutDate: {
          [Op.gte]: new Date()
        }
      }
    });

    if (activeBookings > 0) {
      throw new ValidationError('Cannot delete property with active bookings');
    }

    await property.destroy();

    logger.info(`Property deleted: ${propertyId}`);
  }

  /**
   * Connect property to Beds24
   * @param {string} propertyId - Property ID
   * @param {string} userId - User ID
   * @param {Object} beds24Data - Beds24 connection data
   * @returns {Promise<Object>}
   */
  async connectToBeds24(propertyId, userId, beds24Data) {
    const property = await Property.findOne({
      where: {
        id: propertyId,
        ownerId: userId
      }
    });

    if (!property) {
      throw new NotFoundError('Property');
    }

    // Exchange invite code for tokens
    const tokenData = await beds24Service.exchangeInviteCode(beds24Data.inviteCode);

    // Store refresh token securely (should be encrypted)
    const { getEncryptionService } = require('../utils/encryption');
    const encryption = getEncryptionService();
    const encryptedToken = encryption.encrypt(tokenData.refreshToken);

    // Update property with Beds24 data
    await property.update({
      beds24PropertyId: beds24Data.propertyId,
      beds24RoomIds: beds24Data.roomIds || [],
      beds24SyncEnabled: true,
      // Store encrypted token in settings
      settings: {
        ...property.settings,
        beds24: {
          refreshToken: encryptedToken.encrypted,
          refreshTokenIv: encryptedToken.iv,
          refreshTokenAuthTag: encryptedToken.authTag
        }
      }
    });

    logger.info(`Property connected to Beds24: ${propertyId}`);

    return property.toJSON();
  }

  /**
   * Get Beds24 refresh token for property
   * @param {Object} property - Property object
   * @returns {string} - Decrypted refresh token
   */
  getBeds24RefreshToken(property) {
    if (!property.settings?.beds24) {
      throw new ValidationError('Property not connected to Beds24');
    }

    const { getEncryptionService } = require('../utils/encryption');
    const encryption = getEncryptionService();

    return encryption.decrypt(
      property.settings.beds24.refreshToken,
      property.settings.beds24.refreshTokenIv,
      property.settings.beds24.refreshTokenAuthTag
    );
  }

  /**
   * Sync property data from Beds24
   * @param {string} propertyId - Property ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async syncFromBeds24(propertyId, userId) {
    const property = await Property.findOne({
      where: {
        id: propertyId,
        ownerId: userId
      }
    });

    if (!property) {
      throw new NotFoundError('Property');
    }

    if (!property.beds24SyncEnabled) {
      throw new ValidationError('Beds24 sync not enabled for this property');
    }

    const refreshToken = this.getBeds24RefreshToken(property);

    // Get property data from Beds24
    const beds24Property = await beds24Service.getProperty(
      property.beds24PropertyId,
      refreshToken
    );

    // Update property with latest data
    // Note: Map Beds24 fields to our fields as needed
    await property.update({
      name: beds24Property.name || property.name,
      // Add more field mappings as needed
    });

    logger.info(`Property synced from Beds24: ${propertyId}`);

    return property.toJSON();
  }

  /**
   * Get property statistics
   * @param {string} propertyId - Property ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async getPropertyStats(propertyId, userId) {
    const property = await Property.findOne({
      where: {
        id: propertyId,
        ownerId: userId
      }
    });

    if (!property) {
      throw new NotFoundError('Property');
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get booking statistics
    const totalBookings = await Booking.count({
      where: { propertyId }
    });

    const activeBookings = await Booking.count({
      where: {
        propertyId,
        status: {
          [Op.in]: ['confirmed', 'checked_in']
        }
      }
    });

    const recentBookings = await Booking.count({
      where: {
        propertyId,
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    // Get revenue (last 30 days)
    const revenue = await Booking.sum('totalPrice', {
      where: {
        propertyId,
        status: {
          [Op.notIn]: ['cancelled']
        },
        checkInDate: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    // Get device count
    const deviceCount = await Device.count({
      where: { propertyId }
    });

    return {
      totalBookings,
      activeBookings,
      recentBookings,
      revenue: revenue || 0,
      deviceCount
    };
  }
}

module.exports = new PropertyService();
