const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const { PERMISSIONS } = require('../config/permissions');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/users/me/permissions
 * Get current user's permissions and accessible pages
 */
router.get('/me/permissions', userController.getMyPermissions);

/**
 * GET /api/users
 * Get all users (requires USERS_VIEW permission)
 */
router.get(
  '/',
  requirePermission(PERMISSIONS.USERS_VIEW),
  userController.getUsers
);

/**
 * GET /api/users/export
 * Export users data (requires USERS_EXPORT permission)
 */
router.get(
  '/export',
  requirePermission(PERMISSIONS.USERS_EXPORT),
  userController.exportUsers
);

/**
 * GET /api/users/:id
 * Get user by ID (requires USERS_VIEW permission)
 */
router.get(
  '/:id',
  requirePermission(PERMISSIONS.USERS_VIEW),
  userController.getUserById
);

/**
 * POST /api/users
 * Create new user (requires USERS_CREATE permission)
 */
router.post(
  '/',
  requirePermission(PERMISSIONS.USERS_CREATE),
  userController.createUser
);

/**
 * PATCH /api/users/:id
 * Update user (requires USERS_EDIT permission)
 */
router.patch(
  '/:id',
  requirePermission(PERMISSIONS.USERS_EDIT),
  userController.updateUser
);

/**
 * DELETE /api/users/:id
 * Delete user (requires USERS_DELETE permission)
 */
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.USERS_DELETE),
  userController.deleteUser
);

module.exports = router;
