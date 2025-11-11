const authService = require('../services/auth.service');
const { AuthenticationError, AuthorizationError } = require('../utils/errors');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No authentication token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = authService.verifyToken(token);

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: error.message
        },
        timestamp: new Date().toISOString()
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Invalid authentication token'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Authorization middleware factory
 * Checks if user has required role
 * @param {...string} allowedRoles - Roles that are allowed
 * @returns {Function} - Middleware function
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions'
        },
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't fail if not
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = authService.verifyToken(token);

      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
    }

    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};
