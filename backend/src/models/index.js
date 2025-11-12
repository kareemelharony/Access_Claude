const { sequelize } = require('../config/database');
const User = require('./User');
const Property = require('./Property');
const Booking = require('./Booking');
const Device = require('./Device');
const Automation = require('./Automation');
const GuestMessage = require('./GuestMessage');

/**
 * Define model associations
 */

// User <-> Property (One-to-Many)
User.hasMany(Property, {
  foreignKey: 'ownerId',
  as: 'properties',
  onDelete: 'CASCADE'
});

Property.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner'
});

// Property <-> Booking (One-to-Many)
Property.hasMany(Booking, {
  foreignKey: 'propertyId',
  as: 'bookings',
  onDelete: 'CASCADE'
});

Booking.belongsTo(Property, {
  foreignKey: 'propertyId',
  as: 'property'
});

// Property <-> Device (One-to-Many)
Property.hasMany(Device, {
  foreignKey: 'propertyId',
  as: 'devices',
  onDelete: 'CASCADE'
});

Device.belongsTo(Property, {
  foreignKey: 'propertyId',
  as: 'property'
});

// User <-> Automation (One-to-Many)
User.hasMany(Automation, {
  foreignKey: 'ownerId',
  as: 'automations',
  onDelete: 'CASCADE'
});

Automation.belongsTo(User, {
  foreignKey: 'ownerId',
  as: 'owner'
});

// Property <-> Automation (One-to-Many, optional)
Property.hasMany(Automation, {
  foreignKey: 'propertyId',
  as: 'automations',
  onDelete: 'CASCADE'
});

Automation.belongsTo(Property, {
  foreignKey: 'propertyId',
  as: 'property'
});

// Booking <-> GuestMessage (One-to-Many)
Booking.hasMany(GuestMessage, {
  foreignKey: 'bookingId',
  as: 'messages',
  onDelete: 'CASCADE'
});

GuestMessage.belongsTo(Booking, {
  foreignKey: 'bookingId',
  as: 'booking'
});

// Automation <-> GuestMessage (One-to-Many, optional)
Automation.hasMany(GuestMessage, {
  foreignKey: 'automationId',
  as: 'messages'
});

GuestMessage.belongsTo(Automation, {
  foreignKey: 'automationId',
  as: 'automation'
});

/**
 * Sync database (only use in development)
 */
const syncDatabase = async (options = {}) => {
  try {
    await sequelize.sync(options);
    console.log('✅ Database synchronized');
  } catch (error) {
    console.error('❌ Database sync error:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Property,
  Booking,
  Device,
  Automation,
  GuestMessage,
  syncDatabase
};
