// Recycler middleware (redirects to authMiddleware)
// This file exists for backwards compatibility
// Use authMiddleware directly for better organization

const { protect, recyclerOnly } = require('./authMiddleware');

module.exports = {
  protect,
  recyclerOnly,
};
