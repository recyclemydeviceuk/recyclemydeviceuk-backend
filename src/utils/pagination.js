// Pagination utility
const { PAGINATION } = require('../config/constants');

/**
 * Get pagination parameters from query
 * @param {object} query - Request query object
 * @returns {object} - Pagination parameters
 */
const getPaginationParams = (query) => {
  const page = parseInt(query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(
    parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};

/**
 * Create pagination metadata
 * @param {number} total - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} - Pagination metadata
 */
const createPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null,
  };
};

/**
 * Paginate results with metadata
 * @param {Array} data - Data array
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} - Paginated response
 */
const paginateResults = (data, total, page, limit) => {
  return {
    data,
    pagination: createPaginationMeta(total, page, limit),
  };
};

/**
 * Get pagination links for API responses
 * @param {string} baseUrl - Base URL
 * @param {object} pagination - Pagination metadata
 * @param {object} query - Additional query parameters
 * @returns {object} - Pagination links
 */
const getPaginationLinks = (baseUrl, pagination, query = {}) => {
  const queryParams = new URLSearchParams(query);
  
  const buildUrl = (page) => {
    const params = new URLSearchParams(queryParams);
    params.set('page', page);
    params.set('limit', pagination.limit);
    return `${baseUrl}?${params.toString()}`;
  };

  const links = {
    self: buildUrl(pagination.page),
    first: buildUrl(1),
    last: buildUrl(pagination.totalPages),
  };

  if (pagination.hasNextPage) {
    links.next = buildUrl(pagination.nextPage);
  }

  if (pagination.hasPrevPage) {
    links.prev = buildUrl(pagination.prevPage);
  }

  return links;
};

/**
 * Calculate offset for SQL-based pagination
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {number} - Offset value
 */
const calculateOffset = (page, limit) => {
  return (page - 1) * limit;
};

/**
 * Get page range for pagination UI
 * @param {number} currentPage - Current page
 * @param {number} totalPages - Total pages
 * @param {number} delta - Number of pages to show on each side (default: 2)
 * @returns {Array} - Array of page numbers to display
 */
const getPageRange = (currentPage, totalPages, delta = 2) => {
  const range = [];
  const rangeWithDots = [];
  let l;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      range.push(i);
    }
  }

  range.forEach((i) => {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1);
      } else if (i - l !== 1) {
        rangeWithDots.push('...');
      }
    }
    rangeWithDots.push(i);
    l = i;
  });

  return rangeWithDots;
};

/**
 * Validate pagination parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {object} - Validation result
 */
const validatePaginationParams = (page, limit) => {
  const errors = [];

  if (page < 1) {
    errors.push('Page must be greater than 0');
  }

  if (limit < 1) {
    errors.push('Limit must be greater than 0');
  }

  if (limit > PAGINATION.MAX_LIMIT) {
    errors.push(`Limit cannot exceed ${PAGINATION.MAX_LIMIT}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Create cursor-based pagination metadata (for large datasets)
 * @param {Array} data - Data array
 * @param {string} cursor - Current cursor
 * @param {number} limit - Items per page
 * @returns {object} - Cursor pagination response
 */
const createCursorPagination = (data, cursor, limit) => {
  const hasMore = data.length > limit;
  const results = hasMore ? data.slice(0, limit) : data;
  const nextCursor = hasMore ? results[results.length - 1]._id : null;

  return {
    data: results,
    pagination: {
      cursor,
      nextCursor,
      hasMore,
      limit,
    },
  };
};

module.exports = {
  getPaginationParams,
  createPaginationMeta,
  paginateResults,
  getPaginationLinks,
  calculateOffset,
  getPageRange,
  validatePaginationParams,
  createCursorPagination,
};
