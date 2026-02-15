// Recycler rejection email template
const { APP_CONFIG } = require('../../../config/constants');

module.exports = (data) => {
  const { name, companyName, reason } = data;

  const subject = `Update on Your ${APP_CONFIG.NAME} Application`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Update</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #34495e; color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0;">Application Status Update</h1>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
    <p>Hello ${name},</p>
    
    <p>Thank you for your interest in joining ${APP_CONFIG.NAME} as a recycling partner.</p>
    
    <div style="background-color: #fff; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <p>After careful review of your application for <strong>${companyName}</strong>, we regret to inform you that we are unable to approve your application at this time.</p>
      
      ${reason ? `
      <div style="background-color: #f0f0f0; border-radius: 5px; padding: 15px; margin-top: 15px;">
        <p style="margin: 0;"><strong>Reason:</strong><br>${reason}</p>
      </div>
      ` : ''}
    </div>
    
    <div style="background-color: #e8f4f8; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #2c3e50;">
        <strong>What's Next?</strong><br>
        We encourage you to review our requirements and consider reapplying in the future. You may also contact our team to discuss your application further.
      </p>
    </div>
    
    <p>We appreciate your understanding and interest in partnering with us.</p>
    
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
Application Status Update

Hello ${name},

Thank you for your interest in joining ${APP_CONFIG.NAME} as a recycling partner.

After careful review of your application for ${companyName}, we regret to inform you that we are unable to approve your application at this time.

${reason ? `Reason: ${reason}` : ''}

What's Next?
We encourage you to review our requirements and consider reapplying in the future. You may also contact our team to discuss your application further.

We appreciate your understanding and interest in partnering with us.

${APP_CONFIG.NAME}
${APP_CONFIG.SUPPORT_EMAIL}
  `;

  return { subject, html, text };
};
