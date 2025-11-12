const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Automation Rule Model
 * Stores automation rules for guest communications and device control
 */
const Automation = sequelize.define('automations', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'owner_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  propertyId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'property_id',
    references: {
      model: 'properties',
      key: 'id'
    },
    comment: 'Null means applies to all properties'
  },
  name: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: '{en: "Check-in Welcome", ar: "رسالة ترحيب"}'
  },
  description: {
    type: DataTypes.JSONB,
    comment: '{en: "Send welcome message on check-in", ar: "..."}'
  },

  // Trigger Configuration
  triggerType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'trigger_type',
    comment: 'booking_created, check_in, check_out, time_before_check_in, time_after_check_out, device_status_change'
  },
  triggerConfig: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'trigger_config',
    comment: 'Trigger-specific configuration: {hoursBeforeCheckIn: 24, deviceId: "...", etc.}'
  },

  // Condition Configuration (Optional)
  conditions: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: '[{field: "property.city", operator: "equals", value: "Riyadh"}]'
  },

  // Action Configuration
  actionType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'action_type',
    comment: 'send_message, generate_passcode, control_device, send_email, send_sms, send_whatsapp'
  },
  actionConfig: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'action_config',
    comment: 'Action-specific configuration'
  },

  // Message Template (for messaging actions)
  messageTemplate: {
    type: DataTypes.JSONB,
    field: 'message_template',
    comment: '{en: "Welcome {{guestName}}! Your code is {{passcode}}", ar: "..."}'
  },

  // Execution Settings
  executeOnce: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'execute_once',
    comment: 'Execute only once per booking/trigger'
  },
  retryOnFailure: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'retry_on_failure'
  },
  maxRetries: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
    field: 'max_retries'
  },

  // Status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'inactive', 'error']]
    }
  },

  // Statistics
  totalExecutions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'total_executions'
  },
  successfulExecutions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'successful_executions'
  },
  failedExecutions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'failed_executions'
  },
  lastExecutedAt: {
    type: DataTypes.DATE,
    field: 'last_executed_at'
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
  tableName: 'automations',
  indexes: [
    {
      fields: ['owner_id']
    },
    {
      fields: ['property_id']
    },
    {
      fields: ['trigger_type']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['status']
    }
  ]
});

// Instance methods
Automation.prototype.isEnabled = function() {
  return this.isActive && this.status === 'active';
};

Automation.prototype.incrementExecutions = async function(success = true) {
  this.totalExecutions += 1;
  if (success) {
    this.successfulExecutions += 1;
  } else {
    this.failedExecutions += 1;
  }
  this.lastExecutedAt = new Date();
  await this.save();
};

Automation.prototype.shouldExecute = function(context) {
  if (!this.isEnabled()) {
    return false;
  }

  // Check conditions
  if (this.conditions && this.conditions.length > 0) {
    return this.evaluateConditions(context);
  }

  return true;
};

Automation.prototype.evaluateConditions = function(context) {
  // Simple condition evaluator
  for (const condition of this.conditions) {
    const value = this.getNestedValue(context, condition.field);

    switch (condition.operator) {
      case 'equals':
        if (value !== condition.value) return false;
        break;
      case 'not_equals':
        if (value === condition.value) return false;
        break;
      case 'contains':
        if (!value || !value.includes(condition.value)) return false;
        break;
      case 'greater_than':
        if (!(value > condition.value)) return false;
        break;
      case 'less_than':
        if (!(value < condition.value)) return false;
        break;
      default:
        return false;
    }
  }

  return true;
};

Automation.prototype.getNestedValue = function(obj, path) {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
};

module.exports = Automation;
