const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automation.controller');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Automation Routes
 * Base path: /api/automations
 */

// All routes require authentication
router.use(authenticate);

// Automation CRUD operations
router.post('/', authorize('owner', 'admin'), automationController.createAutomation);
router.get('/', automationController.getAutomations);
router.get('/stats', automationController.getAutomationStats);
router.get('/:id', automationController.getAutomation);
router.patch('/:id', authorize('owner', 'admin'), automationController.updateAutomation);
router.delete('/:id', authorize('owner', 'admin'), automationController.deleteAutomation);

// Test automation
router.post('/:id/test', authorize('owner', 'admin'), automationController.testAutomation);

// Messages
router.get('/messages/:bookingId', automationController.getBookingMessages);
router.post('/messages/:messageId/retry', authorize('owner', 'admin'), automationController.retryMessage);

module.exports = router;
