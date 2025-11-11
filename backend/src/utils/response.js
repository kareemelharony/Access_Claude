/**
 * Standardized API Response Helpers
 */

/**
 * Success response
 * @param {*} data - Response data
 * @param {string} message - Optional success message
 * @returns {Object}
 */
const successResponse = (data, message = null) => ({
  success: true,
  data,
  message,
  timestamp: new Date().toISOString()
});

/**
 * Error response
 * @param {Error} error - Error object
 * @param {string} code - Error code
 * @returns {Object}
 */
const errorResponse = (error, code = 'ERROR') => ({
  success: false,
  error: {
    code,
    message: error.message,
    details: error.details || null
  },
  timestamp: new Date().toISOString()
});

/**
 * Paginated response
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination info
 * @returns {Object}
 */
const paginatedResponse = (data, pagination) => {
  const { page, limit, total } = pagination;
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * Created response (201)
 * @param {*} data - Created resource data
 * @param {string} message - Optional message
 * @returns {Object}
 */
const createdResponse = (data, message = 'Resource created successfully') => ({
  success: true,
  data,
  message,
  timestamp: new Date().toISOString()
});

/**
 * No content response (204)
 * Used for successful DELETE operations
 */
const noContentResponse = () => null;

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse
};
