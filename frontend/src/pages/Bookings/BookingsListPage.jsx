import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  RefreshCw,
  User,
  Home,
  Mail,
  Phone,
} from 'lucide-react';
import useBookingStore from '../../store/bookingStore';
import usePropertyStore from '../../store/propertyStore';

const BookingsListPage = () => {
  const { t } = useTranslation(['common', 'bookings']);
  const {
    bookings,
    pagination,
    isLoading,
    loadBookings,
    cancelBooking,
  } = useBookingStore();

  const { properties, loadProperties } = usePropertyStore();

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    propertyId: '',
  });

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadBookings(filters);
    loadProperties();
  }, []);

  const handleFilterChange = async (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    try {
      await loadBookings(updatedFilters);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRefresh = async () => {
    try {
      await loadBookings(filters);
      toast.success(t('common:messages.success'));
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCancelBooking = async (bookingId, guestName) => {
    if (window.confirm(`Cancel booking for ${guestName}?`)) {
      try {
        await cancelBooking(bookingId);
        toast.success('Booking cancelled successfully');
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const handlePageChange = (newPage) => {
    handleFilterChange({ page: newPage });
  };

  const getStatusBadge = (status) => {
    const badges = {
      confirmed: 'badge badge-info',
      checked_in: 'badge badge-success',
      checked_out: 'badge',
      cancelled: 'badge badge-error',
    };
    return badges[status] || 'badge';
  };

  const getStatusLabel = (status) => {
    const labels = {
      confirmed: 'Confirmed',
      checked_in: 'Checked In',
      checked_out: 'Checked Out',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  // Filter bookings by search query
  const filteredBookings = bookings.filter((booking) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      booking.guestFirstName?.toLowerCase().includes(query) ||
      booking.guestLastName?.toLowerCase().includes(query) ||
      booking.guestEmail?.toLowerCase().includes(query) ||
      booking.property?.name?.en?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('common:navigation.bookings')}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage all your bookings in one place
              </p>
            </div>
            <Link to="/bookings/create" className="btn btn-primary flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {t('common:actions.create')} Booking
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
                  placeholder="Search by guest name, email, or property..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange({ status: e.target.value, page: 1 })}
              className="input"
            >
              <option value="">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="cancelled">Cancelled</option>
            </select>

            {/* Property Filter */}
            <select
              value={filters.propertyId}
              onChange={(e) => handleFilterChange({ propertyId: e.target.value, page: 1 })}
              className="input"
            >
              <option value="">All Properties</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name?.en}
                </option>
              ))}
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

        {/* Bookings Table */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="spinner h-12 w-12"></div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="card text-center py-12">
            <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No bookings found
            </h3>
            <p className="text-gray-500 mb-6">
              Get started by creating your first booking
            </p>
            <Link to="/bookings/create" className="btn btn-primary inline-flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Booking
            </Link>
          </div>
        ) : (
          <>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Guest
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-in
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-out
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nights
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary-600" />
                            </div>
                            <div className="ms-4">
                              <div className="text-sm font-medium text-gray-900">
                                {booking.guestFirstName} {booking.guestLastName}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {booking.guestEmail}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {booking.property?.name?.en || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.property?.city}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(booking.checkInDate), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(booking.checkOutDate), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking.numberOfNights}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusBadge(booking.status)}>
                            {getStatusLabel(booking.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {booking.totalPrice} {booking.currency}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            to={`/bookings/${booking.id}`}
                            className="text-primary-600 hover:text-primary-900 me-4"
                          >
                            View
                          </Link>
                          {booking.status !== 'cancelled' && booking.status !== 'checked_out' && (
                            <button
                              onClick={() => handleCancelBooking(booking.id, `${booking.guestFirstName} ${booking.guestLastName}`)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="card mt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span> of{' '}
                    <span className="font-medium">{pagination.total}</span> results
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="btn btn-outline"
                    >
                      {t('common:actions.previous')}
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="btn btn-outline"
                    >
                      {t('common:actions.next')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BookingsListPage;
