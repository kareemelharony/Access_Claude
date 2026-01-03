const {
  OperationsData,
  MarketingData,
  SalesData,
  FinancialData,
  User,
  Property,
  Booking
} = require('../models');
const exportService = require('../services/export.service');

/**
 * Get operations data with pagination and filters
 */
const getOperationsData = async (req, res) => {
  try {
    const {
      propertyId,
      status,
      taskType,
      page = 1,
      limit = 20
    } = req.query;

    const where = { userId: req.user.id };
    if (propertyId) where.propertyId = propertyId;
    if (status) where.status = status;
    if (taskType) where.taskType = taskType;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: data } = await OperationsData.findAndCountAll({
      where,
      include: [
        { model: Property, as: 'property', attributes: ['id', 'name'] },
        { model: User, as: 'assignee', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        operations: data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit))
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_OPERATIONS_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Create operations data entry
 */
const createOperationsData = async (req, res) => {
  try {
    const data = await OperationsData.create({
      ...req.body,
      userId: req.user.id
    });

    res.status(201).json({
      success: true,
      data: { operation: data },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_OPERATIONS_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Export operations data
 */
const exportOperationsData = async (req, res) => {
  try {
    const { format = 'csv', ...filters } = req.query;
    filters.userId = req.user.id;

    const result = await exportService.exportOperationsData(filters, format);

    const filename = `operations_export_${new Date().toISOString().split('T')[0]}.${format}`;
    const contentType = format === 'csv' ? 'text/csv' : 'application/json';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(result.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_OPERATIONS_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get marketing data with pagination and filters
 */
const getMarketingData = async (req, res) => {
  try {
    const {
      campaignType,
      status,
      channel,
      page = 1,
      limit = 20
    } = req.query;

    const where = { userId: req.user.id };
    if (campaignType) where.campaignType = campaignType;
    if (status) where.status = status;
    if (channel) where.channel = channel;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: data } = await MarketingData.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        campaigns: data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit))
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_MARKETING_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Create marketing campaign
 */
const createMarketingData = async (req, res) => {
  try {
    const data = await MarketingData.create({
      ...req.body,
      userId: req.user.id
    });

    res.status(201).json({
      success: true,
      data: { campaign: data },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_MARKETING_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Export marketing data
 */
const exportMarketingData = async (req, res) => {
  try {
    const { format = 'csv', ...filters } = req.query;
    filters.userId = req.user.id;

    const result = await exportService.exportMarketingData(filters, format);

    const filename = `marketing_export_${new Date().toISOString().split('T')[0]}.${format}`;
    const contentType = format === 'csv' ? 'text/csv' : 'application/json';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(result.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_MARKETING_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get sales data with pagination and filters
 */
const getSalesData = async (req, res) => {
  try {
    const {
      leadType,
      status,
      stage,
      page = 1,
      limit = 20
    } = req.query;

    const where = { userId: req.user.id };
    if (leadType) where.leadType = leadType;
    if (status) where.status = status;
    if (stage) where.stage = stage;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: data } = await SalesData.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: User, as: 'assignee', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        leads: data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit))
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_SALES_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Create sales lead
 */
const createSalesData = async (req, res) => {
  try {
    const data = await SalesData.create({
      ...req.body,
      userId: req.user.id
    });

    res.status(201).json({
      success: true,
      data: { lead: data },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_SALES_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Export sales data
 */
const exportSalesData = async (req, res) => {
  try {
    const { format = 'csv', ...filters } = req.query;
    filters.userId = req.user.id;

    const result = await exportService.exportSalesData(filters, format);

    const filename = `sales_export_${new Date().toISOString().split('T')[0]}.${format}`;
    const contentType = format === 'csv' ? 'text/csv' : 'application/json';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(result.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_SALES_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get financial data with pagination and filters
 */
const getFinancialData = async (req, res) => {
  try {
    const {
      propertyId,
      bookingId,
      transactionType,
      category,
      status,
      page = 1,
      limit = 20
    } = req.query;

    const where = { userId: req.user.id };
    if (propertyId) where.propertyId = propertyId;
    if (bookingId) where.bookingId = bookingId;
    if (transactionType) where.transactionType = transactionType;
    if (category) where.category = category;
    if (status) where.status = status;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: data } = await FinancialData.findAndCountAll({
      where,
      include: [
        { model: Property, as: 'property', attributes: ['id', 'name'] },
        { model: Booking, as: 'booking', attributes: ['id', 'confirmationCode'] }
      ],
      limit: parseInt(limit),
      offset,
      order: [['transactionDate', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        transactions: data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit))
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FINANCIAL_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Create financial transaction
 */
const createFinancialData = async (req, res) => {
  try {
    const data = await FinancialData.create({
      ...req.body,
      userId: req.user.id
    });

    res.status(201).json({
      success: true,
      data: { transaction: data },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_FINANCIAL_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Export financial data
 */
const exportFinancialData = async (req, res) => {
  try {
    const { format = 'csv', ...filters } = req.query;
    filters.userId = req.user.id;

    const result = await exportService.exportFinancialData(filters, format);

    const filename = `financial_export_${new Date().toISOString().split('T')[0]}.${format}`;
    const contentType = format === 'csv' ? 'text/csv' : 'application/json';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(result.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_FINANCIAL_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getOperationsData,
  createOperationsData,
  exportOperationsData,
  getMarketingData,
  createMarketingData,
  exportMarketingData,
  getSalesData,
  createSalesData,
  exportSalesData,
  getFinancialData,
  createFinancialData,
  exportFinancialData
};
