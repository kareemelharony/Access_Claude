const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Booking = sequelize.define('bookings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  propertyId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'property_id',
    references: {
      model: 'properties',
      key: 'id'
    }
  },

  // External IDs
  beds24BookingId: {
    type: DataTypes.STRING(100),
    unique: true,
    field: 'beds24_booking_id'
  },

  // Guest Information
  guestFirstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'guest_first_name'
  },
  guestLastName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'guest_last_name'
  },
  guestEmail: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'guest_email',
    validate: {
      isEmail: true
    }
  },
  guestPhone: {
    type: DataTypes.STRING(20),
    field: 'guest_phone'
  },
  guestCountry: {
    type: DataTypes.STRING(100),
    field: 'guest_country'
  },
  guestLanguage: {
    type: DataTypes.STRING(5),
    defaultValue: 'en',
    field: 'guest_language',
    validate: {
      isIn: [['en', 'ar']]
    }
  },

  // Booking Details
  checkInDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'check_in_date'
  },
  checkInTime: {
    type: DataTypes.TIME,
    defaultValue: '15:00:00',
    field: 'check_in_time'
  },
  checkOutDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'check_out_date'
  },
  checkOutTime: {
    type: DataTypes.TIME,
    defaultValue: '11:00:00',
    field: 'check_out_time'
  },
  numberOfNights: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'number_of_nights'
  },
  numberOfAdults: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'number_of_adults'
  },
  numberOfChildren: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'number_of_children'
  },

  // Pricing
  nightlyRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'nightly_rate'
  },
  totalNightsCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_nights_cost'
  },
  cleaningFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'cleaning_fee'
  },
  serviceFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'service_fee'
  },
  taxAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'tax_amount'
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_price'
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'SAR'
  },

  // Status
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'confirmed',
    validate: {
      isIn: [['confirmed', 'checked_in', 'checked_out', 'cancelled']]
    }
  },
  bookingSource: {
    type: DataTypes.STRING(50),
    field: 'booking_source',
    comment: 'airbnb, booking.com, direct'
  },
  paymentStatus: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending',
    field: 'payment_status',
    validate: {
      isIn: [['pending', 'paid', 'refunded']]
    }
  },

  // Special Requests
  specialRequests: {
    type: DataTypes.TEXT,
    field: 'special_requests'
  },
  internalNotes: {
    type: DataTypes.TEXT,
    field: 'internal_notes'
  },

  // Timestamps
  bookedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'booked_at'
  },
  checkedInAt: {
    type: DataTypes.DATE,
    field: 'checked_in_at'
  },
  checkedOutAt: {
    type: DataTypes.DATE,
    field: 'checked_out_at'
  },
  cancelledAt: {
    type: DataTypes.DATE,
    field: 'cancelled_at'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  timestamps: true,
  underscored: true,
  tableName: 'bookings',
  indexes: [
    {
      fields: ['property_id']
    },
    {
      fields: ['check_in_date', 'check_out_date']
    },
    {
      fields: ['status']
    },
    {
      fields: ['guest_email']
    },
    {
      unique: true,
      fields: ['beds24_booking_id']
    }
  ]
});

// Instance methods
Booking.prototype.getGuestFullName = function() {
  return `${this.guestFirstName} ${this.guestLastName}`;
};

Booking.prototype.isActive = function() {
  return this.status === 'confirmed' || this.status === 'checked_in';
};

Booking.prototype.isPast = function() {
  return new Date(this.checkOutDate) < new Date();
};

module.exports = Booking;
