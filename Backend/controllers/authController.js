const User = require('../models/User'); 
const VendorProfile = require('../models/VendorProfile'); // <-- NEW IMPORT
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- 1. REGISTER A NEW USER OR VENDOR ---
exports.register = async (req, res) => {
  try {
    const { 
      // Common fields
      name, email, password, phone, role, 
      // Customer specific
      location, roomNumber,
      // Vendor specific
      businessName, serviceArea, serviceType, foodType, deliveryType,
      monthlyFee, halfTiffinMonthlyPrice, singleTiffinPrice 
    } = req.body;

    // 1. Check if the email is already registered
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create and save the primary User account
    user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      location: role === 'customer' ? location : undefined, 
      roomNumber: role === 'customer' ? roomNumber : undefined
    });

    await user.save(); // Saves to the 'users' collection

    // 4. IF VENDOR: Create and save their connected Business Profile
    if (role === 'vendor') {
      const vendorProfile = new VendorProfile({
        vendorId: user._id, // Links this profile back to the User account
        businessName,
        serviceArea,
        serviceType,
        foodType,
        deliveryType,
        monthlyFee,
        halfTiffinMonthlyPrice,
        singleTiffinPrice
      });
      await vendorProfile.save(); // Saves to the 'vendorprofiles' collection
    }

    // 5. Create the JWT Token
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' } 
    );

    // 6. Send Success Response
    res.status(201).json({
      message: role === 'vendor' ? 'Vendor Account created successfully' : 'Customer Account created successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// --- 2. LOGIN AN EXISTING USER/VENDOR ---
// (This remains largely the same, as login just checks email/password)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate Token
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: 'Server error during login' });
  }
};
