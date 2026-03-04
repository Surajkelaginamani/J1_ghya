const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const DeliveryStatus = require('./models/DeliveryStatus');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

app.use(cors());
app.use(express.json());

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is missing. Set it in Backend/.env');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB Atlas');
    try {
      await DeliveryStatus.syncIndexes();
      console.log('DeliveryStatus indexes synced');
    } catch (indexError) {
      console.error('Error syncing DeliveryStatus indexes:', indexError);
    }
  })
  .catch((err) => console.error('MongoDB Connection Error:', err));

const authRoutes = require('./Routes/authRoutes');
const customerRoutes = require('./Routes/customerRoutes');
const vendorRoutes = require('./Routes/vendorRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/vendor', vendorRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.all('/api', (req, res) => {
  res.status(400).json({
    message: 'Use a specific API endpoint. Example: POST /api/vendor/homemade-items'
  });
});

app.use('/api', (req, res) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` });
});

module.exports = app;
