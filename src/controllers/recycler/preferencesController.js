// Recycler preferences management
const { HTTP_STATUS } = require('../../config/constants');
const RecyclerPreferences = require('../../models/RecyclerPreferences');

// @desc    Get recycler preferences
// @route   GET /api/recycler/preferences
// @access  Private/Recycler
const getPreferences = async (req, res) => {
  try {
    const recyclerId = req.user._id;

    let preferences = await RecyclerPreferences.findOne({ recyclerId });

    // Create default preferences if they don't exist
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

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Get Preferences Error:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch preferences',
      error: error.message,
    });
  }
};

// @desc    Update recycler preferences
// @route   PUT /api/recycler/preferences
// @access  Private/Recycler
const updatePreferences = async (req, res) => {
  try {
    const recyclerId = req.user._id;
    const { enabledStorage, enabledConditions, selectedDevices } = req.body;

    let preferences = await RecyclerPreferences.findOne({ recyclerId });

    if (preferences) {
      // Update existing preferences
      if (enabledStorage) preferences.enabledStorage = enabledStorage;
      if (enabledConditions) preferences.enabledConditions = enabledConditions;
      if (selectedDevices !== undefined) preferences.selectedDevices = selectedDevices;
      
      await preferences.save();
    } else {
      // Create new preferences
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

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Preferences updated successfully',
      data: preferences,
    });
  } catch (error) {
    console.error('Update Preferences Error:', error);
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message,
    });
  }
};

module.exports = {
  getPreferences,
  updatePreferences,
};
