// Customer pricing queries
const { HTTP_STATUS } = require('../../config/constants');
const RecyclerDevicePricing = require('../../models/RecyclerDevicePricing');
const Device = require('../../models/Device');
const Recycler = require('../../models/Recycler');

// @desc    Get all prices for a device from all recyclers
// @route   GET /api/customer/pricing/device/:deviceId
// @access  Public
const getDevicePrices = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { storage, condition } = req.query;

    // Verify device exists
    const device = await Device.findById(deviceId).populate('brand', 'name');
    if (!device) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Device not found',
      });
    }

    // Get all pricing for this device from active recyclers
    const pricingData = await RecyclerDevicePricing.find({
      deviceId,
      isActive: true,
    })
      .populate({
        path: 'recyclerId',
        match: { status: 'approved' }, // Only approved recyclers
        select: 'companyName email phone city logo usps status',
      })
      .sort({ createdAt: -1 });

    // Filter out any pricing where recyclerId is null (recycler not approved)
    const approvedPricing = pricingData.filter(p => p.recyclerId !== null);

    if (!approvedPricing || approvedPricing.length === 0) {
      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          device: {
            id: device._id,
            name: device.name,
            brand: device.brand.name,
            image: device.image,
            category: device.category,
          },
          offers: [],
        },
      });
    }

    // If storage and condition are provided, filter and format the results
    if (storage && condition) {
      const offers = approvedPricing
        .map((pricing) => {
          // Find the storage pricing
          const storagePrice = pricing.storagePricing.find(
            (sp) => sp.storage === storage
          );

          if (!storagePrice) return null;

          // Get the condition price
          const conditionKey = condition.toLowerCase();
          const price = storagePrice.conditions.get(conditionKey);

          if (price === undefined || price === null) return null;

          return {
            recycler: {
              id: pricing.recyclerId._id,
              name: pricing.recyclerId.companyName,
              email: pricing.recyclerId.email,
              phone: pricing.recyclerId.phone,
              city: pricing.recyclerId.city,
              logo: pricing.recyclerId.logo,
              usps: pricing.recyclerId.usps || [],
            },
            price,
            storage,
            condition,
          };
        })
        .filter((offer) => offer !== null)
        .sort((a, b) => b.price - a.price); // Sort by price descending

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          device: {
            id: device._id,
            name: device.name,
            brand: device.brand.name,
            image: device.image,
            category: device.category,
          },
          offers,
        },
      });
    }

    // If no storage/condition specified, return all pricing data
    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        device: {
          id: device._id,
          name: device.name,
          brand: device.brand.name,
          image: device.image,
          category: device.category,
          storageOptions: device.storageOptions,
          conditionOptions: device.conditionOptions,
        },
        pricing: approvedPricing.map((p) => ({
          recycler: {
            id: p.recyclerId._id,
            name: p.recyclerId.companyName,
            email: p.recyclerId.email,
            phone: p.recyclerId.phone,
            city: p.recyclerId.city,
          },
          storagePricing: p.storagePricing,
        })),
      },
    });
  } catch (error) {
    console.error('Get Device Prices Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch device prices',
      error: error.message,
    });
  }
};

module.exports = {
  getDevicePrices,
};
