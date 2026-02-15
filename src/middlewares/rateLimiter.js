// Rate limiting middleware
const rateLimit = require('express-rate-limit');
const { RATE_LIMIT, HTTP_STATUS } = require('../config/constants');

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS, // 15 minutes
  max: RATE_LIMIT.MAX_REQUESTS, // 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS || 429).json({
      success: false,
      message: 'Too many requests, please try again later',
    });
  },
});

// Strict limiter for authentication routes (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP limiter (prevent OTP spam)
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 OTP requests per 5 minutes
  message: {
    success: false,
    message: 'Too many OTP requests, please try again after 5 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset limiter
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again after 1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload limiter
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 file uploads per 15 minutes
  message: {
    success: false,
    message: 'Too many file uploads, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Contact form limiter (prevent spam)
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 contact form submissions per hour
  message: {
    success: false,
    message: 'Too many contact form submissions, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Review submission limiter
const reviewLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // 10 reviews per day
  message: {
    success: false,
    message: 'Too many review submissions, please try again tomorrow',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  otpLimiter,
  passwordResetLimiter,
  uploadLimiter,
  contactLimiter,
  reviewLimiter,
};
