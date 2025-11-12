const { Device, Property } = require('../models');
const { Op } = require('sequelize');
const ttlockService = require('./integrations/ttlock.service');
const tuyaService = require('./integrations/tuya.service');
const { encryptionService } = require('../utils/encryption');
const logger = require('../utils/logger');
const { NotFoundError, ValidationError, ForbiddenError } = require('../utils/errors');

/**
 * Device Service
 * Handles device management and integration with TTLock and Tuya platforms
 */
class DeviceService {
  /**
   * Create a new device
   * @param {string} userId - User ID
   * @param {Object} deviceData - Device data
   * @returns {Promise<Object>} Created device
   */
  async createDevice(userId, deviceData) {
    const {
      propertyId,
      deviceType,
      deviceId,
      name,
      location,
      category,
      model,
      manufacturer,
      capabilities,
      settings
    } = deviceData;

    // Verify property belongs to user
    const property = await Property.findOne({
      where: { id: propertyId, ownerId: userId }
    });

    if (!property) {
      throw new NotFoundError('Property not found');
    }

    // Check if device already exists
    const existingDevice = await Device.findOne({
      where: {
        propertyId,
        deviceId
      }
    });

    if (existingDevice) {
      throw new ValidationError('Device already exists for this property');
    }

    // Create device
    const device = await Device.create({
      propertyId,
      deviceType,
      deviceId,
      name,
      location,
      category,
      model,
      manufacturer,
      capabilities,
      settings
    });

    logger.info(`Device created: ${device.id} for property: ${propertyId}`);

    return device;
  }

  /**
   * Get user's devices
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} List of devices
   */
  async getUserDevices(userId, filters = {}) {
    const { propertyId, deviceType, status } = filters;

    const where = {};

    // Build query
    if (deviceType) {
      where.deviceType = deviceType;
    }

    if (status) {
      where.status = status;
    }

    // Get user's properties
    const properties = await Property.findAll({
      where: { ownerId: userId },
      attributes: ['id']
    });

    const propertyIds = properties.map(p => p.id);

    if (propertyId) {
      if (!propertyIds.includes(propertyId)) {
        throw new ForbiddenError('Property does not belong to user');
      }
      where.propertyId = propertyId;
    } else {
      where.propertyId = { [Op.in]: propertyIds };
    }

    const devices = await Device.findAll({
      where,
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return devices;
  }

  /**
   * Get device by ID
   * @param {string} deviceId - Device ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Device
   */
  async getDevice(deviceId, userId) {
    const device = await Device.findByPk(deviceId, {
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'name', 'ownerId']
        }
      ]
    });

    if (!device) {
      throw new NotFoundError('Device not found');
    }

    // Verify ownership
    if (device.property.ownerId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    return device;
  }

  /**
   * Update device
   * @param {string} deviceId - Device ID
   * @param {string} userId - User ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated device
   */
  async updateDevice(deviceId, userId, updates) {
    const device = await this.getDevice(deviceId, userId);

    // Allow updating specific fields
    const allowedFields = ['name', 'location', 'settings', 'status'];
    const updateData = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    await device.update(updateData);

    logger.info(`Device updated: ${deviceId}`);

    return device;
  }

  /**
   * Delete device
   * @param {string} deviceId - Device ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteDevice(deviceId, userId) {
    const device = await this.getDevice(deviceId, userId);

    await device.destroy();

    logger.info(`Device deleted: ${deviceId}`);

    return true;
  }

  /**
   * Sync TTLock devices for a property
   * @param {string} propertyId - Property ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Sync result
   */
  async syncTTLockDevices(propertyId, userId) {
    const property = await Property.findOne({
      where: { id: propertyId, ownerId: userId }
    });

    if (!property) {
      throw new NotFoundError('Property not found');
    }

    if (!property.ttlockAccessToken || !property.ttlockRefreshToken) {
      throw new ValidationError('TTLock not connected for this property');
    }

    try {
      // Get valid access token
      const accessToken = await ttlockService.getValidAccessToken(
        property.ttlockAccessToken,
        property.ttlockRefreshToken,
        property.ttlockUserId
      );

      // Fetch locks from TTLock
      const locks = await ttlockService.listLocks(accessToken);

      let created = 0;
      let updated = 0;

      for (const lock of locks) {
        const transformedData = ttlockService.transformLockData(lock);

        // Check if device exists
        const existingDevice = await Device.findOne({
          where: {
            propertyId,
            deviceId: transformedData.deviceId
          }
        });

        if (existingDevice) {
          await existingDevice.update(transformedData);
          updated++;
        } else {
          await Device.create({
            propertyId,
            ...transformedData
          });
          created++;
        }
      }

      logger.info(`TTLock sync completed for property ${propertyId}: ${created} created, ${updated} updated`);

      return {
        success: true,
        created,
        updated,
        total: locks.length
      };
    } catch (error) {
      logger.error('TTLock sync error:', error);
      throw new Error(`Failed to sync TTLock devices: ${error.message}`);
    }
  }

  /**
   * Sync Tuya devices for a property
   * @param {string} propertyId - Property ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Sync result
   */
  async syncTuyaDevices(propertyId, userId) {
    const property = await Property.findOne({
      where: { id: propertyId, ownerId: userId }
    });

    if (!property) {
      throw new NotFoundError('Property not found');
    }

    if (!property.tuyaHomeId) {
      throw new ValidationError('Tuya home not connected for this property');
    }

    try {
      // Get access token (client credentials)
      const { accessToken } = await tuyaService.getAccessToken();

      // Fetch devices from Tuya
      const devices = await tuyaService.getHomeDevices(accessToken, property.tuyaHomeId);

      let created = 0;
      let updated = 0;

      for (const device of devices) {
        const transformedData = tuyaService.transformDeviceData(device);

        // Check if device exists
        const existingDevice = await Device.findOne({
          where: {
            propertyId,
            deviceId: transformedData.deviceId
          }
        });

        if (existingDevice) {
          await existingDevice.update(transformedData);
          updated++;
        } else {
          await Device.create({
            propertyId,
            ...transformedData
          });
          created++;
        }
      }

      logger.info(`Tuya sync completed for property ${propertyId}: ${created} created, ${updated} updated`);

      return {
        success: true,
        created,
        updated,
        total: devices.length
      };
    } catch (error) {
      logger.error('Tuya sync error:', error);
      throw new Error(`Failed to sync Tuya devices: ${error.message}`);
    }
  }

  /**
   * Control TTLock device
   * @param {string} deviceId - Device ID
   * @param {string} userId - User ID
   * @param {Object} command - Command data
   * @returns {Promise<Object>} Command result
   */
  async controlTTLockDevice(deviceId, userId, command) {
    const device = await this.getDevice(deviceId, userId);

    if (!device.isTTLock()) {
      throw new ValidationError('Device is not a TTLock');
    }

    const property = device.property;

    if (!property.ttlockAccessToken || !property.ttlockRefreshToken) {
      throw new ValidationError('TTLock not connected');
    }

    try {
      const accessToken = await ttlockService.getValidAccessToken(
        property.ttlockAccessToken,
        property.ttlockRefreshToken,
        property.ttlockUserId
      );

      const lockId = parseInt(device.deviceId);

      let result;

      switch (command.action) {
        case 'unlock':
          result = await ttlockService.unlock(accessToken, lockId);
          break;

        case 'lock':
          result = await ttlockService.lock(accessToken, lockId);
          break;

        case 'generate_passcode':
          result = await ttlockService.generatePasscode(accessToken, lockId, command.passcodeData);
          break;

        case 'delete_passcode':
          result = await ttlockService.deletePasscode(accessToken, lockId, command.passcodeId);
          break;

        default:
          throw new ValidationError(`Unknown command: ${command.action}`);
      }

      logger.info(`TTLock command executed: ${command.action} on device ${deviceId}`);

      return { success: true, result };
    } catch (error) {
      logger.error('TTLock control error:', error);
      throw new Error(`Failed to control TTLock: ${error.message}`);
    }
  }

  /**
   * Control Tuya device (including smart locks)
   * @param {string} deviceId - Device ID
   * @param {string} userId - User ID
   * @param {Object} command - Command data
   * @returns {Promise<Object>} Command result
   */
  async controlTuyaDevice(deviceId, userId, command) {
    const device = await this.getDevice(deviceId, userId);

    if (!device.isTuyaDevice()) {
      throw new ValidationError('Device is not a Tuya device');
    }

    try {
      const { accessToken } = await tuyaService.getAccessToken();
      const tuyaDeviceId = device.deviceId;

      let result;

      switch (command.action) {
        // General device commands
        case 'toggle':
          result = await tuyaService.toggleDevice(accessToken, tuyaDeviceId, command.turnOn);
          break;

        case 'set_temperature':
          result = await tuyaService.setThermostatTemperature(accessToken, tuyaDeviceId, command.temperature);
          break;

        case 'set_brightness':
          result = await tuyaService.setLightBrightness(accessToken, tuyaDeviceId, command.brightness);
          break;

        case 'set_color':
          result = await tuyaService.setLightColor(accessToken, tuyaDeviceId, command.color);
          break;

        case 'custom_command':
          result = await tuyaService.sendDeviceCommand(accessToken, tuyaDeviceId, command.commands);
          break;

        // Smart lock specific commands
        case 'lock':
          result = await tuyaService.lockControl(accessToken, tuyaDeviceId, true);
          break;

        case 'unlock':
          result = await tuyaService.lockControl(accessToken, tuyaDeviceId, false);
          break;

        case 'generate_passcode':
          result = await tuyaService.generateLockPasscode(accessToken, tuyaDeviceId, command.passcodeData);
          break;

        case 'delete_passcode':
          result = await tuyaService.deleteLockPasscode(accessToken, tuyaDeviceId, command.passcodeId);
          break;

        case 'list_passcodes':
          result = await tuyaService.getLockPasscodes(accessToken, tuyaDeviceId);
          break;

        case 'get_lock_records':
          result = await tuyaService.getLockRecords(accessToken, tuyaDeviceId, command.options || {});
          break;

        default:
          throw new ValidationError(`Unknown command: ${command.action}`);
      }

      logger.info(`Tuya command executed: ${command.action} on device ${deviceId}`);

      return { success: true, result };
    } catch (error) {
      logger.error('Tuya control error:', error);
      throw new Error(`Failed to control Tuya device: ${error.message}`);
    }
  }

  /**
   * Get device status
   * @param {string} deviceId - Device ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Device status
   */
  async getDeviceStatus(deviceId, userId) {
    const device = await this.getDevice(deviceId, userId);

    try {
      let status = {
        deviceId: device.id,
        status: device.status,
        batteryLevel: device.batteryLevel,
        lastSeenAt: device.lastSeenAt
      };

      if (device.isTuyaDevice()) {
        const { accessToken } = await tuyaService.getAccessToken();
        const tuyaStatus = await tuyaService.getDeviceStatus(accessToken, device.deviceId);
        status.details = tuyaStatus;
      }

      return status;
    } catch (error) {
      logger.error('Get device status error:', error);
      throw new Error(`Failed to get device status: ${error.message}`);
    }
  }

  /**
   * Get device statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Device statistics
   */
  async getDeviceStats(userId) {
    // Get user's properties
    const properties = await Property.findAll({
      where: { ownerId: userId },
      attributes: ['id']
    });

    const propertyIds = properties.map(p => p.id);

    const stats = await Device.findAll({
      where: {
        propertyId: { [Op.in]: propertyIds }
      },
      attributes: [
        'deviceType',
        'status',
        [Device.sequelize.fn('COUNT', Device.sequelize.col('id')), 'count']
      ],
      group: ['deviceType', 'status']
    });

    // Format statistics
    const formattedStats = {
      total: 0,
      byType: {},
      byStatus: {
        online: 0,
        offline: 0,
        error: 0
      },
      lowBattery: 0
    };

    for (const stat of stats) {
      const count = parseInt(stat.dataValues.count);
      formattedStats.total += count;

      // By type
      if (!formattedStats.byType[stat.deviceType]) {
        formattedStats.byType[stat.deviceType] = 0;
      }
      formattedStats.byType[stat.deviceType] += count;

      // By status
      if (stat.status && formattedStats.byStatus[stat.status] !== undefined) {
        formattedStats.byStatus[stat.status] += count;
      }
    }

    // Count low battery devices
    const lowBatteryCount = await Device.count({
      where: {
        propertyId: { [Op.in]: propertyIds },
        batteryLevel: { [Op.lt]: 20, [Op.not]: null }
      }
    });

    formattedStats.lowBattery = lowBatteryCount;

    return formattedStats;
  }
}

module.exports = new DeviceService();
