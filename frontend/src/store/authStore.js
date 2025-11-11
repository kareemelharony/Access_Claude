import { create } from 'zustand';
import authService from '../services/auth.service';

/**
 * Authentication Store
 * Manages authentication state and actions
 */
const useAuthStore = create((set, get) => ({
  // State
  user: authService.getUser(),
  isAuthenticated: authService.isAuthenticated(),
  isLoading: false,
  error: null,

  /**
   * Register new user
   */
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register(userData);
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Login user
   */
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(email, password);
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
      return data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Logout user
   */
  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // Even if logout fails, clear local state
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message,
      });
    }
  },

  /**
   * Load current user
   */
  loadUser: async () => {
    if (!authService.isAuthenticated()) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const user = await authService.getCurrentUser();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message,
      });
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await authService.updateProfile(updates);
      set({
        user: updatedUser,
        isLoading: false,
      });
      return updatedUser;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Change password
   */
  changePassword: async (currentPassword, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      await authService.changePassword(currentPassword, newPassword);
      set({ isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Clear error
   */
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
