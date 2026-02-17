// Orders management
const { HTTP_STATUS, PAGINATION, ORDER_STATUS } = require('../../config/constants');

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const Order = require('../../models/Order');

    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const { status, paymentStatus, search, startDate, endDate } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    
    // Handle search across orderNumber, customer name/email
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { deviceName: { $regex: search, $options: 'i' } },
        { recyclerName: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const CounterOffer = require('../../models/CounterOffer');

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('recyclerId', 'companyName email')
      .populate('deviceId', 'name');

    // Populate counter offers for each order
    for (let order of orders) {
      const counterOffer = await CounterOffer.findOne({ orderId: order._id })
        .sort({ createdAt: -1 })
        .select('status amendedPrice originalPrice createdAt respondedAt');
      
      if (counterOffer) {
        order._doc.counterOffer = counterOffer;
      }
    }

    const total = await Order.countDocuments(filter);

    // Calculate total revenue from completed & paid orders (all, not just current page)
    const revenueFilter = { ...filter, status: 'completed', paymentStatus: 'paid' };
    const revenueResult = await Order.aggregate([
      { $match: revenueFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = Math.floor(revenueResult[0]?.total || 0);

    // Count pending orders
    const pendingFilter = { ...filter, status: 'pending' };
    const pendingCount = await Order.countDocuments(pendingFilter);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        totalRevenue: Math.floor(totalRevenue),
        pendingOrders: pendingCount,
        totalOrders: total,
      },
    });
  } catch (error) {
    console.error('Get All Orders Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/admin/orders/:id
// @access  Private/Admin
const getOrderById = async (req, res) => {
  try {
    const Order = require('../../models/Order');

    const order = await Order.findById(req.params.id)
      .populate('recyclerId', 'companyName email phone logo')
      .populate('deviceId', 'name');

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
// @route   PATCH /api/admin/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const Recycler = require('../../models/Recycler');
    const { sendEmail } = require('../../config/aws');
    const { status, notes } = req.body;

    if (!status) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Status is required',
      });
    }

    const order = await Order.findById(req.params.id).populate('recyclerId', 'name companyName');

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order not found',
      });
    }

    const previousStatus = order.status;
    order.status = status;
    if (notes) {
      order.notes = notes;
    }

    // Add to status history
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: req.user._id,
      notes,
    });

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

    // Send emails when order is completed
    if (status === 'completed' && previousStatus !== 'completed') {
      const recyclerName = order.recyclerId?.companyName || order.recyclerId?.name || 'the recycler';
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const reviewUrl = `${frontendUrl}/review-recycler?order=${encodeURIComponent(order.orderNumber)}&email=${encodeURIComponent(order.customerEmail)}`;

      // EMAIL 2: Order Completion Notification
      try {
        await sendEmail({
          to: order.customerEmail,
          subject: 'Order Completed Successfully! - Recycle My Device',
          htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 0;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px;">🎉 Order Completed!</h1>
                <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Your payment is being processed</p>
              </div>

              <!-- Main Content -->
              <div style="background-color: white; padding: 40px 30px;">
                <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hello ${order.customerName},</p>
                
                <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 25px;">
                  Fantastic news! Your device has been received, verified, and your order <strong style="color: #10b981;">#${order.orderNumber}</strong> has been completed successfully.
                </p>

                <!-- Success Box -->
                <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left: 4px solid #10b981; padding: 25px; margin: 25px 0; border-radius: 8px; text-align: center;">
                  <div style="font-size: 48px; margin-bottom: 15px;">✓</div>
                  <h3 style="color: #166534; margin: 0 0 10px 0; font-size: 20px;">Payment Processing</h3>
                  <p style="margin: 0; color: #166534; font-size: 14px;">Your payment of <strong style="font-size: 24px; display: block; margin: 10px 0;">£${Math.round(order.amount)}</strong> will be transferred to your account shortly</p>
                </div>

                <!-- Order Summary -->
                <div style="background-color: #f9fafb; padding: 25px; border-radius: 8px; margin: 25px 0;">
                  <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">📋 Order Summary</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Order Number:</td>
                      <td style="padding: 8px 0; color: #374151; font-weight: bold; text-align: right;">${order.orderNumber}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Recycler:</td>
                      <td style="padding: 8px 0; color: #374151; text-align: right;">${recyclerName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Status:</td>
                      <td style="padding: 8px 0; text-align: right;">
                        <span style="background-color: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">COMPLETED</span>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- What's Next -->
                <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 25px; border-radius: 8px; margin: 25px 0;">
                  <h3 style="color: #1e3a8a; margin: 0 0 15px 0; font-size: 18px;">💰 What Happens Next?</h3>
                  <p style="color: #374151; margin: 0; line-height: 1.8;">
                    ✓ Your payment is being processed<br>
                    ✓ Funds will be transferred within 3-5 business days<br>
                    ✓ You'll receive a confirmation once payment is sent
                  </p>
                </div>

                <!-- Thank You -->
                <div style="text-align: center; margin: 30px 0;">
                  <h3 style="color: #10b981; margin: 0 0 10px 0; font-size: 20px;">Thank You for Recycling! ♻️</h3>
                  <p style="color: #6b7280; font-size: 15px; margin: 0;">
                    You've made a positive impact on the environment by choosing to recycle responsibly.
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div style="background-color: #f3f4f6; text-align: center; padding: 30px 20px;">
                <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                  Questions about your payment?
                </p>
                <p style="margin: 10px 0;">
                  <a href="mailto:support@recyclemydevice.com" style="color: #10b981; text-decoration: none; font-weight: bold;">support@recyclemydevice.com</a>
                </p>
                <p style="color: #9ca3af; font-size: 13px; margin: 20px 0 5px 0;">
                  © ${new Date().getFullYear()} Recycle My Device. All rights reserved.
                </p>
              </div>
            </div>
          `,
        });
        console.log(`Order completion email sent to ${order.customerEmail} for order ${order.orderNumber}`);
      } catch (emailError) {
        console.error('Failed to send order completion email:', emailError);
      }

      // EMAIL 3: Review Request (sent separately after completion)
      try {
        await sendEmail({
          to: order.customerEmail,
          subject: 'How Was Your Experience? - Share Your Feedback',
          htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 0;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 10px;">⭐⭐⭐⭐⭐</div>
                <h1 style="color: white; margin: 0; font-size: 28px;">Rate Your Experience</h1>
                <p style="color: #fef3c7; margin: 10px 0 0 0; font-size: 15px;">Help ${recyclerName} improve their service</p>
              </div>

              <!-- Main Content -->
              <div style="background-color: white; padding: 40px 30px;">
                <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hello ${order.customerName},</p>
                
                <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 25px;">
                  Now that your order <strong>#${order.orderNumber}</strong> is complete, we'd love to hear about your experience with ${recyclerName}!
                </p>

                <!-- Review CTA Box -->
                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; padding: 30px; margin: 25px 0; border-radius: 8px; text-align: center;">
                  <h2 style="color: #92400e; margin: 0 0 15px 0; font-size: 22px;">Share Your Feedback</h2>
                  <p style="color: #78350f; font-size: 15px; margin-bottom: 25px;">
                    Your honest review helps other customers and encourages recyclers to maintain excellent service
                  </p>
                  
                  <!-- Big CTA Button -->
                  <a href="${reviewUrl}" 
                     style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 18px 45px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);">
                    ⭐ Write Your Review
                  </a>
                  
                  <p style="color: #92400e; font-size: 13px; margin-top: 15px; font-weight: 600;">
                    Takes less than 2 minutes ⏱️
                  </p>
                </div>

                <!-- Why Review Matters -->
                <div style="background-color: #f9fafb; padding: 25px; border-radius: 8px; margin-top: 30px;">
                  <h3 style="color: #374151; font-size: 17px; margin: 0 0 15px 0;">💚 Why Your Review Matters</h3>
                  <div style="margin-bottom: 12px;">
                    <span style="color: #10b981; font-size: 20px; margin-right: 10px;">✓</span>
                    <span style="color: #6b7280; font-size: 15px;">Helps other customers make informed decisions</span>
                  </div>
                  <div style="margin-bottom: 12px;">
                    <span style="color: #10b981; font-size: 20px; margin-right: 10px;">✓</span>
                    <span style="color: #6b7280; font-size: 15px;">Encourages recyclers to maintain high-quality service</span>
                  </div>
                  <div>
                    <span style="color: #10b981; font-size: 20px; margin-right: 10px;">✓</span>
                    <span style="color: #6b7280; font-size: 15px;">Improves the recycling experience for everyone</span>
                  </div>
                </div>

                <!-- Alternative Link -->
                <p style="font-size: 13px; color: #9ca3af; margin-top: 30px; text-align: center;">
                  Button not working? Copy this link:<br>
                  <a href="${reviewUrl}" style="color: #f59e0b; word-break: break-all; font-size: 12px;">${reviewUrl}</a>
                </p>
              </div>

              <!-- Footer -->
              <div style="background-color: #f3f4f6; text-align: center; padding: 30px 20px;">
                <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">
                  We appreciate your feedback!
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
        console.log(`Review request email sent to ${order.customerEmail} for order ${order.orderNumber}`);
      } catch (emailError) {
        console.error('Failed to send review request email:', emailError);
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
// @route   PATCH /api/admin/orders/:id/payment
// @access  Private/Admin
const updatePaymentStatus = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const { paymentStatus, transactionId, paymentNotes } = req.body;

    if (!paymentStatus) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Payment status is required',
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.paymentStatus = paymentStatus;
    if (transactionId) order.transactionId = transactionId;
    if (paymentNotes) order.paymentNotes = paymentNotes;

    if (paymentStatus === 'completed') {
      order.paidAt = new Date();
    }

    await order.save();

    // TODO: Send payment confirmation email

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

// @desc    Assign order to recycler
// @route   PATCH /api/admin/orders/:id/assign
// @access  Private/Admin
const assignOrderToRecycler = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const Recycler = require('../../models/Recycler');
    const { recyclerId } = req.body;

    if (!recyclerId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Recycler ID is required',
      });
    }

    const recycler = await Recycler.findById(recyclerId);
    if (!recycler) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Recycler not found',
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { recyclerId, assignedAt: new Date() },
      { new: true }
    ).populate('recyclerId', 'name email');

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order not found',
      });
    }

    // TODO: Send notification to recycler

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Order assigned to recycler successfully',
      data: order,
    });
  } catch (error) {
    console.error('Assign Order Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to assign order',
      error: error.message,
    });
  }
};

// @desc    Delete order
// @route   DELETE /api/admin/orders/:id
// @access  Private/Admin
const deleteOrder = async (req, res) => {
  try {
    const Order = require('../../models/Order');

    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    console.error('Delete Order Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message,
    });
  }
};

// @desc    Bulk update order status
// @route   POST /api/admin/orders/bulk-update
// @access  Private/Admin
const bulkUpdateOrders = async (req, res) => {
  try {
    const Order = require('../../models/Order');
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

    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
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

// @desc    Export orders to CSV
// @route   GET /api/admin/orders/export
// @access  Private/Admin
const exportOrders = async (req, res) => {
  try {
    const Order = require('../../models/Order');
    const { startDate, endDate, status } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const orders = await Order.find(filter)
      .populate('recyclerId', 'companyName')
      .populate('deviceId', 'name')
      .sort({ createdAt: -1 });

    // Convert to CSV format
    const csv = orders.map(order => ({
      'Order Number': order.orderNumber,
      'Customer Name': order.customerName || 'N/A',
      'Customer Email': order.customerEmail || 'N/A',
      'Device': order.deviceId?.name || 'N/A',
      'Storage': order.storage || 'N/A',
      'Condition': order.deviceCondition || 'N/A',
      'Amount': Math.round(order.amount),
      'Status': order.status,
      'Payment Status': order.paymentStatus,
      'Recycler': order.recyclerId?.name || 'Not Assigned',
      'Created At': order.createdAt,
    }));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: csv,
      count: csv.length,
    });
  } catch (error) {
    console.error('Export Orders Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to export orders',
      error: error.message,
    });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  assignOrderToRecycler,
  deleteOrder,
  bulkUpdateOrders,
  exportOrders,
};
