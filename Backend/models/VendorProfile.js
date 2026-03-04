const mongoose = require('mongoose');

const vendorProfileSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // ... existing fields (businessName, pricing, etc.) ...

  // 1. ADD THE WEEKLY MENU TEMPLATE
  weeklyMenu: {
    Monday: { lunch: { type: String, default: "" }, dinner: { type: String, default: "" } },
    Tuesday: { lunch: { type: String, default: "" }, dinner: { type: String, default: "" } },
    Wednesday: { lunch: { type: String, default: "" }, dinner: { type: String, default: "" } },
    Thursday: { lunch: { type: String, default: "" }, dinner: { type: String, default: "" } },
    Friday: { lunch: { type: String, default: "" }, dinner: { type: String, default: "" } },
    Saturday: { lunch: { type: String, default: "" }, dinner: { type: String, default: "" } },
    Sunday: { lunch: { type: String, default: "" }, dinner: { type: String, default: "" } }
  },

  // 2. ADD ANNOUNCEMENTS ARRAY
  announcements: [{
    type: { type: String },
    text: { type: String },
    date: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],

  // ... rest of schema
  businessName: { type: String, required: true },
  serviceArea: { type: String, required: true },
  
  // Added serviceType based on your frontend form
  serviceType: { type: String, enum: ['tiffin', 'products', 'both'], required: true },
  
  foodType: { type: String, enum: ['veg', 'nonveg', 'mix'], required: true },
  deliveryType: { type: String, enum: ['delivery', 'pickup', 'both'], required: true },
  monthlyFee: { type: Number, required: true, min: 0 },
  halfTiffinMonthlyPrice: { type: Number, required: true, min: 0 },
  singleTiffinPrice: { type: Number, required: true, min: 0 },
  
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  upiId: { type: String }, 
  isAcceptingOrders: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('VendorProfile', vendorProfileSchema);
