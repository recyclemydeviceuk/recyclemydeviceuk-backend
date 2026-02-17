// Counter Offer Controller
const CounterOffer = require('../models/CounterOffer');
const Order = require('../models/Order');
const Admin = require('../models/Admin');
const Recycler = require('../models/Recycler');
const { sendEmail } = require('../config/aws');
const { HTTP_STATUS } = require('../config/constants');
const { uploadMultipleFiles } = require('../services/storage/s3Service');
const crypto = require('crypto');

// @desc    Create counter offer
// @route   POST /api/counter-offers
// @access  Private/Recycler Only
const createCounterOffer = async (req, res) => {
  try {
    const { orderId, amendedPrice, reason, images } = req.body;

    // Validate required fields
    if (!orderId || !amendedPrice || !reason) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Order ID, amended price, and reason are required',
      });
    }

    // Only recyclers can create counter offers
    if (req.user.role !== 'recycler') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only recyclers can create counter offers',
      });
    }

    // Get order details
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if there's already a pending counter offer
    const existingOffer = await CounterOffer.findOne({
      orderId,
      status: 'pending',
    });

    if (existingOffer) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'There is already a pending counter offer for this order',
      });
    }

    // Generate unique token for customer access
    const token = crypto.randomBytes(32).toString('hex');

    // Look up the recycler by email
    const creator = await Recycler.findOne({ email: req.user.email });
    
    if (!creator) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Recycler not found',
      });
    }

    // Create counter offer
    const counterOffer = await CounterOffer.create({
      orderId,
      orderNumber: order.orderNumber,
      originalPrice: order.amount,
      amendedPrice,
      reason,
      images: images || [],
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      createdBy: creator._id,
      createdByModel: 'Recycler',
      createdByName: req.user.name || req.user.email,
      token,
      status: 'pending',
    });

    // Update order status to counter_offer_pending
    order.status = 'counter_offer_pending';
    await order.save();

    // Send email to customer
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const counterOfferUrl = `${frontendUrl}/counter-offer/${token}`;

    try {
      await sendEmail({
        to: order.customerEmail,
        subject: 'Counter Offer for Your Device - Recycle My Device',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 0;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">💰 Counter Offer Received</h1>
              <p style="color: #fef3c7; margin: 10px 0 0 0; font-size: 15px;">We have a revised offer for your device</p>
            </div>

            <!-- Main Content -->
            <div style="background-color: white; padding: 40px 30px;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hello ${order.customerName},</p>
              
              <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 25px;">
                We have collected and inspected your device (Order #${order.orderNumber}). Based on our inspection, we would like to offer you a revised price.
              </p>

              <!-- TOP CTA BUTTON -->
              <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 25px; margin: 25px 0; border-radius: 12px; text-align: center;">
                <h3 style="color: white; margin: 0 0 15px 0; font-size: 20px;">⏰ Action Required - Review Within 7 Days</h3>
                <p style="color: #dcfce7; font-size: 15px; margin-bottom: 20px;">
                  Please review and respond to this offer to proceed with your order.
                </p>
                <a href="${counterOfferUrl}" 
                   style="display: inline-block; background: white; color: #16a34a; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); margin-bottom: 10px;">
                  ✓ Review Counter Offer
                </a>
                <p style="color: #dcfce7; font-size: 13px; margin-top: 15px;">
                  Click above to accept or decline this offer on the review page
                </p>
              </div>

              <!-- Price Comparison -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; padding: 25px; margin: 25px 0; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                  <div>
                    <p style="color: #92400e; font-size: 14px; margin: 0;">Original Offer:</p>
                    <p style="color: #78350f; font-size: 24px; font-weight: bold; margin: 5px 0 0 0;">£${order.amount.toFixed(2)}</p>
                  </div>
                  <div style="font-size: 24px;">→</div>
                  <div>
                    <p style="color: #92400e; font-size: 14px; margin: 0;">Revised Offer:</p>
                    <p style="color: #16a34a; font-size: 24px; font-weight: bold; margin: 5px 0 0 0;">£${amendedPrice.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <!-- Reason -->
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #374151; font-size: 16px; margin: 0 0 10px 0;">📝 Reason for Adjustment:</h3>
                <p style="color: #6b7280; margin: 0; line-height: 1.6;">${reason}</p>
              </div>

              ${images && images.length > 0 ? `
              <div style="margin: 20px 0;">
                <h3 style="color: #374151; font-size: 16px; margin: 0 0 15px 0;">📸 Device Images:</h3>
                <p style="color: #6b7280; font-size: 14px; margin-bottom: 15px;">We've attached images of your device for your reference.</p>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px;">
                  ${images.map(img => `
                    <img src="${img.url}" alt="Device" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; border: 2px solid #e5e7eb;" />
                  `).join('')}
                </div>
              </div>
              ` : ''}

              <!-- Alternative Link -->
              <p style="font-size: 13px; color: #9ca3af; margin-top: 30px; text-align: center;">
                Button not working? Copy this link:<br>
                <a href="${counterOfferUrl}" style="color: #f59e0b; word-break: break-all; font-size: 12px;">${counterOfferUrl}</a>
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f3f4f6; text-align: center; padding: 30px 20px;">
              <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                Questions about this counter offer?
              </p>
              <p style="margin: 10px 0;">
                <a href="mailto:support@recyclemydevice.com" style="color: #f59e0b; text-decoration: none; font-weight: bold;">support@recyclemydevice.com</a>
              </p>
              <p style="color: #9ca3af; font-size: 13px; margin: 20px 0 5px 0;">
                © ${new Date().getFullYear()} Recycle My Device. All rights reserved.
              </p>
            </div>
          </div>
        `,
      });
      console.log(`Counter offer email sent to ${order.customerEmail}`);
    } catch (emailError) {
      console.error('Failed to send counter offer email:', emailError);
    }

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Counter offer created successfully',
      data: counterOffer,
    });
  } catch (error) {
    console.error('Create Counter Offer Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to create counter offer',
      error: error.message,
    });
  }
};

// @desc    Get counter offer by token (for customer)
// @route   GET /api/counter-offers/token/:token
// @access  Public
const getCounterOfferByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const counterOffer = await CounterOffer.findOne({ token })
      .populate('orderId', 'orderNumber deviceName deviceCondition storage');

    if (!counterOffer) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Counter offer not found',
      });
    }

    // Check if expired
    if (counterOffer.expiresAt < new Date() && counterOffer.status === 'pending') {
      counterOffer.status = 'expired';
      await counterOffer.save();
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: counterOffer,
    });
  } catch (error) {
    console.error('Get Counter Offer By Token Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch counter offer',
      error: error.message,
    });
  }
};

// @desc    Accept counter offer
// @route   POST /api/counter-offers/:token/accept
// @access  Public
const acceptCounterOffer = async (req, res) => {
  try {
    const { token } = req.params;
    const { customerNotes } = req.body;

    const counterOffer = await CounterOffer.findOne({ token });

    if (!counterOffer) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Counter offer not found',
      });
    }

    if (counterOffer.status !== 'pending') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Counter offer has already been ${counterOffer.status}`,
      });
    }

    // Check if expired
    if (counterOffer.expiresAt < new Date()) {
      counterOffer.status = 'expired';
      await counterOffer.save();
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Counter offer has expired',
      });
    }

    // Update counter offer
    counterOffer.status = 'accepted';
    counterOffer.respondedAt = new Date();
    counterOffer.customerNotes = customerNotes;
    await counterOffer.save();

    // Update order with new price and status
    const order = await Order.findById(counterOffer.orderId);
    if (order) {
      order.amount = counterOffer.amendedPrice;
      order.status = 'confirmed'; // Move to confirmed after acceptance
      await order.save();
    }

    // Send confirmation email to customer
    try {
      await sendEmail({
        to: counterOffer.customerEmail,
        subject: 'Counter Offer Accepted - Recycle My Device',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #16a34a; margin: 0;">✓ Counter Offer Accepted!</h1>
              <p style="color: #666; margin: 5px 0;">Thank you for your response</p>
            </div>
            
            <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h2 style="color: #15803d; margin: 0 0 10px 0;">Great News!</h2>
              <p style="color: #166534; margin: 0;">
                You have accepted our counter offer of <strong>£${counterOffer.amendedPrice.toFixed(2)}</strong> for order <strong>#${counterOffer.orderNumber}</strong>.
              </p>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin: 0 0 15px 0;">📋 Next Steps:</h3>
              <ul style="color: #6b7280; line-height: 1.8;">
                <li>We will process your order with the new agreed price</li>
                <li>You'll receive payment confirmation once the order is completed</li>
                <li>Funds will be transferred within 3-5 business days</li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              Best regards,<br>
              <strong style="color: #16a34a;">Recycle My Device Team</strong><br>
              <a href="mailto:support@recyclemydevice.com" style="color: #16a34a;">support@recyclemydevice.com</a>
            </p>
          </div>
        `,
      });
      console.log(`Acceptance email sent to customer: ${counterOffer.customerEmail}`);
    } catch (emailError) {
      console.error('Failed to send acceptance email to customer:', emailError);
    }

    // Send notification email to recycler
    try {
      // Get recycler email from the counter offer
      const recycler = await Recycler.findById(counterOffer.createdBy);
      if (recycler && recycler.email) {
        await sendEmail({
          to: recycler.email,
          subject: `Counter Offer Accepted - Order #${counterOffer.orderNumber}`,
          htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #16a34a; margin: 0;">✓ Counter Offer Accepted!</h1>
                <p style="color: #666; margin: 5px 0;">Customer has accepted your offer</p>
              </div>
              
              <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 20px 0; border-radius: 5px;">
                <h2 style="color: #15803d; margin: 0 0 10px 0;">Good News!</h2>
                <p style="color: #166534; margin: 0;">
                  The customer has accepted your counter offer of <strong>£${counterOffer.amendedPrice.toFixed(2)}</strong> for order <strong>#${counterOffer.orderNumber}</strong>.
                </p>
              </div>
              
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #374151; margin: 0 0 15px 0;">📋 Order Details:</h3>
                <p style="color: #6b7280; margin: 5px 0;"><strong>Order Number:</strong> ${counterOffer.orderNumber}</p>
                <p style="color: #6b7280; margin: 5px 0;"><strong>Customer:</strong> ${counterOffer.customerName}</p>
                <p style="color: #6b7280; margin: 5px 0;"><strong>Customer Email:</strong> ${counterOffer.customerEmail}</p>
                <p style="color: #6b7280; margin: 5px 0;"><strong>Agreed Price:</strong> £${counterOffer.amendedPrice.toFixed(2)}</p>
              </div>

              <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1e40af; margin: 0 0 10px 0;">Next Steps:</h3>
                <p style="color: #1e3a8a; margin: 0;">
                  Please proceed with collecting the device and processing the order. The order status has been updated to "confirmed".
                </p>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                Best regards,<br>
                <strong style="color: #16a34a;">Recycle My Device Team</strong><br>
                <a href="mailto:support@recyclemydevice.com" style="color: #16a34a;">support@recyclemydevice.com</a>
              </p>
            </div>
          `,
        });
        console.log(`Acceptance notification sent to recycler: ${recycler.email}`);
      }
    } catch (emailError) {
      console.error('Failed to send acceptance notification to recycler:', emailError);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Counter offer accepted successfully',
      data: counterOffer,
    });
  } catch (error) {
    console.error('Accept Counter Offer Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to accept counter offer',
      error: error.message,
    });
  }
};

// @desc    Decline counter offer
// @route   POST /api/counter-offers/:token/decline
// @access  Public
const declineCounterOffer = async (req, res) => {
  try {
    const { token } = req.params;
    const { customerNotes } = req.body;

    const counterOffer = await CounterOffer.findOne({ token });

    if (!counterOffer) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Counter offer not found',
      });
    }

    if (counterOffer.status !== 'pending') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Counter offer has already been ${counterOffer.status}`,
      });
    }

    // Update counter offer
    counterOffer.status = 'declined';
    counterOffer.respondedAt = new Date();
    counterOffer.customerNotes = customerNotes;
    await counterOffer.save();

    // Update order status
    const order = await Order.findById(counterOffer.orderId);
    if (order) {
      order.status = 'cancelled'; // Cancel order if counter offer declined
      order.cancellationReason = 'Customer declined counter offer';
      await order.save();
    }

    // Send confirmation email to customer
    try {
      await sendEmail({
        to: counterOffer.customerEmail,
        subject: 'Counter Offer Declined - Recycle My Device',
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; margin: 0;">Counter Offer Declined</h1>
              <p style="color: #666; margin: 5px 0;">We've received your response</p>
            </div>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <p style="color: #991b1b; margin: 0;">
                You have declined our counter offer of <strong>£${counterOffer.amendedPrice.toFixed(2)}</strong> for order <strong>#${counterOffer.orderNumber}</strong>.
              </p>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #6b7280; margin: 0;">
                Your order has been cancelled as per your decision. We appreciate you considering our offer.
              </p>
              ${customerNotes ? `
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                <p style="color: #374151; margin: 0 0 5px 0; font-weight: bold;">Your feedback:</p>
                <p style="color: #6b7280; margin: 0; font-style: italic;">"${customerNotes}"</p>
              </div>
              ` : ''}
            </div>
            
            <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin: 0 0 10px 0;">We'd Love to Help Again!</h3>
              <p style="color: #1e3a8a; margin: 0;">
                If you have other devices to recycle or would like to discuss this further, please don't hesitate to contact us.
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              Best regards,<br>
              <strong style="color: #1b981b;">Recycle My Device Team</strong><br>
              <a href="mailto:support@recyclemydevice.com" style="color: #1b981b;">support@recyclemydevice.com</a>
            </p>
          </div>
        `,
      });
      console.log(`Decline email sent to customer: ${counterOffer.customerEmail}`);
    } catch (emailError) {
      console.error('Failed to send decline email to customer:', emailError);
    }

    // Send notification email to recycler
    try {
      // Get recycler email from the counter offer
      const recycler = await Recycler.findById(counterOffer.createdBy);
      if (recycler && recycler.email) {
        await sendEmail({
          to: recycler.email,
          subject: `Counter Offer Declined - Order #${counterOffer.orderNumber}`,
          htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #dc2626; margin: 0;">Counter Offer Declined</h1>
                <p style="color: #666; margin: 5px 0;">Customer has declined your offer</p>
              </div>
              
              <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 5px;">
                <h2 style="color: #991b1b; margin: 0 0 10px 0;">Update</h2>
                <p style="color: #991b1b; margin: 0;">
                  The customer has declined your counter offer of <strong>£${counterOffer.amendedPrice.toFixed(2)}</strong> for order <strong>#${counterOffer.orderNumber}</strong>.
                </p>
              </div>
              
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #374151; margin: 0 0 15px 0;">📋 Order Details:</h3>
                <p style="color: #6b7280; margin: 5px 0;"><strong>Order Number:</strong> ${counterOffer.orderNumber}</p>
                <p style="color: #6b7280; margin: 5px 0;"><strong>Customer:</strong> ${counterOffer.customerName}</p>
                <p style="color: #6b7280; margin: 5px 0;"><strong>Customer Email:</strong> ${counterOffer.customerEmail}</p>
                <p style="color: #6b7280; margin: 5px 0;"><strong>Counter Offer Price:</strong> £${counterOffer.amendedPrice.toFixed(2)}</p>
                ${customerNotes ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                  <p style="color: #374151; margin: 0 0 5px 0; font-weight: bold;">Customer feedback:</p>
                  <p style="color: #6b7280; margin: 0; font-style: italic;">"${customerNotes}"</p>
                </div>
                ` : ''}
              </div>

              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #374151; margin: 0 0 10px 0;">Status Update:</h3>
                <p style="color: #6b7280; margin: 0;">
                  The order has been cancelled. No further action is required for this order.
                </p>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                Best regards,<br>
                <strong style="color: #1b981b;">Recycle My Device Team</strong><br>
                <a href="mailto:support@recyclemydevice.com" style="color: #1b981b;">support@recyclemydevice.com</a>
              </p>
            </div>
          `,
        });
        console.log(`Decline notification sent to recycler: ${recycler.email}`);
      }
    } catch (emailError) {
      console.error('Failed to send decline notification to recycler:', emailError);
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Counter offer declined successfully',
      data: counterOffer,
    });
  } catch (error) {
    console.error('Decline Counter Offer Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to decline counter offer',
      error: error.message,
    });
  }
};

// @desc    Get counter offers for an order
// @route   GET /api/counter-offers/order/:orderId
// @access  Private/Admin or Recycler
const getCounterOffersByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const counterOffers = await CounterOffer.find({ orderId }).sort({ createdAt: -1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: counterOffers,
    });
  } catch (error) {
    console.error('Get Counter Offers By Order Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch counter offers',
      error: error.message,
    });
  }
};

// @desc    Upload counter offer images
// @route   POST /api/counter-offers/upload-images
// @access  Private/Admin or Recycler
const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'No images provided',
      });
    }

    // Upload images to S3
    const result = await uploadMultipleFiles(req.files, 'counter-offers');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Images uploaded successfully',
      data: result.files.map(file => ({
        url: file.url,
        publicId: file.key, // Map 'key' to 'publicId' for model compatibility
      })),
    });
  } catch (error) {
    console.error('Upload Images Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message,
    });
  }
};

module.exports = {
  createCounterOffer,
  getCounterOfferByToken,
  acceptCounterOffer,
  declineCounterOffer,
  getCounterOffersByOrder,
  uploadImages,
};
