import api from './api';

/**
 * User Management Service
 */

/**
 * Get user permissions and accessible pages
 * @returns {Promise<Object>} - User permissions and pages
 */
export const getMyPermissions = async () => {
  const response = await api.get('/users/me/permissions');
  return response.data.data;
};

/**
 * Get all users
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - Users list with pagination
 */
export const getUsers = async (params = {}) => {
  const response = await api.get('/users', { params });
  return response.data.data;
};

/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {Promise<Object>} - User data
 */
export const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data.data;
};

/**
 * Create new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} - Created user
 */
export const createUser = async (userData) => {
  const response = await api.post('/users', userData);
  return response.data.data;
};

/**
 * Update user
 * @param {string} id - User ID
 * @param {Object} updates - Update data
 * @returns {Promise<Object>} - Updated user
 */
export const updateUser = async (id, updates) => {
  const response = await api.patch(`/users/${id}`, updates);
  return response.data.data;
};

/**
 * Delete user
 * @param {string} id - User ID
 * @returns {Promise<void>}
 */
export const deleteUser = async (id) => {
  await api.delete(`/users/${id}`);
};

/**
 * Export users data
 * @param {Object} params - Export parameters
 * @returns {Promise<Blob>} - Export file
 */
export const exportUsers = async (params = {}) => {
  const response = await api.get('/users/export', {
    params,
    responseType: 'blob'
  });
  return response.data;
};

const userService = {
  getMyPermissions,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  exportUsers
};

export default userService;
