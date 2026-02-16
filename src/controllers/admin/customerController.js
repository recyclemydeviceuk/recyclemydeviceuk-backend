// Admin Customer Management
const Order = require('../../models/Order');
const { HTTP_STATUS, PAGINATION } = require('../../config/constants');

// @desc    Get all customers with order statistics (from orders)
// @route   GET /api/admin/customers
// @access  Private/Admin
const getAllCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || PAGINATION.DEFAULT_PAGE;
    const limit = parseInt(req.query.limit) || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;
    const { search, sortBy } = req.query;

    // Aggregate customers from orders
    // Group by email AND name to handle cases where same email might be used by different people
    const customerAggregation = await Order.aggregate([
      {
        $group: {
          _id: {
            email: '$customerEmail',
            name: '$customerName',
          },
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { 
              $cond: [
                { $and: [{ $eq: ['$status', 'completed'] }, { $eq: ['$paymentStatus', 'paid'] }] }, 
                1, 
                0 
              ] 
            },
          },
          totalEarned: {
            $sum: { 
              $cond: [
                { $and: [{ $eq: ['$status', 'completed'] }, { $eq: ['$paymentStatus', 'paid'] }] }, 
                '$amount', 
                0 
              ] 
            },
          },
          lastOrderDate: { $max: '$createdAt' },
          firstOrderDate: { $min: '$createdAt' },
          phone: { $first: '$customerPhone' },
          address: { $first: '$address' },
          city: { $first: '$city' },
          postcode: { $first: '$postcode' },
        },
      },
      {
        $project: {
          _id: 0,
          email: '$_id.email',
          name: '$_id.name',
          phone: 1,
          address: 1,
          city: 1,
          postcode: 1,
          totalOrders: 1,
          completedOrders: 1,
          totalEarned: 1,
          lastOrderDate: 1,
          joinedDate: '$firstOrderDate',
        },
      },
    ]);

    // Determine order frequency for each customer
    const customersWithFrequency = customerAggregation.map(customer => {
      let orderFrequency = 'First Time';
      if (customer.totalOrders > 8) orderFrequency = 'Weekly';
      else if (customer.totalOrders > 5) orderFrequency = 'Bi-weekly';
      else if (customer.totalOrders > 2) orderFrequency = 'Monthly';
      else if (customer.totalOrders > 1) orderFrequency = 'Occasionally';

      return {
        id: `${customer.email}-${customer.name}`.replace(/[^a-zA-Z0-9]/g, '-'),
        name: customer.name || 'N/A',
        email: customer.email,
        phone: customer.phone || 'N/A',
        address: customer.address || 'N/A',
        city: customer.city || 'N/A',
        postcode: customer.postcode || 'N/A',
        totalOrders: customer.totalOrders,
        totalEarned: customer.totalEarned,
        lastOrderDate: customer.lastOrderDate,
        joinedDate: customer.joinedDate,
        orderFrequency,
        devices: customer.devices || [],
      };
    });

    // Apply search filter if provided
    let filteredCustomers = customersWithFrequency;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCustomers = customersWithFrequency.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.phone.includes(search) ||
        (c.city && c.city.toLowerCase().includes(searchLower))
      );
    }

    // Sort based on query
    let sortedCustomers = filteredCustomers;
    if (sortBy === 'totalOrders') {
      sortedCustomers = filteredCustomers.sort((a, b) => b.totalOrders - a.totalOrders);
    } else if (sortBy === 'totalEarned') {
      sortedCustomers = filteredCustomers.sort((a, b) => b.totalEarned - a.totalEarned);
    } else if (sortBy === 'name') {
      sortedCustomers = filteredCustomers.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Apply pagination
    const totalCustomers = sortedCustomers.length;
    const paginatedCustomers = sortedCustomers.slice(skip, skip + limit);

    // Calculate stats (from all customers, not just current page)
    const totalPayout = sortedCustomers.reduce((sum, c) => sum + c.totalEarned, 0);
    const totalOrdersCount = sortedCustomers.reduce((sum, c) => sum + c.totalOrders, 0);
    const averageOrderValue = totalOrdersCount > 0 ? totalPayout / totalOrdersCount : 0;
    const repeatCustomers = sortedCustomers.filter(c => c.totalOrders > 1).length;

    // Round all customer earnings in the paginated list
    const roundedCustomers = paginatedCustomers.map(c => ({
      ...c,
      totalEarned: Math.round(c.totalEarned)
    }));

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        customers: roundedCustomers,
        stats: {
          totalCustomers: totalCustomers,
          totalPayout: Math.round(totalPayout),
          averageOrderValue: Math.round(averageOrderValue),
          repeatCustomers,
        },
      },
      pagination: {
        page,
        limit,
        total: totalCustomers,
        pages: Math.ceil(totalCustomers / limit),
      },
    });
  } catch (error) {
    console.error('Get All Customers Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message,
    });
  }
};

// @desc    Get customer by email with full details
// @route   GET /api/admin/customers/:id (id is email-name hash)
// @access  Private/Admin
const getCustomerById = async (req, res) => {
  try {
    // ID is email, extract it from the hash format
    const customerId = req.params.id;
    
    // Get all orders to find customer email
    const allOrders = await Order.find();
    const customer = allOrders.find(o => 
      `${o.customerEmail}-${o.customerName}`.replace(/[^a-zA-Z0-9]/g, '-') === customerId
    );

    if (!customer) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Get all orders for this customer (by email and name)
    const orders = await Order.find({ 
      customerEmail: customer.customerEmail,
      customerName: customer.customerName,
    })
      .populate('recyclerId', 'companyName')
      .populate('deviceId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalEarned = completedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        customer: {
          id: customerId,
          name: customer.customerName,
          email: customer.customerEmail,
          phone: customer.customerPhone,
          address: customer.address,
          city: customer.city,
          postcode: customer.postcode,
          joinedDate: orders[orders.length - 1]?.createdAt, // First order date
        },
        stats: {
          totalOrders: orders.length,
          completedOrders: completedOrders.length,
          totalEarned: Math.round(totalEarned),
        },
        orders: orders.map(order => {
          let device = 'N/A';
          
          // Handle populated deviceId - Device model has 'name' field
          if (order.deviceId) {
            if (typeof order.deviceId === 'object' && order.deviceId.name) {
              device = order.deviceId.name;
            } else if (typeof order.deviceId === 'string') {
              device = 'Device ID: ' + order.deviceId; // Fallback to ID if not populated
            }
          }
          
          return {
            id: order._id,
            orderNumber: order.orderNumber,
            device,
            amount: order.amount,
            status: order.status,
            recycler: order.recyclerId?.companyName || 'N/A',
            createdAt: order.createdAt,
          };
        }),
      },
    });
  } catch (error) {
    console.error('Get Customer By ID Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch customer details',
      error: error.message,
    });
  }
};

// @desc    Get customer statistics
// @route   GET /api/admin/customers/stats
// @access  Private/Admin
const getCustomerStats = async (req, res) => {
  try {
    // Count unique customers by email+name combination
    const uniqueCustomers = await Order.aggregate([
      {
        $group: {
          _id: {
            email: '$customerEmail',
            name: '$customerName',
          },
          orderCount: { $sum: 1 },
          totalEarned: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] },
          },
        },
      },
    ]);

    const totalCustomers = uniqueCustomers.length;
    const activeCustomers = uniqueCustomers.filter(c => c.orderCount > 0).length;
    const repeatCustomers = uniqueCustomers.filter(c => c.orderCount > 1).length;
    const totalRevenue = uniqueCustomers.reduce((sum, c) => sum + c.totalEarned, 0);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        totalCustomers,
        activeCustomers,
        repeatCustomers,
        totalRevenue: Math.round(totalRevenue),
      },
    });
  } catch (error) {
    console.error('Get Customer Stats Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch customer statistics',
      error: error.message,
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  getCustomerStats,
};
