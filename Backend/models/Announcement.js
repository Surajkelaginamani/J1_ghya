const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  vendorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'VendorProfile', 
    required: true 
  },
  type: { 
    type: String, 
    required: true // e.g., 'Holiday / Leave', 'Price Update'
  },
  text: { 
    type: String, 
    required: true 
  },
  date: { 
    type: String // We'll keep it as a string since your frontend sends 'en-IN' format
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Announcement', announcementSchema);
