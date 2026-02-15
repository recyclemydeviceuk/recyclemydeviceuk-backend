// Standardized API response utilities
const { HTTP_STATUS } = require('../config/constants');

/**
 * Success response
 * @param {object} res - Express response object
 * @param {object} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 * @returns {object} - Response
 */
const successResponse = (res, data, message = 'Success', statusCode = HTTP_STATUS.OK) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Error response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Array} errors - Validation errors (optional)
 * @returns {object} - Response
 */
const errorResponse = (res, message = 'Error', statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Created response (201)
 * @param {object} res - Express response object
 * @param {object} data - Created resource data
 * @param {string} message - Success message
 * @returns {object} - Response
 */
const createdResponse = (res, data, message = 'Resource created successfully') => {
  return successResponse(res, data, message, HTTP_STATUS.CREATED);
};

/**
 * No content response (204)
 * @param {object} res - Express response object
 * @returns {object} - Response
 */
const noContentResponse = (res) => {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
};

/**
 * Paginated response
 * @param {object} res - Express response object
 * @param {Array} data - Data array
 * @param {object} pagination - Pagination metadata
 * @param {string} message - Success message
 * @returns {object} - Response
 */
const paginatedResponse = (res, data, pagination, message = 'Success') => {
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Validation error response (422)
 * @param {object} res - Express response object
 * @param {Array} errors - Validation errors
 * @param {string} message - Error message
 * @returns {object} - Response
 */
const validationErrorResponse = (res, errors, message = 'Validation error') => {
  return errorResponse(res, message, HTTP_STATUS.VALIDATION_ERROR, errors);
};

/**
 * Not found response (404)
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @returns {object} - Response
 */
const notFoundResponse = (res, message = 'Resource not found') => {
  return errorResponse(res, message, HTTP_STATUS.NOT_FOUND);
};

/**
 * Unauthorized response (401)
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @returns {object} - Response
 */
const unauthorizedResponse = (res, message = 'Unauthorized access') => {
  return errorResponse(res, message, HTTP_STATUS.UNAUTHORIZED);
};

/**
 * Forbidden response (403)
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @returns {object} - Response
 */
const forbiddenResponse = (res, message = 'Access forbidden') => {
  return errorResponse(res, message, HTTP_STATUS.FORBIDDEN);
};

/**
 * Bad request response (400)
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {Array} errors - Validation errors (optional)
 * @returns {object} - Response
 */
const badRequestResponse = (res, message = 'Bad request', errors = null) => {
  return errorResponse(res, message, HTTP_STATUS.BAD_REQUEST, errors);
};

/**
 * Conflict response (409)
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @returns {object} - Response
 */
const conflictResponse = (res, message = 'Resource already exists') => {
  return errorResponse(res, message, HTTP_STATUS.CONFLICT);
};

/**
 * Server error response (500)
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @returns {object} - Response
 */
const serverErrorResponse = (res, message = 'Internal server error') => {
  return errorResponse(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
};

/**
 * Custom response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {boolean} success - Success flag
 * @param {string} message - Response message
 * @param {object} data - Response data (optional)
 * @returns {object} - Response
 */
const customResponse = (res, statusCode, success, message, data = null) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString(),
  };

  if (data) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Format validation errors from express-validator
 * @param {object} errors - Express-validator errors object
 * @returns {Array} - Formatted errors array
 */
const formatValidationErrors = (errors) => {
  return errors.array().map((err) => ({
    field: err.path || err.param,
    message: err.msg,
    value: err.value,
  }));
};

module.exports = {
  successResponse,
  errorResponse,
  createdResponse,
  noContentResponse,
  paginatedResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  badRequestResponse,
  conflictResponse,
  serverErrorResponse,
  customResponse,
  formatValidationErrors,
};
