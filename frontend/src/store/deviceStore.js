import { create } from 'zustand';
import deviceService from '../services/device.service';
import { toast } from 'react-toastify';

/**
 * Device Store
 * Manages device state using Zustand
 */
const useDeviceStore = create((set, get) => ({
  // State
  devices: [],
  selectedDevice: null,
  deviceStats: null,
  loading: false,
  error: null,

  /**
   * Load devices
   */
  loadDevices: async (filters = {}) => {
    set({ loading: true, error: null });

    try {
      const devices = await deviceService.getDevices(filters);
      set({ devices, loading: false });
      return devices;
    } catch (error) {
      set({
        error: error.response?.data?.error?.message || 'Failed to load devices',
        loading: false
      });
      toast.error(error.response?.data?.error?.message || 'Failed to load devices');
      throw error;
    }
  },

  /**
   * Load device by ID
   */
  loadDevice: async (deviceId) => {
    set({ loading: true, error: null });

    try {
      const device = await deviceService.getDevice(deviceId);
      set({ selectedDevice: device, loading: false });
      return device;
    } catch (error) {
      set({
        error: error.response?.data?.error?.message || 'Failed to load device',
        loading: false
      });
      toast.error(error.response?.data?.error?.message || 'Failed to load device');
      throw error;
    }
  },

  /**
   * Create device
   */
  createDevice: async (deviceData) => {
    set({ loading: true, error: null });

    try {
      const device = await deviceService.createDevice(deviceData);
      set((state) => ({
        devices: [...state.devices, device],
        loading: false
      }));
      toast.success('Device added successfully');
      return device;
    } catch (error) {
      set({
        error: error.response?.data?.error?.message || 'Failed to create device',
        loading: false
      });
      toast.error(error.response?.data?.error?.message || 'Failed to create device');
      throw error;
    }
  },

  /**
   * Update device
   */
  updateDevice: async (deviceId, updates) => {
    set({ loading: true, error: null });

    try {
      const device = await deviceService.updateDevice(deviceId, updates);
      set((state) => ({
        devices: state.devices.map((d) => (d.id === deviceId ? device : d)),
        selectedDevice: state.selectedDevice?.id === deviceId ? device : state.selectedDevice,
        loading: false
      }));
      toast.success('Device updated successfully');
      return device;
    } catch (error) {
      set({
        error: error.response?.data?.error?.message || 'Failed to update device',
        loading: false
      });
      toast.error(error.response?.data?.error?.message || 'Failed to update device');
      throw error;
    }
  },

  /**
   * Delete device
   */
  deleteDevice: async (deviceId) => {
    set({ loading: true, error: null });

    try {
      await deviceService.deleteDevice(deviceId);
      set((state) => ({
        devices: state.devices.filter((d) => d.id !== deviceId),
        selectedDevice: state.selectedDevice?.id === deviceId ? null : state.selectedDevice,
        loading: false
      }));
      toast.success('Device deleted successfully');
    } catch (error) {
      set({
        error: error.response?.data?.error?.message || 'Failed to delete device',
        loading: false
      });
      toast.error(error.response?.data?.error?.message || 'Failed to delete device');
      throw error;
    }
  },

  /**
   * Get device status
   */
  getDeviceStatus: async (deviceId) => {
    try {
      const status = await deviceService.getDeviceStatus(deviceId);
      return status;
    } catch (error) {
      toast.error('Failed to get device status');
      throw error;
    }
  },

  /**
   * Control device
   */
  controlDevice: async (deviceId, command) => {
    set({ loading: true, error: null });

    try {
      const result = await deviceService.controlDevice(deviceId, command);
      set({ loading: false });
      toast.success('Command sent successfully');
      return result;
    } catch (error) {
      set({
        error: error.response?.data?.error?.message || 'Failed to control device',
        loading: false
      });
      toast.error(error.response?.data?.error?.message || 'Failed to control device');
      throw error;
    }
  },

  /**
   * Sync TTLock devices
   */
  syncTTLockDevices: async (propertyId) => {
    set({ loading: true, error: null });

    try {
      const result = await deviceService.syncTTLockDevices(propertyId);
      toast.success(`TTLock sync complete: ${result.created} created, ${result.updated} updated`);

      // Reload devices
      await get().loadDevices({ propertyId });

      set({ loading: false });
      return result;
    } catch (error) {
      set({
        error: error.response?.data?.error?.message || 'Failed to sync TTLock devices',
        loading: false
      });
      toast.error(error.response?.data?.error?.message || 'Failed to sync TTLock devices');
      throw error;
    }
  },

  /**
   * Sync Tuya devices
   */
  syncTuyaDevices: async (propertyId) => {
    set({ loading: true, error: null });

    try {
      const result = await deviceService.syncTuyaDevices(propertyId);
      toast.success(`Tuya sync complete: ${result.created} created, ${result.updated} updated`);

      // Reload devices
      await get().loadDevices({ propertyId });

      set({ loading: false });
      return result;
    } catch (error) {
      set({
        error: error.response?.data?.error?.message || 'Failed to sync Tuya devices',
        loading: false
      });
      toast.error(error.response?.data?.error?.message || 'Failed to sync Tuya devices');
      throw error;
    }
  },

  /**
   * Connect TTLock
   */
  connectTTLock: async (code, propertyId) => {
    set({ loading: true, error: null });

    try {
      const result = await deviceService.connectTTLock(code, propertyId);
      set({ loading: false });
      toast.success('TTLock connected successfully');
      return result;
    } catch (error) {
      set({
        error: error.response?.data?.error?.message || 'Failed to connect TTLock',
        loading: false
      });
      toast.error(error.response?.data?.error?.message || 'Failed to connect TTLock');
      throw error;
    }
  },

  /**
   * Connect Tuya home
   */
  connectTuyaHome: async (propertyId, homeId) => {
    set({ loading: true, error: null });

    try {
      const result = await deviceService.connectTuyaHome(propertyId, homeId);
      set({ loading: false });
      toast.success('Tuya home connected successfully');
      return result;
    } catch (error) {
      set({
        error: error.response?.data?.error?.message || 'Failed to connect Tuya home',
        loading: false
      });
      toast.error(error.response?.data?.error?.message || 'Failed to connect Tuya home');
      throw error;
    }
  },

  /**
   * Load device statistics
   */
  loadDeviceStats: async () => {
    try {
      const stats = await deviceService.getDeviceStats();
      set({ deviceStats: stats });
      return stats;
    } catch (error) {
      console.error('Failed to load device stats:', error);
      throw error;
    }
  },

  /**
   * Generate passcode
   */
  generatePasscode: async (deviceId, passcodeData) => {
    set({ loading: true, error: null });

    try {
      const result = await deviceService.generatePasscode(deviceId, passcodeData);
      set({ loading: false });
      toast.success('Passcode generated successfully');
      return result;
    } catch (error) {
      set({
        error: error.response?.data?.error?.message || 'Failed to generate passcode',
        loading: false
      });
      toast.error(error.response?.data?.error?.message || 'Failed to generate passcode');
      throw error;
    }
  },

  /**
   * List passcodes
   */
  listPasscodes: async (deviceId) => {
    try {
      const passcodes = await deviceService.listPasscodes(deviceId);
      return passcodes;
    } catch (error) {
      toast.error('Failed to load passcodes');
      throw error;
    }
  },

  /**
   * Delete passcode
   */
  deletePasscode: async (deviceId, passcodeId) => {
    set({ loading: true, error: null });

    try {
      await deviceService.deletePasscode(deviceId, passcodeId);
      set({ loading: false });
      toast.success('Passcode deleted successfully');
    } catch (error) {
      set({
        error: error.response?.data?.error?.message || 'Failed to delete passcode',
        loading: false
      });
      toast.error(error.response?.data?.error?.message || 'Failed to delete passcode');
      throw error;
    }
  },

  /**
   * Toggle device
   */
  toggleDevice: async (deviceId, turnOn) => {
    return get().controlDevice(deviceId, { action: 'toggle', turnOn });
  },

  /**
   * Set temperature
   */
  setTemperature: async (deviceId, temperature) => {
    return get().controlDevice(deviceId, { action: 'set_temperature', temperature });
  },

  /**
   * Set brightness
   */
  setBrightness: async (deviceId, brightness) => {
    return get().controlDevice(deviceId, { action: 'set_brightness', brightness });
  },

  /**
   * Lock device
   */
  lockDevice: async (deviceId) => {
    return get().controlDevice(deviceId, { action: 'lock' });
  },

  /**
   * Unlock device
   */
  unlockDevice: async (deviceId) => {
    return get().controlDevice(deviceId, { action: 'unlock' });
  },

  /**
   * Clear error
   */
  clearError: () => set({ error: null }),

  /**
   * Select device
   */
  selectDevice: (device) => set({ selectedDevice: device }),

  /**
   * Clear selected device
   */
  clearSelectedDevice: () => set({ selectedDevice: null })
}));

export default useDeviceStore;
