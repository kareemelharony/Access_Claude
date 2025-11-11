const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

/**
 * Webhook Routes
 * Base path: /api/webhooks
 *
 * Note: Webhook routes DO NOT require authentication
 * They are called by external services (Beds24, Tuya, TTLock)
 */

// Beds24 webhook
router.post('/beds24', webhookController.handleBeds24Webhook);

// Test endpoint
router.get('/test', webhookController.testWebhook);

// Future webhook endpoints
// router.post('/tuya', webhookController.handleTuyaWebhook);
// router.post('/ttlock', webhookController.handleTTLockWebhook);

module.exports = router;
