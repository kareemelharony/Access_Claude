const beds24Service = require('../services/integrations/beds24.service');
const { Booking, Property } = require('../models');
const { asyncHandler } = require('../utils/errors');
const { successResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Webhook Controller
 * Handles incoming webhooks from external services
 */
class WebhookController {
  /**
   * Handle Beds24 webhook
   * POST /api/webhooks/beds24
   *
   * Beds24 sends webhooks for:
   * - New bookings (status: 1)
   * - Modified bookings (status: 2)
   * - Cancelled bookings (status: 3)
   */
  handleBeds24Webhook = asyncHandler(async (req, res) => {
    logger.info('Received Beds24 webhook', { body: req.body });

    // Validate webhook payload
    if (!beds24Service.validateWebhookPayload(req.body)) {
      logger.warn('Invalid Beds24 webhook payload', { body: req.body });
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_WEBHOOK',
          message: 'Invalid webhook payload'
        }
      });
    }

    const webhookData = req.body;
    const beds24BookingId = webhookData.bookId.toString();
    const beds24PropertyId = webhookData.propertyId.toString();

    try {
      // Find property by Beds24 property ID
      const property = await Property.findOne({
        where: {
          beds24PropertyId: beds24PropertyId,
          beds24SyncEnabled: true
        }
      });

      if (!property) {
        logger.warn(`Property not found for Beds24 property ID: ${beds24PropertyId}`);
        // Return success to prevent webhook retries
        return res.json(successResponse({ processed: false, reason: 'Property not found' }));
      }

      // Transform webhook data to our format
      const transformedData = beds24Service.transformWebhookData(webhookData);

      // Check booking status
      switch (webhookData.status) {
        case 1: // New booking
          await this.handleNewBooking(property.id, transformedData);
          break;

        case 2: // Modified booking
          await this.handleModifiedBooking(beds24BookingId, transformedData);
          break;

        case 3: // Cancelled booking
          await this.handleCancelledBooking(beds24BookingId);
          break;

        default:
          logger.warn(`Unknown Beds24 booking status: ${webhookData.status}`);
      }

      logger.info(`Beds24 webhook processed successfully: ${beds24BookingId}`);

      res.json(successResponse({ processed: true }));
    } catch (error) {
      logger.error('Beds24 webhook processing error:', error);

      // Return success to prevent webhook retries, but log the error
      res.json(successResponse({
        processed: false,
        error: error.message
      }));
    }
  });

  /**
   * Handle new booking from Beds24
   * @private
   */
  async handleNewBooking(propertyId, bookingData) {
    logger.info(`Processing new booking from Beds24: ${bookingData.beds24BookingId}`);

    // Check if booking already exists
    const existingBooking = await Booking.findOne({
      where: { beds24BookingId: bookingData.beds24BookingId }
    });

    if (existingBooking) {
      logger.info(`Booking already exists, updating: ${bookingData.beds24BookingId}`);
      await existingBooking.update(bookingData);
      return existingBooking;
    }

    // Get property details for pricing calculation
    const property = await Property.findByPk(propertyId);

    // Calculate dates and pricing
    const checkIn = new Date(bookingData.checkInDate);
    const checkOut = new Date(bookingData.checkOutDate);
    const numberOfNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    // Use existing price from Beds24 or calculate
    let totalPrice = bookingData.totalPrice;
    if (!totalPrice || totalPrice === 0) {
      const nightlyRate = totalPrice / numberOfNights;
      const cleaningFee = property.cleaningFee || 0;
      const taxAmount = (totalPrice + cleaningFee) * (property.taxRate / 100);
      totalPrice = totalPrice + cleaningFee + taxAmount;
    }

    // Create booking
    const booking = await Booking.create({
      propertyId,
      ...bookingData,
      numberOfNights,
      nightlyRate: totalPrice / numberOfNights,
      totalNightsCost: bookingData.totalPrice,
      cleaningFee: property.cleaningFee || 0,
      taxAmount: 0,
      totalPrice,
      currency: property.currency || 'SAR'
    });

    logger.info(`New booking created from Beds24 webhook: ${booking.id}`);

    // TODO: Trigger automations (e.g., generate access code, send welcome message)
    // This will be implemented in Phase 4

    return booking;
  }

  /**
   * Handle modified booking from Beds24
   * @private
   */
  async handleModifiedBooking(beds24BookingId, bookingData) {
    logger.info(`Processing modified booking from Beds24: ${beds24BookingId}`);

    const booking = await Booking.findOne({
      where: { beds24BookingId }
    });

    if (!booking) {
      logger.warn(`Booking not found for modification: ${beds24BookingId}`);
      // Create it as a new booking
      const property = await Property.findOne({
        where: { beds24PropertyId: bookingData.beds24PropertyId }
      });

      if (property) {
        return this.handleNewBooking(property.id, bookingData);
      }
      return null;
    }

    // Update booking
    await booking.update(bookingData);

    logger.info(`Booking updated from Beds24 webhook: ${booking.id}`);

    // TODO: Update automations if dates changed
    // This will be implemented in Phase 4

    return booking;
  }

  /**
   * Handle cancelled booking from Beds24
   * @private
   */
  async handleCancelledBooking(beds24BookingId) {
    logger.info(`Processing cancelled booking from Beds24: ${beds24BookingId}`);

    const booking = await Booking.findOne({
      where: { beds24BookingId }
    });

    if (!booking) {
      logger.warn(`Booking not found for cancellation: ${beds24BookingId}`);
      return null;
    }

    // Update booking status
    await booking.update({
      status: 'cancelled',
      cancelledAt: new Date()
    });

    logger.info(`Booking cancelled from Beds24 webhook: ${booking.id}`);

    // TODO: Cancel automations and remove access codes
    // This will be implemented in Phase 4

    return booking;
  }

  /**
   * Test webhook endpoint
   * GET /api/webhooks/test
   */
  testWebhook = asyncHandler(async (req, res) => {
    res.json(successResponse({
      message: 'Webhook endpoint is working',
      timestamp: new Date().toISOString()
    }));
  });
}

module.exports = new WebhookController();
