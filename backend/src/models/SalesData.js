const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SalesData = sequelize.define('sales_data', {
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
  leadType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'lead_type',
    comment: 'Type of lead: new_property, existing_owner, partnership, etc.'
  },
  leadSource: {
    type: DataTypes.STRING(100),
    field: 'lead_source',
    comment: 'Source of lead: website, referral, cold_call, etc.'
  },
  contactName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'contact_name'
  },
  contactEmail: {
    type: DataTypes.STRING(255),
    field: 'contact_email',
    validate: {
      isEmail: true
    }
  },
  contactPhone: {
    type: DataTypes.STRING(20),
    field: 'contact_phone'
  },
  company: {
    type: DataTypes.STRING(255),
    comment: 'Company name if applicable'
  },
  propertyCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'property_count',
    comment: 'Number of properties the lead has'
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'new',
    validate: {
      isIn: [['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'on_hold']]
    }
  },
  stage: {
    type: DataTypes.STRING(50),
    defaultValue: 'lead',
    validate: {
      isIn: [['lead', 'prospect', 'opportunity', 'customer']]
    }
  },
  estimatedValue: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'estimated_value',
    comment: 'Estimated monthly recurring revenue'
  },
  actualValue: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'actual_value',
    comment: 'Actual monthly recurring revenue'
  },
  probability: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Probability of closing (0-100%)',
    validate: {
      min: 0,
      max: 100
    }
  },
  expectedCloseDate: {
    type: DataTypes.DATE,
    field: 'expected_close_date'
  },
  actualCloseDate: {
    type: DataTypes.DATE,
    field: 'actual_close_date'
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
  lastContactDate: {
    type: DataTypes.DATE,
    field: 'last_contact_date'
  },
  nextFollowUpDate: {
    type: DataTypes.DATE,
    field: 'next_follow_up_date'
  },
  notes: {
    type: DataTypes.TEXT
  },
  lostReason: {
    type: DataTypes.TEXT,
    field: 'lost_reason',
    comment: 'Reason if lead was lost'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional sales data and interactions'
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
  tableName: 'sales_data',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['lead_type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['stage']
    },
    {
      fields: ['assigned_to']
    },
    {
      fields: ['contact_email']
    },
    {
      fields: ['expected_close_date']
    }
  ]
});

module.exports = SalesData;
