// Guest order placement (no authentication required)
// Customers fill checkout form and place orders anonymously
const { HTTP_STATUS } = require('../../config/constants');
const { sendEmail } = require('../../services/email/sesService');
const { generateOrderNumber } = require('../../utils/generateOTP');
const { generateInvoicePDF } = require('../../utils/pdfGenerator');

// @desc    Create order (guest/anonymous)
// @route   POST /api/customer/orders
// @access  Public
const createOrder = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const Device = require('../../models/Device');
    const Recycler = require('../../models/Recycler');

    const {
      deviceId,
      recyclerId,
      deviceCondition,
      storage,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      address,
      city,
      postcode,
    } = req.body;

    // Validation
    if (!deviceId || !recyclerId || !deviceCondition || !amount) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Device, recycler, condition, and amount are required',
      });
    }

    if (!customerName || !customerEmail || !customerPhone) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Customer contact information is required',
      });
    }

    // Verify device exists
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Device not found',
      });
    }

    // Verify recycler exists and is approved
    const recycler = await Recycler.findById(recyclerId);
    if (!recycler || recycler.status !== 'approved') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid recycler selected',
      });
    }

    // Generate unique 6-digit alphanumeric order number
    let orderNumber;
    let isUnique = false;
    
    // Keep generating until we get a unique order number
    while (!isUnique) {
      orderNumber = generateOrderNumber();
      const existingOrder = await Order.findOne({ orderNumber });
      if (!existingOrder) {
        isUnique = true;
      }
    }

    // Create order
    const order = await Order.create({
      orderNumber,
      deviceId,
      recyclerId,
      deviceName: device.name, // Store device name for search
      recyclerName: recycler.companyName, // Store recycler name for search
      deviceCondition,
      storage,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      address,
      city,
      postcode,
      status: 'pending',
      paymentStatus: 'pending',
    });

    // Generate PDF invoice
    let pdfBuffer;
    try {
      pdfBuffer = await generateInvoicePDF({
        orderNumber,
        customerName,
        customerEmail,
        customerPhone,
        address,
        city,
        postcode,
        deviceName: device.name,
        deviceCondition,
        storage,
        amount,
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: order.createdAt,
      });
      console.log('PDF invoice generated successfully');
    } catch (pdfError) {
      console.error('PDF generation failed:', pdfError);
      // Continue without PDF if generation fails
    }

    // Send order confirmation email to customer with PDF attachment
    try {
      const emailOptions = {
        to: customerEmail,
        subject: 'Thank You for Your Order! - Recycle My Device',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 0;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px;">Thank You!</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Your order has been received</p>
            </div>

            <!-- Main Content -->
            <div style="background-color: white; padding: 40px 30px;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hello ${customerName},</p>
              
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 25px;">
                Thank you for choosing Recycle My Device! We've received your order and are excited to help you recycle your device responsibly.
              </p>

              <!-- Order Summary Box -->
              <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #1e3a8a; padding: 25px; margin: 25px 0; border-radius: 8px;">
                <h3 style="color: #1e3a8a; margin: 0 0 15px 0; font-size: 18px;">Order Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #374151; font-weight: bold;">Order Number:</td>
                    <td style="padding: 8px 0; color: #1e3a8a; font-weight: bold; text-align: right;">${orderNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151;">Device:</td>
                    <td style="padding: 8px 0; color: #374151; text-align: right;">${device.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #374151;">Condition:</td>
                    <td style="padding: 8px 0; color: #374151; text-align: right; text-transform: capitalize;">${deviceCondition}</td>
                  </tr>
                  ${storage ? `<tr>
                    <td style="padding: 8px 0; color: #374151;">Storage:</td>
                    <td style="padding: 8px 0; color: #374151; text-align: right;">${storage}</td>
                  </tr>` : ''}
                  <tr style="border-top: 2px solid #1e3a8a;">
                    <td style="padding: 12px 0 0 0; color: #1e3a8a; font-weight: bold; font-size: 18px;">Amount:</td>
                    <td style="padding: 12px 0 0 0; color: #10b981; font-weight: bold; font-size: 20px; text-align: right;">£${amount}</td>
                  </tr>
                </table>
              </div>

              <!-- Invoice Attachment Notice -->
              ${pdfBuffer ? `
              <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 8px;">
                <p style="color: #166534; font-size: 14px; margin: 0;">
                  <strong>Invoice Attached:</strong> Your order invoice has been attached to this email for your records.
                </p>
              </div>
              ` : ''}

              <!-- What's Next Section -->
              <div style="background-color: #f9fafb; padding: 25px; border-radius: 8px; margin: 25px 0;">
                <h3 style="color: #1e3a8a; margin: 0 0 15px 0; font-size: 18px;">What Happens Next?</h3>
                <div style="margin-bottom: 15px;">
                  <div style="display: inline-block; width: 30px; height: 30px; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; border-radius: 50%; text-align: center; line-height: 30px; font-weight: bold; margin-right: 10px;">1</div>
                  <span style="color: #374151; font-size: 15px;">You'll receive a shipping label via email shortly</span>
                </div>
                <div style="margin-bottom: 15px;">
                  <div style="display: inline-block; width: 30px; height: 30px; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; border-radius: 50%; text-align: center; line-height: 30px; font-weight: bold; margin-right: 10px;">2</div>
                  <span style="color: #374151; font-size: 15px;">Pack your device securely in the box</span>
                </div>
                <div style="margin-bottom: 15px;">
                  <div style="display: inline-block; width: 30px; height: 30px; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; border-radius: 50%; text-align: center; line-height: 30px; font-weight: bold; margin-right: 10px;">3</div>
                  <span style="color: #374151; font-size: 15px;">Ship your device using the provided label</span>
                </div>
                <div>
                  <div style="display: inline-block; width: 30px; height: 30px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border-radius: 50%; text-align: center; line-height: 30px; font-weight: bold; margin-right: 10px;">4</div>
                  <span style="color: #374151; font-size: 15px;">Once received and verified, payment will be processed</span>
                </div>
              </div>

              <!-- Track Order CTA -->
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 14px; margin-bottom: 15px;">
                  Keep this order number for tracking: <strong style="color: #1e3a8a;">${orderNumber}</strong>
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f3f4f6; text-align: center; padding: 30px 20px;">
              <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                Questions? We're here to help!
              </p>
              <p style="margin: 10px 0;">
                <a href="mailto:support@recyclemydevice.com" style="color: #1e3a8a; text-decoration: none; font-weight: bold;">support@recyclemydevice.com</a>
              </p>
              <p style="color: #9ca3af; font-size: 13px; margin: 20px 0 5px 0;">
                © ${new Date().getFullYear()} Recycle My Device. All rights reserved.
              </p>
            </div>
          </div>
        `,
      };

      // Attach PDF invoice if generated successfully
      if (pdfBuffer) {
        emailOptions.attachments = [{
          filename: `Invoice-${orderNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        }];
      }

      await sendEmail(emailOptions);
      console.log(`Order confirmation email${pdfBuffer ? ' with PDF invoice' : ''} sent to ${customerEmail}`);
    } catch (emailError) {
      console.error('Order confirmation email failed:', emailError);
    }

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        orderNumber: order.orderNumber,
        orderId: order._id,
        amount: order.amount,
        status: order.status,
      },
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to create order',
      error: error.message,
    });
  }
};

// @desc    Track order by order number
// @route   GET /api/customer/orders/track/:orderNumber
// @access  Public
const trackOrder = async (req, res) => {
  try {
    const Order = require('../../models/Order');

    const { orderNumber } = req.params;

    const order = await Order.findOne({ orderNumber })
      .populate('deviceId', 'name brand model image')
      .populate('recyclerId', 'name companyName')
      .select('-customerEmail -customerPhone');

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Track Order Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to track order',
      error: error.message,
    });
  }
};

// @desc    Get order by ID and email (for verification)
// @route   POST /api/customer/orders/verify
// @access  Public
const verifyOrder = async (req, res) => {
  try {
    const Order = require('../../models/Order');

    const { orderNumber, email } = req.body;

    if (!orderNumber || !email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Order number and email are required',
      });
    }

    const order = await Order.findOne({ 
      orderNumber, 
      customerEmail: email 
    })
      .populate('deviceId', 'name brand model image')
      .populate('recyclerId', 'name companyName');

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order not found or email does not match',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Verify Order Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to verify order',
      error: error.message,
    });
  }
};

// @desc    Get price quote for device
// @route   POST /api/customer/orders/quote
// @access  Public
const getPriceQuote = async (req, res) => {
  try {
    const Device = require('../../models/Device');
    const { deviceId, condition, storage } = req.body;

    if (!deviceId || !condition) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Device ID and condition are required',
      });
    }

    const device = await Device.findById(deviceId);

    if (!device) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Device not found',
      });
    }

    // Calculate price based on condition (simplified logic)
    let priceMultiplier = 1;
    switch (condition.toLowerCase()) {
      case 'excellent':
        priceMultiplier = 1;
        break;
      case 'good':
        priceMultiplier = 0.85;
        break;
      case 'fair':
        priceMultiplier = 0.7;
        break;
      case 'poor':
        priceMultiplier = 0.5;
        break;
      default:
        priceMultiplier = 0.8;
    }

    const estimatedPrice = (device.basePrice * priceMultiplier).toFixed(2);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        deviceId: device._id,
        deviceName: device.name,
        condition,
        storage,
        estimatedPrice: parseFloat(estimatedPrice),
        basePrice: device.basePrice,
      },
    });
  } catch (error) {
    console.error('Get Price Quote Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get price quote',
      error: error.message,
    });
  }
};

// @desc    Cancel order
// @route   POST /api/customer/orders/:orderNumber/cancel
// @access  Public
const cancelOrder = async (req, res) => {
  try {
    const Order = require('../../models/Order');

    const { orderNumber } = req.params;
    const { email, reason } = req.body;

    if (!email) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Email is required for verification',
      });
    }

    const order = await Order.findOne({ 
      orderNumber, 
      customerEmail: email 
    });

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order not found or email does not match',
      });
    }

    // Only allow cancellation if order is still pending
    if (order.status !== 'pending') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Order cannot be cancelled at this stage',
      });
    }

    order.status = 'cancelled';
    order.cancellationReason = reason || 'Customer requested cancellation';
    await order.save();

    // Send cancellation email
    try {
      await sendEmail({
        to: email,
        subject: 'Order Cancellation Confirmation',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ef4444;">Order Cancelled</h1>
            
            <p style="font-size: 16px;">Hello ${order.customerName},</p>
            
            <p style="font-size: 16px;">
              Your order <strong>${orderNumber}</strong> has been cancelled as requested.
            </p>

            <p style="color: #666; font-size: 14px;">
              If you have any questions, please contact us at support@recyclemydevice.com
            </p>

            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              <strong>Recycle My Device Team</strong>
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel Order Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  trackOrder,
  verifyOrder,
  getPriceQuote,
  cancelOrder,
};
