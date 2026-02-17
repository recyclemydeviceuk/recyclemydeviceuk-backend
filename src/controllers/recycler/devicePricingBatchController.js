// Batch operations for device pricing and selection
const { HTTP_STATUS } = require('../../config/constants');
const RecyclerDevicePricing = require('../../models/RecyclerDevicePricing');
const RecyclerPreferences = require('../../models/RecyclerPreferences');
const Device = require('../../models/Device');

// @desc    Save complete device configuration (batch)
// @route   POST /api/recycler/device-config/batch-save
// @access  Private/Recycler
const batchSaveConfiguration = async (req, res) => {
  try {
    const recyclerId = req.user._id;
    const { 
      selectedDevices, 
      devicePricing, 
      enabledStorage, 
      enabledConditions 
    } = req.body;

    console.log('Batch save request:', {
      recyclerId: recyclerId.toString(),
      selectedDevicesCount: selectedDevices?.length,
      devicePricingCount: devicePricing?.length,
      enabledStorage,
      enabledConditions
    });

    // Validate request
    if (!Array.isArray(selectedDevices)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'selectedDevices must be an array',
      });
    }

    if (!Array.isArray(devicePricing)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'devicePricing must be an array',
      });
    }

    // Update preferences
    let preferences = await RecyclerPreferences.findOne({ recyclerId });
    
    if (preferences) {
      if (enabledStorage) preferences.enabledStorage = enabledStorage;
      if (enabledConditions) preferences.enabledConditions = enabledConditions;
      // Only update selectedDevices if provided and not empty (for bulk saves)
      // For individual device saves, we skip this to preserve existing selections
      if (selectedDevices && selectedDevices.length > 0) {
        preferences.selectedDevices = selectedDevices;
      }
      await preferences.save();
    } else {
      preferences = await RecyclerPreferences.create({
        recyclerId,
        enabledStorage: enabledStorage || {
          '128GB': true,
          '256GB': true,
          '512GB': true,
          '1TB': true,
        },
        enabledConditions: enabledConditions || {
          'Like New': true,
          'Good': true,
          'Fair': true,
          'Poor': true,
          'Faulty': true,
        },
        selectedDevices: selectedDevices || [],
      });
    }

    // Process device pricing
    const savedPricing = [];
    const errors = [];

    for (const pricing of devicePricing) {
      try {
        const { deviceId, pricing: pricingData } = pricing;

        if (!deviceId || !pricingData || !Array.isArray(pricingData)) {
          errors.push({
            deviceId,
            error: 'Invalid pricing data format',
          });
          continue;
        }

        // Verify device exists
        const device = await Device.findById(deviceId);
        if (!device) {
          errors.push({
            deviceId,
            error: 'Device not found',
          });
          continue;
        }

        // Transform pricing data to storage-based format
        const storagePricingMap = {};
        
        pricingData.forEach(item => {
          const { condition, storage, price } = item;
          
          if (!storagePricingMap[storage]) {
            storagePricingMap[storage] = {};
          }
          
          // Normalize condition key to lowercase for consistency
          const conditionKey = condition.toLowerCase();
          storagePricingMap[storage][conditionKey] = price || 0;
        });

        // Convert to array format
        const storagePricing = Object.keys(storagePricingMap).map(storage => ({
          storage,
          conditions: storagePricingMap[storage],
        }));

        // Create or update pricing
        let devicePricingDoc = await RecyclerDevicePricing.findOne({
          recyclerId,
          deviceId,
        });

        if (devicePricingDoc) {
          devicePricingDoc.storagePricing = storagePricing;
          devicePricingDoc.isActive = true;
          await devicePricingDoc.save();
        } else {
          devicePricingDoc = await RecyclerDevicePricing.create({
            recyclerId,
            deviceId,
            storagePricing,
            isActive: true,
          });
        }

        savedPricing.push({
          deviceId,
          success: true,
        });
      } catch (error) {
        console.error('Error saving pricing for device:', pricing.deviceId, error);
        errors.push({
          deviceId: pricing.deviceId,
          error: error.message,
        });
      }
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Configuration saved successfully. ${savedPricing.length} devices configured.`,
      data: {
        savedCount: savedPricing.length,
        errorCount: errors.length,
        savedPricing,
        errors: errors.length > 0 ? errors : undefined,
        preferences,
      },
    });
  } catch (error) {
    console.error('Batch Save Configuration Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to save configuration',
      error: error.message,
    });
  }
};

// @desc    Get complete device configuration
// @route   GET /api/recycler/device-config
// @access  Private/Recycler
const getConfiguration = async (req, res) => {
  try {
    const recyclerId = req.user._id;

    // Get preferences
    let preferences = await RecyclerPreferences.findOne({ recyclerId })
      .populate('selectedDevices', 'name brand image storageOptions conditionOptions');

    if (!preferences) {
      preferences = await RecyclerPreferences.create({
        recyclerId,
        enabledStorage: {
          '128GB': true,
          '256GB': true,
          '512GB': true,
          '1TB': true,
        },
        enabledConditions: {
          'Like New': true,
          'Good': true,
          'Fair': true,
          'Poor': true,
          'Faulty': true,
        },
        selectedDevices: [],
      });
    }

    // Get all pricing for this recycler
    const allPricing = await RecyclerDevicePricing.find({ recyclerId })
      .populate('deviceId', 'name brand image storageOptions conditionOptions');

    // Transform pricing to frontend format with sync to current device options
    const pricingByDevice = {};
    
    for (const pricing of allPricing) {
      const deviceId = pricing.deviceId._id.toString();
      const device = pricing.deviceId;
      
      // Get current device options
      const currentStorageOptions = device.storageOptions || [];
      const currentConditionOptions = device.conditionOptions || [];
      
      // Build a map of existing pricing for quick lookup
      const existingPricingMap = {};
      pricing.storagePricing.forEach(sp => {
        const conditions = sp.conditions instanceof Map ? 
          Object.fromEntries(sp.conditions) : sp.conditions;
        
        Object.keys(conditions).forEach(conditionKey => {
          const key = `${sp.storage.toLowerCase()}-${conditionKey.toLowerCase()}`;
          existingPricingMap[key] = conditions[conditionKey];
        });
      });
      
      // Build synced pricing array
      const syncedPricingArray = [];
      
      // For each current storage option
      currentStorageOptions.forEach(storage => {
        // For each current condition option
        currentConditionOptions.forEach(condition => {
          const conditionKey = condition.toLowerCase();
          const lookupKey = `${storage.toLowerCase()}-${conditionKey}`;
          
          // Check if we have existing pricing for this combination
          const existingPrice = existingPricingMap[lookupKey];
          
          syncedPricingArray.push({
            condition: condition,
            storage: storage,
            price: existingPrice !== undefined ? existingPrice : 0,
          });
        });
      });
      
      pricingByDevice[deviceId] = syncedPricingArray;
      
      // If device options changed, update the stored pricing in background
      const hasChanges = syncedPricingArray.length !== (pricing.storagePricing || []).reduce(
        (acc, sp) => acc + (sp.conditions ? Object.keys(sp.conditions).length : 0), 0
      );
      
      if (hasChanges) {
        // Transform synced pricing back to storage format and save
        const newStoragePricingMap = {};
        syncedPricingArray.forEach(item => {
          if (!newStoragePricingMap[item.storage]) {
            newStoragePricingMap[item.storage] = {};
          }
          newStoragePricingMap[item.storage][item.condition.toLowerCase()] = item.price;
        });
        
        const newStoragePricing = Object.keys(newStoragePricingMap).map(storage => ({
          storage,
          conditions: newStoragePricingMap[storage],
        }));
        
        // Update in background (don't await to keep response fast)
        RecyclerDevicePricing.findOneAndUpdate(
          { recyclerId, deviceId },
          { storagePricing: newStoragePricing },
          { new: true }
        ).exec().catch(err => console.error('Background pricing sync error:', err));
      }
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        preferences: {
          enabledStorage: preferences.enabledStorage instanceof Map ? 
            Object.fromEntries(preferences.enabledStorage) : preferences.enabledStorage,
          enabledConditions: preferences.enabledConditions instanceof Map ? 
            Object.fromEntries(preferences.enabledConditions) : preferences.enabledConditions,
          selectedDevices: preferences.selectedDevices,
        },
        pricingByDevice,
      },
    });
  } catch (error) {
    console.error('Get Configuration Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch configuration',
      error: error.message,
    });
  }
};

module.exports = {
  batchSaveConfiguration,
  getConfiguration,
};
