const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/customer/dashboard
// This route is protected! Only logged-in users with a token can access it.
router.get('/dashboard', authMiddleware, customerController.getDashboardData);
// GET /api/customer/vendors
router.get('/vendors', authMiddleware, customerController.getAllVendors);
// GET /api/customer/vendors/:id
// The ":id" makes this a dynamic URL parameter
router.get('/vendors/:id', authMiddleware, customerController.getVendorById);
// POST /api/customer/subscribe
router.post('/subscribe', authMiddleware, customerController.createSubscriptionRequest);
// GET /api/customer/subscriptions
router.get('/subscriptions', authMiddleware, customerController.getMySubscriptions);
router.get('/subscribed-weekly-menus', authMiddleware, customerController.getSubscribedWeeklyMenus);
// GET /api/customer/orders
router.get('/orders', authMiddleware, customerController.getMyOrders);
router.get('/homemade-items', authMiddleware, customerController.getHomemadeProducts);
router.post('/homemade-orders', authMiddleware, customerController.placeHomemadeOrder);
router.get('/homemade-orders', authMiddleware, customerController.getMyHomemadeOrders);

router.put('/subscriptions/:id/holidays', authMiddleware, customerController.updateHolidays);

router.get('/profile', authMiddleware, customerController.getProfile);
router.put('/profile', authMiddleware, customerController.updateProfile);
// Payment Route
router.get('/payments', authMiddleware, customerController.getCustomerPayments);
router.get('/reviews', authMiddleware, customerController.getCustomerReviews);
router.post('/reviews', authMiddleware, customerController.createOrUpdateReview);
router.delete('/reviews/:reviewId', authMiddleware, customerController.deleteMyReview);
module.exports = router;
