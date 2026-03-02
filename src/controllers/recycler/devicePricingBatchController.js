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
      enabledConditions,
      enabledNetworks
    } = req.body;

    console.log('Batch save request:', {
      recyclerId: recyclerId.toString(),
      selectedDevicesCount: selectedDevices?.length,
      devicePricingCount: devicePricing?.length,
      enabledStorage,
      enabledConditions,
      enabledNetworks
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
      if (enabledNetworks) preferences.enabledNetworks = enabledNetworks;
      // Only update selectedDevices if provided and not empty (for bulk saves)
      // For individual device saves, we skip this to preserve existing selections
      if (selectedDevices && selectedDevices.length > 0) {
        preferences.selectedDevices = selectedDevices;
      }
      await preferences.save();
    } else {
      preferences = await RecyclerPreferences.create({
        recyclerId,
        enabledStorage: enabledStorage || {},
        enabledConditions: enabledConditions || {},
        enabledNetworks: enabledNetworks || {},
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

        // Transform pricing data to storage+network-based format
        // Key is "storage||network" to support storage+network combinations
        const storagePricingMap = {};
        
        pricingData.forEach(item => {
          const { condition, storage, network, price } = item;
          const networkKey = network || 'Unlocked';
          const combinedKey = `${storage}||${networkKey}`;
          
          if (!storagePricingMap[combinedKey]) {
            storagePricingMap[combinedKey] = { storage, network: networkKey, conditions: {} };
          }
          
          // Normalize condition key to lowercase for consistency
          const conditionKey = condition.toLowerCase();
          storagePricingMap[combinedKey].conditions[conditionKey] = price || 0;
        });

        // Convert to array format preserving network field
        const storagePricing = Object.values(storagePricingMap).map(entry => ({
          storage: entry.storage,
          network: entry.network,
          conditions: entry.conditions,
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
      .populate('selectedDevices', 'name brand image storageOptions conditionOptions networkOptions');

    if (!preferences) {
      preferences = await RecyclerPreferences.create({
        recyclerId,
        enabledStorage: {},
        enabledConditions: {},
        enabledNetworks: {},
        selectedDevices: [],
      });
    }

    // Get all pricing for this recycler
    const allPricing = await RecyclerDevicePricing.find({ recyclerId })
      .populate('deviceId', 'name brand image storageOptions conditionOptions networkOptions');

    // Transform pricing to frontend format with sync to current device options
    const pricingByDevice = {};
    
    for (const pricing of allPricing) {
      // Handle cases where device might have been deleted or not populated
      if (!pricing.deviceId) {
        console.warn(`Skipping pricing for recycler ${recyclerId} - device not found (deviceId: ${pricing.deviceId})`);
        continue;
      }
      
      // deviceId might be populated object or just an ID string
      const deviceId = pricing.deviceId._id 
        ? pricing.deviceId._id.toString() 
        : pricing.deviceId.toString();
      const device = pricing.deviceId._id ? pricing.deviceId : null;
      
      // Skip if device was deleted or we can't get device info
      if (!device) {
        console.warn(`Skipping pricing - device ${deviceId} not found`);
        continue;
      }
      
      // Get current device options
      const currentStorageOptions = device.storageOptions || [];
      const currentConditionOptions = device.conditionOptions || [];
      const currentNetworkOptions = device.networkOptions && device.networkOptions.length > 0
        ? device.networkOptions
        : ['Unlocked'];
      
      // Build a map of existing pricing for quick lookup (storage+network+condition)
      const existingPricingMap = {};
      pricing.storagePricing.forEach(sp => {
        const conditions = sp.conditions instanceof Map ? 
          Object.fromEntries(sp.conditions) : sp.conditions;
        const networkKey = (sp.network || 'Unlocked').toLowerCase();
        
        Object.keys(conditions).forEach(conditionKey => {
          const key = `${sp.storage.toLowerCase()}-${networkKey}-${conditionKey.toLowerCase()}`;
          existingPricingMap[key] = conditions[conditionKey];
        });
      });
      
      // Build synced pricing array (3D: storage × network × condition)
      const syncedPricingArray = [];
      
      currentStorageOptions.forEach(storage => {
        currentNetworkOptions.forEach(network => {
          currentConditionOptions.forEach(condition => {
            const conditionKey = condition.toLowerCase();
            const networkKeyLower = network.toLowerCase();
            const lookupKey = `${storage.toLowerCase()}-${networkKeyLower}-${conditionKey}`;
            const existingPrice = existingPricingMap[lookupKey];
            
            syncedPricingArray.push({
              condition,
              storage,
              network,
              price: existingPrice !== undefined ? existingPrice : 0,
            });
          });
        });
      });
      
      pricingByDevice[deviceId] = syncedPricingArray;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        preferences: {
          enabledStorage: preferences.enabledStorage instanceof Map ? 
            Object.fromEntries(preferences.enabledStorage) : preferences.enabledStorage,
          enabledConditions: preferences.enabledConditions instanceof Map ? 
            Object.fromEntries(preferences.enabledConditions) : preferences.enabledConditions,
          enabledNetworks: preferences.enabledNetworks instanceof Map ? 
            Object.fromEntries(preferences.enabledNetworks) : (preferences.enabledNetworks || {}),
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
