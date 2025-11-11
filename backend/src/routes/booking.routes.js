const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Booking Routes
 * Base path: /api/bookings
 */

// All routes require authentication
router.use(authenticate);

// Booking CRUD operations
router.post('/', authorize('owner', 'admin'), bookingController.createBooking);
router.get('/', bookingController.getBookings);
router.get('/stats', bookingController.getBookingStats);
router.get('/:id', bookingController.getBooking);
router.patch('/:id', authorize('owner', 'admin'), bookingController.updateBooking);

// Booking actions
router.post('/:id/cancel', authorize('owner', 'admin'), bookingController.cancelBooking);

// Beds24 integration
router.post('/beds24/sync', authorize('owner', 'admin'), bookingController.syncFromBeds24);

module.exports = router;
