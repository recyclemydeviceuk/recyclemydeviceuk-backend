// Contact form response email template
const { APP_CONFIG } = require('../../../config/constants');

module.exports = (data) => {
  const { name, originalMessage, responseMessage, respondedBy } = data;

  const subject = `Re: Your Message to ${APP_CONFIG.NAME}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Response</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0;">We've Received Your Message</h1>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
    <p>Hello ${name},</p>
    
    <p>Thank you for contacting ${APP_CONFIG.NAME}. We've reviewed your message and here's our response:</p>
    
    <div style="background-color: #fff; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h3 style="color: #667eea; margin-top: 0;">Our Response</h3>
      <p style="white-space: pre-wrap;">${responseMessage}</p>
      <p style="margin-top: 20px; font-size: 14px; color: #666;">
        - ${respondedBy || 'Support Team'}
      </p>
    </div>
    
    <div style="background-color: #f0f0f0; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: #666;">Your Original Message:</h4>
      <p style="margin: 0; white-space: pre-wrap; font-style: italic;">${originalMessage}</p>
    </div>
    
    <p>If you have any further questions, feel free to reply to this email or contact us directly.</p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #666;">
      ${APP_CONFIG.NAME}<br>
      ${APP_CONFIG.SUPPORT_EMAIL}
    </p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
    <p>&copy; ${new Date().getFullYear()} ${APP_CONFIG.NAME}. All rights reserved.</p>
  </div>
</body>
</html>
  `;

  const text = `
Thank you for contacting ${APP_CONFIG.NAME}

Hello ${name},

Thank you for contacting us. Here's our response:

${responseMessage}

- ${respondedBy || 'Support Team'}

Your Original Message:
${originalMessage}

If you have any further questions, feel free to reply to this email.

${APP_CONFIG.NAME}
${APP_CONFIG.SUPPORT_EMAIL}
  `;

  return { subject, html, text };
};
