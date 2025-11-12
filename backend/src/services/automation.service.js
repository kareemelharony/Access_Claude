const { Automation, Booking, Property, Device, GuestMessage } = require('../models');
const { Op } = require('sequelize');
const messageService = require('./message.service');
const deviceService = require('./device.service');
const ttlockService = require('./integrations/ttlock.service');
const tuyaService = require('./integrations/tuya.service');
const logger = require('../utils/logger');
const { NotFoundError, ValidationError, ForbiddenError } = require('../utils/errors');

/**
 * Automation Service
 * Handles automation rule execution and management
 */
class AutomationService {
  /**
   * Create automation rule
   * @param {string} userId - User ID
   * @param {Object} automationData - Automation data
   * @returns {Promise<Object>} Created automation
   */
  async createAutomation(userId, automationData) {
    const {
      propertyId,
      name,
      description,
      triggerType,
      triggerConfig,
      conditions,
      actionType,
      actionConfig,
      messageTemplate,
      executeOnce,
      retryOnFailure,
      maxRetries
    } = automationData;

    // Verify property ownership if specified
    if (propertyId) {
      const property = await Property.findOne({
        where: { id: propertyId, ownerId: userId }
      });

      if (!property) {
        throw new NotFoundError('Property not found');
      }
    }

    const automation = await Automation.create({
      ownerId: userId,
      propertyId,
      name,
      description,
      triggerType,
      triggerConfig: triggerConfig || {},
      conditions: conditions || [],
      actionType,
      actionConfig,
      messageTemplate,
      executeOnce: executeOnce !== undefined ? executeOnce : true,
      retryOnFailure: retryOnFailure !== undefined ? retryOnFailure : true,
      maxRetries: maxRetries || 3,
      isActive: true,
      status: 'active'
    });

    logger.info(`Automation created: ${automation.id} by user ${userId}`);

    return automation;
  }

  /**
   * Get user automations
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} List of automations
   */
  async getUserAutomations(userId, filters = {}) {
    const { propertyId, triggerType, isActive } = filters;

    const where = { ownerId: userId };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (triggerType) {
      where.triggerType = triggerType;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const automations = await Automation.findAll({
      where,
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return automations;
  }

  /**
   * Get automation by ID
   * @param {string} automationId - Automation ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Automation
   */
  async getAutomation(automationId, userId) {
    const automation = await Automation.findByPk(automationId, {
      include: [
        {
          model: Property,
          as: 'property',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!automation) {
      throw new NotFoundError('Automation not found');
    }

    if (automation.ownerId !== userId) {
      throw new ForbiddenError('Access denied');
    }

    return automation;
  }

  /**
   * Update automation
   * @param {string} automationId - Automation ID
   * @param {string} userId - User ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated automation
   */
  async updateAutomation(automationId, userId, updates) {
    const automation = await this.getAutomation(automationId, userId);

    const allowedFields = [
      'name', 'description', 'triggerConfig', 'conditions',
      'actionConfig', 'messageTemplate', 'isActive', 'executeOnce',
      'retryOnFailure', 'maxRetries'
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    await automation.update(updateData);

    logger.info(`Automation updated: ${automationId}`);

    return automation;
  }

  /**
   * Delete automation
   * @param {string} automationId - Automation ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteAutomation(automationId, userId) {
    const automation = await this.getAutomation(automationId, userId);

    await automation.destroy();

    logger.info(`Automation deleted: ${automationId}`);

    return true;
  }

  /**
   * Execute automation for a specific trigger
   * @param {string} triggerType - Trigger type
   * @param {Object} context - Execution context
   * @returns {Promise<Array>} Execution results
   */
  async executeTrigger(triggerType, context) {
    const { bookingId, propertyId, deviceId } = context;

    // Find matching automations
    const where = {
      triggerType,
      isActive: true,
      status: 'active',
      [Op.or]: [
        { propertyId: null }, // Global automations
        { propertyId: propertyId } // Property-specific automations
      ]
    };

    const automations = await Automation.findAll({ where });

    logger.info(`Found ${automations.length} automations for trigger: ${triggerType}`);

    const results = [];

    for (const automation of automations) {
      try {
        // Check if automation should execute
        if (!automation.shouldExecute(context)) {
          logger.info(`Automation ${automation.id} conditions not met, skipping`);
          continue;
        }

        // Check if already executed for this booking (if executeOnce is true)
        if (automation.executeOnce && bookingId) {
          const alreadyExecuted = await GuestMessage.findOne({
            where: {
              bookingId,
              automationId: automation.id
            }
          });

          if (alreadyExecuted) {
            logger.info(`Automation ${automation.id} already executed for booking ${bookingId}, skipping`);
            continue;
          }
        }

        // Execute automation
        const result = await this.executeAutomation(automation, context);
        results.push(result);

        // Increment execution counter
        await automation.incrementExecutions(true);
      } catch (error) {
        logger.error(`Error executing automation ${automation.id}:`, error);
        await automation.incrementExecutions(false);

        results.push({
          automationId: automation.id,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Execute specific automation
   * @private
   * @param {Object} automation - Automation instance
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Execution result
   */
  async executeAutomation(automation, context) {
    logger.info(`Executing automation: ${automation.id}, action: ${automation.actionType}`);

    const { bookingId, propertyId, deviceId } = context;

    let result;

    switch (automation.actionType) {
      case 'send_message':
      case 'send_email':
      case 'send_sms':
      case 'send_whatsapp':
        result = await this.executeSendMessage(automation, context);
        break;

      case 'generate_passcode':
        result = await this.executeGeneratePasscode(automation, context);
        break;

      case 'control_device':
        result = await this.executeControlDevice(automation, context);
        break;

      default:
        throw new Error(`Unsupported action type: ${automation.actionType}`);
    }

    return {
      automationId: automation.id,
      success: true,
      result
    };
  }

  /**
   * Execute send message action
   * @private
   */
  async executeSendMessage(automation, context) {
    const { bookingId } = context;

    if (!bookingId) {
      throw new Error('Booking ID required for send message action');
    }

    const booking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: Property,
          as: 'property'
        }
      ]
    });

    if (!booking) {
      throw new Error(`Booking not found: ${bookingId}`);
    }

    // Build template variables
    const variables = await messageService.buildTemplateVariables(booking, context.additionalVariables || {});

    // Get message type from action config or use default
    const messageType = automation.actionConfig.messageType || 'email';
    const template = automation.messageTemplate[booking.language || 'en'] || automation.messageTemplate.en;

    // Render template
    const subject = template.subject ? messageService.renderTemplate(template.subject, variables) : undefined;
    const body = messageService.renderTemplate(template.body || template, variables);

    // Send message
    const messageData = {
      bookingId,
      automationId: automation.id,
      messageType,
      recipient: {
        name: `${booking.guestFirstName} ${booking.guestLastName}`,
        email: booking.guestEmail,
        phone: booking.guestPhone
      },
      subject,
      body,
      language: booking.language || 'en',
      metadata: { automation: automation.name, trigger: automation.triggerType }
    };

    return messageService.sendMessage(messageData);
  }

  /**
   * Execute generate passcode action
   * @private
   */
  async executeGeneratePasscode(automation, context) {
    const { bookingId, propertyId } = context;

    if (!bookingId || !propertyId) {
      throw new Error('Booking ID and Property ID required for generate passcode action');
    }

    const booking = await Booking.findByPk(bookingId);
    const property = await Property.findByPk(propertyId);

    if (!booking || !property) {
      throw new Error('Booking or property not found');
    }

    // Find TTLock device for this property
    const device = await Device.findOne({
      where: {
        propertyId,
        deviceType: 'ttlock',
        status: 'online'
      }
    });

    if (!device) {
      throw new Error('No TTLock device found for property');
    }

    // Get TTLock credentials
    if (!property.ttlockAccessToken || !property.ttlockRefreshToken) {
      throw new Error('TTLock not connected for this property');
    }

    const accessToken = await ttlockService.getValidAccessToken(
      property.ttlockAccessToken,
      property.ttlockRefreshToken,
      property.ttlockUserId
    );

    // Generate guest passcode
    const passcode = await ttlockService.generateGuestPasscode(
      accessToken,
      parseInt(device.deviceId),
      {
        guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        bookingId: booking.id
      }
    );

    logger.info(`Generated passcode for booking ${bookingId}: ${passcode.passcode}`);

    // Optionally send passcode to guest if configured
    if (automation.actionConfig.sendToGuest) {
      await messageService.sendCheckInInstructions(
        booking,
        passcode.passcode,
        automation.actionConfig.messageType || 'email'
      );
    }

    return passcode;
  }

  /**
   * Execute control device action
   * @private
   */
  async executeControlDevice(automation, context) {
    const { deviceId } = automation.actionConfig;

    if (!deviceId) {
      throw new Error('Device ID required for control device action');
    }

    const device = await Device.findByPk(deviceId);

    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }

    const command = automation.actionConfig.command;

    if (!command) {
      throw new Error('Device command required');
    }

    // Execute device command based on device type
    if (device.isTTLock()) {
      return deviceService.controlTTLockDevice(deviceId, device.property.ownerId, command);
    } else if (device.isTuyaDevice()) {
      return deviceService.controlTuyaDevice(deviceId, device.property.ownerId, command);
    }

    throw new Error('Unsupported device type');
  }

  /**
   * Get automation statistics
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Automation statistics
   */
  async getAutomationStats(userId) {
    const automations = await Automation.findAll({
      where: { ownerId: userId },
      attributes: [
        'isActive',
        [Automation.sequelize.fn('COUNT', Automation.sequelize.col('id')), 'count'],
        [Automation.sequelize.fn('SUM', Automation.sequelize.col('total_executions')), 'totalExecutions'],
        [Automation.sequelize.fn('SUM', Automation.sequelize.col('successful_executions')), 'successfulExecutions'],
        [Automation.sequelize.fn('SUM', Automation.sequelize.col('failed_executions')), 'failedExecutions']
      ],
      group: ['is_active']
    });

    const stats = {
      total: 0,
      active: 0,
      inactive: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      successRate: 0
    };

    for (const record of automations) {
      const count = parseInt(record.dataValues.count);
      const totalExec = parseInt(record.dataValues.totalExecutions) || 0;
      const successExec = parseInt(record.dataValues.successfulExecutions) || 0;
      const failedExec = parseInt(record.dataValues.failedExecutions) || 0;

      stats.total += count;
      stats.totalExecutions += totalExec;
      stats.successfulExecutions += successExec;
      stats.failedExecutions += failedExec;

      if (record.isActive) {
        stats.active += count;
      } else {
        stats.inactive += count;
      }
    }

    if (stats.totalExecutions > 0) {
      stats.successRate = Math.round((stats.successfulExecutions / stats.totalExecutions) * 100);
    }

    return stats;
  }
}

module.exports = new AutomationService();
