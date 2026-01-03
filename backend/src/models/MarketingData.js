const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MarketingData = sequelize.define('marketing_data', {
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
  campaignType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'campaign_type',
    comment: 'Type of marketing campaign: email, social_media, seo, paid_ads, etc.'
  },
  campaignName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'campaign_name'
  },
  campaignDescription: {
    type: DataTypes.TEXT,
    field: 'campaign_description'
  },
  targetAudience: {
    type: DataTypes.STRING(255),
    field: 'target_audience'
  },
  channel: {
    type: DataTypes.STRING(100),
    comment: 'Marketing channel: facebook, instagram, google, email, etc.'
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'draft',
    validate: {
      isIn: [['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled']]
    }
  },
  startDate: {
    type: DataTypes.DATE,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATE,
    field: 'end_date'
  },
  budget: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Campaign budget'
  },
  actualSpend: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'actual_spend'
  },
  impressions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of impressions'
  },
  clicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of clicks'
  },
  conversions: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Number of conversions/leads'
  },
  revenue: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Revenue generated from campaign'
  },
  roi: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    comment: 'Return on Investment percentage'
  },
  notes: {
    type: DataTypes.TEXT
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional campaign data and analytics'
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
  tableName: 'marketing_data',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['campaign_type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['channel']
    },
    {
      fields: ['start_date']
    },
    {
      fields: ['end_date']
    }
  ]
});

module.exports = MarketingData;
