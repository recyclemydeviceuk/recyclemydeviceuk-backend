// Newsletter subscriptions management
const { HTTP_STATUS, PAGINATION } = require('../../config/constants');

// @desc    Get all newsletter subscriptions
// @route   GET /api/admin/newsletters
// @access  Private/Admin
const getAllNewsletters = async (req, res) => {
  try {
    const Newsletter = require('../../models/Newsletter');

    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const { status, search, startDate, endDate } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.email = { $regex: search, $options: 'i' };
    }
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const newsletters = await Newsletter.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Newsletter.countDocuments(filter);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: newsletters,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get All Newsletters Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch newsletter subscriptions',
      error: error.message,
    });
  }
};

// @desc    Get newsletter statistics
// @route   GET /api/admin/newsletters/stats
// @access  Private/Admin
const getNewsletterStats = async (req, res) => {
  try {
    const Newsletter = require('../../models/Newsletter');

    const totalSubscribers = await Newsletter.countDocuments();
    const activeSubscribers = await Newsletter.countDocuments({ status: 'active' });
    const unsubscribedCount = await Newsletter.countDocuments({ status: 'unsubscribed' });

    // Get recent subscriptions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSubscriptions = await Newsletter.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
      status: 'active',
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        totalSubscribers,
        activeSubscribers,
        unsubscribedCount,
        recentSubscriptions,
      },
    });
  } catch (error) {
    console.error('Get Newsletter Stats Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch newsletter statistics',
      error: error.message,
    });
  }
};

// @desc    Update newsletter status
// @route   PATCH /api/admin/newsletters/:id/status
// @access  Private/Admin
const updateNewsletterStatus = async (req, res) => {
  try {
    const Newsletter = require('../../models/Newsletter');
    const { status } = req.body;

    if (!status || !['active', 'unsubscribed'].includes(status)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Valid status is required (active or unsubscribed)',
      });
    }

    const newsletter = await Newsletter.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        unsubscribedAt: status === 'unsubscribed' ? new Date() : null,
      },
      { new: true }
    );

    if (!newsletter) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Newsletter subscription not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Newsletter status updated successfully',
      data: newsletter,
    });
  } catch (error) {
    console.error('Update Newsletter Status Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update newsletter status',
      error: error.message,
    });
  }
};

// @desc    Delete newsletter subscription
// @route   DELETE /api/admin/newsletters/:id
// @access  Private/Admin
const deleteNewsletter = async (req, res) => {
  try {
    const Newsletter = require('../../models/Newsletter');

    const newsletter = await Newsletter.findByIdAndDelete(req.params.id);

    if (!newsletter) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Newsletter subscription not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Newsletter subscription deleted successfully',
    });
  } catch (error) {
    console.error('Delete Newsletter Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete newsletter subscription',
      error: error.message,
    });
  }
};

// @desc    Bulk delete newsletters
// @route   POST /api/admin/newsletters/bulk-delete
// @access  Private/Admin
const bulkDeleteNewsletters = async (req, res) => {
  try {
    const Newsletter = require('../../models/Newsletter');
    const { newsletterIds } = req.body;

    if (!newsletterIds || !Array.isArray(newsletterIds) || newsletterIds.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Newsletter IDs are required',
      });
    }

    const result = await Newsletter.deleteMany({ _id: { $in: newsletterIds } });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `${result.deletedCount} newsletter subscriptions deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Bulk Delete Newsletters Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete newsletter subscriptions',
      error: error.message,
    });
  }
};

// @desc    Export newsletters to CSV
// @route   GET /api/admin/newsletters/export
// @access  Private/Admin
const exportNewsletters = async (req, res) => {
  try {
    const Newsletter = require('../../models/Newsletter');
    const { status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const newsletters = await Newsletter.find(filter).sort({ createdAt: -1 });

    // Convert to CSV
    let csv = 'Email,Status,Subscribed Date,Unsubscribed Date\n';
    newsletters.forEach((newsletter) => {
      csv += `${newsletter.email},${newsletter.status},${newsletter.createdAt},${newsletter.unsubscribedAt || 'N/A'}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=newsletters-${Date.now()}.csv`);
    res.status(HTTP_STATUS.OK).send(csv);
  } catch (error) {
    console.error('Export Newsletters Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to export newsletters',
      error: error.message,
    });
  }
};

module.exports = {
  getAllNewsletters,
  getNewsletterStats,
  updateNewsletterStatus,
  deleteNewsletter,
  bulkDeleteNewsletters,
  exportNewsletters,
};
