/**
 * Role-Based Access Control (RBAC) Configuration
 * Defines permissions and access levels for each user role
 */

// Define all possible permissions in the system
const PERMISSIONS = {
  // Dashboard permissions
  DASHBOARD_VIEW: 'dashboard:view',
  DASHBOARD_ANALYTICS: 'dashboard:analytics',

  // Property management
  PROPERTIES_VIEW: 'properties:view',
  PROPERTIES_CREATE: 'properties:create',
  PROPERTIES_EDIT: 'properties:edit',
  PROPERTIES_DELETE: 'properties:delete',
  PROPERTIES_EXPORT: 'properties:export',

  // Booking management
  BOOKINGS_VIEW: 'bookings:view',
  BOOKINGS_CREATE: 'bookings:create',
  BOOKINGS_EDIT: 'bookings:edit',
  BOOKINGS_CANCEL: 'bookings:cancel',
  BOOKINGS_EXPORT: 'bookings:export',

  // Device management
  DEVICES_VIEW: 'devices:view',
  DEVICES_CREATE: 'devices:create',
  DEVICES_EDIT: 'devices:edit',
  DEVICES_DELETE: 'devices:delete',
  DEVICES_CONTROL: 'devices:control',
  DEVICES_EXPORT: 'devices:export',

  // Automation
  AUTOMATION_VIEW: 'automation:view',
  AUTOMATION_CREATE: 'automation:create',
  AUTOMATION_EDIT: 'automation:edit',
  AUTOMATION_DELETE: 'automation:delete',
  AUTOMATION_EXPORT: 'automation:export',

  // Messages & Communication
  MESSAGES_VIEW: 'messages:view',
  MESSAGES_SEND: 'messages:send',
  MESSAGES_EXPORT: 'messages:export',

  // Marketing
  MARKETING_VIEW: 'marketing:view',
  MARKETING_CAMPAIGNS: 'marketing:campaigns',
  MARKETING_ANALYTICS: 'marketing:analytics',
  MARKETING_EXPORT: 'marketing:export',

  // Sales
  SALES_VIEW: 'sales:view',
  SALES_LEADS: 'sales:leads',
  SALES_ANALYTICS: 'sales:analytics',
  SALES_EXPORT: 'sales:export',

  // Financial
  FINANCIAL_VIEW: 'financial:view',
  FINANCIAL_TRANSACTIONS: 'financial:transactions',
  FINANCIAL_REPORTS: 'financial:reports',
  FINANCIAL_EXPORT: 'financial:export',

  // Operations
  OPERATIONS_VIEW: 'operations:view',
  OPERATIONS_TASKS: 'operations:tasks',
  OPERATIONS_REPORTS: 'operations:reports',
  OPERATIONS_EXPORT: 'operations:export',

  // User management
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  USERS_EXPORT: 'users:export',

  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
  SETTINGS_INTEGRATIONS: 'settings:integrations',

  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_GENERATE: 'reports:generate',
  REPORTS_EXPORT: 'reports:export',

  // System admin
  SYSTEM_ADMIN: 'system:admin',
  SYSTEM_LOGS: 'system:logs',
};

// Define role hierarchies and their permissions
const ROLE_PERMISSIONS = {
  // CEO - Full access to everything
  ceo: [
    ...Object.values(PERMISSIONS) // All permissions
  ],

  // Operations Manager - Full operations + view access to other departments
  operations_manager: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_ANALYTICS,
    PERMISSIONS.PROPERTIES_VIEW,
    PERMISSIONS.PROPERTIES_CREATE,
    PERMISSIONS.PROPERTIES_EDIT,
    PERMISSIONS.PROPERTIES_DELETE,
    PERMISSIONS.PROPERTIES_EXPORT,
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.BOOKINGS_CREATE,
    PERMISSIONS.BOOKINGS_EDIT,
    PERMISSIONS.BOOKINGS_CANCEL,
    PERMISSIONS.BOOKINGS_EXPORT,
    PERMISSIONS.DEVICES_VIEW,
    PERMISSIONS.DEVICES_CREATE,
    PERMISSIONS.DEVICES_EDIT,
    PERMISSIONS.DEVICES_DELETE,
    PERMISSIONS.DEVICES_CONTROL,
    PERMISSIONS.DEVICES_EXPORT,
    PERMISSIONS.AUTOMATION_VIEW,
    PERMISSIONS.AUTOMATION_CREATE,
    PERMISSIONS.AUTOMATION_EDIT,
    PERMISSIONS.AUTOMATION_DELETE,
    PERMISSIONS.AUTOMATION_EXPORT,
    PERMISSIONS.MESSAGES_VIEW,
    PERMISSIONS.MESSAGES_SEND,
    PERMISSIONS.MESSAGES_EXPORT,
    PERMISSIONS.OPERATIONS_VIEW,
    PERMISSIONS.OPERATIONS_TASKS,
    PERMISSIONS.OPERATIONS_REPORTS,
    PERMISSIONS.OPERATIONS_EXPORT,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_EXPORT,
    // View-only access to other departments
    PERMISSIONS.MARKETING_VIEW,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.FINANCIAL_VIEW,
  ],

  // Operations Specialist - Limited operations access
  operations_specialist: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PROPERTIES_VIEW,
    PERMISSIONS.PROPERTIES_EDIT,
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.BOOKINGS_EDIT,
    PERMISSIONS.DEVICES_VIEW,
    PERMISSIONS.DEVICES_CONTROL,
    PERMISSIONS.AUTOMATION_VIEW,
    PERMISSIONS.MESSAGES_VIEW,
    PERMISSIONS.MESSAGES_SEND,
    PERMISSIONS.OPERATIONS_VIEW,
    PERMISSIONS.OPERATIONS_TASKS,
    PERMISSIONS.SETTINGS_VIEW,
  ],

  // Marketing Manager - Full marketing access
  marketing_manager: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.MARKETING_VIEW,
    PERMISSIONS.MARKETING_CAMPAIGNS,
    PERMISSIONS.MARKETING_ANALYTICS,
    PERMISSIONS.MARKETING_EXPORT,
    PERMISSIONS.MESSAGES_VIEW,
    PERMISSIONS.MESSAGES_SEND,
    PERMISSIONS.MESSAGES_EXPORT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.SETTINGS_VIEW,
    // View-only access to relevant data
    PERMISSIONS.PROPERTIES_VIEW,
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.SALES_VIEW,
  ],

  // Marketing Specialist - Limited marketing access
  marketing_specialist: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.MARKETING_VIEW,
    PERMISSIONS.MARKETING_CAMPAIGNS,
    PERMISSIONS.MESSAGES_VIEW,
    PERMISSIONS.MESSAGES_SEND,
    PERMISSIONS.PROPERTIES_VIEW,
    PERMISSIONS.BOOKINGS_VIEW,
  ],

  // Sales Manager - Full sales access
  sales_manager: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_LEADS,
    PERMISSIONS.SALES_ANALYTICS,
    PERMISSIONS.SALES_EXPORT,
    PERMISSIONS.MESSAGES_VIEW,
    PERMISSIONS.MESSAGES_SEND,
    PERMISSIONS.MESSAGES_EXPORT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.SETTINGS_VIEW,
    // View-only access to relevant data
    PERMISSIONS.PROPERTIES_VIEW,
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.MARKETING_VIEW,
    PERMISSIONS.FINANCIAL_VIEW,
  ],

  // Sales Specialist - Limited sales access
  sales_specialist: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_LEADS,
    PERMISSIONS.MESSAGES_VIEW,
    PERMISSIONS.MESSAGES_SEND,
    PERMISSIONS.PROPERTIES_VIEW,
    PERMISSIONS.BOOKINGS_VIEW,
  ],

  // Financial Manager - Full financial access
  financial_manager: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_ANALYTICS,
    PERMISSIONS.FINANCIAL_VIEW,
    PERMISSIONS.FINANCIAL_TRANSACTIONS,
    PERMISSIONS.FINANCIAL_REPORTS,
    PERMISSIONS.FINANCIAL_EXPORT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.SETTINGS_VIEW,
    // View-only access to relevant data
    PERMISSIONS.PROPERTIES_VIEW,
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.MARKETING_VIEW,
  ],

  // Financial Specialist - Limited financial access
  financial_specialist: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.FINANCIAL_VIEW,
    PERMISSIONS.FINANCIAL_TRANSACTIONS,
    PERMISSIONS.PROPERTIES_VIEW,
    PERMISSIONS.BOOKINGS_VIEW,
  ],

  // Admin - Almost full access (for backward compatibility)
  admin: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_ANALYTICS,
    PERMISSIONS.PROPERTIES_VIEW,
    PERMISSIONS.PROPERTIES_CREATE,
    PERMISSIONS.PROPERTIES_EDIT,
    PERMISSIONS.PROPERTIES_DELETE,
    PERMISSIONS.PROPERTIES_EXPORT,
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.BOOKINGS_CREATE,
    PERMISSIONS.BOOKINGS_EDIT,
    PERMISSIONS.BOOKINGS_CANCEL,
    PERMISSIONS.BOOKINGS_EXPORT,
    PERMISSIONS.DEVICES_VIEW,
    PERMISSIONS.DEVICES_CREATE,
    PERMISSIONS.DEVICES_EDIT,
    PERMISSIONS.DEVICES_DELETE,
    PERMISSIONS.DEVICES_CONTROL,
    PERMISSIONS.DEVICES_EXPORT,
    PERMISSIONS.AUTOMATION_VIEW,
    PERMISSIONS.AUTOMATION_CREATE,
    PERMISSIONS.AUTOMATION_EDIT,
    PERMISSIONS.AUTOMATION_DELETE,
    PERMISSIONS.AUTOMATION_EXPORT,
    PERMISSIONS.MESSAGES_VIEW,
    PERMISSIONS.MESSAGES_SEND,
    PERMISSIONS.MESSAGES_EXPORT,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.USERS_EXPORT,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_EDIT,
    PERMISSIONS.SETTINGS_INTEGRATIONS,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_EXPORT,
  ],

  // Owner - Property owner access (backward compatibility)
  owner: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PROPERTIES_VIEW,
    PERMISSIONS.PROPERTIES_CREATE,
    PERMISSIONS.PROPERTIES_EDIT,
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.BOOKINGS_CREATE,
    PERMISSIONS.DEVICES_VIEW,
    PERMISSIONS.DEVICES_CONTROL,
    PERMISSIONS.AUTOMATION_VIEW,
    PERMISSIONS.MESSAGES_VIEW,
    PERMISSIONS.MESSAGES_SEND,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_EDIT,
  ],

  // Staff - Basic access (backward compatibility)
  staff: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PROPERTIES_VIEW,
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.DEVICES_VIEW,
    PERMISSIONS.MESSAGES_VIEW,
  ],
};

// Define which pages each role can access
const ROLE_PAGES = {
  ceo: [
    '/dashboard',
    '/properties',
    '/bookings',
    '/devices',
    '/automation',
    '/messages',
    '/tasks',
    '/reports',
    '/settings',
    '/users',
    '/marketing',
    '/sales',
    '/financial',
    '/operations',
  ],
  operations_manager: [
    '/dashboard',
    '/properties',
    '/bookings',
    '/devices',
    '/automation',
    '/messages',
    '/tasks',
    '/reports',
    '/settings',
    '/operations',
  ],
  operations_specialist: [
    '/dashboard',
    '/properties',
    '/bookings',
    '/devices',
    '/messages',
    '/operations',
  ],
  marketing_manager: [
    '/dashboard',
    '/marketing',
    '/messages',
    '/reports',
    '/properties',
    '/bookings',
  ],
  marketing_specialist: [
    '/dashboard',
    '/marketing',
    '/messages',
    '/properties',
    '/bookings',
  ],
  sales_manager: [
    '/dashboard',
    '/sales',
    '/messages',
    '/reports',
    '/properties',
    '/bookings',
  ],
  sales_specialist: [
    '/dashboard',
    '/sales',
    '/messages',
    '/properties',
    '/bookings',
  ],
  financial_manager: [
    '/dashboard',
    '/financial',
    '/reports',
    '/properties',
    '/bookings',
  ],
  financial_specialist: [
    '/dashboard',
    '/financial',
    '/properties',
    '/bookings',
  ],
  admin: [
    '/dashboard',
    '/properties',
    '/bookings',
    '/devices',
    '/automation',
    '/messages',
    '/tasks',
    '/reports',
    '/settings',
    '/users',
  ],
  owner: [
    '/dashboard',
    '/properties',
    '/bookings',
    '/devices',
    '/automation',
    '/messages',
    '/settings',
  ],
  staff: [
    '/dashboard',
    '/properties',
    '/bookings',
    '/devices',
    '/messages',
  ],
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean} - True if role has permission
 */
const hasPermission = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

/**
 * Check if a role can access a specific page
 * @param {string} role - User role
 * @param {string} page - Page path
 * @returns {boolean} - True if role can access page
 */
const canAccessPage = (role, page) => {
  const pages = ROLE_PAGES[role] || [];
  // Check exact match or parent path match
  return pages.some(allowedPage =>
    page === allowedPage || page.startsWith(allowedPage + '/')
  );
};

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {Array} - Array of permissions
 */
const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Get all accessible pages for a role
 * @param {string} role - User role
 * @returns {Array} - Array of page paths
 */
const getRolePages = (role) => {
  return ROLE_PAGES[role] || [];
};

/**
 * Get department from role
 * @param {string} role - User role
 * @returns {string} - Department name
 */
const getDepartmentFromRole = (role) => {
  if (role === 'ceo') return 'executive';
  if (role.includes('operations')) return 'operations';
  if (role.includes('marketing')) return 'marketing';
  if (role.includes('sales')) return 'sales';
  if (role.includes('financial')) return 'financial';
  return 'general';
};

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLE_PAGES,
  hasPermission,
  canAccessPage,
  getRolePermissions,
  getRolePages,
  getDepartmentFromRole,
};
