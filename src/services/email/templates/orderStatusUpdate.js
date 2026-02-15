// Order status update email template
const { APP_CONFIG } = require('../../../config/constants');

module.exports = (data) => {
  const { orderNumber, customerName, status, statusLabel, statusMessage, nextSteps, statusColor } = data;

  // Use provided color or default to blue
  const color = statusColor || '#3498db';

  const subject = `Order Update - ${orderNumber}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Status Update</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: ${color}; color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0;">Order Status Update</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px;">Order ${orderNumber}</p>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
    <p>Hello ${customerName},</p>
    
    <p>Your order status has been updated:</p>
    
    <div style="background-color: #fff; border-left: 4px solid ${color}; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: ${color}; margin: 0 0 10px 0;">${statusLabel || statusMessage}</h2>
      ${statusMessage && statusLabel ? `<p style="margin: 10px 0;">${statusMessage}</p>` : ''}
      ${nextSteps ? `<p style="margin: 0;">${nextSteps}</p>` : ''}
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_CONFIG.FRONTEND_URL}/track/${orderNumber}" style="display: inline-block; background-color: ${color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Order Details</a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #666;">
      Questions? Contact us at ${APP_CONFIG.SUPPORT_EMAIL}
    </p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
    <p>&copy; ${new Date().getFullYear()} ${APP_CONFIG.NAME}. All rights reserved.</p>
  </div>
</body>
</html>
  `;

  const text = `
Order Status Update

Hello ${customerName},

Your order ${orderNumber} status has been updated:

${statusMessage}

${nextSteps || ''}

View order details: ${APP_CONFIG.FRONTEND_URL}/track/${orderNumber}

${APP_CONFIG.NAME}
${APP_CONFIG.SUPPORT_EMAIL}
  `;

  return { subject, html, text };
};
