const automationService = require('../services/automation.service');
const messageService = require('../services/message.service');
const { asyncHandler } = require('../utils/errors');
const { successResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Automation Controller
 * Handles automation management endpoints
 */
class AutomationController {
  /**
   * Create automation
   * POST /api/automations
   */
  createAutomation = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const automationData = req.body;

    const automation = await automationService.createAutomation(userId, automationData);

    res.status(201).json(successResponse(automation, 'Automation created successfully'));
  });

  /**
   * Get user automations
   * GET /api/automations
   */
  getAutomations = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const filters = {
      propertyId: req.query.propertyId,
      triggerType: req.query.triggerType,
      isActive: req.query.isActive
    };

    const automations = await automationService.getUserAutomations(userId, filters);

    res.json(successResponse(automations));
  });

  /**
   * Get automation by ID
   * GET /api/automations/:id
   */
  getAutomation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const automation = await automationService.getAutomation(id, userId);

    res.json(successResponse(automation));
  });

  /**
   * Update automation
   * PATCH /api/automations/:id
   */
  updateAutomation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    const automation = await automationService.updateAutomation(id, userId, updates);

    res.json(successResponse(automation, 'Automation updated successfully'));
  });

  /**
   * Delete automation
   * DELETE /api/automations/:id
   */
  deleteAutomation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    await automationService.deleteAutomation(id, userId);

    res.json(successResponse(null, 'Automation deleted successfully'));
  });

  /**
   * Get automation statistics
   * GET /api/automations/stats
   */
  getAutomationStats = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const stats = await automationService.getAutomationStats(userId);

    res.json(successResponse(stats));
  });

  /**
   * Test automation execution
   * POST /api/automations/:id/test
   */
  testAutomation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const context = req.body;

    const automation = await automationService.getAutomation(id, userId);

    const result = await automationService.executeAutomation(automation, context);

    res.json(successResponse(result, 'Automation test executed'));
  });

  /**
   * Get booking messages
   * GET /api/automations/messages/:bookingId
   */
  getBookingMessages = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    const messages = await messageService.getBookingMessages(bookingId);

    res.json(successResponse(messages));
  });

  /**
   * Retry failed message
   * POST /api/automations/messages/:messageId/retry
   */
  retryMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;

    const message = await messageService.retryMessage(messageId);

    res.json(successResponse(message, 'Message retry initiated'));
  });
}

module.exports = new AutomationController();
