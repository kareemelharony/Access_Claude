const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FinancialData = sequelize.define('financial_data', {
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
  bookingId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'booking_id',
    references: {
      model: 'bookings',
      key: 'id'
    }
  },
  transactionType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'transaction_type',
    comment: 'Type: revenue, expense, refund, commission, tax, etc.'
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Category: booking_revenue, cleaning, maintenance, utilities, platform_fee, etc.'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Transaction amount'
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'SAR',
    comment: 'Currency code (SAR, USD, EUR, etc.)'
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'completed', 'cancelled', 'refunded', 'failed']]
    }
  },
  paymentMethod: {
    type: DataTypes.STRING(100),
    field: 'payment_method',
    comment: 'Payment method: credit_card, bank_transfer, cash, etc.'
  },
  referenceNumber: {
    type: DataTypes.STRING(255),
    field: 'reference_number',
    comment: 'External reference or invoice number'
  },
  transactionDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'transaction_date',
    defaultValue: DataTypes.NOW
  },
  dueDate: {
    type: DataTypes.DATE,
    field: 'due_date',
    comment: 'Due date for expenses/invoices'
  },
  paidDate: {
    type: DataTypes.DATE,
    field: 'paid_date',
    comment: 'Date payment was completed'
  },
  taxAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'tax_amount',
    comment: 'Tax amount (VAT, etc.)'
  },
  taxRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'tax_rate',
    comment: 'Tax rate percentage'
  },
  netAmount: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'net_amount',
    comment: 'Net amount after tax'
  },
  vendor: {
    type: DataTypes.STRING(255),
    comment: 'Vendor or payee name'
  },
  notes: {
    type: DataTypes.TEXT
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional financial data'
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
  tableName: 'financial_data',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['property_id']
    },
    {
      fields: ['booking_id']
    },
    {
      fields: ['transaction_type']
    },
    {
      fields: ['category']
    },
    {
      fields: ['status']
    },
    {
      fields: ['transaction_date']
    },
    {
      fields: ['reference_number']
    }
  ]
});

module.exports = FinancialData;
