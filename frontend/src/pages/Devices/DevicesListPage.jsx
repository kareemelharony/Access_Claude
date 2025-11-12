import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Lock,
  Lightbulb,
  Thermometer,
  Plug,
  Sensor,
  Plus,
  RefreshCw,
  Power,
  Battery,
  BatteryLow,
  WifiOff,
  Wifi,
  Trash2,
  Settings
} from 'lucide-react';
import useDeviceStore from '../../store/deviceStore';
import usePropertyStore from '../../store/propertyStore';

const DevicesListPage = () => {
  const { t } = useTranslation(['common', 'devices']);
  const {
    devices,
    loading,
    loadDevices,
    deleteDevice,
    toggleDevice,
    syncTTLockDevices,
    syncTuyaDevices
  } = useDeviceStore();
  const { properties, loadProperties } = usePropertyStore();

  const [selectedProperty, setSelectedProperty] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [syncing, setSyncing] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  useEffect(() => {
    loadDevices();
    loadProperties();
  }, [loadDevices, loadProperties]);

  const handleSync = async (platform) => {
    if (!selectedProperty || selectedProperty === 'all') {
      alert('Please select a property first');
      return;
    }

    setSyncing(true);
    try {
      if (platform === 'ttlock') {
        await syncTTLockDevices(selectedProperty);
      } else if (platform === 'tuya') {
        await syncTuyaDevices(selectedProperty);
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleToggle = async (device) => {
    try {
      // Assume device is currently on if status is 'online'
      await toggleDevice(device.id, false);
      // Reload devices to get updated status
      await loadDevices();
    } catch (error) {
      console.error('Toggle error:', error);
    }
  };

  const handleDelete = async (deviceId) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      try {
        await deleteDevice(deviceId);
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const getDeviceIcon = (deviceType) => {
    const iconMap = {
      'ttlock': Lock,
      'tuya_light': Lightbulb,
      'tuya_thermostat': Thermometer,
      'tuya_plug': Plug,
      'tuya_sensor': Sensor,
      'tuya_switch': Power
    };

    const Icon = iconMap[deviceType] || Settings;
    return Icon;
  };

  const getDeviceColor = (deviceType) => {
    const colorMap = {
      'ttlock': 'text-blue-600 bg-blue-100',
      'tuya_light': 'text-yellow-600 bg-yellow-100',
      'tuya_thermostat': 'text-orange-600 bg-orange-100',
      'tuya_plug': 'text-green-600 bg-green-100',
      'tuya_sensor': 'text-purple-600 bg-purple-100',
      'tuya_switch': 'text-indigo-600 bg-indigo-100'
    };

    return colorMap[deviceType] || 'text-gray-600 bg-gray-100';
  };

  const getStatusBadge = (device) => {
    if (device.status === 'online') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Wifi className="w-3 h-3" />
          Online
        </span>
      );
    } else if (device.status === 'offline') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <WifiOff className="w-3 h-3" />
          Offline
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Error
        </span>
      );
    }
  };

  const getBatteryIcon = (level) => {
    if (!level) return null;

    if (level < 20) {
      return <BatteryLow className="w-4 h-4 text-red-600" />;
    }

    return <Battery className="w-4 h-4 text-green-600" />;
  };

  // Filter devices
  const filteredDevices = devices.filter((device) => {
    if (selectedProperty !== 'all' && device.propertyId !== selectedProperty) {
      return false;
    }

    if (selectedType !== 'all' && device.deviceType !== selectedType) {
      return false;
    }

    if (selectedStatus !== 'all' && device.status !== selectedStatus) {
      return false;
    }

    return true;
  });

  // Get unique device types
  const deviceTypes = [...new Set(devices.map(d => d.deviceType))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('common:navigation.devices')}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your smart locks and devices
              </p>
            </div>
            <button
              onClick={() => setShowConnectModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Connect Device
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Property filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property
              </label>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="input"
              >
                <option value="all">All Properties</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name?.en || 'Unnamed Property'}
                  </option>
                ))}
              </select>
            </div>

            {/* Type filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Device Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="input"
              >
                <option value="all">All Types</option>
                {deviceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input"
              >
                <option value="all">All Status</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="error">Error</option>
              </select>
            </div>

            {/* Sync buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sync Devices
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSync('ttlock')}
                  disabled={syncing || selectedProperty === 'all'}
                  className="flex-1 btn btn-secondary text-xs flex items-center justify-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                  TTLock
                </button>
                <button
                  onClick={() => handleSync('tuya')}
                  disabled={syncing || selectedProperty === 'all'}
                  className="flex-1 btn btn-secondary text-xs flex items-center justify-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                  Tuya
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Devices Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Settings className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No devices found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Connect your first device to get started
            </p>
            <button
              onClick={() => setShowConnectModal(true)}
              className="mt-4 btn btn-primary"
            >
              Connect Device
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDevices.map((device) => {
              const Icon = getDeviceIcon(device.deviceType);
              const colorClass = getDeviceColor(device.deviceType);

              return (
                <div key={device.id} className="card hover:shadow-lg transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${colorClass}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {device.name?.en || 'Unnamed Device'}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {device.location || 'No location'}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(device)}
                  </div>

                  {/* Device Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium text-gray-900">
                        {device.deviceType.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    {device.manufacturer && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Brand:</span>
                        <span className="font-medium text-gray-900">{device.manufacturer}</span>
                      </div>
                    )}
                    {device.batteryLevel !== null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Battery:</span>
                        <span className="flex items-center gap-1 font-medium text-gray-900">
                          {getBatteryIcon(device.batteryLevel)}
                          {device.batteryLevel}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    {device.isTuyaDevice && device.status === 'online' && (
                      <button
                        onClick={() => handleToggle(device)}
                        className="flex-1 btn btn-secondary text-sm flex items-center justify-center gap-1"
                      >
                        <Power className="w-4 h-4" />
                        Toggle
                      </button>
                    )}
                    {device.isTTLock && device.status === 'online' && (
                      <Link
                        to={`/devices/${device.id}`}
                        className="flex-1 btn btn-secondary text-sm text-center"
                      >
                        Passcodes
                      </Link>
                    )}
                    <button
                      onClick={() => handleDelete(device.id)}
                      className="btn btn-secondary text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Connect Device Modal - Placeholder */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Connect Device</h2>
            <p className="text-gray-600 mb-6">
              Device connection modal will be implemented in the next step.
            </p>
            <button
              onClick={() => setShowConnectModal(false)}
              className="btn btn-primary w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevicesListPage;
