// Public contact form (no authentication required)
const { HTTP_STATUS } = require('../../config/constants');
const { sendEmail } = require('../../config/aws');

// @desc    Submit contact form
// @route   POST /api/customer/contact
// @access  Public
const submitContactForm = async (req, res) => {
  try {
    const Contact = require('../../models/ContactSubmission');

    const {
      name,
      email,
      orderNumber,
      subject,
      message,
    } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Name, email, subject, and message are required',
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Create contact submission
    const contact = await Contact.create({
      name,
      email,
      phone: orderNumber || '', // Store order number in phone field for now
      subject,
      message,
      category: 'General',
      status: 'new',
    });

    // Send confirmation email to customer
    try {
      await sendEmail({
        to: email,
        subject: 'We Received Your Message - Recycle My Device',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1e3a8a;">Thank You for Contacting Us!</h1>
            
            <p style="font-size: 16px;">Hello ${name},</p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              We have received your message and our team will get back to you within 24-48 hours.
            </p>

            <div style="background-color: #f0f4ff; border-left: 4px solid #1e3a8a; padding: 15px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
              <p style="margin: 10px 0 0 0;"><strong>Your Message:</strong></p>
              <p style="margin: 5px 0 0 0; color: #666;">${message}</p>
            </div>

            <p style="font-size: 14px; color: #666;">
              If you have any urgent concerns, please call us at <strong>+44 123 456 7890</strong>
            </p>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Best regards,<br>
              <strong>Recycle My Device Support Team</strong>
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Confirmation email failed:', emailError);
    }

    // Send notification to admin
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL || 'admin@recyclemydevice.com',
        subject: `New Contact Form Submission - ${subject}`,
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1e3a8a;">New Contact Form Submission</h1>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Name:</strong> ${name}</p>
              <p style="margin: 10px 0 0 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 10px 0 0 0;"><strong>Order Number:</strong> ${orderNumber || 'Not provided'}</p>
              <p style="margin: 10px 0 0 0;"><strong>Subject:</strong> ${subject}</p>
              <p style="margin: 10px 0 0 0;"><strong>Message:</strong></p>
              <p style="margin: 5px 0 0 0; padding: 10px; background: white; border-radius: 4px;">${message}</p>
            </div>

            <p style="font-size: 14px; color: #666;">
              Submission ID: <strong>${contact._id}</strong>
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Admin notification failed:', emailError);
    }

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you soon!',
      data: {
        id: contact._id,
        status: contact.status,
      },
    });
  } catch (error) {
    console.error('Submit Contact Form Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to submit contact form',
      error: error.message,
    });
  }
};

// @desc    Get contact form categories
// @route   GET /api/customer/contact/categories
// @access  Public
const getContactCategories = async (req, res) => {
  try {
    const categories = [
      'General Inquiry',
      'Order Support',
      'Device Questions',
      'Payment Issues',
      'Technical Support',
      'Partnership',
      'Feedback',
      'Complaint',
    ];

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Get Contact Categories Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
};

// @desc    Subscribe to newsletter
// @route   POST /api/customer/contact/newsletter
// @access  Public
const subscribeNewsletter = async (req, res) => {
  try {
    const Newsletter = require('../../models/Newsletter');

    const { email } = req.body;

    if (!email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Check if already subscribed
    const existingSubscription = await Newsletter.findOne({ email });

    if (existingSubscription) {
      if (existingSubscription.status === 'active') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'This email is already subscribed to our newsletter',
        });
      } else {
        // Reactivate subscription
        existingSubscription.status = 'active';
        await existingSubscription.save();

        return res.status(HTTP_STATUS.OK).json({
          success: true,
          message: 'Newsletter subscription reactivated successfully!',
        });
      }
    }

    // Create new subscription
    await Newsletter.create({
      email,
      status: 'active',
    });

    // Send welcome email
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to Recycle My Device Newsletter!',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1e3a8a;">Welcome to Our Newsletter!</h1>
            
            <p style="font-size: 16px;">Hello,</p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Thank you for subscribing to the Recycle My Device newsletter! You'll now receive:
            </p>

            <ul style="font-size: 16px; line-height: 1.8;">
              <li>Latest device recycling tips</li>
              <li>Special offers and promotions</li>
              <li>Environmental impact updates</li>
              <li>New device listings</li>
            </ul>

            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              You can unsubscribe at any time by clicking the unsubscribe link in our emails.
            </p>

            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              <strong>Recycle My Device Team</strong>
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
    }

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Successfully subscribed to newsletter!',
    });
  } catch (error) {
    console.error('Subscribe Newsletter Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to subscribe to newsletter',
      error: error.message,
    });
  }
};

module.exports = {
  submitContactForm,
  getContactCategories,
  subscribeNewsletter,
};
