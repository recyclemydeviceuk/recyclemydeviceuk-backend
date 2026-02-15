// Request validation middleware
const { body, param, query, validationResult } = require('express-validator');
const { HTTP_STATUS } = require('../config/constants');

// Validation result handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.VALIDATION_ERROR).json({
      success: false,
      message: 'Validation error',
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// Email validation
const validateEmail = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  validate,
];

// Phone validation
const validatePhone = [
  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s\+\-\(\)]+$/)
    .withMessage('Please provide a valid phone number')
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10 and 15 digits'),
  validate,
];

// Password validation
const validatePassword = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  validate,
];

// OTP validation
const validateOTP = [
  body('otp')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  validate,
];

// Order creation validation
const validateOrderCreation = [
  body('deviceId')
    .notEmpty()
    .withMessage('Device ID is required')
    .isMongoId()
    .withMessage('Invalid device ID'),
  body('condition')
    .notEmpty()
    .withMessage('Device condition is required')
    .isIn(['like_new', 'good', 'fair', 'poor', 'faulty'])
    .withMessage('Invalid device condition'),
  body('customerName')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('customerEmail')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('customerPhone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[\d\s\+\-\(\)]+$/)
    .withMessage('Invalid phone number format'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('postcode')
    .trim()
    .notEmpty()
    .withMessage('Postcode is required'),
  validate,
];

// Contact form validation
const validateContactForm = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
  validate,
];

// Review submission validation
const validateReview = [
  body('recyclerId')
    .notEmpty()
    .withMessage('Recycler ID is required')
    .isMongoId()
    .withMessage('Invalid recycler ID'),
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .isMongoId()
    .withMessage('Invalid order ID'),
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment must not exceed 500 characters'),
  validate,
];

// Device creation validation
const validateDeviceCreation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Device name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Device name must be between 2 and 200 characters'),
  body('brand')
    .trim()
    .notEmpty()
    .withMessage('Brand is required'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['smartphone', 'tablet', 'laptop', 'smartwatch', 'console', 'other'])
    .withMessage('Invalid category'),
  body('basePrice')
    .notEmpty()
    .withMessage('Base price is required')
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),
  validate,
];

// MongoDB ID validation
const validateMongoId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),
  validate,
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validate,
];

// Search validation
const validateSearch = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  validate,
];

// Date range validation
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  validate,
];

// Recycler registration validation
const validateRecyclerRegistration = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('companyName')
    .trim()
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Company name must be between 2 and 200 characters'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('postcode')
    .trim()
    .notEmpty()
    .withMessage('Postcode is required'),
  validate,
];

module.exports = {
  validate,
  validateEmail,
  validatePhone,
  validatePassword,
  validateOTP,
  validateOrderCreation,
  validateContactForm,
  validateReview,
  validateDeviceCreation,
  validateMongoId,
  validatePagination,
  validateSearch,
  validateDateRange,
  validateRecyclerRegistration,
};
