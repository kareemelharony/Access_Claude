import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Calendar,
  DoorOpen,
  DoorClosed,
  Plus,
  Settings,
  AlertCircle,
} from 'lucide-react';
import usePropertyStore from '../../store/propertyStore';
import useBookingStore from '../../store/bookingStore';
import useDeviceStore from '../../store/deviceStore';

const DashboardPage = () => {
  const { t } = useTranslation(['common', 'dashboard']);
  const { properties, loadProperties } = usePropertyStore();
  const { bookingStats, loadBookingStats } = useBookingStore();
  const { deviceStats, loadDeviceStats } = useDeviceStore();

  useEffect(() => {
    loadProperties();
    loadBookingStats();
    loadDeviceStats();
  }, [loadProperties, loadBookingStats, loadDeviceStats]);

  const stats = [
    {
      name: 'Total Properties',
      value: properties.length,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/properties',
    },
    {
      name: 'Total Bookings',
      value: bookingStats?.totalBookings || 0,
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      link: '/bookings',
    },
    {
      name: 'Smart Devices',
      value: deviceStats?.total || 0,
      icon: Settings,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      link: '/devices',
    },
    {
      name: 'Device Alerts',
      value: (deviceStats?.byStatus?.offline || 0) + (deviceStats?.lowBattery || 0),
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      link: '/devices?status=offline',
    },
  ];

  const upcomingStats = [
    {
      name: 'Check-ins Today',
      value: bookingStats?.checkInsToday || 0,
      icon: DoorOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      link: '/bookings?status=confirmed',
    },
    {
      name: 'Check-outs Today',
      value: bookingStats?.checkOutsToday || 0,
      icon: DoorClosed,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      link: '/bookings?status=checked_in',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('common:navigation.dashboard')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's what's happening today.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.name}
                to={stat.link}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center">
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ms-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Upcoming Events */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {upcomingStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.name}
                to={stat.link}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center">
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ms-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/properties/create"
              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <Plus className="h-8 w-8 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">Add Property</p>
                <p className="text-sm text-gray-500">Create a new property</p>
              </div>
            </Link>

            <Link
              to="/bookings/create"
              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <Plus className="h-8 w-8 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">Create Booking</p>
                <p className="text-sm text-gray-500">Add a new booking</p>
              </div>
            </Link>

            <Link
              to="/devices"
              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <Plus className="h-8 w-8 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">Add Device</p>
                <p className="text-sm text-gray-500">Connect smart devices</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Properties */}
        {properties.length > 0 && (
          <div className="card mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Your Properties
              </h2>
              <Link to="/properties" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.slice(0, 3).map((property) => (
                <Link
                  key={property.id}
                  to={`/properties/${property.id}`}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900">
                      {property.name?.en || 'Unnamed Property'}
                    </h3>
                    <span className={`badge ${
                      property.status === 'active' ? 'badge-success' : 'badge'
                    }`}>
                      {property.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    {property.city}, {property.country}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>{property.type}</span>
                    {property.bedrooms && <span>• {property.bedrooms} beds</span>}
                    {property.maxGuests && <span>• {property.maxGuests} guests</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Getting Started Guide */}
        {properties.length === 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Getting Started
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Create Your First Property</h3>
                  <p className="text-sm text-gray-600">
                    Add your property details including location, amenities, and pricing.
                  </p>
                  <Link to="/properties/create" className="text-sm text-primary-600 hover:text-primary-700 mt-2 inline-block">
                    Add Property →
                  </Link>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Connect to Beds24</h3>
                  <p className="text-sm text-gray-600">
                    Sync your bookings from Airbnb, Booking.com, and other channels.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Add Smart Devices</h3>
                  <p className="text-sm text-gray-600">
                    Connect TTLock smart locks and Tuya smart home devices.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">4</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Automate Guest Experience</h3>
                  <p className="text-sm text-gray-600">
                    Set up automated access codes, welcome messages, and check-out reminders.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
