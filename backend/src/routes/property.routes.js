const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/property.controller');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Property Routes
 * Base path: /api/properties
 */

// All routes require authentication
router.use(authenticate);

// Property CRUD operations
router.post('/', authorize('owner', 'admin'), propertyController.createProperty);
router.get('/', propertyController.getProperties);
router.get('/:id', propertyController.getProperty);
router.patch('/:id', authorize('owner', 'admin'), propertyController.updateProperty);
router.delete('/:id', authorize('owner', 'admin'), propertyController.deleteProperty);

// Beds24 integration
router.post('/:id/beds24/connect', authorize('owner', 'admin'), propertyController.connectToBeds24);
router.post('/:id/beds24/sync', authorize('owner', 'admin'), propertyController.syncFromBeds24);

// Statistics
router.get('/:id/stats', propertyController.getPropertyStats);

module.exports = router;
