// Recycler orders
const { HTTP_STATUS, PAGINATION } = require('../../config/constants');
const { sendEmail } = require('../../config/aws');

// @desc    Get all orders for recycler
// @route   GET /api/recycler/orders
// @access  Private/Recycler
const getAllOrders = async (req, res) => {
  try {
    const Order = require('../../models/Order');

    const recyclerId = req.user._id;
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

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email phone')
        .populate('deviceId', 'name brand model image'),
      Order.countDocuments(filter),
    ]);

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

    const recyclerId = req.user._id;

    const order = await Order.findOne({ _id: req.params.id, recyclerId })
      .populate('userId', 'name email phone address city postcode')
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

    const recyclerId = req.user._id;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Status is required',
      });
    }

    const order = await Order.findOne({ _id: req.params.id, recyclerId })
      .populate('userId', 'name email')
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

    // Set completion timestamp
    if (status === 'completed' && !order.completedAt) {
      order.completedAt = new Date();
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
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
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

    const recyclerId = req.user._id;
    const { paymentStatus, transactionId } = req.body;

    if (!paymentStatus) {
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

    const recyclerId = req.user._id;
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

    const recyclerId = req.user._id;
    const { status } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const orders = await Order.find({ recyclerId, status })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'name email')
      .populate('deviceId', 'name brand model')
      .select('orderNumber status amount deviceCondition createdAt');

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

    const recyclerId = req.user._id;

    const stats = await Order.aggregate([
      {
        $match: { recyclerId: mongoose.Types.ObjectId(recyclerId) },
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

    const recyclerId = req.user._id;
    const { startDate, endDate, status } = req.query;

    const filter = { recyclerId };

    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(filter)
      .populate('userId', 'name email')
      .populate('deviceId', 'name brand model')
      .sort({ createdAt: -1 });

    // Build CSV
    let csv = 'Order Number,Date,Customer Name,Customer Email,Device,Condition,Amount,Status,Payment Status\n';

    orders.forEach((order) => {
      csv += `${order.orderNumber},`;
      csv += `${new Date(order.createdAt).toLocaleDateString()},`;
      csv += `${order.userId?.name || 'N/A'},`;
      csv += `${order.userId?.email || 'N/A'},`;
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

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  addOrderNote,
  getOrdersByStatus,
  getOrderStats,
  exportOrders,
};
