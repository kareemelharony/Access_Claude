const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Property = sequelize.define('properties', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'owner_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: '{en: "Villa Name", ar: "اسم الفيلا"}'
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['villa', 'apartment', 'studio', 'room']]
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  country: {
    type: DataTypes.STRING(100),
    defaultValue: 'Saudi Arabia'
  },
  postalCode: {
    type: DataTypes.STRING(20),
    field: 'postal_code'
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8)
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8)
  },
  description: {
    type: DataTypes.JSONB,
    comment: '{en: "...", ar: "..."}'
  },
  images: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: '[{url: "...", caption: {...}, order: 1}]'
  },
  amenities: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: '["wifi", "parking", "pool"]'
  },
  bedrooms: {
    type: DataTypes.INTEGER
  },
  bathrooms: {
    type: DataTypes.INTEGER
  },
  maxGuests: {
    type: DataTypes.INTEGER,
    field: 'max_guests'
  },
  areaSqm: {
    type: DataTypes.INTEGER,
    field: 'area_sqm'
  },

  // Beds24 Integration
  beds24PropertyId: {
    type: DataTypes.STRING(100),
    field: 'beds24_property_id'
  },
  beds24RoomIds: {
    type: DataTypes.JSONB,
    field: 'beds24_room_ids',
    defaultValue: []
  },
  beds24RefreshToken: {
    type: DataTypes.TEXT,
    field: 'beds24_refresh_token',
    comment: 'Encrypted Beds24 OAuth refresh token'
  },
  beds24SyncEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'beds24_sync_enabled'
  },

  // Tuya Integration
  tuyaHomeId: {
    type: DataTypes.STRING(100),
    field: 'tuya_home_id'
  },
  tuyaUserId: {
    type: DataTypes.STRING(100),
    field: 'tuya_user_id'
  },
  tuyaSyncEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'tuya_sync_enabled'
  },

  // TTLock Integration
  ttlockUserId: {
    type: DataTypes.STRING(100),
    field: 'ttlock_user_id'
  },
  ttlockAccessToken: {
    type: DataTypes.TEXT,
    field: 'ttlock_access_token',
    comment: 'TTLock OAuth access token'
  },
  ttlockRefreshToken: {
    type: DataTypes.TEXT,
    field: 'ttlock_refresh_token',
    comment: 'Encrypted TTLock refresh token'
  },
  ttlockEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'ttlock_enabled'
  },

  // Operational Settings
  checkInTime: {
    type: DataTypes.TIME,
    defaultValue: '15:00:00',
    field: 'check_in_time'
  },
  checkOutTime: {
    type: DataTypes.TIME,
    defaultValue: '11:00:00',
    field: 'check_out_time'
  },
  minStayNights: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'min_stay_nights'
  },
  maxStayNights: {
    type: DataTypes.INTEGER,
    field: 'max_stay_nights'
  },
  instantBooking: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'instant_booking'
  },

  // Financial Settings
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'SAR'
  },
  cleaningFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'cleaning_fee'
  },
  taxRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 15.00,
    field: 'tax_rate',
    comment: 'VAT 15%'
  },

  // Status
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'inactive', 'maintenance']]
    }
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
  },
  deletedAt: {
    type: DataTypes.DATE,
    field: 'deleted_at'
  }
}, {
  timestamps: true,
  paranoid: true,
  underscored: true,
  tableName: 'properties',
  indexes: [
    {
      fields: ['owner_id']
    },
    {
      fields: ['city']
    },
    {
      fields: ['beds24_property_id']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = Property;
