const mongoose = require('mongoose');

const vendorHolidaySchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VendorProfile',
      required: true
    },
    dateKey: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      default: ''
    },
    extendedSubscriptions: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

vendorHolidaySchema.index({ vendor: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.model('VendorHoliday', vendorHolidaySchema);
