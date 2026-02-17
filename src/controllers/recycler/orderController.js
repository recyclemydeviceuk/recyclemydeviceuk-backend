// Recycler orders
const { HTTP_STATUS, PAGINATION } = require('../../config/constants');
const { sendEmail } = require('../../config/aws');

// @desc    Get all orders for recycler
// @route   GET /api/recycler/orders
// @access  Private/Recycler
const getAllOrders = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const mongoose = require('mongoose');

    // Get recycler ID from JWT token
    const recyclerIdString = req.user.id || req.user._id;
    console.log('Recycler ID from token:', recyclerIdString);
    console.log('Full req.user:', req.user);

    // Convert to ObjectId if it's a valid string
    let recyclerId;
    try {
      recyclerId = mongoose.Types.ObjectId.isValid(recyclerIdString) 
        ? new mongoose.Types.ObjectId(recyclerIdString)
        : recyclerIdString;
    } catch (err) {
      console.error('Error converting recyclerId to ObjectId:', err);
      recyclerId = recyclerIdString;
    }

    console.log('Converted recyclerId:', recyclerId);

    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const { status, paymentStatus, search, startDate, endDate } = req.query;

    // Build filter
    const filter = { recyclerId };

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const CounterOffer = require('../../models/CounterOffer');

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('deviceId', 'name brand model image'),
      Order.countDocuments(filter),
    ]);

    // Populate counter offers for each order
    for (let order of orders) {
      const counterOffer = await CounterOffer.findOne({ orderId: order._id })
        .sort({ createdAt: -1 })
        .select('status amendedPrice originalPrice reason createdAt respondedAt');
      
      if (counterOffer) {
        order._doc.counterOffer = counterOffer;
      }
    }

    console.log('Filter being used:', filter);
    console.log('Total orders found:', total);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get All Orders Error:', error);
    console.error('Error stack:', error.stack);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/recycler/orders/:id
// @access  Private/Recycler
const getOrderById = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const mongoose = require('mongoose');

    const recyclerId = new mongoose.Types.ObjectId(req.user._id || req.user.id);

    const order = await Order.findOne({ _id: req.params.id, recyclerId })
      .populate('deviceId', 'name brand model specifications image');

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
    console.error('Get Order By ID Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message,
    });
  }
};

// @desc    Update order status
// @route   PATCH /api/recycler/orders/:id/status
// @access  Private/Recycler
const updateOrderStatus = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const User = require('../../models/User');
    const mongoose = require('mongoose');

    const recyclerId = new mongoose.Types.ObjectId(req.user._id || req.user.id);
    const { status, notes } = req.body;

    if (!status) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Status is required',
      });
    }

    const order = await Order.findOne({ _id: req.params.id, recyclerId })
      .populate('deviceId', 'name brand model');

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order not found',
      });
    }

    const previousStatus = order.status;
    order.status = status;
    if (notes) order.statusNotes = notes;

    // Automatically set payment status based on order status
    // If order is completed, payment status becomes 'paid'
    // For all other statuses, payment status is 'pending'
    if (status === 'completed') {
      order.paymentStatus = 'paid';
      order.paidAt = new Date();
      order.completedAt = new Date();
    } else {
      order.paymentStatus = 'pending';
    }

    await order.save();

    // Send email notification to customer
    if (order.userId && order.userId.email) {
      try {
        let emailSubject = '';
        let emailMessage = '';

        switch (status) {
          case 'processing':
            emailSubject = 'Your Device Order is Being Processed';
            emailMessage = `
              <p>Your order <strong>#${order.orderNumber}</strong> is now being processed.</p>
              <p>We have received your ${order.deviceId?.name} and are evaluating its condition.</p>
            `;
            break;
          case 'completed':
            emailSubject = 'Your Order Has Been Completed';
            emailMessage = `
              <p>Great news! Your order <strong>#${order.orderNumber}</strong> has been completed.</p>
              <p>The payment of <strong>£${order.amount}</strong> will be processed shortly.</p>
            `;
            break;
          case 'cancelled':
            emailSubject = 'Your Order Has Been Cancelled';
            emailMessage = `
              <p>Your order <strong>#${order.orderNumber}</strong> has been cancelled.</p>
              ${notes ? `<p><strong>Reason:</strong> ${notes}</p>` : ''}
            `;
            break;
          default:
            emailSubject = 'Order Status Update';
            emailMessage = `
              <p>Your order <strong>#${order.orderNumber}</strong> status has been updated to <strong>${status}</strong>.</p>
            `;
        }

        await sendEmail({
          to: order.userId.email,
          subject: emailSubject,
          htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #1e3a8a;">Order Update</h1>
              
              <p style="font-size: 16px;">Hello ${order.userId.name},</p>
              
              ${emailMessage}
              
              <div style="background-color: #f0f4ff; border-left: 4px solid #1e3a8a; padding: 15px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p style="margin: 10px 0 0 0;"><strong>Device:</strong> ${order.deviceId?.name || 'N/A'}</p>
                <p style="margin: 10px 0 0 0;"><strong>Amount:</strong> £${order.amount}</p>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Best regards,<br>
                <strong>Recycle My Device Team</strong>
              </p>
            </div>
          `,
        });
        console.log(`Order status email sent successfully to ${order.customerEmail}`);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
    } else {
      console.log('No customer email found for order:', order.orderNumber);
    }

    // Send review request email if order is completed AND paid
    if (status === 'completed' && order.paymentStatus === 'paid' && order.customerEmail) {
      try {
        console.log(`Sending review request email to: ${order.customerEmail}`);
        
        const reviewLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/review?order=${order.orderNumber}&email=${order.customerEmail}`;
        
        await sendEmail({
          to: order.customerEmail,
          subject: 'Share Your Experience - Recycle My Device',
          htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1b981b; margin: 0;">Recycle My Device</h1>
                <p style="color: #666; margin: 5px 0;">Sustainable Device Recycling</p>
              </div>
              
              <h2 style="color: #333; border-bottom: 3px solid #1b981b; padding-bottom: 10px;">How Was Your Experience?</h2>
              
              <p style="font-size: 16px; color: #333;">Hello ${order.customerName},</p>
              
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Thank you for choosing Recycle My Device! We're thrilled that your order <strong>#${order.orderNumber}</strong> has been completed and payment of <strong>£${order.amount}</strong> has been processed.
              </p>
              
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                We'd love to hear about your experience! Your feedback helps us improve our services and helps other customers make informed decisions.
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${reviewLink}" style="display: inline-block; background: #1b981b; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px rgba(27, 152, 27, 0.3);">
                  Leave a Review
                </a>
              </div>
              
              <div style="background-color: #f0f9f0; border-left: 4px solid #1b981b; padding: 20px; margin: 30px 0; border-radius: 5px;">
                <p style="margin: 0; color: #333;"><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p style="margin: 10px 0 0 0; color: #333;"><strong>Device:</strong> ${order.deviceId?.name || order.deviceName || 'N/A'}</p>
                <p style="margin: 10px 0 0 0; color: #333;"><strong>Amount Paid:</strong> £${order.amount}</p>
              </div>
              
              <p style="font-size: 14px; color: #666; line-height: 1.6;">
                Your review will be visible on our website after approval and will help us maintain our high standards of service.
              </p>
              
              <p style="color: #666; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
                Best regards,<br>
                <strong style="color: #1b981b;">Recycle My Device Team</strong><br>
                <a href="mailto:support@recyclemydevice.co.uk" style="color: #1b981b;">support@recyclemydevice.co.uk</a>
              </p>
            </div>
          `,
        });
        console.log(`Review request email sent successfully to ${order.customerEmail}`);
      } catch (emailError) {
        console.error('Review request email sending failed:', emailError);
      }
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Order status updated successfully',
      data: order,
    });
  } catch (error) {
    console.error('Update Order Status Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message,
    });
  }
};

// @desc    Update payment status
// @route   PATCH /api/recycler/orders/:id/payment
// @access  Private/Recycler
const updatePaymentStatus = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const mongoose = require('mongoose');

    console.log('Update Payment Status - Request Body:', req.body);
    console.log('Update Payment Status - Params:', req.params);

    const recyclerId = new mongoose.Types.ObjectId(req.user._id || req.user.id);
    const { paymentStatus, transactionId } = req.body;

    console.log('Extracted paymentStatus:', paymentStatus);

    if (!paymentStatus) {
      console.log('Payment status is missing!');
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Payment status is required',
      });
    }

    const order = await Order.findOne({ _id: req.params.id, recyclerId });

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.paymentStatus = paymentStatus;
    if (transactionId) order.transactionId = transactionId;
    if (paymentStatus === 'paid') order.paidAt = new Date();

    await order.save();

    // Send email notification for payment status changes
    if (order.customerEmail) {
      try {
        let emailSubject = '';
        let emailMessage = '';

        switch (paymentStatus) {
          case 'pending':
            emailSubject = 'Payment Pending - Recycle My Device';
            emailMessage = `
              <p>The payment for your order <strong>#${order.orderNumber}</strong> is currently pending.</p>
              <p>We will process your payment once the order is completed.</p>
            `;
            break;
          case 'processing':
            emailSubject = 'Payment Processing - Recycle My Device';
            emailMessage = `
              <p>We are processing the payment for your order <strong>#${order.orderNumber}</strong>.</p>
              <p>Amount: <strong>£${order.amount}</strong></p>
              <p>You will receive confirmation once the payment is completed.</p>
            `;
            break;
          case 'paid':
            emailSubject = 'Payment Completed - Recycle My Device';
            emailMessage = `
              <p>Great news! The payment for your order <strong>#${order.orderNumber}</strong> has been completed.</p>
              <p>Amount Paid: <strong>£${order.amount}</strong></p>
              ${transactionId ? `<p>Transaction ID: <strong>${transactionId}</strong></p>` : ''}
              <p>The funds will be transferred to your account within 3-5 business days.</p>
              <p>Thank you for choosing Recycle My Device!</p>
            `;
            break;
          case 'failed':
            emailSubject = 'Payment Failed - Recycle My Device';
            emailMessage = `
              <p>Unfortunately, the payment for your order <strong>#${order.orderNumber}</strong> has failed.</p>
              <p>Our team will contact you shortly to resolve this issue.</p>
              <p>If you have any questions, please contact our support team.</p>
            `;
            break;
          case 'refunded':
            emailSubject = 'Payment Refunded - Recycle My Device';
            emailMessage = `
              <p>The payment for your order <strong>#${order.orderNumber}</strong> has been refunded.</p>
              <p>Refund Amount: <strong>£${order.amount}</strong></p>
              <p>The funds will be returned to your original payment method within 5-10 business days.</p>
            `;
            break;
          default:
            emailSubject = 'Payment Status Update';
            emailMessage = `
              <p>The payment status for your order <strong>#${order.orderNumber}</strong> has been updated to <strong>${paymentStatus}</strong>.</p>
            `;
        }

        console.log(`Sending payment status email to: ${order.customerEmail}`);
        
        await sendEmail({
          to: order.customerEmail,
          subject: emailSubject,
          htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1b981b; margin: 0;">Recycle My Device</h1>
                <p style="color: #666; margin: 5px 0;">Sustainable Device Recycling</p>
              </div>
              
              <h2 style="color: #333; border-bottom: 3px solid #1b981b; padding-bottom: 10px;">Payment Update</h2>
              
              <p style="font-size: 16px; color: #333;">Hello ${order.customerName},</p>
              
              ${emailMessage}
              
              <div style="background-color: #f0f9f0; border-left: 4px solid #1b981b; padding: 20px; margin: 30px 0; border-radius: 5px;">
                <p style="margin: 0; color: #333;"><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p style="margin: 10px 0 0 0; color: #333;"><strong>Device:</strong> ${order.deviceId?.name || order.deviceName || 'N/A'}</p>
                <p style="margin: 10px 0 0 0; color: #333;"><strong>Amount:</strong> £${order.amount}</p>
                <p style="margin: 10px 0 0 0; color: #333;"><strong>Payment Status:</strong> <span style="background: ${paymentStatus === 'paid' ? '#1b981b' : '#f59e0b'}; color: white; padding: 4px 12px; border-radius: 4px; font-weight: bold;">${paymentStatus.toUpperCase()}</span></p>
                ${transactionId ? `<p style="margin: 10px 0 0 0; color: #333;"><strong>Transaction ID:</strong> ${transactionId}</p>` : ''}
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
                Best regards,<br>
                <strong style="color: #1b981b;">Recycle My Device Team</strong><br>
                <a href="mailto:support@recyclemydevice.co.uk" style="color: #1b981b;">support@recyclemydevice.co.uk</a>
              </p>
            </div>
          `,
        });
        
        console.log(`Payment status email sent successfully to ${order.customerEmail}`);
      } catch (emailError) {
        console.error('Payment email sending failed:', emailError);
      }
    } else {
      console.log('No customer email found for order:', order.orderNumber);
    }

    // Send review request email if payment is paid AND order is completed
    if (paymentStatus === 'paid' && order.status === 'completed' && order.customerEmail) {
      try {
        console.log(`Sending review request email to: ${order.customerEmail}`);
        
        const reviewLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/review?order=${order.orderNumber}&email=${order.customerEmail}`;
        
        await sendEmail({
          to: order.customerEmail,
          subject: 'Share Your Experience - Recycle My Device',
          htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1b981b; margin: 0;">Recycle My Device</h1>
                <p style="color: #666; margin: 5px 0;">Sustainable Device Recycling</p>
              </div>
              
              <h2 style="color: #333; border-bottom: 3px solid #1b981b; padding-bottom: 10px;">How Was Your Experience?</h2>
              
              <p style="font-size: 16px; color: #333;">Hello ${order.customerName},</p>
              
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                Thank you for choosing Recycle My Device! We're thrilled that your order <strong>#${order.orderNumber}</strong> has been completed and payment of <strong>£${order.amount}</strong> has been processed.
              </p>
              
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                We'd love to hear about your experience! Your feedback helps us improve our services and helps other customers make informed decisions.
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${reviewLink}" style="display: inline-block; background: #1b981b; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px rgba(27, 152, 27, 0.3);">
                  Leave a Review
                </a>
              </div>
              
              <div style="background-color: #f0f9f0; border-left: 4px solid #1b981b; padding: 20px; margin: 30px 0; border-radius: 5px;">
                <p style="margin: 0; color: #333;"><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p style="margin: 10px 0 0 0; color: #333;"><strong>Device:</strong> ${order.deviceId?.name || order.deviceName || 'N/A'}</p>
                <p style="margin: 10px 0 0 0; color: #333;"><strong>Amount Paid:</strong> £${order.amount}</p>
              </div>
              
              <p style="font-size: 14px; color: #666; line-height: 1.6;">
                Your review will be visible on our website after approval and will help us maintain our high standards of service.
              </p>
              
              <p style="color: #666; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
                Best regards,<br>
                <strong style="color: #1b981b;">Recycle My Device Team</strong><br>
                <a href="mailto:support@recyclemydevice.co.uk" style="color: #1b981b;">support@recyclemydevice.co.uk</a>
              </p>
            </div>
          `,
        });
        
        console.log(`Review request email sent successfully to ${order.customerEmail}`);
      } catch (emailError) {
        console.error('Review request email sending failed:', emailError);
      }
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Payment status updated successfully',
      data: order,
    });
  } catch (error) {
    console.error('Update Payment Status Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update payment status',
      error: error.message,
    });
  }
};

// @desc    Add note to order
// @route   POST /api/recycler/orders/:id/notes
// @access  Private/Recycler
const addOrderNote = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const mongoose = require('mongoose');

    const recyclerId = new mongoose.Types.ObjectId(req.user._id || req.user.id);
    const { note } = req.body;

    if (!note) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Note is required',
      });
    }

    const order = await Order.findOne({ _id: req.params.id, recyclerId });

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (!order.notes) order.notes = [];

    order.notes.push({
      text: note,
      createdBy: recyclerId,
      createdAt: new Date(),
    });

    await order.save();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Note added successfully',
      data: order,
    });
  } catch (error) {
    console.error('Add Order Note Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to add note',
      error: error.message,
    });
  }
};

// @desc    Get orders by status
// @route   GET /api/recycler/orders/status/:status
// @access  Private/Recycler
const getOrdersByStatus = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const mongoose = require('mongoose');

    const recyclerId = new mongoose.Types.ObjectId(req.user._id || req.user.id);
    const { status } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const orders = await Order.find({ recyclerId, status })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('deviceId', 'name brand model')
      .select('orderNumber customerName customerEmail status amount deviceCondition createdAt');

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Get Orders By Status Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch orders by status',
      error: error.message,
    });
  }
};

// @desc    Get order statistics
// @route   GET /api/recycler/orders/stats/summary
// @access  Private/Recycler
const getOrderStats = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const mongoose = require('mongoose');

    const recyclerId = new mongoose.Types.ObjectId(req.user._id || req.user.id);

    const stats = await Order.aggregate([
      {
        $match: { recyclerId: recyclerId },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get Order Stats Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch order statistics',
      error: error.message,
    });
  }
};

// @desc    Export orders to CSV
// @route   GET /api/recycler/orders/export
// @access  Private/Recycler
const exportOrders = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const mongoose = require('mongoose');

    const recyclerId = new mongoose.Types.ObjectId(req.user._id || req.user.id);
    const { startDate, endDate, status } = req.query;

    const filter = { recyclerId };

    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(filter)
      .populate('deviceId', 'name brand model')
      .sort({ createdAt: -1 });

    // Build CSV
    let csv = 'Order Number,Date,Customer Name,Customer Email,Device,Condition,Amount,Status,Payment Status\n';

    orders.forEach((order) => {
      csv += `${order.orderNumber},`;
      csv += `${new Date(order.createdAt).toLocaleDateString()},`;
      csv += `${order.customerName || 'N/A'},`;
      csv += `${order.customerEmail || 'N/A'},`;
      csv += `${order.deviceId?.name || 'N/A'},`;
      csv += `${order.deviceCondition || 'N/A'},`;
      csv += `£${order.amount},`;
      csv += `${order.status},`;
      csv += `${order.paymentStatus}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=orders_${Date.now()}.csv`);
    res.status(HTTP_STATUS.OK).send(csv);
  } catch (error) {
    console.error('Export Orders Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to export orders',
      error: error.message,
    });
  }
};

// @desc    Get available order statuses
// @route   GET /api/recycler/orders/utilities/statuses
// @access  Private/Recycler
const getOrderStatuses = async (req, res) => {
  try {
    const OrderStatus = require('../../models/OrderStatus');

    const statuses = await OrderStatus.find({ isActive: true })
      .select('name label description')
      .sort({ order: 1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: statuses,
    });
  } catch (error) {
    console.error('Get Order Statuses Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch order statuses',
      error: error.message,
    });
  }
};

// @desc    Get available payment statuses
// @route   GET /api/recycler/orders/utilities/payment-statuses
// @access  Private/Recycler
const getPaymentStatuses = async (req, res) => {
  try {
    const PaymentStatus = require('../../models/PaymentStatus');

    const statuses = await PaymentStatus.find({ isActive: true })
      .select('name label description')
      .sort({ order: 1 });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: statuses,
    });
  } catch (error) {
    console.error('Get Payment Statuses Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch payment statuses',
      error: error.message,
    });
  }
};

// @desc    Bulk update order status for recycler
// @route   POST /api/recycler/orders/bulk-update
// @access  Private/Recycler
const bulkUpdateOrders = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const mongoose = require('mongoose');
    const { orderIds, status } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Order IDs are required',
      });
    }

    if (!status) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Status is required',
      });
    }

    // Get recycler ID from token
    const recyclerIdString = req.user.id || req.user._id;
    let recyclerId;
    try {
      recyclerId = mongoose.Types.ObjectId.isValid(recyclerIdString) 
        ? new mongoose.Types.ObjectId(recyclerIdString)
        : recyclerIdString;
    } catch (err) {
      recyclerId = recyclerIdString;
    }

    // Only update orders belonging to this recycler
    const result = await Order.updateMany(
      { 
        _id: { $in: orderIds },
        recyclerId: recyclerId 
      },
      { $set: { status } }
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `${result.modifiedCount} orders updated successfully`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Bulk Update Orders Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update orders',
      error: error.message,
    });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  addOrderNote,
  getOrdersByStatus,
  getOrderStats,
  exportOrders,
  getOrderStatuses,
  getPaymentStatuses,
  bulkUpdateOrders,
};
