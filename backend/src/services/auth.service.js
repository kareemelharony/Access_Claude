const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { AuthenticationError, ValidationError } = require('../utils/errors');
const { validatePasswordStrength } = require('../utils/validation');

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - User and tokens
   */
  async register(userData) {
    const { email, password, firstName, lastName, phone, language } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    // Validate password strength
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      throw new ValidationError(passwordCheck.message);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      language: language || 'en',
      role: 'owner',
      emailVerified: false
    });

    // Generate tokens
    const tokens = this.generateTokens(user);

    return {
      user: user.toJSON(),
      ...tokens
    };
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - User and tokens
   */
  async login(email, password) {
    // Find user
    const user = await User.findOne({
      where: { email, status: 'active' }
    });

    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    // Generate tokens
    const tokens = this.generateTokens(user);

    return {
      user: user.toJSON(),
      ...tokens
    };
  }

  /**
   * Generate JWT access and refresh tokens
   * @param {Object} user - User object
   * @returns {Object} - {accessToken, refreshToken, expiresIn}
   */
  generateTokens(user) {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900 // 15 minutes in seconds
    };
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} - New access token
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Get user
      const user = await User.findByPk(decoded.userId);
      if (!user || user.status !== 'active') {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Generate new access token
      const accessToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
      );

      return {
        accessToken,
        expiresIn: 900
      };
    } catch (error) {
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  /**
   * Verify access token
   * @param {string} token - Access token
   * @returns {Object} - Decoded token payload
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User object
   */
  async getUserById(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    return user.toJSON();
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} - Updated user
   */
  async updateProfile(userId, updates) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Only allow certain fields to be updated
    const allowedFields = ['firstName', 'lastName', 'phone', 'language', 'timezone', 'avatarUrl'];
    const filteredUpdates = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    await user.update(filteredUpdates);
    return user.toJSON();
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Validate new password
    const passwordCheck = validatePasswordStrength(newPassword);
    if (!passwordCheck.valid) {
      throw new ValidationError(passwordCheck.message);
    }

    // Hash and update password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await user.update({ passwordHash });

    return true;
  }
}

module.exports = new AuthService();
