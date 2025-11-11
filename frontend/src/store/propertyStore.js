import { create } from 'zustand';
import propertyService from '../services/property.service';

/**
 * Property Store
 * Manages property state and actions
 */
const usePropertyStore = create((set, get) => ({
  // State
  properties: [],
  selectedProperty: null,
  propertyStats: null,
  isLoading: false,
  error: null,

  /**
   * Load all properties
   */
  loadProperties: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const properties = await propertyService.getProperties(filters);
      set({ properties, isLoading: false });
      return properties;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Load single property
   */
  loadProperty: async (propertyId) => {
    set({ isLoading: true, error: null });
    try {
      const property = await propertyService.getProperty(propertyId);
      set({ selectedProperty: property, isLoading: false });
      return property;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Create property
   */
  createProperty: async (propertyData) => {
    set({ isLoading: true, error: null });
    try {
      const property = await propertyService.createProperty(propertyData);
      set((state) => ({
        properties: [property, ...state.properties],
        isLoading: false,
      }));
      return property;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Update property
   */
  updateProperty: async (propertyId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const property = await propertyService.updateProperty(propertyId, updates);
      set((state) => ({
        properties: state.properties.map((p) =>
          p.id === propertyId ? property : p
        ),
        selectedProperty: state.selectedProperty?.id === propertyId ? property : state.selectedProperty,
        isLoading: false,
      }));
      return property;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Delete property
   */
  deleteProperty: async (propertyId) => {
    set({ isLoading: true, error: null });
    try {
      await propertyService.deleteProperty(propertyId);
      set((state) => ({
        properties: state.properties.filter((p) => p.id !== propertyId),
        selectedProperty: state.selectedProperty?.id === propertyId ? null : state.selectedProperty,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Connect property to Beds24
   */
  connectToBeds24: async (propertyId, beds24Data) => {
    set({ isLoading: true, error: null });
    try {
      const property = await propertyService.connectToBeds24(propertyId, beds24Data);
      set((state) => ({
        properties: state.properties.map((p) =>
          p.id === propertyId ? property : p
        ),
        selectedProperty: property,
        isLoading: false,
      }));
      return property;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Sync property from Beds24
   */
  syncFromBeds24: async (propertyId) => {
    set({ isLoading: true, error: null });
    try {
      const property = await propertyService.syncFromBeds24(propertyId);
      set((state) => ({
        properties: state.properties.map((p) =>
          p.id === propertyId ? property : p
        ),
        selectedProperty: property,
        isLoading: false,
      }));
      return property;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * Load property statistics
   */
  loadPropertyStats: async (propertyId) => {
    set({ isLoading: true, error: null });
    try {
      const stats = await propertyService.getPropertyStats(propertyId);
      set({ propertyStats: stats, isLoading: false });
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
   * Clear selected property
   */
  clearSelectedProperty: () => set({ selectedProperty: null }),
}));

export default usePropertyStore;
