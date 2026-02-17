// Payment confirmation email template
const { APP_CONFIG } = require('../../../config/constants');

module.exports = (data) => {
  const { orderNumber, customerName, amount, paymentMethod, transactionId } = data;

  const subject = `Payment Confirmation - ${orderNumber}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0;">Payment Received!</h1>
    <p style="margin: 10px 0 0 0; font-size: 18px;">Thank you for recycling with us</p>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
    <p>Hello ${customerName},</p>
    
    <p>We're pleased to confirm that your payment has been processed successfully!</p>
    
    <div style="background-color: #fff; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h3 style="color: #11998e; margin-top: 0;">Payment Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 0;"><strong>Order Number:</strong></td>
          <td style="padding: 10px 0; text-align: right;">${orderNumber}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 0;"><strong>Amount Paid:</strong></td>
          <td style="padding: 10px 0; text-align: right; color: #27ae60; font-size: 20px; font-weight: bold;">£${amount}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 10px 0;"><strong>Payment Method:</strong></td>
          <td style="padding: 10px 0; text-align: right;">${paymentMethod}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0;"><strong>Transaction ID:</strong></td>
          <td style="padding: 10px 0; text-align: right; font-family: monospace;">${transactionId}</td>
        </tr>
      </table>
    </div>
    
    <div style="background-color: #e8f5e9; border-left: 4px solid #27ae60; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #2c3e50;">
        <strong>What's Next?</strong><br>
        Your order has been completed. You'll receive a receipt via email shortly. Thank you for choosing ${APP_CONFIG.NAME} for your device recycling needs!
      </p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #666;">
      Questions about your payment? Contact us at ${APP_CONFIG.SUPPORT_EMAIL}
    </p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
    <p>&copy; ${new Date().getFullYear()} ${APP_CONFIG.NAME}. All rights reserved.</p>
  </div>
</body>
</html>
  `;

  const text = `
Payment Received!

Hello ${customerName},

We're pleased to confirm that your payment has been processed successfully!

Payment Details:
Order Number: ${orderNumber}
Amount Paid: £${amount}
Payment Method: ${paymentMethod}
Transaction ID: ${transactionId}

Thank you for choosing ${APP_CONFIG.NAME} for your device recycling needs!

${APP_CONFIG.NAME}
${APP_CONFIG.SUPPORT_EMAIL}
  `;

  return { subject, html, text };
};
