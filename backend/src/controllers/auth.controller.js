const authService = require('../services/auth.service');
const { asyncHandler } = require('../utils/errors');
const { successResponse, createdResponse } = require('../utils/response');
const Joi = require('joi');

/**
 * Auth Controller
 * Handles authentication-related requests
 */
class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  register = asyncHandler(async (req, res) => {
    // Validate request body
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      firstName: Joi.string().min(2).max(100).required(),
      lastName: Joi.string().min(2).max(100).required(),
      phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
      language: Joi.string().valid('en', 'ar').default('en')
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

    const result = await authService.register(value);

    res.status(201).json(createdResponse(result, 'User registered successfully'));
  });

  /**
   * Login user
   * POST /api/auth/login
   */
  login = asyncHandler(async (req, res) => {
    // Validate request body
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
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

    const result = await authService.login(value.email, value.password);

    res.json(successResponse(result, 'Login successful'));
  });

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Refresh token is required'
        }
      });
    }

    const result = await authService.refreshToken(refreshToken);

    res.json(successResponse(result, 'Token refreshed successfully'));
  });

  /**
   * Get current user
   * GET /api/auth/me
   */
  getCurrentUser = asyncHandler(async (req, res) => {
    const user = await authService.getUserById(req.user.id);

    res.json(successResponse(user));
  });

  /**
   * Update user profile
   * PATCH /api/auth/profile
   */
  updateProfile = asyncHandler(async (req, res) => {
    // Validate request body
    const schema = Joi.object({
      firstName: Joi.string().min(2).max(100),
      lastName: Joi.string().min(2).max(100),
      phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
      language: Joi.string().valid('en', 'ar'),
      timezone: Joi.string(),
      avatarUrl: Joi.string().uri()
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

    const user = await authService.updateProfile(req.user.id, value);

    res.json(successResponse(user, 'Profile updated successfully'));
  });

  /**
   * Change password
   * POST /api/auth/change-password
   */
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Current password and new password are required'
        }
      });
    }

    await authService.changePassword(req.user.id, currentPassword, newPassword);

    res.json(successResponse(null, 'Password changed successfully'));
  });

  /**
   * Logout user
   * POST /api/auth/logout
   */
  logout = asyncHandler(async (req, res) => {
    // In a stateless JWT setup, logout is handled client-side
    // by deleting the tokens. Here we just return success.
    // In a more advanced setup, you might want to blacklist the token.

    res.json(successResponse(null, 'Logout successful'));
  });
}

module.exports = new AuthController();
