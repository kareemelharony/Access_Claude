const Joi = require('joi');
const { ValidationError } = require('./errors');

/**
 * Validate request middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} property - Property to validate (body, query, params)
 * @returns {Function} - Express middleware
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      return next(new ValidationError('Validation failed', errors));
    }

    // Replace request data with validated data
    req[property] = value;
    next();
  };
};

/**
 * Common validation schemas
 */
const schemas = {
  // UUID validation
  uuid: Joi.string().uuid().required(),

  // Email validation
  email: Joi.string().email().lowercase().trim().required(),

  // Password validation
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),

  // Phone number validation (international format)
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).messages({
    'string.pattern.base': 'Phone number must be in international format'
  }),

  // Date validation
  date: Joi.date().iso().required(),

  // Future date validation
  futureDate: Joi.date().iso().greater('now').required(),

  // Pagination
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  },

  // Language
  language: Joi.string().valid('en', 'ar').default('en'),
};

/**
 * Password strength validator
 * @param {string} password - Password to validate
 * @returns {Object} - {valid: boolean, message: string}
 */
const validatePasswordStrength = (password) => {
  if (!password || password.length < 8) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters long'
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase) {
    return {
      valid: false,
      message: 'Password must contain at least one uppercase letter'
    };
  }

  if (!hasLowerCase) {
    return {
      valid: false,
      message: 'Password must contain at least one lowercase letter'
    };
  }

  if (!hasNumbers) {
    return {
      valid: false,
      message: 'Password must contain at least one number'
    };
  }

  if (!hasSpecialChar) {
    return {
      valid: false,
      message: 'Password must contain at least one special character'
    };
  }

  return { valid: true };
};

/**
 * Sanitize input to prevent XSS
 * @param {*} input - Input to sanitize
 * @returns {*} - Sanitized input
 */
const sanitizeInput = (input) => {
  const xss = require('xss');

  if (typeof input === 'string') {
    return xss(input);
  }

  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item));
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const key in input) {
      sanitized[key] = sanitizeInput(input[key]);
    }
    return sanitized;
  }

  return input;
};

module.exports = {
  validate,
  schemas,
  validatePasswordStrength,
  sanitizeInput
};
