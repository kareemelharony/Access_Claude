const propertyService = require('../services/property.service');
const { asyncHandler } = require('../utils/errors');
const { successResponse, createdResponse, paginatedResponse } = require('../utils/response');
const Joi = require('joi');

/**
 * Property Controller
 * Handles property-related HTTP requests
 */
class PropertyController {
  /**
   * Create new property
   * POST /api/properties
   */
  createProperty = asyncHandler(async (req, res) => {
    // Validation schema
    const schema = Joi.object({
      name: Joi.object({
        en: Joi.string().required(),
        ar: Joi.string().required()
      }).required(),
      type: Joi.string().valid('villa', 'apartment', 'studio', 'room').required(),
      address: Joi.string().required(),
      city: Joi.string().required(),
      country: Joi.string().default('Saudi Arabia'),
      postalCode: Joi.string(),
      latitude: Joi.number(),
      longitude: Joi.number(),
      description: Joi.object({
        en: Joi.string(),
        ar: Joi.string()
      }),
      images: Joi.array().items(Joi.object({
        url: Joi.string().uri().required(),
        caption: Joi.object({
          en: Joi.string(),
          ar: Joi.string()
        }),
        order: Joi.number()
      })),
      amenities: Joi.array().items(Joi.string()),
      bedrooms: Joi.number().integer().min(0),
      bathrooms: Joi.number().integer().min(0),
      maxGuests: Joi.number().integer().min(1),
      areaSqm: Joi.number().integer().min(1),
      checkInTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
      checkOutTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
      minStayNights: Joi.number().integer().min(1).default(1),
      maxStayNights: Joi.number().integer().min(1),
      instantBooking: Joi.boolean().default(false),
      currency: Joi.string().length(3).default('SAR'),
      cleaningFee: Joi.number().min(0).default(0),
      taxRate: Joi.number().min(0).max(100).default(15)
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

    const property = await propertyService.createProperty(req.user.id, value);

    res.status(201).json(createdResponse(property, 'Property created successfully'));
  });

  /**
   * Get all properties for user
   * GET /api/properties
   */
  getProperties = asyncHandler(async (req, res) => {
    const filters = {
      status: req.query.status,
      city: req.query.city,
      type: req.query.type
    };

    const properties = await propertyService.getUserProperties(req.user.id, filters);

    res.json(successResponse(properties));
  });

  /**
   * Get single property
   * GET /api/properties/:id
   */
  getProperty = asyncHandler(async (req, res) => {
    const property = await propertyService.getProperty(req.params.id, req.user.id);

    res.json(successResponse(property));
  });

  /**
   * Update property
   * PATCH /api/properties/:id
   */
  updateProperty = asyncHandler(async (req, res) => {
    const property = await propertyService.updateProperty(
      req.params.id,
      req.user.id,
      req.body
    );

    res.json(successResponse(property, 'Property updated successfully'));
  });

  /**
   * Delete property
   * DELETE /api/properties/:id
   */
  deleteProperty = asyncHandler(async (req, res) => {
    await propertyService.deleteProperty(req.params.id, req.user.id);

    res.status(204).send();
  });

  /**
   * Connect property to Beds24
   * POST /api/properties/:id/beds24/connect
   */
  connectToBeds24 = asyncHandler(async (req, res) => {
    const schema = Joi.object({
      inviteCode: Joi.string().required(),
      propertyId: Joi.string().required(),
      roomIds: Joi.array().items(Joi.string())
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

    const property = await propertyService.connectToBeds24(
      req.params.id,
      req.user.id,
      value
    );

    res.json(successResponse(property, 'Property connected to Beds24 successfully'));
  });

  /**
   * Sync property from Beds24
   * POST /api/properties/:id/beds24/sync
   */
  syncFromBeds24 = asyncHandler(async (req, res) => {
    const property = await propertyService.syncFromBeds24(
      req.params.id,
      req.user.id
    );

    res.json(successResponse(property, 'Property synced from Beds24 successfully'));
  });

  /**
   * Get property statistics
   * GET /api/properties/:id/stats
   */
  getPropertyStats = asyncHandler(async (req, res) => {
    const stats = await propertyService.getPropertyStats(
      req.params.id,
      req.user.id
    );

    res.json(successResponse(stats));
  });
}

module.exports = new PropertyController();
