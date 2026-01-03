const authService = require('../services/auth.service');
const { AuthenticationError, AuthorizationError } = require('../utils/errors');
const { hasPermission, canAccessPage } = require('../config/permissions');

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
      role: decoded.role,
      department: decoded.department || 'general'
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
        role: decoded.role,
        department: decoded.department || 'general'
      };
    }

    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

/**
 * Permission-based authorization middleware
 * Checks if user has specific permission
 * @param {...string} requiredPermissions - Permissions that are required
 * @returns {Function} - Middleware function
 */
const requirePermission = (...requiredPermissions) => {
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

    // Check if user has any of the required permissions
    const userHasPermission = requiredPermissions.some(permission =>
      hasPermission(req.user.role, permission)
    );

    if (!userHasPermission) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions to access this resource',
          required: requiredPermissions
        },
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

/**
 * Page access middleware
 * Checks if user can access a specific page
 * @param {string} pagePath - Page path to check
 * @returns {Function} - Middleware function
 */
const requirePageAccess = (pagePath) => {
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

    if (!canAccessPage(req.user.role, pagePath)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'You do not have access to this page',
          page: pagePath
        },
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

/**
 * Department-based authorization middleware
 * Checks if user belongs to specific department(s)
 * @param {...string} allowedDepartments - Departments that are allowed
 * @returns {Function} - Middleware function
 */
const requireDepartment = (...allowedDepartments) => {
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

    // CEO has access to all departments
    if (req.user.role === 'ceo') {
      return next();
    }

    // Check if user's department is in allowed list
    const userDepartment = req.user.department || 'general';
    if (!allowedDepartments.includes(userDepartment)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Access restricted to specific departments',
          allowedDepartments
        },
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  requirePermission,
  requirePageAccess,
  requireDepartment
};
