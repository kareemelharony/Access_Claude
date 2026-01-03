const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OperationsData = sequelize.define('operations_data', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
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
    }
  },
  taskType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'task_type',
    comment: 'Type of operational task: maintenance, cleaning, inspection, etc.'
  },
  taskTitle: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'task_title'
  },
  taskDescription: {
    type: DataTypes.TEXT,
    field: 'task_description'
  },
  priority: {
    type: DataTypes.STRING(20),
    defaultValue: 'medium',
    validate: {
      isIn: [['low', 'medium', 'high', 'urgent']]
    }
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'in_progress', 'completed', 'cancelled', 'on_hold']]
    }
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'assigned_to',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  dueDate: {
    type: DataTypes.DATE,
    field: 'due_date'
  },
  completedAt: {
    type: DataTypes.DATE,
    field: 'completed_at'
  },
  estimatedDuration: {
    type: DataTypes.INTEGER,
    field: 'estimated_duration',
    comment: 'Estimated duration in minutes'
  },
  actualDuration: {
    type: DataTypes.INTEGER,
    field: 'actual_duration',
    comment: 'Actual duration in minutes'
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  notes: {
    type: DataTypes.TEXT
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional operational data'
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
  tableName: 'operations_data',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['property_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['task_type']
    },
    {
      fields: ['assigned_to']
    },
    {
      fields: ['due_date']
    }
  ]
});

module.exports = OperationsData;
