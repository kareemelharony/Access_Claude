const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('users', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash'
  },
  firstName: {
    type: DataTypes.STRING(100),
    field: 'first_name'
  },
  lastName: {
    type: DataTypes.STRING(100),
    field: 'last_name'
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  role: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'operations_specialist',
    validate: {
      isIn: [[
        'ceo',
        'operations_manager',
        'operations_specialist',
        'marketing_manager',
        'marketing_specialist',
        'sales_manager',
        'sales_specialist',
        'financial_manager',
        'financial_specialist',
        'admin',
        'owner',
        'staff'
      ]]
    }
  },
  department: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: {
      isIn: [['operations', 'marketing', 'sales', 'financial', 'executive', 'general']]
    }
  },
  language: {
    type: DataTypes.STRING(5),
    defaultValue: 'en',
    validate: {
      isIn: [['en', 'ar']]
    }
  },
  timezone: {
    type: DataTypes.STRING(50),
    defaultValue: 'Asia/Riyadh'
  },
  avatarUrl: {
    type: DataTypes.TEXT,
    field: 'avatar_url'
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'email_verified'
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'suspended', 'deleted']]
    }
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    field: 'last_login_at'
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
  tableName: 'users',
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['role']
    },
    {
      fields: ['status']
    }
  ]
});

// Instance methods
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.passwordHash;
  return values;
};

User.prototype.getFullName = function() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.email;
};

module.exports = User;
