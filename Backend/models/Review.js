const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VendorProfile',
      required: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    }
  },
  { timestamps: true }
);

// One customer can keep one latest review per vendor (can update it later).
reviewSchema.index({ vendor: 1, customer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);

