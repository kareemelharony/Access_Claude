import api from './api';

/**
 * Property Service
 * Handles all property-related API calls
 */
class PropertyService {
  /**
   * Create new property
   * @param {Object} propertyData - Property data
   * @returns {Promise<Object>}
   */
  async createProperty(propertyData) {
    const response = await api.post('/properties', propertyData);
    return response.data;
  }

  /**
   * Get all properties
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>}
   */
  async getProperties(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.city) params.append('city', filters.city);
    if (filters.type) params.append('type', filters.type);

    const response = await api.get(`/properties?${params.toString()}`);
    return response.data;
  }

  /**
   * Get single property
   * @param {string} propertyId - Property ID
   * @returns {Promise<Object>}
   */
  async getProperty(propertyId) {
    const response = await api.get(`/properties/${propertyId}`);
    return response.data;
  }

  /**
   * Update property
   * @param {string} propertyId - Property ID
   * @param {Object} updates - Property updates
   * @returns {Promise<Object>}
   */
  async updateProperty(propertyId, updates) {
    const response = await api.patch(`/properties/${propertyId}`, updates);
    return response.data;
  }

  /**
   * Delete property
   * @param {string} propertyId - Property ID
   * @returns {Promise<void>}
   */
  async deleteProperty(propertyId) {
    await api.delete(`/properties/${propertyId}`);
  }

  /**
   * Connect property to Beds24
   * @param {string} propertyId - Property ID
   * @param {Object} beds24Data - Beds24 connection data
   * @returns {Promise<Object>}
   */
  async connectToBeds24(propertyId, beds24Data) {
    const response = await api.post(`/properties/${propertyId}/beds24/connect`, beds24Data);
    return response.data;
  }

  /**
   * Sync property from Beds24
   * @param {string} propertyId - Property ID
   * @returns {Promise<Object>}
   */
  async syncFromBeds24(propertyId) {
    const response = await api.post(`/properties/${propertyId}/beds24/sync`);
    return response.data;
  }

  /**
   * Get property statistics
   * @param {string} propertyId - Property ID
   * @returns {Promise<Object>}
   */
  async getPropertyStats(propertyId) {
    const response = await api.get(`/properties/${propertyId}/stats`);
    return response.data;
  }
}

export default new PropertyService();
