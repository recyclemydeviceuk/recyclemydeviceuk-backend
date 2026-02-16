// Recycler global preferences for device acceptance
const mongoose = require('mongoose');

const recyclerPreferencesSchema = new mongoose.Schema({
  recyclerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recycler',
    required: [true, 'Recycler ID is required'],
    unique: true,
    index: true,
  },
  // Enabled storage options
  enabledStorage: {
    type: Map,
    of: Boolean,
    default: {
      '128GB': true,
      '256GB': true,
      '512GB': true,
      '1TB': true,
    },
  },
  // Enabled condition options
  enabledConditions: {
    type: Map,
    of: Boolean,
    default: {
      'Like New': true,
      'Good': true,
      'Fair': true,
      'Poor': true,
      'Faulty': true,
    },
  },
  // Selected devices (for quick reference)
  selectedDevices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('RecyclerPreferences', recyclerPreferencesSchema);
