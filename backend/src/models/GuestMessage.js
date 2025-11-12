const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Guest Message Model
 * Tracks all messages sent to guests (email, SMS, WhatsApp)
 */
const GuestMessage = sequelize.define('guest_messages', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  bookingId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'booking_id',
    references: {
      model: 'bookings',
      key: 'id'
    }
  },
  automationId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'automation_id',
    references: {
      model: 'automations',
      key: 'id'
    },
    comment: 'Null if sent manually'
  },

  // Recipient Information
  recipientName: {
    type: DataTypes.STRING(200),
    field: 'recipient_name'
  },
  recipientEmail: {
    type: DataTypes.STRING(255),
    field: 'recipient_email'
  },
  recipientPhone: {
    type: DataTypes.STRING(50),
    field: 'recipient_phone'
  },

  // Message Details
  messageType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'message_type',
    validate: {
      isIn: [['email', 'sms', 'whatsapp']]
    }
  },
  subject: {
    type: DataTypes.STRING(500),
    comment: 'For emails only'
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Message content'
  },
  language: {
    type: DataTypes.STRING(5),
    defaultValue: 'en',
    comment: 'Message language: en, ar'
  },

  // Delivery Status
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'sent', 'delivered', 'failed', 'bounced']]
    }
  },
  sentAt: {
    type: DataTypes.DATE,
    field: 'sent_at'
  },
  deliveredAt: {
    type: DataTypes.DATE,
    field: 'delivered_at'
  },
  failureReason: {
    type: DataTypes.TEXT,
    field: 'failure_reason'
  },

  // External Service Information
  externalMessageId: {
    type: DataTypes.STRING(255),
    field: 'external_message_id',
    comment: 'Message ID from email/SMS/WhatsApp provider'
  },
  provider: {
    type: DataTypes.STRING(50),
    comment: 'sendgrid, twilio, whatsapp_business'
  },

  // Metadata
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Additional message metadata and variables used'
  },
  retryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'retry_count'
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
  }
}, {
  timestamps: true,
  underscored: true,
  tableName: 'guest_messages',
  indexes: [
    {
      fields: ['booking_id']
    },
    {
      fields: ['automation_id']
    },
    {
      fields: ['message_type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Instance methods
GuestMessage.prototype.markAsSent = async function(externalMessageId, provider) {
  this.status = 'sent';
  this.sentAt = new Date();
  this.externalMessageId = externalMessageId;
  this.provider = provider;
  await this.save();
};

GuestMessage.prototype.markAsDelivered = async function() {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  await this.save();
};

GuestMessage.prototype.markAsFailed = async function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
  this.retryCount += 1;
  await this.save();
};

GuestMessage.prototype.shouldRetry = function(maxRetries = 3) {
  return this.status === 'failed' && this.retryCount < maxRetries;
};

module.exports = GuestMessage;
