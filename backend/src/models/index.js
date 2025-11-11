const { sequelize } = require('../config/database');
const User = require('./User');
const Property = require('./Property');
const Booking = require('./Booking');
const Device = require('./Device');

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
  syncDatabase
};
