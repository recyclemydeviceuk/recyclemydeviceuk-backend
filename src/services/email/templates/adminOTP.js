// Admin OTP email template
const { APP_CONFIG } = require('../../../config/constants');

module.exports = (data) => {
  const { otp, email } = data;

  const subject = `Your OTP Code - ${APP_CONFIG.NAME}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin OTP</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Admin Login OTP</h1>
    
    <p>Hello,</p>
    
    <p>You have requested to login to the ${APP_CONFIG.NAME} admin portal. Your One-Time Password (OTP) is:</p>
    
    <div style="background-color: #fff; border: 2px solid #3498db; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
      <h2 style="color: #3498db; font-size: 36px; letter-spacing: 10px; margin: 0;">${otp}</h2>
    </div>
    
    <p><strong>This OTP will expire in 10 minutes.</strong></p>
    
    <p>If you did not request this OTP, please ignore this email or contact our support team immediately.</p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #666;">
      This email was sent to ${email}<br>
      For security reasons, do not share this OTP with anyone.
    </p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} ${APP_CONFIG.NAME}. All rights reserved.</p>
    <p>${APP_CONFIG.SUPPORT_EMAIL}</p>
  </div>
</body>
</html>
  `;

  const text = `
Admin Login OTP

Your One-Time Password (OTP) is: ${otp}

This OTP will expire in 10 minutes.

If you did not request this OTP, please ignore this email.

${APP_CONFIG.NAME}
${APP_CONFIG.SUPPORT_EMAIL}
  `;

  return { subject, html, text };
};
