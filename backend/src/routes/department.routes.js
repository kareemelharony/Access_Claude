const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

// All routes require authentication
router.use(authenticate);

// ==================== OPERATIONS ROUTES ====================

/**
 * GET /api/departments/operations
 * Get operations data
 */
router.get(
  '/operations',
  requirePermission(PERMISSIONS.OPERATIONS_VIEW),
  departmentController.getOperationsData
);

/**
 * POST /api/departments/operations
 * Create operations task
 */
router.post(
  '/operations',
  requirePermission(PERMISSIONS.OPERATIONS_TASKS),
  departmentController.createOperationsData
);

/**
 * GET /api/departments/operations/export
 * Export operations data
 */
router.get(
  '/operations/export',
  requirePermission(PERMISSIONS.OPERATIONS_EXPORT),
  departmentController.exportOperationsData
);

// ==================== MARKETING ROUTES ====================

/**
 * GET /api/departments/marketing
 * Get marketing campaigns
 */
router.get(
  '/marketing',
  requirePermission(PERMISSIONS.MARKETING_VIEW),
  departmentController.getMarketingData
);

/**
 * POST /api/departments/marketing
 * Create marketing campaign
 */
router.post(
  '/marketing',
  requirePermission(PERMISSIONS.MARKETING_CAMPAIGNS),
  departmentController.createMarketingData
);

/**
 * GET /api/departments/marketing/export
 * Export marketing data
 */
router.get(
  '/marketing/export',
  requirePermission(PERMISSIONS.MARKETING_EXPORT),
  departmentController.exportMarketingData
);

// ==================== SALES ROUTES ====================

/**
 * GET /api/departments/sales
 * Get sales leads
 */
router.get(
  '/sales',
  requirePermission(PERMISSIONS.SALES_VIEW),
  departmentController.getSalesData
);

/**
 * POST /api/departments/sales
 * Create sales lead
 */
router.post(
  '/sales',
  requirePermission(PERMISSIONS.SALES_LEADS),
  departmentController.createSalesData
);

/**
 * GET /api/departments/sales/export
 * Export sales data
 */
router.get(
  '/sales/export',
  requirePermission(PERMISSIONS.SALES_EXPORT),
  departmentController.exportSalesData
);

// ==================== FINANCIAL ROUTES ====================

/**
 * GET /api/departments/financial
 * Get financial transactions
 */
router.get(
  '/financial',
  requirePermission(PERMISSIONS.FINANCIAL_VIEW),
  departmentController.getFinancialData
);

/**
 * POST /api/departments/financial
 * Create financial transaction
 */
router.post(
  '/financial',
  requirePermission(PERMISSIONS.FINANCIAL_TRANSACTIONS),
  departmentController.createFinancialData
);

/**
 * GET /api/departments/financial/export
 * Export financial data
 */
router.get(
  '/financial/export',
  requirePermission(PERMISSIONS.FINANCIAL_EXPORT),
  departmentController.exportFinancialData
);

module.exports = router;
