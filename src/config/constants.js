// App-wide constants

// User Roles
const USER_ROLES = {
  ADMIN: 'admin',
  RECYCLER: 'recycler',
  CUSTOMER: 'customer',
};

// Order Status
const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  DEVICE_RECEIVED: 'device_received',
  INSPECTING: 'inspecting',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAYMENT_PROCESSING: 'payment_processing',
  PAYMENT_SENT: 'payment_sent',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Payment Status
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

// Payment Methods (for paying customers for their devices)
const PAYMENT_METHODS = {
  BANK_TRANSFER: 'bank_transfer',
  CASH: 'cash',
  CHEQUE: 'cheque',
};

// Device Conditions
const DEVICE_CONDITIONS = {
  LIKE_NEW: 'like_new',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
  FAULTY: 'faulty',
};

// Device Categories
const DEVICE_CATEGORIES = {
  SMARTPHONE: 'smartphone',
  TABLET: 'tablet',
  LAPTOP: 'laptop',
  SMARTWATCH: 'smartwatch',
  CONSOLE: 'console',
  OTHER: 'other',
};

// Brands
const DEVICE_BRANDS = {
  APPLE: 'Apple',
  SAMSUNG: 'Samsung',
  GOOGLE: 'Google',
  HUAWEI: 'Huawei',
  XIAOMI: 'Xiaomi',
  ONEPLUS: 'OnePlus',
  SONY: 'Sony',
  LG: 'LG',
  MOTOROLA: 'Motorola',
  NOKIA: 'Nokia',
  OTHER: 'Other',
};

// Recycler Status
const RECYCLER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPENDED: 'suspended',
  ACTIVE: 'active',
};

// Cart Configuration
const CART_CONFIG = {
  MAX_ITEMS: parseInt(process.env.MAX_CART_ITEMS) || 1,
  EXPIRY_HOURS: parseInt(process.env.CART_EXPIRY_HOURS) || 24,
};

// File Upload Limits
const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
  MAX_FILES_PER_UPLOAD: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword'],
};

// Pagination
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// Rate Limiting
const RATE_LIMIT = {
  WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
};

// Email Templates
const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  OTP_VERIFICATION: 'otp_verification',
  ORDER_CONFIRMATION: 'order_confirmation',
  PAYMENT_CONFIRMATION: 'payment_confirmation',
  DEVICE_RECEIVED: 'device_received',
  INSPECTION_COMPLETE: 'inspection_complete',
  PASSWORD_RESET: 'password_reset',
  RECYCLER_APPROVED: 'recycler_approved',
  RECYCLER_REJECTED: 'recycler_rejected',
};

// OTP Configuration
const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
  MAX_ATTEMPTS: 3,
};

// Price Range Filters
const PRICE_RANGES = {
  LOW: { min: 0, max: 100 },
  MEDIUM: { min: 100, max: 300 },
  HIGH: { min: 300, max: 500 },
  PREMIUM: { min: 500, max: 1000 },
};

// Notification Types
const NOTIFICATION_TYPES = {
  ORDER_UPDATE: 'order_update',
  PAYMENT_UPDATE: 'payment_update',
  SYSTEM_ALERT: 'system_alert',
  PROMOTION: 'promotion',
};

// App Configuration
const APP_CONFIG = {
  NAME: 'Recycle My Device',
  VERSION: '1.0.0',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:5000',
  SUPPORT_EMAIL: 'support@recyclemydevice.com',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@recyclemydevice.com',
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  INTERNAL_SERVER_ERROR: 500,
};

// Error Messages
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  SERVER_ERROR: 'Internal server error',
  TOKEN_EXPIRED: 'Token has expired',
  INVALID_TOKEN: 'Invalid token',
  EMAIL_EXISTS: 'Email already exists',
  CART_LIMIT_REACHED: 'Cart limit reached. Please complete your current order first.',
  FILE_TOO_LARGE: 'File size exceeds maximum limit',
  INVALID_FILE_TYPE: 'Invalid file type',
};

// Success Messages
const SUCCESS_MESSAGES = {
  ORDER_CREATED: 'Order created successfully',
  ORDER_UPDATED: 'Order updated successfully',
  PAYMENT_SUCCESS: 'Payment processed successfully',
  EMAIL_SENT: 'Email sent successfully',
  FILE_UPLOADED: 'File uploaded successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
};

module.exports = {
  USER_ROLES,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  DEVICE_CONDITIONS,
  DEVICE_CATEGORIES,
  DEVICE_BRANDS,
  RECYCLER_STATUS,
  CART_CONFIG,
  UPLOAD_LIMITS,
  PAGINATION,
  RATE_LIMIT,
  EMAIL_TEMPLATES,
  OTP_CONFIG,
  PRICE_RANGES,
  NOTIFICATION_TYPES,
  APP_CONFIG,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};
