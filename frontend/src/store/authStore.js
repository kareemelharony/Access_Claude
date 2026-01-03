import { create } from 'zustand';
import authService from '../services/auth.service';
import userService from '../services/user.service';

/**
 * Authentication Store
 * Manages authentication state and actions
 */
const useAuthStore = create((set, get) => ({
  // State
  user: authService.getUser(),
  isAuthenticated: authService.isAuthenticated(),
  permissions: [],
  accessiblePages: [],
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

      // Load permissions after registration
      get().loadPermissions();

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

      // Load permissions after login
      get().loadPermissions();

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
        permissions: [],
        accessiblePages: [],
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // Even if logout fails, clear local state
      set({
        user: null,
        isAuthenticated: false,
        permissions: [],
        accessiblePages: [],
        isLoading: false,
        error: error.message,
      });
    }
  },

  /**
   * Load user permissions
   */
  loadPermissions: async () => {
    try {
      const permissionsData = await userService.getMyPermissions();
      set({
        permissions: permissionsData.permissions || [],
        accessiblePages: permissionsData.pages || [],
      });
    } catch (error) {
      console.error('Failed to load permissions:', error);
      set({
        permissions: [],
        accessiblePages: [],
      });
    }
  },

  /**
   * Load current user
   */
  loadUser: async () => {
    if (!authService.isAuthenticated()) {
      set({ isAuthenticated: false, user: null, permissions: [], accessiblePages: [] });
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

      // Load permissions
      get().loadPermissions();

    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        permissions: [],
        accessiblePages: [],
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

  /**
   * Check if user has permission
   */
  hasPermission: (permission) => {
    const { permissions } = get();
    return permissions.includes(permission);
  },

  /**
   * Check if user can access page
   */
  canAccessPage: (pagePath) => {
    const { accessiblePages } = get();
    return accessiblePages.some(page =>
      pagePath === page || pagePath.startsWith(page + '/')
    );
  },

  /**
   * Check if user has any of the required roles
   */
  hasRole: (...roles) => {
    const { user } = get();
    return user && roles.includes(user.role);
  },
}));

export default useAuthStore;
