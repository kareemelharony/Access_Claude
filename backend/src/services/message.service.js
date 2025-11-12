const { GuestMessage, Booking, Property } = require('../models');
const logger = require('../utils/logger');

/**
 * Message Service
 * Handles sending emails, SMS, and WhatsApp messages to guests
 */
class MessageService {
  /**
   * Send message to guest
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} Created guest message
   */
  async sendMessage(messageData) {
    const {
      bookingId,
      automationId,
      messageType,
      recipient,
      subject,
      body,
      language = 'en',
      metadata = {}
    } = messageData;

    // Create message record
    const guestMessage = await GuestMessage.create({
      bookingId,
      automationId,
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      recipientPhone: recipient.phone,
      messageType,
      subject,
      body,
      language,
      metadata,
      status: 'pending'
    });

    try {
      let result;

      switch (messageType) {
        case 'email':
          result = await this.sendEmail(recipient.email, subject, body);
          break;

        case 'sms':
          result = await this.sendSMS(recipient.phone, body);
          break;

        case 'whatsapp':
          result = await this.sendWhatsApp(recipient.phone, body);
          break;

        default:
          throw new Error(`Unsupported message type: ${messageType}`);
      }

      // Mark as sent
      await guestMessage.markAsSent(result.messageId, result.provider);

      logger.info(`Message sent successfully: ${guestMessage.id} via ${messageType}`);

      return guestMessage;
    } catch (error) {
      // Mark as failed
      await guestMessage.markAsFailed(error.message);

      logger.error(`Failed to send message: ${guestMessage.id}`, error);

      throw error;
    }
  }

  /**
   * Send email using SendGrid or configured provider
   * @private
   */
  async sendEmail(to, subject, body) {
    // Placeholder for actual email service integration
    logger.info(`Sending email to ${to}: ${subject}`);

    // Simulate email sending
    // In production, integrate with SendGrid, AWS SES, etc.
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to,
      from: process.env.SENDER_EMAIL,
      subject,
      html: body,
    };

    const response = await sgMail.send(msg);
    */

    return {
      messageId: `email_${Date.now()}`,
      provider: 'sendgrid'
    };
  }

  /**
   * Send SMS using Twilio or configured provider
   * @private
   */
  async sendSMS(to, body) {
    // Placeholder for actual SMS service integration
    logger.info(`Sending SMS to ${to}`);

    // In production, integrate with Twilio
    /*
    const twilio = require('twilio');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
    */

    return {
      messageId: `sms_${Date.now()}`,
      provider: 'twilio'
    };
  }

  /**
   * Send WhatsApp message using Twilio or WhatsApp Business API
   * @private
   */
  async sendWhatsApp(to, body) {
    // Placeholder for actual WhatsApp service integration
    logger.info(`Sending WhatsApp to ${to}`);

    // In production, integrate with Twilio WhatsApp or WhatsApp Business API
    /*
    const twilio = require('twilio');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const message = await client.messages.create({
      body,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`
    });
    */

    return {
      messageId: `whatsapp_${Date.now()}`,
      provider: 'twilio_whatsapp'
    };
  }

  /**
   * Get messages for a booking
   * @param {string} bookingId - Booking ID
   * @returns {Promise<Array>} List of messages
   */
  async getBookingMessages(bookingId) {
    const messages = await GuestMessage.findAll({
      where: { bookingId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Booking,
          as: 'booking',
          attributes: ['id', 'guestFirstName', 'guestLastName', 'guestEmail']
        }
      ]
    });

    return messages;
  }

  /**
   * Retry failed message
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} Updated message
   */
  async retryMessage(messageId) {
    const message = await GuestMessage.findByPk(messageId, {
      include: [
        {
          model: Booking,
          as: 'booking'
        }
      ]
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (!message.shouldRetry()) {
      throw new Error('Message cannot be retried (max retries reached or not in failed status)');
    }

    // Reset status and attempt to send again
    message.status = 'pending';
    await message.save();

    const recipient = {
      name: message.recipientName,
      email: message.recipientEmail,
      phone: message.recipientPhone
    };

    try {
      let result;

      switch (message.messageType) {
        case 'email':
          result = await this.sendEmail(recipient.email, message.subject, message.body);
          break;

        case 'sms':
          result = await this.sendSMS(recipient.phone, message.body);
          break;

        case 'whatsapp':
          result = await this.sendWhatsApp(recipient.phone, message.body);
          break;
      }

      await message.markAsSent(result.messageId, result.provider);

      return message;
    } catch (error) {
      await message.markAsFailed(error.message);
      throw error;
    }
  }

  /**
   * Render message template with variables
   * @param {string} template - Message template
   * @param {Object} variables - Template variables
   * @returns {string} Rendered message
   */
  renderTemplate(template, variables) {
    let rendered = template;

    // Simple template variable replacement
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(regex, value || '');
    }

    return rendered;
  }

  /**
   * Build template variables from booking and property data
   * @param {Object} booking - Booking instance
   * @param {Object} additionalVars - Additional variables
   * @returns {Object} Template variables
   */
  async buildTemplateVariables(booking, additionalVars = {}) {
    const property = await Property.findByPk(booking.propertyId);

    const variables = {
      // Guest information
      guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
      guestFirstName: booking.guestFirstName,
      guestLastName: booking.guestLastName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,

      // Booking information
      bookingId: booking.id,
      beds24BookingId: booking.beds24BookingId,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      checkInTime: property?.checkInTime || '15:00',
      checkOutTime: property?.checkOutTime || '11:00',
      numberOfGuests: booking.numberOfGuests,
      numberOfNights: booking.numberOfNights,
      totalPrice: booking.totalPrice,

      // Property information
      propertyName: property?.name?.en || 'Property',
      propertyAddress: property?.address,
      propertyCity: property?.city,

      // Additional variables
      ...additionalVars
    };

    return variables;
  }

  /**
   * Send booking confirmation message
   * @param {Object} booking - Booking instance
   * @param {string} messageType - Message type (email, sms, whatsapp)
   * @returns {Promise<Object>} Sent message
   */
  async sendBookingConfirmation(booking, messageType = 'email') {
    const variables = await this.buildTemplateVariables(booking);

    const templates = {
      email: {
        subject: 'Booking Confirmation - {{propertyName}}',
        body: `
Dear {{guestName}},

Your booking has been confirmed!

Property: {{propertyName}}
Check-in: {{checkInDate}} at {{checkInTime}}
Check-out: {{checkOutDate}} at {{checkOutTime}}
Guests: {{numberOfGuests}}

We look forward to welcoming you!

Best regards,
Lumive Access
        `.trim()
      },
      sms: {
        body: 'Booking confirmed! Check-in: {{checkInDate}} at {{checkInTime}}. {{propertyName}}, {{propertyCity}}'
      }
    };

    const template = templates[messageType] || templates.email;

    const messageData = {
      bookingId: booking.id,
      messageType,
      recipient: {
        name: `${booking.guestFirstName} ${booking.guestLastName}`,
        email: booking.guestEmail,
        phone: booking.guestPhone
      },
      subject: template.subject ? this.renderTemplate(template.subject, variables) : undefined,
      body: this.renderTemplate(template.body, variables),
      language: 'en',
      metadata: { type: 'booking_confirmation' }
    };

    return this.sendMessage(messageData);
  }

  /**
   * Send check-in instructions with passcode
   * @param {Object} booking - Booking instance
   * @param {string} passcode - Access passcode
   * @param {string} messageType - Message type
   * @returns {Promise<Object>} Sent message
   */
  async sendCheckInInstructions(booking, passcode, messageType = 'email') {
    const variables = await this.buildTemplateVariables(booking, { passcode });

    const templates = {
      email: {
        subject: 'Check-in Instructions - {{propertyName}}',
        body: `
Dear {{guestName}},

Welcome to {{propertyName}}!

Your access code: {{passcode}}

Check-in details:
- Date: {{checkInDate}}
- Time: {{checkInTime}}
- Address: {{propertyAddress}}, {{propertyCity}}

Instructions:
1. Arrive at the property at {{checkInTime}}
2. Use the access code {{passcode}} to unlock the main door
3. The code is valid from {{checkInDate}} to {{checkOutDate}}

If you have any questions, please don't hesitate to contact us.

Enjoy your stay!

Best regards,
Lumive Access
        `.trim()
      },
      sms: {
        body: 'Welcome to {{propertyName}}! Your access code: {{passcode}}. Valid from {{checkInDate}} at {{checkInTime}}'
      }
    };

    const template = templates[messageType] || templates.email;

    const messageData = {
      bookingId: booking.id,
      messageType,
      recipient: {
        name: `${booking.guestFirstName} ${booking.guestLastName}`,
        email: booking.guestEmail,
        phone: booking.guestPhone
      },
      subject: template.subject ? this.renderTemplate(template.subject, variables) : undefined,
      body: this.renderTemplate(template.body, variables),
      language: 'en',
      metadata: { type: 'check_in_instructions', passcode }
    };

    return this.sendMessage(messageData);
  }

  /**
   * Send check-out reminder
   * @param {Object} booking - Booking instance
   * @param {string} messageType - Message type
   * @returns {Promise<Object>} Sent message
   */
  async sendCheckOutReminder(booking, messageType = 'email') {
    const variables = await this.buildTemplateVariables(booking);

    const templates = {
      email: {
        subject: 'Check-out Reminder - {{propertyName}}',
        body: `
Dear {{guestName}},

This is a friendly reminder that your check-out is scheduled for:

Date: {{checkOutDate}}
Time: {{checkOutTime}}

Please ensure:
- All doors and windows are locked
- Lights and appliances are turned off
- Take all your belongings with you

Thank you for staying with us!

Best regards,
Lumive Access
        `.trim()
      },
      sms: {
        body: 'Check-out reminder: {{checkOutDate}} at {{checkOutTime}}. Please ensure everything is locked and turned off. Thank you!'
      }
    };

    const template = templates[messageType] || templates.email;

    const messageData = {
      bookingId: booking.id,
      messageType,
      recipient: {
        name: `${booking.guestFirstName} ${booking.guestLastName}`,
        email: booking.guestEmail,
        phone: booking.guestPhone
      },
      subject: template.subject ? this.renderTemplate(template.subject, variables) : undefined,
      body: this.renderTemplate(template.body, variables),
      language: 'en',
      metadata: { type: 'check_out_reminder' }
    };

    return this.sendMessage(messageData);
  }
}

module.exports = new MessageService();
