const deviceService = require('../services/device.service');
const ttlockService = require('../services/integrations/ttlock.service');
const tuyaService = require('../services/integrations/tuya.service');
const { Property } = require('../models');
const { asyncHandler, NotFoundError, ValidationError } = require('../utils/errors');
const { successResponse } = require('../utils/response');
const { encryptionService } = require('../utils/encryption');
const logger = require('../utils/logger');

/**
 * Device Controller
 * Handles device management and control endpoints
 */
class DeviceController {
  /**
   * Create a new device
   * POST /api/devices
   */
  createDevice = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const deviceData = req.body;

    const device = await deviceService.createDevice(userId, deviceData);

    res.status(201).json(successResponse(device, 'Device created successfully'));
  });

  /**
   * Get user's devices
   * GET /api/devices
   */
  getDevices = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const filters = {
      propertyId: req.query.propertyId,
      deviceType: req.query.deviceType,
      status: req.query.status
    };

    const devices = await deviceService.getUserDevices(userId, filters);

    res.json(successResponse(devices));
  });

  /**
   * Get device by ID
   * GET /api/devices/:id
   */
  getDevice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const device = await deviceService.getDevice(id, userId);

    res.json(successResponse(device));
  });

  /**
   * Update device
   * PATCH /api/devices/:id
   */
  updateDevice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    const device = await deviceService.updateDevice(id, userId, updates);

    res.json(successResponse(device, 'Device updated successfully'));
  });

  /**
   * Delete device
   * DELETE /api/devices/:id
   */
  deleteDevice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    await deviceService.deleteDevice(id, userId);

    res.json(successResponse(null, 'Device deleted successfully'));
  });

  /**
   * Get device status
   * GET /api/devices/:id/status
   */
  getDeviceStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const status = await deviceService.getDeviceStatus(id, userId);

    res.json(successResponse(status));
  });

  /**
   * Control device
   * POST /api/devices/:id/control
   */
  controlDevice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const command = req.body;

    const device = await deviceService.getDevice(id, userId);

    let result;

    if (device.isTTLock()) {
      result = await deviceService.controlTTLockDevice(id, userId, command);
    } else if (device.isTuyaDevice()) {
      result = await deviceService.controlTuyaDevice(id, userId, command);
    } else {
      throw new Error('Unsupported device type');
    }

    res.json(successResponse(result, 'Command executed successfully'));
  });

  /**
   * Sync TTLock devices
   * POST /api/devices/ttlock/sync
   */
  syncTTLockDevices = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { propertyId } = req.body;

    const result = await deviceService.syncTTLockDevices(propertyId, userId);

    res.json(successResponse(result, 'TTLock devices synced successfully'));
  });

  /**
   * Sync Tuya devices
   * POST /api/devices/tuya/sync
   */
  syncTuyaDevices = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { propertyId } = req.body;

    const result = await deviceService.syncTuyaDevices(propertyId, userId);

    res.json(successResponse(result, 'Tuya devices synced successfully'));
  });

  /**
   * Get TTLock authorization URL
   * GET /api/devices/ttlock/auth-url
   */
  getTTLockAuthUrl = asyncHandler(async (req, res) => {
    const state = `${req.user.id}:${Date.now()}`;
    const authUrl = ttlockService.getAuthorizationUrl(state);

    res.json(successResponse({ authUrl, state }));
  });

  /**
   * Handle TTLock OAuth callback
   * POST /api/devices/ttlock/callback
   */
  handleTTLockCallback = asyncHandler(async (req, res) => {
    const { code, propertyId } = req.body;
    const userId = req.user.id;

    // Exchange code for tokens
    const tokens = await ttlockService.exchangeAuthorizationCode(code);

    // Update property with TTLock credentials
    const property = await Property.findOne({
      where: { id: propertyId, ownerId: userId }
    });

    if (!property) {
      throw new NotFoundError('Property not found');
    }

    await property.update({
      ttlockAccessToken: tokens.accessToken,
      ttlockRefreshToken: encryptionService.encrypt(tokens.refreshToken),
      ttlockUserId: tokens.uid
    });

    logger.info(`TTLock connected for property: ${propertyId}`);

    res.json(successResponse({ connected: true }, 'TTLock connected successfully'));
  });

  /**
   * Get Tuya authorization URL
   * GET /api/devices/tuya/auth-url
   */
  getTuyaAuthUrl = asyncHandler(async (req, res) => {
    // For Tuya, we use client credentials flow
    // This is just a placeholder for UI integration
    res.json(successResponse({
      message: 'Tuya uses client credentials. Configure in settings.'
    }));
  });

  /**
   * Connect Tuya home to property
   * POST /api/devices/tuya/connect
   */
  connectTuyaHome = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { propertyId, homeId } = req.body;

    const property = await Property.findOne({
      where: { id: propertyId, ownerId: userId }
    });

    if (!property) {
      throw new NotFoundError('Property not found');
    }

    await property.update({
      tuyaHomeId: homeId
    });

    logger.info(`Tuya home connected for property: ${propertyId}`);

    res.json(successResponse({ connected: true }, 'Tuya home connected successfully'));
  });

  /**
   * Get device statistics
   * GET /api/devices/stats
   */
  getDeviceStats = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const stats = await deviceService.getDeviceStats(userId);

    res.json(successResponse(stats));
  });

  /**
   * Generate passcode for TTLock
   * POST /api/devices/:id/passcode
   */
  generatePasscode = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const passcodeData = req.body;

    const result = await deviceService.controlTTLockDevice(id, userId, {
      action: 'generate_passcode',
      passcodeData
    });

    res.json(successResponse(result, 'Passcode generated successfully'));
  });

  /**
   * Delete passcode from TTLock
   * DELETE /api/devices/:id/passcode/:passcodeId
   */
  deletePasscode = asyncHandler(async (req, res) => {
    const { id, passcodeId } = req.params;
    const userId = req.user.id;

    const result = await deviceService.controlTTLockDevice(id, userId, {
      action: 'delete_passcode',
      passcodeId: parseInt(passcodeId)
    });

    res.json(successResponse(result, 'Passcode deleted successfully'));
  });

  /**
   * List passcodes for TTLock
   * GET /api/devices/:id/passcodes
   */
  listPasscodes = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const device = await deviceService.getDevice(id, userId);

    if (!device.isTTLock()) {
      throw new ValidationError('Device is not a TTLock');
    }

    const property = device.property;

    const accessToken = await ttlockService.getValidAccessToken(
      property.ttlockAccessToken,
      property.ttlockRefreshToken,
      property.ttlockUserId
    );

    const passcodes = await ttlockService.listPasscodes(accessToken, parseInt(device.deviceId));

    res.json(successResponse(passcodes));
  });
}

module.exports = new DeviceController();
