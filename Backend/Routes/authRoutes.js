const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Import the middleware we just created
const authMiddleware = require('../middleware/authMiddleware');

// --- PUBLIC ROUTES (No token needed) ---
router.post('/register', authController.register);
router.post('/login', authController.login);

// --- PROTECTED ROUTE (Requires a valid token!) ---
// Notice how we put authMiddleware in the middle!
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // Because authMiddleware ran first, we now have access to req.user!
    const User = require('../models/User');
    const user = await User.findById(req.user.userId).select('-password'); // Fetch user but hide password

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;