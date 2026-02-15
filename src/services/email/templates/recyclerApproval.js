// Recycler approval email template
const { APP_CONFIG } = require('../../../config/constants');

module.exports = (data) => {
  const { name, companyName, loginUrl } = data;

  const subject = `Welcome to ${APP_CONFIG.NAME} - Application Approved!`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recycler Approved</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0;">Congratulations! 🎉</h1>
    <p style="margin: 10px 0 0 0; font-size: 18px;">Your application has been approved</p>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
    <p>Hello ${name},</p>
    
    <p>Great news! Your application to join ${APP_CONFIG.NAME} as a recycling partner has been <strong>approved</strong>!</p>
    
    <div style="background-color: #fff; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h3 style="color: #f5576c; margin-top: 0;">Your Account Details</h3>
      <p><strong>Company:</strong> ${companyName}</p>
      <p style="margin: 0;">You can now log in to your recycler dashboard and start receiving device recycling orders.</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${loginUrl || APP_CONFIG.FRONTEND_URL + '/recycler/login'}" style="display: inline-block; background-color: #f5576c; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Access Dashboard</a>
    </div>
    
    <div style="background-color: #e8f4f8; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
      <h4 style="margin: 0 0 10px 0; color: #2c3e50;">Getting Started:</h4>
      <ul style="margin: 0; padding-left: 20px;">
        <li>Complete your business profile</li>
        <li>Set your service areas and pricing</li>
        <li>Start accepting orders</li>
        <li>Manage your recycling operations</li>
      </ul>
    </div>
    
    <p>We're excited to have you as part of our recycling network. Together, we can make a positive impact on the environment!</p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #666;">
      Need help getting started? Contact us at ${APP_CONFIG.SUPPORT_EMAIL}
    </p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
    <p>&copy; ${new Date().getFullYear()} ${APP_CONFIG.NAME}. All rights reserved.</p>
  </div>
</body>
</html>
  `;

  const text = `
Congratulations! Your Application Has Been Approved

Hello ${name},

Great news! Your application to join ${APP_CONFIG.NAME} as a recycling partner has been approved!

Company: ${companyName}

You can now log in to your recycler dashboard and start receiving device recycling orders.

Access Dashboard: ${loginUrl || APP_CONFIG.FRONTEND_URL + '/recycler/login'}

Getting Started:
- Complete your business profile
- Set your service areas and pricing
- Start accepting orders
- Manage your recycling operations

We're excited to have you as part of our recycling network!

${APP_CONFIG.NAME}
${APP_CONFIG.SUPPORT_EMAIL}
  `;

  return { subject, html, text };
};
