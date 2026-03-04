const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/vendor/dashboard
router.get('/dashboard', authMiddleware, vendorController.getVendorDashboard);
router.get('/reviews', authMiddleware, vendorController.getVendorReviews);
// GET /api/vendor/students
router.get('/students', authMiddleware, vendorController.getVendorStudents);

// PUT /api/vendor/update-request
router.put('/update-request', authMiddleware, vendorController.updateRequestStatus);
router.post('/deliveries/:subscriptionId/mark-delivered', authMiddleware, vendorController.markDeliveryCompleted);
router.post('/deliveries/reset', authMiddleware, vendorController.resetVendorDailyDeliveries);

// Communication Center Routes
router.get('/communications', authMiddleware, vendorController.getCommunicationData);
router.put('/update-menu', authMiddleware, vendorController.updateWeeklyMenu);
router.post('/post-announcement', authMiddleware, vendorController.postAnnouncement);
router.get('/deliveries/today', authMiddleware, vendorController.getDailyDeliveryList);
// Vendor Profile Settings Routes
router.get('/profile', authMiddleware, vendorController.getVendorProfileSettings);
router.put('/profile', authMiddleware, vendorController.updateVendorProfileSettings);
router.get('/payments', authMiddleware, vendorController.getPaymentRecords);
router.put('/payments/:subscriptionId/mark-paid', authMiddleware, vendorController.markAsPaid);
router.get('/homemade-items', authMiddleware, vendorController.getVendorHomemadeItems);
router.post('/homemade-items', authMiddleware, vendorController.createVendorHomemadeItem);
router.put('/homemade-items/:itemId', authMiddleware, vendorController.updateVendorHomemadeItem);
router.put('/homemade-items/:itemId/restock', authMiddleware, vendorController.restockVendorHomemadeItem);
router.get('/homemade-orders', authMiddleware, vendorController.getVendorHomemadeOrders);
router.put('/homemade-orders/:orderId/status', authMiddleware, vendorController.updateVendorHomemadeOrderStatus);
router.get('/homemade-stock-logs', authMiddleware, vendorController.getVendorHomemadeStockLogs);
router.get('/holidays', authMiddleware, vendorController.getVendorHolidays);
router.post('/holidays', authMiddleware, vendorController.addVendorHoliday);
router.delete('/holidays/:holidayId', authMiddleware, vendorController.deleteVendorHoliday);
module.exports = router;
