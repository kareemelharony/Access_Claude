const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Device Routes
 * Base path: /api/devices
 */

// All routes require authentication
router.use(authenticate);

// Device CRUD operations
router.post('/', authorize('owner', 'admin'), deviceController.createDevice);
router.get('/', deviceController.getDevices);
router.get('/stats', deviceController.getDeviceStats);
router.get('/:id', deviceController.getDevice);
router.patch('/:id', authorize('owner', 'admin'), deviceController.updateDevice);
router.delete('/:id', authorize('owner', 'admin'), deviceController.deleteDevice);

// Device status and control
router.get('/:id/status', deviceController.getDeviceStatus);
router.post('/:id/control', authorize('owner', 'admin'), deviceController.controlDevice);

// TTLock integration
router.get('/ttlock/auth-url', authorize('owner', 'admin'), deviceController.getTTLockAuthUrl);
router.post('/ttlock/callback', authorize('owner', 'admin'), deviceController.handleTTLockCallback);
router.post('/ttlock/sync', authorize('owner', 'admin'), deviceController.syncTTLockDevices);

// Tuya integration
router.get('/tuya/auth-url', authorize('owner', 'admin'), deviceController.getTuyaAuthUrl);
router.post('/tuya/connect', authorize('owner', 'admin'), deviceController.connectTuyaHome);
router.post('/tuya/sync', authorize('owner', 'admin'), deviceController.syncTuyaDevices);

// TTLock passcode management
router.post('/:id/passcode', authorize('owner', 'admin'), deviceController.generatePasscode);
router.get('/:id/passcodes', deviceController.listPasscodes);
router.delete('/:id/passcode/:passcodeId', authorize('owner', 'admin'), deviceController.deletePasscode);

module.exports = router;
