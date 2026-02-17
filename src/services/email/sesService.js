// AWS SES email service
const { ses, sesEmailConfig } = require('../../config/aws');
const { SendEmailCommand, SendRawEmailCommand } = require('@aws-sdk/client-ses');
const logger = require('../../utils/logger');

// Email templates
const templates = {
  adminOTP: require('./templates/adminOTP'),
  contactResponse: require('./templates/contactResponse'),
  orderConfirmation: require('./templates/orderConfirmation'),
  orderStatusUpdate: require('./templates/orderStatusUpdate'),
  paymentConfirmation: require('./templates/paymentConfirmation'),
  recyclerApproval: require('./templates/recyclerApproval'),
  recyclerRejection: require('./templates/recyclerRejection'),
};

/**
 * Send email via AWS SES
 * @param {object} options - Email options
 * @param {Array} options.attachments - Optional attachments [{filename, content}]
 * @returns {Promise<object>} - Send result
 */
const sendEmail = async ({ to, subject, html, text, replyTo, attachments }) => {
  // If attachments exist, use sendRawEmail with MIME format
  if (attachments && attachments.length > 0) {
    return sendEmailWithAttachments({ to, subject, html, text, replyTo, attachments });
  }

  const params = {
    Source: sesEmailConfig.fromEmail,
    Destination: {
      ToAddresses: Array.isArray(to) ? to : [to],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: sesEmailConfig.charset,
      },
      Body: {
        Html: {
          Data: html,
          Charset: sesEmailConfig.charset,
        },
        Text: {
          Data: text || html.replace(/<[^>]*>/g, ''),
          Charset: sesEmailConfig.charset,
        },
      },
    },
  };

  if (replyTo) {
    params.ReplyToAddresses = Array.isArray(replyTo) ? replyTo : [replyTo];
  }

  try {
    const command = new SendEmailCommand(params);
    const result = await ses.send(command);
    logger.logEmail('sent', to, { subject, messageId: result.MessageId });
    
    return {
      success: true,
      messageId: result.MessageId,
    };
  } catch (error) {
    logger.logError(error, { context: 'SES sendEmail', to, subject });
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Send email with attachments using sendRawEmail (MIME format)
 * @param {object} options - Email options
 * @returns {Promise<object>} - Send result
 */
const sendEmailWithAttachments = async ({ to, subject, html, text, replyTo, attachments }) => {
  const toAddresses = Array.isArray(to) ? to : [to];
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const altBoundary = `----=_Alt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  // Build email headers
  let rawMessage = '';
  rawMessage += `From: ${sesEmailConfig.fromEmail}\r\n`;
  rawMessage += `To: ${toAddresses.join(', ')}\r\n`;
  rawMessage += `Subject: ${subject}\r\n`;
  if (replyTo) {
    rawMessage += `Reply-To: ${Array.isArray(replyTo) ? replyTo.join(', ') : replyTo}\r\n`;
  }
  rawMessage += 'MIME-Version: 1.0\r\n';
  rawMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n`;
  rawMessage += '\r\n';
  
  // Add multipart/alternative section for text and HTML
  rawMessage += `--${boundary}\r\n`;
  rawMessage += `Content-Type: multipart/alternative; boundary="${altBoundary}"\r\n`;
  rawMessage += '\r\n';
  
  // Plain text part
  rawMessage += `--${altBoundary}\r\n`;
  rawMessage += 'Content-Type: text/plain; charset=UTF-8\r\n';
  rawMessage += 'Content-Transfer-Encoding: 7bit\r\n';
  rawMessage += '\r\n';
  rawMessage += text || html.replace(/<[^>]*>/g, '');
  rawMessage += '\r\n';
  
  // HTML part
  rawMessage += `--${altBoundary}\r\n`;
  rawMessage += 'Content-Type: text/html; charset=UTF-8\r\n';
  rawMessage += 'Content-Transfer-Encoding: 7bit\r\n';
  rawMessage += '\r\n';
  rawMessage += html;
  rawMessage += '\r\n';
  
  // Close alternative boundary
  rawMessage += `--${altBoundary}--\r\n`;

  // Add attachments
  for (const attachment of attachments) {
    const base64Content = attachment.content.toString('base64');
    rawMessage += `--${boundary}\r\n`;
    rawMessage += `Content-Type: ${attachment.contentType || 'application/pdf'}; name="${attachment.filename}"\r\n`;
    rawMessage += 'Content-Transfer-Encoding: base64\r\n';
    rawMessage += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
    rawMessage += '\r\n';
    rawMessage += base64Content;
    rawMessage += '\r\n';
  }

  // Close main boundary
  rawMessage += `--${boundary}--`;

  const params = {
    RawMessage: {
      Data: Buffer.from(rawMessage),
    },
  };

  try {
    const command = new SendRawEmailCommand(params);
    const result = await ses.send(command);
    logger.logEmail('sent', to, { subject, messageId: result.MessageId, attachmentsCount: attachments.length });
    
    return {
      success: true,
      messageId: result.MessageId,
    };
  } catch (error) {
    logger.logError(error, { context: 'SES sendRawEmail', to, subject });
    throw new Error(`Failed to send email with attachments: ${error.message}`);
  }
};

/**
 * Send templated email
 * @param {string} templateName - Template name
 * @param {string|Array} to - Recipient email(s)
 * @param {object} data - Template data
 * @returns {Promise<object>} - Send result
 */
const sendTemplatedEmail = async (templateName, to, data) => {
  const template = templates[templateName];
  
  if (!template) {
    throw new Error(`Email template '${templateName}' not found`);
  }

  const { subject, html, text } = template(data);

  return sendEmail({
    to,
    subject,
    html,
    text,
  });
};

/**
 * Send OTP email to admin
 * @param {string} email - Admin email
 * @param {string} otp - OTP code
 * @returns {Promise<object>} - Send result
 */
const sendAdminOTP = async (email, otp) => {
  return sendTemplatedEmail('adminOTP', email, { otp, email });
};

/**
 * Send order confirmation email
 * @param {string} email - Customer email
 * @param {object} orderData - Order details
 * @returns {Promise<object>} - Send result
 */
const sendOrderConfirmation = async (email, orderData) => {
  return sendTemplatedEmail('orderConfirmation', email, orderData);
};

/**
 * Send order status update email
 * @param {string} email - Customer email
 * @param {object} orderData - Order details
 * @returns {Promise<object>} - Send result
 */
const sendOrderStatusUpdate = async (email, orderData) => {
  return sendTemplatedEmail('orderStatusUpdate', email, orderData);
};

/**
 * Send payment confirmation email
 * @param {string} email - Customer email
 * @param {object} paymentData - Payment details
 * @returns {Promise<object>} - Send result
 */
const sendPaymentConfirmation = async (email, paymentData) => {
  return sendTemplatedEmail('paymentConfirmation', email, paymentData);
};

/**
 * Send contact form response email
 * @param {string} email - Customer email
 * @param {object} responseData - Response details
 * @returns {Promise<object>} - Send result
 */
const sendContactResponse = async (email, responseData) => {
  return sendTemplatedEmail('contactResponse', email, responseData);
};

/**
 * Send recycler approval email
 * @param {string} email - Recycler email
 * @param {object} recyclerData - Recycler details
 * @returns {Promise<object>} - Send result
 */
const sendRecyclerApproval = async (email, recyclerData) => {
  return sendTemplatedEmail('recyclerApproval', email, recyclerData);
};

/**
 * Send recycler rejection email
 * @param {string} email - Recycler email
 * @param {object} rejectionData - Rejection details
 * @returns {Promise<object>} - Send result
 */
const sendRecyclerRejection = async (email, rejectionData) => {
  return sendTemplatedEmail('recyclerRejection', email, rejectionData);
};

/**
 * Send bulk emails (with rate limiting)
 * @param {Array} emails - Array of email objects
 * @returns {Promise<Array>} - Send results
 */
const sendBulkEmails = async (emails) => {
  const results = [];
  
  for (const emailData of emails) {
    try {
      const result = await sendEmail(emailData);
      results.push({ success: true, ...result });
      
      // Rate limiting: wait 100ms between emails
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      results.push({ success: false, error: error.message, to: emailData.to });
    }
  }
  
  return results;
};

/**
 * Verify email address
 * @param {string} email - Email to verify
 * @returns {Promise<object>} - Verification result
 */
const verifyEmailAddress = async (email) => {
  const params = {
    EmailAddress: email,
  };

  try {
    await ses.verifyEmailIdentity(params).promise();
    logger.info('Email verification initiated', { email });
    
    return {
      success: true,
      message: 'Verification email sent',
    };
  } catch (error) {
    logger.logError(error, { context: 'SES verifyEmail', email });
    throw new Error(`Failed to verify email: ${error.message}`);
  }
};

/**
 * Get sending statistics
 * @returns {Promise<object>} - Sending stats
 */
const getSendingStats = async () => {
  try {
    const stats = await ses.getSendStatistics().promise();
    return {
      success: true,
      data: stats.SendDataPoints,
    };
  } catch (error) {
    logger.logError(error, { context: 'SES getSendingStats' });
    throw new Error(`Failed to get sending stats: ${error.message}`);
  }
};

module.exports = {
  sendEmail,
  sendTemplatedEmail,
  sendAdminOTP,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendPaymentConfirmation,
  sendContactResponse,
  sendRecyclerApproval,
  sendRecyclerRejection,
  sendBulkEmails,
  verifyEmailAddress,
  getSendingStats,
};
