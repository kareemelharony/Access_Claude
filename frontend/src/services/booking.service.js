import api from './api';

/**
 * Booking Service
 * Handles all booking-related API calls
 */
class BookingService {
  /**
   * Create new booking
   * @param {Object} bookingData - Booking data
   * @returns {Promise<Object>}
   */
  async createBooking(bookingData) {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  }

  /**
   * Get all bookings
   * @param {Object} filters - Optional filters and pagination
   * @returns {Promise<Object>} - { bookings, pagination }
   */
  async getBookings(filters = {}) {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.status) params.append('status', filters.status);
    if (filters.propertyId) params.append('propertyId', filters.propertyId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.guestEmail) params.append('guestEmail', filters.guestEmail);

    const response = await api.get(`/bookings?${params.toString()}`);
    return {
      bookings: response.data,
      pagination: response.pagination
    };
  }

  /**
   * Get single booking
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object>}
   */
  async getBooking(bookingId) {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  }

  /**
   * Update booking
   * @param {string} bookingId - Booking ID
   * @param {Object} updates - Booking updates
   * @returns {Promise<Object>}
   */
  async updateBooking(bookingId, updates) {
    const response = await api.patch(`/bookings/${bookingId}`, updates);
    return response.data;
  }

  /**
   * Cancel booking
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Object>}
   */
  async cancelBooking(bookingId) {
    const response = await api.post(`/bookings/${bookingId}/cancel`);
    return response.data;
  }

  /**
   * Sync bookings from Beds24
   * @param {string} propertyId - Property ID
   * @param {Object} options - Sync options
   * @returns {Promise<Object>}
   */
  async syncFromBeds24(propertyId, options = {}) {
    const response = await api.post('/bookings/beds24/sync', {
      propertyId,
      ...options
    });
    return response.data;
  }

  /**
   * Get booking statistics
   * @param {string} propertyId - Optional property ID filter
   * @returns {Promise<Object>}
   */
  async getBookingStats(propertyId = null) {
    const params = propertyId ? `?propertyId=${propertyId}` : '';
    const response = await api.get(`/bookings/stats${params}`);
    return response.data;
  }
}

export default new BookingService();
