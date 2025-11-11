const bookingService = require('../services/booking.service');
const { asyncHandler } = require('../utils/errors');
const { successResponse, createdResponse, paginatedResponse } = require('../utils/response');
const Joi = require('joi');

/**
 * Booking Controller
 * Handles booking-related HTTP requests
 */
class BookingController {
  /**
   * Create new booking
   * POST /api/bookings
   */
  createBooking = asyncHandler(async (req, res) => {
    // Validation schema
    const schema = Joi.object({
      propertyId: Joi.string().uuid().required(),
      checkInDate: Joi.date().iso().greater('now').required(),
      checkOutDate: Joi.date().iso().greater(Joi.ref('checkInDate')).required(),
      guestFirstName: Joi.string().min(2).max(100).required(),
      guestLastName: Joi.string().min(2).max(100).required(),
      guestEmail: Joi.string().email().required(),
      guestPhone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
      guestLanguage: Joi.string().valid('en', 'ar').default('en'),
      numberOfAdults: Joi.number().integer().min(1).required(),
      numberOfChildren: Joi.number().integer().min(0).default(0),
      nightlyRate: Joi.number().min(0).required(),
      specialRequests: Joi.string().max(500),
      bookingSource: Joi.string().default('direct')
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    const booking = await bookingService.createBooking(req.user.id, value);

    res.status(201).json(createdResponse(booking, 'Booking created successfully'));
  });

  /**
   * Get all bookings for user
   * GET /api/bookings
   */
  getBookings = asyncHandler(async (req, res) => {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      status: req.query.status,
      propertyId: req.query.propertyId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      guestEmail: req.query.guestEmail
    };

    const result = await bookingService.getUserBookings(req.user.id, filters);

    res.json(paginatedResponse(result.bookings, result.pagination));
  });

  /**
   * Get single booking
   * GET /api/bookings/:id
   */
  getBooking = asyncHandler(async (req, res) => {
    const booking = await bookingService.getBooking(req.params.id, req.user.id);

    res.json(successResponse(booking));
  });

  /**
   * Update booking
   * PATCH /api/bookings/:id
   */
  updateBooking = asyncHandler(async (req, res) => {
    const allowedUpdates = [
      'checkInDate',
      'checkOutDate',
      'guestFirstName',
      'guestLastName',
      'guestEmail',
      'guestPhone',
      'numberOfAdults',
      'numberOfChildren',
      'specialRequests',
      'internalNotes',
      'status'
    ];

    // Filter updates to only allowed fields
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const booking = await bookingService.updateBooking(
      req.params.id,
      req.user.id,
      updates
    );

    res.json(successResponse(booking, 'Booking updated successfully'));
  });

  /**
   * Cancel booking
   * POST /api/bookings/:id/cancel
   */
  cancelBooking = asyncHandler(async (req, res) => {
    const booking = await bookingService.cancelBooking(req.params.id, req.user.id);

    res.json(successResponse(booking, 'Booking cancelled successfully'));
  });

  /**
   * Sync bookings from Beds24
   * POST /api/bookings/beds24/sync
   */
  syncFromBeds24 = asyncHandler(async (req, res) => {
    const schema = Joi.object({
      propertyId: Joi.string().uuid().required(),
      startDate: Joi.date().iso(),
      endDate: Joi.date().iso()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        }
      });
    }

    const result = await bookingService.syncFromBeds24(
      value.propertyId,
      req.user.id,
      {
        startDate: value.startDate,
        endDate: value.endDate
      }
    );

    res.json(successResponse(result, 'Bookings synced from Beds24 successfully'));
  });

  /**
   * Get booking statistics
   * GET /api/bookings/stats
   */
  getBookingStats = asyncHandler(async (req, res) => {
    const stats = await bookingService.getBookingStats(
      req.user.id,
      req.query.propertyId
    );

    res.json(successResponse(stats));
  });
}

module.exports = new BookingController();
