const { Op } = require('sequelize');
const {
  User,
  Property,
  Booking,
  Device,
  OperationsData,
  MarketingData,
  SalesData,
  FinancialData
} = require('../models');

/**
 * Export Service
 * Handles data export functionality for all department databases
 */

/**
 * Convert data to CSV format
 * @param {Array} data - Array of data objects
 * @param {Array} columns - Column names
 * @returns {string} - CSV string
 */
const convertToCSV = (data, columns) => {
  if (!data || data.length === 0) {
    return '';
  }

  // Get all columns if not specified
  if (!columns || columns.length === 0) {
    const firstRow = data[0];
    columns = Object.keys(firstRow);
  }

  // Create header row
  const header = columns.join(',');

  // Create data rows
  const rows = data.map(row => {
    return columns.map(column => {
      const value = row[column];

      // Handle null/undefined
      if (value === null || value === undefined) {
        return '';
      }

      // Handle objects (stringify)
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }

      // Handle strings with commas or quotes
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    }).join(',');
  });

  return [header, ...rows].join('\n');
};

/**
 * Flatten nested objects for export
 * @param {Object} obj - Object to flatten
 * @param {string} prefix - Prefix for nested keys
 * @returns {Object} - Flattened object
 */
const flattenObject = (obj, prefix = '') => {
  const flattened = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}_${key}` : key;

    if (value === null || value === undefined) {
      flattened[newKey] = value;
    } else if (value instanceof Date) {
      flattened[newKey] = value.toISOString();
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Skip complex objects, just stringify them
      flattened[newKey] = JSON.stringify(value);
    } else if (Array.isArray(value)) {
      flattened[newKey] = JSON.stringify(value);
    } else {
      flattened[newKey] = value;
    }
  }

  return flattened;
};

/**
 * Export operations data
 * @param {Object} filters - Query filters
 * @param {string} format - Export format (csv, json)
 * @returns {Object} - Export data and metadata
 */
const exportOperationsData = async (filters = {}, format = 'csv') => {
  try {
    const where = {};

    // Apply filters
    if (filters.userId) where.userId = filters.userId;
    if (filters.propertyId) where.propertyId = filters.propertyId;
    if (filters.status) where.status = filters.status;
    if (filters.taskType) where.taskType = filters.taskType;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt[Op.gte] = new Date(filters.startDate);
      if (filters.endDate) where.createdAt[Op.lte] = new Date(filters.endDate);
    }

    const data = await OperationsData.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: Property, as: 'property', attributes: ['id', 'name'] },
        { model: User, as: 'assignee', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Flatten data for export
    const flatData = data.map(item => {
      const plain = item.toJSON();
      return flattenObject(plain);
    });

    let exportData;
    if (format === 'csv') {
      exportData = convertToCSV(flatData);
    } else {
      exportData = JSON.stringify(flatData, null, 2);
    }

    return {
      data: exportData,
      format,
      recordCount: flatData.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Operations data export failed: ${error.message}`);
  }
};

/**
 * Export marketing data
 * @param {Object} filters - Query filters
 * @param {string} format - Export format (csv, json)
 * @returns {Object} - Export data and metadata
 */
const exportMarketingData = async (filters = {}, format = 'csv') => {
  try {
    const where = {};

    // Apply filters
    if (filters.userId) where.userId = filters.userId;
    if (filters.campaignType) where.campaignType = filters.campaignType;
    if (filters.status) where.status = filters.status;
    if (filters.channel) where.channel = filters.channel;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt[Op.gte] = new Date(filters.startDate);
      if (filters.endDate) where.createdAt[Op.lte] = new Date(filters.endDate);
    }

    const data = await MarketingData.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Flatten data for export
    const flatData = data.map(item => {
      const plain = item.toJSON();
      return flattenObject(plain);
    });

    let exportData;
    if (format === 'csv') {
      exportData = convertToCSV(flatData);
    } else {
      exportData = JSON.stringify(flatData, null, 2);
    }

    return {
      data: exportData,
      format,
      recordCount: flatData.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Marketing data export failed: ${error.message}`);
  }
};

/**
 * Export sales data
 * @param {Object} filters - Query filters
 * @param {string} format - Export format (csv, json)
 * @returns {Object} - Export data and metadata
 */
const exportSalesData = async (filters = {}, format = 'csv') => {
  try {
    const where = {};

    // Apply filters
    if (filters.userId) where.userId = filters.userId;
    if (filters.leadType) where.leadType = filters.leadType;
    if (filters.status) where.status = filters.status;
    if (filters.stage) where.stage = filters.stage;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt[Op.gte] = new Date(filters.startDate);
      if (filters.endDate) where.createdAt[Op.lte] = new Date(filters.endDate);
    }

    const data = await SalesData.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: User, as: 'assignee', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Flatten data for export
    const flatData = data.map(item => {
      const plain = item.toJSON();
      return flattenObject(plain);
    });

    let exportData;
    if (format === 'csv') {
      exportData = convertToCSV(flatData);
    } else {
      exportData = JSON.stringify(flatData, null, 2);
    }

    return {
      data: exportData,
      format,
      recordCount: flatData.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Sales data export failed: ${error.message}`);
  }
};

/**
 * Export financial data
 * @param {Object} filters - Query filters
 * @param {string} format - Export format (csv, json)
 * @returns {Object} - Export data and metadata
 */
const exportFinancialData = async (filters = {}, format = 'csv') => {
  try {
    const where = {};

    // Apply filters
    if (filters.userId) where.userId = filters.userId;
    if (filters.propertyId) where.propertyId = filters.propertyId;
    if (filters.bookingId) where.bookingId = filters.bookingId;
    if (filters.transactionType) where.transactionType = filters.transactionType;
    if (filters.category) where.category = filters.category;
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.transactionDate = {};
      if (filters.startDate) where.transactionDate[Op.gte] = new Date(filters.startDate);
      if (filters.endDate) where.transactionDate[Op.lte] = new Date(filters.endDate);
    }

    const data = await FinancialData.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: Property, as: 'property', attributes: ['id', 'name'] },
        { model: Booking, as: 'booking', attributes: ['id', 'confirmationCode'] }
      ],
      order: [['transactionDate', 'DESC']]
    });

    // Flatten data for export
    const flatData = data.map(item => {
      const plain = item.toJSON();
      return flattenObject(plain);
    });

    let exportData;
    if (format === 'csv') {
      exportData = convertToCSV(flatData);
    } else {
      exportData = JSON.stringify(flatData, null, 2);
    }

    return {
      data: exportData,
      format,
      recordCount: flatData.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Financial data export failed: ${error.message}`);
  }
};

/**
 * Export all department data (for CEO/admin)
 * @param {Object} filters - Query filters
 * @param {string} format - Export format (csv, json)
 * @returns {Object} - Export data and metadata
 */
const exportAllDepartmentData = async (filters = {}, format = 'csv') => {
  try {
    const [operations, marketing, sales, financial] = await Promise.all([
      exportOperationsData(filters, format),
      exportMarketingData(filters, format),
      exportSalesData(filters, format),
      exportFinancialData(filters, format)
    ]);

    return {
      operations,
      marketing,
      sales,
      financial,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`All department data export failed: ${error.message}`);
  }
};

/**
 * Export users data
 * @param {Object} filters - Query filters
 * @param {string} format - Export format (csv, json)
 * @returns {Object} - Export data and metadata
 */
const exportUsersData = async (filters = {}, format = 'csv') => {
  try {
    const where = {};

    // Apply filters
    if (filters.role) where.role = filters.role;
    if (filters.department) where.department = filters.department;
    if (filters.status) where.status = filters.status;

    const data = await User.findAll({
      where,
      attributes: { exclude: ['passwordHash'] }, // Never export passwords
      order: [['createdAt', 'DESC']]
    });

    // Flatten data for export
    const flatData = data.map(item => {
      const plain = item.toJSON();
      return flattenObject(plain);
    });

    let exportData;
    if (format === 'csv') {
      exportData = convertToCSV(flatData);
    } else {
      exportData = JSON.stringify(flatData, null, 2);
    }

    return {
      data: exportData,
      format,
      recordCount: flatData.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Users data export failed: ${error.message}`);
  }
};

module.exports = {
  exportOperationsData,
  exportMarketingData,
  exportSalesData,
  exportFinancialData,
  exportAllDepartmentData,
  exportUsersData,
  convertToCSV,
  flattenObject
};
