const { sequelize } = require('../config/database');
const User = require('./User');
const Property = require('./Property');
const Booking = require('./Booking');
const Device = require('./Device');
const Automation = require('./Automation');
const GuestMessage = require('./GuestMessage');
const OperationsData = require('./OperationsData');
const MarketingData = require('./MarketingData');
const SalesData = require('./SalesData');
const FinancialData = require('./FinancialData');

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

// User <-> OperationsData (One-to-Many)
User.hasMany(OperationsData, {
  foreignKey: 'userId',
  as: 'operationsData',
  onDelete: 'CASCADE'
});

OperationsData.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Property <-> OperationsData (One-to-Many)
Property.hasMany(OperationsData, {
  foreignKey: 'propertyId',
  as: 'operationsData',
  onDelete: 'SET NULL'
});

OperationsData.belongsTo(Property, {
  foreignKey: 'propertyId',
  as: 'property'
});

// User (assigned) <-> OperationsData (One-to-Many)
User.hasMany(OperationsData, {
  foreignKey: 'assignedTo',
  as: 'assignedOperationsTasks'
});

OperationsData.belongsTo(User, {
  foreignKey: 'assignedTo',
  as: 'assignee'
});

// User <-> MarketingData (One-to-Many)
User.hasMany(MarketingData, {
  foreignKey: 'userId',
  as: 'marketingData',
  onDelete: 'CASCADE'
});

MarketingData.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User <-> SalesData (One-to-Many)
User.hasMany(SalesData, {
  foreignKey: 'userId',
  as: 'salesData',
  onDelete: 'CASCADE'
});

SalesData.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// User (assigned) <-> SalesData (One-to-Many)
User.hasMany(SalesData, {
  foreignKey: 'assignedTo',
  as: 'assignedSalesLeads'
});

SalesData.belongsTo(User, {
  foreignKey: 'assignedTo',
  as: 'assignee'
});

// User <-> FinancialData (One-to-Many)
User.hasMany(FinancialData, {
  foreignKey: 'userId',
  as: 'financialData',
  onDelete: 'CASCADE'
});

FinancialData.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Property <-> FinancialData (One-to-Many)
Property.hasMany(FinancialData, {
  foreignKey: 'propertyId',
  as: 'financialData',
  onDelete: 'SET NULL'
});

FinancialData.belongsTo(Property, {
  foreignKey: 'propertyId',
  as: 'property'
});

// Booking <-> FinancialData (One-to-Many)
Booking.hasMany(FinancialData, {
  foreignKey: 'bookingId',
  as: 'financialData',
  onDelete: 'SET NULL'
});

FinancialData.belongsTo(Booking, {
  foreignKey: 'bookingId',
  as: 'booking'
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
  OperationsData,
  MarketingData,
  SalesData,
  FinancialData,
  syncDatabase
};
