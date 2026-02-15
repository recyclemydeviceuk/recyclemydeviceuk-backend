// Order confirmation email template
const { APP_CONFIG } = require('../../../config/constants');

module.exports = (data) => {
  const { orderNumber, customerName, device, condition, price, address } = data;

  const subject = `Order Confirmation - ${orderNumber}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0;">Order Confirmed! 🎉</h1>
    <p style="margin: 10px 0 0 0; font-size: 18px;">Thank you for choosing ${APP_CONFIG.NAME}</p>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
    <p>Hello ${customerName},</p>
    
    <p>Your device recycling order has been confirmed and is being processed.</p>
    
    <div style="background-color: #fff; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h3 style="color: #667eea; margin-top: 0;">Order Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 0;"><strong>Order Number:</strong></td>
          <td style="padding: 10px 0; text-align: right;">${orderNumber}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 0;"><strong>Device:</strong></td>
          <td style="padding: 10px 0; text-align: right;">${device}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 0;"><strong>Condition:</strong></td>
          <td style="padding: 10px 0; text-align: right;">${condition}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0;"><strong>Estimated Value:</strong></td>
          <td style="padding: 10px 0; text-align: right; color: #27ae60; font-size: 18px; font-weight: bold;">£${price}</td>
        </tr>
      </table>
    </div>
    
    <div style="background-color: #fff; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h3 style="color: #667eea; margin-top: 0;">Collection Address</h3>
      <p style="margin: 0;">${address}</p>
    </div>
    
    <div style="background-color: #e8f4f8; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: #2c3e50;">What's Next?</h4>
      <ol style="margin: 0; padding-left: 20px;">
        <li>Prepare your device for collection</li>
        <li>Wait for our recycling partner to contact you</li>
        <li>Device inspection and final price confirmation</li>
        <li>Receive payment within 2-5 business days</li>
      </ol>
    </div>
    
    <p>You can track your order status anytime using order number <strong>${orderNumber}</strong>.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_CONFIG.FRONTEND_URL}/track/${orderNumber}" style="display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Track Order</a>
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
Order Confirmed!

Hello ${customerName},

Your device recycling order has been confirmed.

Order Details:
Order Number: ${orderNumber}
Device: ${device}
Condition: ${condition}
Estimated Value: £${price}

Collection Address:
${address}

What's Next?
1. Prepare your device for collection
2. Wait for our recycling partner to contact you
3. Device inspection and final price confirmation
4. Receive payment within 2-5 business days

Track your order: ${APP_CONFIG.FRONTEND_URL}/track/${orderNumber}

${APP_CONFIG.NAME}
${APP_CONFIG.SUPPORT_EMAIL}
  `;

  return { subject, html, text };
};
