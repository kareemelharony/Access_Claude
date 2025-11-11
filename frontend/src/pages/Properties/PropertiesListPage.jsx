import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
  Building2,
  Home,
  MapPin,
  Plus,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import usePropertyStore from '../../store/propertyStore';

const PropertiesListPage = () => {
  const { t } = useTranslation(['common', 'properties']);
  const {
    properties,
    isLoading,
    loadProperties,
    deleteProperty,
  } = usePropertyStore();

  const [filters, setFilters] = useState({
    status: '',
    city: '',
    type: '',
  });

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProperties(filters);
  }, [loadProperties]);

  const handleRefresh = async () => {
    try {
      await loadProperties(filters);
      toast.success(t('common:messages.success'));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (propertyId, propertyName) => {
    if (window.confirm(t('common:messages.confirm_delete'))) {
      try {
        await deleteProperty(propertyId);
        toast.success(`Property ${propertyName.en} deleted successfully`);
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  // Filter properties by search query
  const filteredProperties = properties.filter((property) => {
    const nameMatch = property.name?.en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     property.name?.ar?.includes(searchQuery);
    const cityMatch = property.city?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || cityMatch;
  });

  const getPropertyIcon = (type) => {
    switch (type) {
      case 'villa':
        return <Home className="h-6 w-6" />;
      case 'apartment':
      case 'studio':
        return <Building2 className="h-6 w-6" />;
      default:
        return <Home className="h-6 w-6" />;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'badge badge-success',
      inactive: 'badge badge-error',
      maintenance: 'badge badge-warning',
    };
    return badges[status] || 'badge';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('common:navigation.properties')}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your properties and sync with Beds24
              </p>
            </div>
            <Link to="/properties/create" className="btn btn-primary flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {t('common:actions.create')} Property
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                loadProperties({ ...filters, status: e.target.value });
              }}
              className="input"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
            </select>

            {/* Type Filter */}
            <select
              value={filters.type}
              onChange={(e) => {
                setFilters({ ...filters, type: e.target.value });
                loadProperties({ ...filters, type: e.target.value });
              }}
              className="input"
            >
              <option value="">All Types</option>
              <option value="villa">Villa</option>
              <option value="apartment">Apartment</option>
              <option value="studio">Studio</option>
              <option value="room">Room</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="btn btn-outline flex items-center gap-2"
              disabled={isLoading}
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              {t('common:actions.refresh')}
            </button>
          </div>
        </div>

        {/* Properties Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="spinner h-12 w-12"></div>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="card text-center py-12">
            <Home className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No properties found
            </h3>
            <p className="text-gray-500 mb-6">
              Get started by creating your first property
            </p>
            <Link to="/properties/create" className="btn btn-primary inline-flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Property
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <div key={property.id} className="card hover:shadow-lg transition-shadow">
                {/* Property Image */}
                <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200 rounded-t-lg -mx-6 -mt-6 mb-4">
                  {property.images && property.images[0] ? (
                    <img
                      src={property.images[0].url}
                      alt={property.name.en}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      {getPropertyIcon(property.type)}
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <span className={getStatusBadge(property.status)}>
                      {property.status}
                    </span>
                  </div>
                </div>

                {/* Property Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {property.name?.en || 'Unnamed Property'}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 me-1" />
                      {property.city}, {property.country}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{property.type}</span>
                    {property.bedrooms && <span>• {property.bedrooms} beds</span>}
                    {property.maxGuests && <span>• {property.maxGuests} guests</span>}
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {property.beds24SyncEnabled && (
                      <span className="badge badge-info text-xs">
                        Beds24
                      </span>
                    )}
                    {property.tuyaSyncEnabled && (
                      <span className="badge badge-success text-xs">
                        Tuya
                      </span>
                    )}
                    {property.ttlockEnabled && (
                      <span className="badge badge-success text-xs">
                        TTLock
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Link
                      to={`/properties/${property.id}`}
                      className="btn btn-outline flex-1 text-sm"
                    >
                      {t('common:actions.view')}
                    </Link>
                    <Link
                      to={`/properties/${property.id}/edit`}
                      className="btn btn-outline flex-1 text-sm"
                    >
                      {t('common:actions.edit')}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesListPage;
