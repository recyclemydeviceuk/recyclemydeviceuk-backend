const RecyclerApplication = require('../../models/RecyclerApplication');
const { HTTP_STATUS } = require('../../config/constants');

/**
 * Submit a new recycler application
 */
const submitApplication = async (req, res) => {
  try {
    const { name, email, phone, companyName, website, businessDescription } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !companyName) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Please provide all required fields: name, email, phone, and company name',
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Phone validation (basic - at least 10 digits)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Please provide a valid phone number',
      });
    }

    // Check if application already exists with this email
    const existingApplication = await RecyclerApplication.findOne({ 
      email: email.toLowerCase(),
      status: { $in: ['pending', 'approved'] }
    });

    if (existingApplication) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: existingApplication.status === 'approved' 
          ? 'An application with this email has already been approved'
          : 'An application with this email is already pending review',
      });
    }

    // Create new application
    const application = new RecyclerApplication({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      companyName: companyName.trim(),
      website: website ? website.trim() : undefined,
      businessDescription: businessDescription ? businessDescription.trim() : undefined,
      status: 'pending',
    });

    await application.save();

    // TODO: Send email notification to admin team
    // TODO: Send confirmation email to applicant

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Application submitted successfully! Our team will review it within 2 business days.',
      data: {
        applicationId: application._id,
        status: application.status,
        submittedAt: application.createdAt,
      },
    });
  } catch (error) {
    console.error('Error submitting recycler application:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while submitting your application. Please try again.',
    });
  }
};

module.exports = {
  submitApplication,
};
