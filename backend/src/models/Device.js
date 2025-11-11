const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Device = sequelize.define('devices', {
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
  deviceType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'device_type',
    comment: 'ttlock, tuya_thermostat, tuya_light, tuya_plug, etc.'
  },
  deviceId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'device_id',
    comment: 'External device ID from TTLock or Tuya'
  },
  name: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: '{en: "Main Door Lock", ar: "قفل الباب الرئيسي"}'
  },
  location: {
    type: DataTypes.STRING(100),
    comment: 'Main Entrance, Living Room, etc.'
  },
  category: {
    type: DataTypes.STRING(50),
    comment: 'For Tuya: wk, dj, cz, ms'
  },

  // Device Info
  model: {
    type: DataTypes.STRING(100)
  },
  manufacturer: {
    type: DataTypes.STRING(100)
  },
  firmwareVersion: {
    type: DataTypes.STRING(50),
    field: 'firmware_version'
  },

  // Status
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'online',
    validate: {
      isIn: [['online', 'offline', 'error']]
    }
  },
  batteryLevel: {
    type: DataTypes.INTEGER,
    field: 'battery_level',
    validate: {
      min: 0,
      max: 100
    }
  },
  lastSeenAt: {
    type: DataTypes.DATE,
    field: 'last_seen_at'
  },

  // Metadata
  capabilities: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Device-specific capabilities'
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Device-specific settings'
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
  tableName: 'devices',
  indexes: [
    {
      fields: ['property_id']
    },
    {
      fields: ['device_type']
    },
    {
      fields: ['device_id']
    },
    {
      fields: ['status']
    }
  ]
});

// Instance methods
Device.prototype.isOnline = function() {
  return this.status === 'online';
};

Device.prototype.hasLowBattery = function() {
  return this.batteryLevel !== null && this.batteryLevel < 20;
};

Device.prototype.isTTLock = function() {
  return this.deviceType === 'ttlock';
};

Device.prototype.isTuyaDevice = function() {
  return this.deviceType.startsWith('tuya_');
};

module.exports = Device;
