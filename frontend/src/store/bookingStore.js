import { create } from 'zustand';
import bookingService from '../services/booking.service';

/**
 * Booking Store
 * Manages booking state and actions
 */
const useBookingStore = create((set, get) => ({
  // State
  bookings: [],
  selectedBooking: null,
  bookingStats: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  isLoading: false,
  error: null,

  /**
   * Load all bookings
   */
  loadBookings: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { bookings, pagination } = await bookingService.getBookings(filters);
      set({ bookings, pagination, isLoading: false });
      return bookings;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Load single booking
   */
  loadBooking: async (bookingId) => {
    set({ isLoading: true, error: null });
    try {
      const booking = await bookingService.getBooking(bookingId);
      set({ selectedBooking: booking, isLoading: false });
      return booking;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Create booking
   */
  createBooking: async (bookingData) => {
    set({ isLoading: true, error: null });
    try {
      const booking = await bookingService.createBooking(bookingData);
      set((state) => ({
        bookings: [booking, ...state.bookings],
        isLoading: false,
      }));
      return booking;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Update booking
   */
  updateBooking: async (bookingId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const booking = await bookingService.updateBooking(bookingId, updates);
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === bookingId ? booking : b
        ),
        selectedBooking: state.selectedBooking?.id === bookingId ? booking : state.selectedBooking,
        isLoading: false,
      }));
      return booking;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Cancel booking
   */
  cancelBooking: async (bookingId) => {
    set({ isLoading: true, error: null });
    try {
      const booking = await bookingService.cancelBooking(bookingId);
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b.id === bookingId ? booking : b
        ),
        selectedBooking: state.selectedBooking?.id === bookingId ? booking : state.selectedBooking,
        isLoading: false,
      }));
      return booking;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Sync bookings from Beds24
   */
  syncFromBeds24: async (propertyId, options = {}) => {
    set({ isLoading: true, error: null });
    try {
      const result = await bookingService.syncFromBeds24(propertyId, options);
      // Reload bookings after sync
      await get().loadBookings({ propertyId });
      return result;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Load booking statistics
   */
  loadBookingStats: async (propertyId = null) => {
    set({ isLoading: true, error: null });
    try {
      const stats = await bookingService.getBookingStats(propertyId);
      set({ bookingStats: stats, isLoading: false });
      return stats;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Clear error
   */
  clearError: () => set({ error: null }),

  /**
   * Clear selected booking
   */
  clearSelectedBooking: () => set({ selectedBooking: null }),
}));

export default useBookingStore;
