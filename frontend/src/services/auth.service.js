import api from './api';

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - User and tokens
   */
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    if (response.data) {
      this.setAuthData(response.data);
    }
    return response.data;
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - User and tokens
   */
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.data) {
      this.setAuthData(response.data);
    }
    return response.data;
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
    }
  }

  /**
   * Get current user
   * @returns {Promise<Object>} - Current user
   */
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  }

  /**
   * Update user profile
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} - Updated user
   */
  async updateProfile(updates) {
    const response = await api.patch('/auth/profile', updates);
    if (response.data) {
      // Update stored user data
      const currentUser = this.getUser();
      const updatedUser = { ...currentUser, ...response.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    return response.data;
  }

  /**
   * Change password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async changePassword(currentPassword, newPassword) {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  }

  /**
   * Refresh access token
   * @returns {Promise<string>} - New access token
   */
  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post('/auth/refresh', { refreshToken });
    if (response.data) {
      localStorage.setItem('accessToken', response.data.accessToken);
    }
    return response.data.accessToken;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    const token = localStorage.getItem('accessToken');
    const user = this.getUser();
    return !!(token && user);
  }

  /**
   * Get stored user data
   * @returns {Object|null}
   */
  getUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get stored access token
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem('accessToken');
  }

  /**
   * Store authentication data
   * @private
   * @param {Object} data - Auth data (user, accessToken, refreshToken)
   */
  setAuthData(data) {
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
  }

  /**
   * Clear all authentication data
   * @private
   */
  clearAuthData() {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

export default new AuthService();
