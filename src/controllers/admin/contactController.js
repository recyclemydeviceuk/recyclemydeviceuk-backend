// Contact submissions
const { HTTP_STATUS, PAGINATION } = require('../../config/constants');
const { sendEmail } = require('../../config/aws');

// @desc    Get all contact submissions
// @route   GET /api/admin/contacts
// @access  Private/Admin
const getAllContacts = async (req, res) => {
  try {
    const Contact = require('../../models/ContactSubmission');

    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const { status, search, startDate, endDate } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Contact.countDocuments(filter);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get All Contacts Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch contact submissions',
      error: error.message,
    });
  }
};

// @desc    Get contact by ID
// @route   GET /api/admin/contacts/:id
// @access  Private/Admin
const getContactById = async (req, res) => {
  try {
    const Contact = require('../../models/ContactSubmission');

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Contact submission not found',
      });
    }

    // Mark as read
    if (!contact.isRead) {
      contact.isRead = true;
      contact.readAt = new Date();
      await contact.save();
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error('Get Contact By ID Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch contact submission',
      error: error.message,
    });
  }
};

// @desc    Reply to contact submission
// @route   POST /api/admin/contacts/:id/reply
// @access  Private/Admin
const replyToContact = async (req, res) => {
  try {
    const Contact = require('../../models/ContactSubmission');
    const { message } = req.body;

    if (!message) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Reply message is required',
      });
    }

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Contact submission not found',
      });
    }

    // Send reply email
    try {
      await sendEmail({
        to: contact.email,
        subject: `Re: ${contact.subject || 'Your Contact Form Submission'}`,
        htmlBody: `
          <h2>Hello ${contact.name},</h2>
          <p>Thank you for contacting Recycle My Device. Here's our response to your inquiry:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-left: 3px solid #f59e0b; margin: 20px 0;">
            ${message}
          </div>
          <p><strong>Your Original Message:</strong></p>
          <p style="color: #666;">${contact.message}</p>
          <hr />
          <p style="color: #999; font-size: 12px;">
            If you have any further questions, please don't hesitate to contact us.
          </p>
        `,
      });

      contact.status = 'resolved';
      contact.respondedAt = new Date();
      contact.response = message;
      await contact.save();

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Reply sent successfully',
        data: contact,
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to send reply email',
        error: emailError.message,
      });
    }
  } catch (error) {
    console.error('Reply To Contact Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to reply to contact',
      error: error.message,
    });
  }
};

// @desc    Update contact status
// @route   PATCH /api/admin/contacts/:id/status
// @access  Private/Admin
const updateContactStatus = async (req, res) => {
  try {
    const Contact = require('../../models/ContactSubmission');
    const { status } = req.body;

    if (!status) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Status is required',
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!contact) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Contact submission not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Contact status updated successfully',
      data: contact,
    });
  } catch (error) {
    console.error('Update Contact Status Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update contact status',
      error: error.message,
    });
  }
};

// @desc    Mark contact as read
// @route   PATCH /api/admin/contacts/:id/read
// @access  Private/Admin
const markAsRead = async (req, res) => {
  try {
    const Contact = require('../../models/ContactSubmission');

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!contact) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Contact submission not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Contact marked as read',
      data: contact,
    });
  } catch (error) {
    console.error('Mark As Read Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to mark contact as read',
      error: error.message,
    });
  }
};

// @desc    Delete contact submission
// @route   DELETE /api/admin/contacts/:id
// @access  Private/Admin
const deleteContact = async (req, res) => {
  try {
    const Contact = require('../../models/ContactSubmission');

    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Contact submission not found',
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Contact submission deleted successfully',
    });
  } catch (error) {
    console.error('Delete Contact Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete contact submission',
      error: error.message,
    });
  }
};

// @desc    Bulk delete contacts
// @route   POST /api/admin/contacts/bulk-delete
// @access  Private/Admin
const bulkDeleteContacts = async (req, res) => {
  try {
    const Contact = require('../../models/ContactSubmission');
    const { contactIds } = req.body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Contact IDs are required',
      });
    }

    const result = await Contact.deleteMany({ _id: { $in: contactIds } });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `${result.deletedCount} contact submissions deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Bulk Delete Contacts Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete contact submissions',
      error: error.message,
    });
  }
};

// @desc    Get contact statistics
// @route   GET /api/admin/contacts/stats
// @access  Private/Admin
const getContactStats = async (req, res) => {
  try {
    const Contact = require('../../models/ContactSubmission');

    const totalContacts = await Contact.countDocuments();
    const unreadContacts = await Contact.countDocuments({ isRead: false });
    const pendingContacts = await Contact.countDocuments({ status: 'new' });
    const repliedContacts = await Contact.countDocuments({ status: 'resolved' });

    // Contacts by status
    const contactsByStatus = await Contact.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        totalContacts,
        unreadContacts,
        pendingContacts,
        repliedContacts,
        contactsByStatus,
      },
    });
  } catch (error) {
    console.error('Get Contact Stats Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch contact statistics',
      error: error.message,
    });
  }
};

module.exports = {
  getAllContacts,
  getContactById,
  replyToContact,
  updateContactStatus,
  markAsRead,
  deleteContact,
  bulkDeleteContacts,
  getContactStats,
};
