const { User } = require('../models');
const { ValidationError } = require('../utils/errors');
const { getDepartmentFromRole } = require('../config/permissions');
const bcrypt = require('bcryptjs');
const exportService = require('../services/export.service');

/**
 * Get all users (CEO/Admin only)
 */
const getUsers = async (req, res) => {
  try {
    const { role, department, status, page = 1, limit = 20 } = req.query;

    const where = {};
    if (role) where.role = role;
    if (department) where.department = department;
    if (status) where.status = status;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['passwordHash'] },
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        users,
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
        code: 'FETCH_USERS_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['passwordHash'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: { user },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_USER_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Create new user (CEO/Admin only)
 */
const createUser = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      department,
      language
    } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Email already registered'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Auto-assign department based on role if not provided
    const userDepartment = department || getDepartmentFromRole(role);

    // Create user
    const user = await User.create({
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      role,
      department: userDepartment,
      language: language || 'en',
      emailVerified: false,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      data: { user: user.toJSON() },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_USER_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update user
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      phone,
      role,
      department,
      language,
      status
    } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Prepare update data
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) {
      updateData.role = role;
      // Auto-update department if role changes
      updateData.department = department || getDepartmentFromRole(role);
    }
    if (department !== undefined) updateData.department = department;
    if (language !== undefined) updateData.language = language;
    if (status !== undefined) updateData.status = status;

    await user.update(updateData);

    res.json({
      success: true,
      data: { user: user.toJSON() },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_USER_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Delete user (soft delete)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Soft delete
    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_USER_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Export users data
 */
const exportUsers = async (req, res) => {
  try {
    const { role, department, status, format = 'csv' } = req.query;

    const filters = {};
    if (role) filters.role = role;
    if (department) filters.department = department;
    if (status) filters.status = status;

    const result = await exportService.exportUsersData(filters, format);

    // Set appropriate headers for download
    const filename = `users_export_${new Date().toISOString().split('T')[0]}.${format}`;
    const contentType = format === 'csv' ? 'text/csv' : 'application/json';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(result.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_USERS_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get current user permissions
 */
const getMyPermissions = async (req, res) => {
  try {
    const { getRolePermissions, getRolePages } = require('../config/permissions');

    const permissions = getRolePermissions(req.user.role);
    const pages = getRolePages(req.user.role);

    res.json({
      success: true,
      data: {
        role: req.user.role,
        department: req.user.department,
        permissions,
        pages
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_PERMISSIONS_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  exportUsers,
  getMyPermissions
};
