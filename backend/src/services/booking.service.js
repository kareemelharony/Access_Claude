const { Booking, Property, User } = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');
const beds24Service = require('./integrations/beds24.service');
const propertyService = require('./property.service');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Booking Service
 * Handles booking management operations
 */
class BookingService {
  /**
   * Create new booking
   * @param {string} userId - User ID
   * @param {Object} bookingData - Booking data
   * @returns {Promise<Object>}
   */
  async createBooking(userId, bookingData) {
    // Validate property belongs to user
    const property = await Property.findOne({
      where: {
        id: bookingData.propertyId,
        ownerId: userId
      }
    });

    if (!property) {
      throw new NotFoundError('Property');
    }

    // Validate dates
    const checkIn = new Date(bookingData.checkInDate);
    const checkOut = new Date(bookingData.checkOutDate);
    const now = new Date();

    if (checkIn < now) {
      throw new ValidationError('Check-in date cannot be in the past');
    }

    if (checkOut <= checkIn) {
      throw new ValidationError('Check-out date must be after check-in date');
    }

    // Check for overlapping bookings
    const overlapping = await this.checkOverlappingBookings(
      bookingData.propertyId,
      checkIn,
      checkOut
    );

    if (overlapping) {
      throw new ValidationError('Property is already booked for these dates');
    }

    // Calculate number of nights
    const numberOfNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    // Calculate pricing
    const nightlyRate = bookingData.nightlyRate || 0;
    const totalNightsCost = nightlyRate * numberOfNights;
    const cleaningFee = property.cleaningFee || 0;
    const taxAmount = (totalNightsCost + cleaningFee) * (property.taxRate / 100);
    const totalPrice = totalNightsCost + cleaningFee + taxAmount;

    // Create booking
    const booking = await Booking.create({
      propertyId: bookingData.propertyId,
      guestFirstName: bookingData.guestFirstName,
      guestLastName: bookingData.guestLastName,
      guestEmail: bookingData.guestEmail,
      guestPhone: bookingData.guestPhone,
      guestLanguage: bookingData.guestLanguage || 'en',
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfNights,
      numberOfAdults: bookingData.numberOfAdults || 1,
      numberOfChildren: bookingData.numberOfChildren || 0,
      nightlyRate,
      totalNightsCost,
      cleaningFee,
      taxAmount,
      totalPrice,
      currency: property.currency || 'SAR',
      status: 'confirmed',
      bookingSource: bookingData.bookingSource || 'direct',
      specialRequests: bookingData.specialRequests
    });

    logger.info(`Booking created: ${booking.id}`);

    // Sync to Beds24 if enabled
    if (property.beds24SyncEnabled) {
      try {
        const refreshToken = propertyService.getBeds24RefreshToken(property);
        const beds24Booking = await beds24Service.createBooking(
          {
            propertyId: property.beds24PropertyId,
            roomId: property.beds24RoomIds[0], // Use first room
            checkIn: bookingData.checkInDate,
            checkOut: bookingData.checkOutDate,
            guestFirstName: bookingData.guestFirstName,
            guestLastName: bookingData.guestLastName,
            guestEmail: bookingData.guestEmail,
            guestPhone: bookingData.guestPhone,
            totalPrice,
            adults: bookingData.numberOfAdults,
            children: bookingData.numberOfChildren
          },
          refreshToken
        );

        // Update booking with Beds24 ID
        await booking.update({
          beds24BookingId: beds24Booking.id
        });

        logger.info(`Booking synced to Beds24: ${booking.id}`);
      } catch (error) {
        logger.error('Failed to sync booking to Beds24:', error);
        // Don't fail the booking creation if sync fails
      }
    }

    return booking.toJSON();
  }

  /**
   * Get all bookings for user
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} - Paginated bookings
   */
  async getUserBookings(userId, filters = {}) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    // Build where clause
    const where = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.propertyId) {
      where.propertyId = filters.propertyId;
    }

    if (filters.startDate && filters.endDate) {
      where.checkInDate = {
        [Op.between]: [filters.startDate, filters.endDate]
      };
    }

    if (filters.guestEmail) {
      where.guestEmail = {
        [Op.iLike]: `%${filters.guestEmail}%`
      };
    }

    // Get bookings for user's properties
    const { rows, count } = await Booking.findAndCountAll({
      where,
      include: [
        {
          model: Property,
          as: 'property',
          where: { ownerId: userId },
          attributes: ['id', 'name', 'type', 'city']
        }
      ],
      limit,
      offset,
      order: [['checkInDate', 'DESC']]
    });

    return {
      bookings: rows.map(b => b.toJSON()),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Get single booking by ID
   * @param {string} bookingId - Booking ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>}
   */
  async getBooking(bookingId, userId) {
    const booking = await Booking.findOne({
      where: { id: bookingId },
      include: [
        {
          model: Property,
          as: 'property',
          where: { ownerId: userId },
          include: ['devices']
        }
      ]
    });

    if (!booking) {
      throw new NotFoundError('Booking');
    }

    return booking.toJSON();
  }

  /**
   * Update booking
   * @param {string} bookingId - Booking ID
   * @param {string} userId - User ID (for authorization)
   * @param {Object} updates - Booking updates
   * @returns {Promise<Object>}
   */
  async updateBooking(bookingId, userId, updates) {
    const booking = await Booking.findOne({
      where: { id: bookingId },
      include: [
        {
          model: Property,
          as: 'property',
          where: { ownerId: userId }
        }
      ]
    });

    if (!booking) {
      throw new NotFoundError('Booking');
    }

    // Validate date changes if provided
    if (updates.checkInDate || updates.checkOutDate) {
      const checkIn = new Date(updates.checkInDate || booking.checkInDate);
      const checkOut = new Date(updates.checkOutDate || booking.checkOutDate);

      if (checkOut <= checkIn) {
        throw new ValidationError('Check-out date must be after check-in date');
      }

      // Check for overlaps (excluding this booking)
      const overlapping = await this.checkOverlappingBookings(
        booking.propertyId,
        checkIn,
        checkOut,
        bookingId
      );

      if (overlapping) {
        throw new ValidationError('Property is already booked for these dates');
      }

      // Recalculate nights and pricing
      const numberOfNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      const totalNightsCost = booking.nightlyRate * numberOfNights;
      const taxAmount = (totalNightsCost + booking.cleaningFee) * (booking.property.taxRate / 100);

      updates.numberOfNights = numberOfNights;
      updates.totalNightsCost = totalNightsCost;
      updates.taxAmount = taxAmount;
      updates.totalPrice = totalNightsCost + booking.cleaningFee + taxAmount;
    }

    await booking.update(updates);

    logger.info(`Booking updated: ${bookingId}`);

    // Sync to Beds24 if enabled
    if (booking.property.beds24SyncEnabled && booking.beds24BookingId) {
      try {
        const refreshToken = propertyService.getBeds24RefreshToken(booking.property);
        await beds24Service.updateBooking(
          booking.beds24BookingId,
          updates,
          refreshToken
        );
      } catch (error) {
        logger.error('Failed to sync booking update to Beds24:', error);
      }
    }

    return booking.toJSON();
  }

  /**
   * Cancel booking
   * @param {string} bookingId - Booking ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<Object>}
   */
  async cancelBooking(bookingId, userId) {
    const booking = await this.getBooking(bookingId, userId);

    if (booking.status === 'cancelled') {
      throw new ValidationError('Booking is already cancelled');
    }

    if (booking.status === 'checked_out') {
      throw new ValidationError('Cannot cancel completed booking');
    }

    await Booking.update(
      {
        status: 'cancelled',
        cancelledAt: new Date()
      },
      {
        where: { id: bookingId }
      }
    );

    logger.info(`Booking cancelled: ${bookingId}`);

    return { ...booking, status: 'cancelled' };
  }

  /**
   * Check for overlapping bookings
   * @param {string} propertyId - Property ID
   * @param {Date} checkIn - Check-in date
   * @param {Date} checkOut - Check-out date
   * @param {string} excludeBookingId - Booking ID to exclude (for updates)
   * @returns {Promise<boolean>}
   */
  async checkOverlappingBookings(propertyId, checkIn, checkOut, excludeBookingId = null) {
    const where = {
      propertyId,
      status: {
        [Op.in]: ['confirmed', 'checked_in']
      },
      [Op.or]: [
        {
          // New booking starts during existing booking
          checkInDate: {
            [Op.between]: [checkIn, checkOut]
          }
        },
        {
          // New booking ends during existing booking
          checkOutDate: {
            [Op.between]: [checkIn, checkOut]
          }
        },
        {
          // New booking completely overlaps existing booking
          [Op.and]: [
            {
              checkInDate: {
                [Op.lte]: checkIn
              }
            },
            {
              checkOutDate: {
                [Op.gte]: checkOut
              }
            }
          ]
        }
      ]
    };

    if (excludeBookingId) {
      where.id = {
        [Op.ne]: excludeBookingId
      };
    }

    const count = await Booking.count({ where });

    return count > 0;
  }

  /**
   * Sync bookings from Beds24
   * @param {string} propertyId - Property ID
   * @param {string} userId - User ID
   * @param {Object} options - Sync options
   * @returns {Promise<Object>}
   */
  async syncFromBeds24(propertyId, userId, options = {}) {
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

    const refreshToken = propertyService.getBeds24RefreshToken(property);

    // Default to syncing bookings from today onwards
    const startDate = options.startDate || new Date().toISOString().split('T')[0];
    const endDate = options.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Get bookings from Beds24
    const beds24Bookings = await beds24Service.getBookings(
      {
        propertyId: property.beds24PropertyId,
        startDate,
        endDate
      },
      refreshToken
    );

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const beds24Booking of beds24Bookings) {
      try {
        const transformedData = beds24Service.transformWebhookData(beds24Booking);

        // Check if booking exists
        const existingBooking = await Booking.findOne({
          where: {
            beds24BookingId: transformedData.beds24BookingId
          }
        });

        if (existingBooking) {
          // Update existing booking
          await existingBooking.update(transformedData);
          updated++;
        } else {
          // Create new booking
          await Booking.create({
            propertyId,
            ...transformedData
          });
          created++;
        }
      } catch (error) {
        logger.error(`Failed to sync booking ${beds24Booking.bookId}:`, error);
        errors++;
      }
    }

    logger.info(`Beds24 sync completed for property ${propertyId}: ${created} created, ${updated} updated, ${errors} errors`);

    return {
      success: true,
      created,
      updated,
      errors,
      total: beds24Bookings.length
    };
  }

  /**
   * Get booking statistics
   * @param {string} userId - User ID
   * @param {string} propertyId - Optional property ID filter
   * @returns {Promise<Object>}
   */
  async getBookingStats(userId, propertyId = null) {
    const where = {
      status: {
        [Op.notIn]: ['cancelled']
      }
    };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    const propertyWhere = { ownerId: userId };
    if (propertyId) {
      propertyWhere.id = propertyId;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Total bookings
    const totalBookings = await Booking.count({
      where,
      include: [
        {
          model: Property,
          as: 'property',
          where: propertyWhere,
          attributes: []
        }
      ]
    });

    // Active bookings
    const activeBookings = await Booking.count({
      where: {
        ...where,
        status: {
          [Op.in]: ['confirmed', 'checked_in']
        }
      },
      include: [
        {
          model: Property,
          as: 'property',
          where: propertyWhere,
          attributes: []
        }
      ]
    });

    // Check-ins today
    const checkInsToday = await Booking.count({
      where: {
        ...where,
        checkInDate: today
      },
      include: [
        {
          model: Property,
          as: 'property',
          where: propertyWhere,
          attributes: []
        }
      ]
    });

    // Check-outs today
    const checkOutsToday = await Booking.count({
      where: {
        ...where,
        checkOutDate: today
      },
      include: [
        {
          model: Property,
          as: 'property',
          where: propertyWhere,
          attributes: []
        }
      ]
    });

    // Total revenue
    const totalRevenue = await Booking.sum('totalPrice', {
      where,
      include: [
        {
          model: Property,
          as: 'property',
          where: propertyWhere,
          attributes: []
        }
      ]
    });

    return {
      totalBookings,
      activeBookings,
      checkInsToday,
      checkOutsToday,
      totalRevenue: totalRevenue || 0
    };
  }
}

module.exports = new BookingService();
