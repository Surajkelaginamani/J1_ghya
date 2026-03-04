const User = require('../models/User');
const Subscription = require('../models/Subscription');
const DailyMenu = require('../models/DailyMenu');
const Announcement = require('../models/Announcement');
const VendorProfile = require('../models/VendorProfile');
const Review = require('../models/Review');
const HomemadeItem = require('../models/HomemadeItem');
const HomemadeOrder = require('../models/HomemadeOrder');
const HomemadeStockLog = require('../models/HomemadeStockLog');

const normalizeDateKey = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  const dateKey = raw.includes('T') ? raw.slice(0, 10) : raw;
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? dateKey : null;
};

const parseDateKeyAsLocal = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const getWeekdayName = (date = new Date()) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

const buildTodaysMenuFromWeekly = (weeklyMenu) => {
  const dayName = getWeekdayName(new Date());
  const dayMenu = weeklyMenu?.[dayName] || {};
  const lunchItems = String(dayMenu.lunch || '').trim();
  const dinnerItems = String(dayMenu.dinner || '').trim();

  if (!lunchItems && !dinnerItems) return null;

  return {
    day: dayName,
    lunch: { time: '12:30 PM', items: lunchItems || 'No lunch menu set.' },
    dinner: dinnerItems ? { time: '8:00 PM', items: dinnerItems } : null
  };
};

const defaultWeeklyMenu = () => ({
  Monday: { lunch: '', dinner: '' },
  Tuesday: { lunch: '', dinner: '' },
  Wednesday: { lunch: '', dinner: '' },
  Thursday: { lunch: '', dinner: '' },
  Friday: { lunch: '', dinner: '' },
  Saturday: { lunch: '', dinner: '' },
  Sunday: { lunch: '', dinner: '' }
});

const recomputeVendorRating = async (vendorId) => {
  const result = await Review.aggregate([
    { $match: { vendor: vendorId } },
    {
      $group: {
        _id: '$vendor',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (!result.length) {
    await VendorProfile.findByIdAndUpdate(vendorId, { rating: 0, totalReviews: 0 });
    return;
  }

  const { averageRating, totalReviews } = result[0];
  await VendorProfile.findByIdAndUpdate(vendorId, {
    rating: Number(averageRating.toFixed(1)),
    totalReviews
  });
};


exports.getDailyDeliveryList = async (req, res) => {
  try {
    const vendorId = req.vendor.id; // From your auth middleware
    
    // Get today's date in YYYY-MM-DD format (to match how you saved skippedDates)
    // We use a slight timezone adjustment to ensure it matches Indian Standard Time (IST) if needed
    const today = new Date();
    const todayDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 1. Fetch all ACTIVE subscriptions for this vendor
    // We populate the customer data so we know their name, location, and room number
    const allActiveSubs = await Subscription.find({ 
      vendorId: vendorId, 
      status: 'active' 
    }).populate('customerId', 'name phone location roomNumber');

    // 2. The Filter: Remove anyone who has marked today as a holiday
    const deliveriesToday = allActiveSubs.filter(sub => {
      // If skippedDates doesn't exist or today is NOT in the array, they get food!
      return !sub.skippedDates || !sub.skippedDates.includes(todayDateString);
    });

    // 3. Smart Grouping: Group the remaining students by their Hostel/Location
    const groupedDeliveries = deliveriesToday.reduce((acc, sub) => {
      // Handle cases where the customer might have deleted their account but sub remains
      if (!sub.customerId) return acc; 

      const location = sub.customerId.location || 'Unspecified Location';
      
      if (!acc[location]) {
        acc[location] = [];
      }
      
      acc[location].push({
        subscriptionId: sub._id,
        customerName: sub.customerId.name,
        roomNumber: sub.customerId.roomNumber || 'N/A',
        phone: sub.customerId.phone,
        planType: sub.planType,
        mealType: sub.mealType // Veg, Non-Veg
      });
      
      return acc;
    }, {});

    res.status(200).json({ 
      date: todayDateString,
      totalDeliveries: deliveriesToday.length,
      groupedList: groupedDeliveries 
    });

  } catch (error) {
    console.error("Error fetching delivery list:", error);
    res.status(500).json({ error: "Server error fetching delivery list" });
  }
};
// GET PROFILE
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password'); 
    if (!user) return res.status(404).json({ error: "User not found" });
    
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Server error fetching profile" });
  }
};

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    // Extracting exactly what matches your schema
    const { name, phone, location, roomNumber } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { name, phone, location, roomNumber },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Server error updating profile" });
  }
};
exports.updateHolidays = async (req, res) => {
  try {
    const subscriptionId = req.params.id;
    const customerId = req.user.userId || req.user.id;
    const { skippedDates } = req.body;

    if (!Array.isArray(skippedDates)) {
      return res.status(400).json({ error: "skippedDates must be an array." });
    }

    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      customer: customerId
    });

    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found for this customer." });
    }

    // Normalize to YYYY-MM-DD and deduplicate.
    const normalizedDates = [...new Set(skippedDates.map(normalizeDateKey).filter(Boolean))].sort();

    // Allow leave for today and future dates. Only past dates are ignored.
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const validDates = [];
    const ignoredDates = [];

    normalizedDates.forEach((dateKey) => {
      const targetDate = parseDateKeyAsLocal(dateKey);
      if (targetDate.getTime() >= todayStart.getTime()) {
        validDates.push(dateKey);
      } else {
        ignoredDates.push(dateKey);
      }
    });

    subscription.skippedDates = validDates;
    const updatedSubscription = await subscription.save();

    res.status(200).json({ 
      message: ignoredDates.length
        ? "Holidays updated. Some past dates were not saved."
        : "Holidays updated successfully!",
      subscription: updatedSubscription,
      ignoredDates
    });

  } catch (error) {
    console.error("Error updating holidays:", error);
    res.status(500).json({ error: "Server error while saving holidays" });
  }
};
// In controllers/customerController.js
exports.getCustomerDashboard = async (req, res) => {
  try {
    const customerId = req.user.userId || req.user.id;

    // Fetch the active subscription
    const activeSubscription = await Subscription.findOne({ 
        customer: customerId, // ensure this matches your schema (customer vs customerId)
        status: 'active' 
    }).populate('vendor');

    let vendorAnnouncements = [];
    let isUnpaid = false;

    if (activeSubscription) {
      // 1. Fetch announcements
      vendorAnnouncements = await Announcement.find({ 
          vendorId: activeSubscription.vendor._id 
      }).sort({ createdAt: -1 }).limit(3);
      
      // 2. NEW: Check if the vendor marked them as unpaid!
      // If it's explicitly 'unpaid', or if the field is missing (old data), flag it.
      if (activeSubscription.paymentStatus === 'unpaid' || !activeSubscription.paymentStatus) {
        isUnpaid = true;
      }
    }

    res.status(200).json({
      user: req.user,
      subscription: activeSubscription,
      announcements: vendorAnnouncements,
      hasPendingBill: isUnpaid, // Send the flag to the frontend!
      // ... stats, todaysMenu, etc.
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Dashboard fetch failed" });
  }
};

exports.getDashboardData = async (req, res) => {
  try {
    const customerId = req.user.userId || req.user.id;
    const allSubscriptions = await Subscription.find({ customer: customerId }).select('status endDate');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeSubscriptionsCount = allSubscriptions.filter(
      (sub) => String(sub.status || '').trim().toLowerCase() === 'active' && new Date(sub.endDate) > today
    ).length;

    // 1. Get the customer's basic details
    const customer = await User.findById(customerId).select('name email location');

    // 2. Look for an active subscription for this customer
    // We use .populate('vendor') to fetch the vendor's business details at the same time!
    const activeSubscription = await Subscription.findOne({ 
      customer: customerId, 
      status: 'active' 
    }).populate('vendor');

    let todaysMenu = null;
    let announcements = [];
    let weeklyMenus = [];

    // 3. If they have a subscription, check what that vendor is cooking today
    if (activeSubscription) {
      // Get today's date (starting at midnight) to search the DB
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      todaysMenu = await DailyMenu.findOne({
        vendor: activeSubscription.vendor._id,
        date: { $gte: today }
      });

      const weeklyMenuFromVendor = activeSubscription.vendor?.weeklyMenu || defaultWeeklyMenu();
      if (!todaysMenu) {
        todaysMenu = buildTodaysMenuFromWeekly(weeklyMenuFromVendor);
      }

      announcements = await Announcement.find({
        vendorId: activeSubscription.vendor._id
      })
      .sort({ createdAt: -1 })
      .limit(5);
    }

    const activeSubscriptions = await Subscription.find({
      customer: customerId,
      status: 'active'
    }).populate('vendor', 'businessName weeklyMenu');

    weeklyMenus = activeSubscriptions
      .filter((sub) => sub.vendor)
      .map((sub) => ({
        subscriptionId: sub._id,
        vendorId: sub.vendor._id,
        vendorName: sub.vendor.businessName || 'Vendor',
        weeklyMenu: sub.vendor.weeklyMenu || defaultWeeklyMenu()
      }));

    // 4. Send it all back to React in one neat package
    res.status(200).json({
      user: customer,
      subscription: activeSubscription || null,
      todaysMenu: todaysMenu || null,
      weeklyMenus,
      announcements,
      stats: {
        activeSubscriptions: activeSubscriptionsCount,
        totalOrders: 0, // We will calculate these later when we build the Orders model
        monthlySpend: 0
      }
    });

  } catch (error) {
    console.error("Dashboard Data Error:", error);
    res.status(500).json({ message: 'Server error fetching dashboard data' });
  }
};

exports.getAllVendors = async (req, res) => {
  try {
    // Find all vendor profiles in the database
    const vendors = await VendorProfile.find();
    
    res.status(200).json(vendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ message: 'Server error fetching vendors' });
  }
};

// Get a single vendor by ID
exports.getVendorById = async (req, res) => {
  try {
    // req.params.id grabs the ID directly from the URL!
    const vendor = await VendorProfile.findById(req.params.id);
    
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    
    res.status(200).json(vendor);
  } catch (error) {
    console.error("Error fetching vendor details:", error);
    res.status(500).json({ message: 'Server error fetching vendor details' });
  }
};

// Create a new Subscription Request
exports.createSubscriptionRequest = async (req, res) => {
  try {
    const { vendorId, planType, price, specialRequests } = req.body;
    const customerId = req.user.userId || req.user.id; // From the JWT token

    // 1. Check if they already have a pending or active request with this vendor
    const existingSub = await Subscription.findOne({
      customer: customerId,
      vendor: vendorId,
      status: { $in: ['pending', 'active'] }
    });

    if (existingSub) {
      return res.status(400).json({ message: "You already have a request or active subscription with this vendor." });
    }

    // 2. Create the new pending subscription
    // Since we don't know the exact end date until the vendor accepts, we will just set a placeholder or leave it blank for now. We can set it to 30 days from today as a baseline.
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const newSubscription = new Subscription({
      customer: customerId,
      vendor: vendorId,
      planType: planType,
      mealType: 'mix', // You can make this dynamic later based on what they select
      price: price,
      endDate: endDate,
      status: 'pending',
      // You can add specialRequests to your DB schema later if you want to save them!
    });

    await newSubscription.save();

    res.status(201).json({ message: "Request sent successfully! Waiting for vendor approval.", subscription: newSubscription });

  } catch (error) {
    console.error("Subscription Error:", error);
    res.status(500).json({ message: "Server error while sending request." });
  }
};
// Get all subscriptions for the logged-in customer
exports.getMySubscriptions = async (req, res) => {
  try {
    const customerId = req.user.userId || req.user.id;

    // Find all subscriptions for this user and populate the vendor's business name
    const subscriptions = await Subscription.find({ customer: customerId })
      .populate('vendor', 'businessName') 
      .sort({ createdAt: -1 }); // Shows the newest requests at the top!

    res.status(200).json(subscriptions);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ message: 'Server error fetching subscriptions' });
  }
};

exports.getSubscribedWeeklyMenus = async (req, res) => {
  try {
    const customerId = req.user.userId || req.user.id;
    const activeSubscriptions = await Subscription.find({
      customer: customerId,
      status: 'active'
    }).populate('vendor', 'businessName weeklyMenu');

    const menus = activeSubscriptions
      .filter((sub) => sub.vendor)
      .map((sub) => ({
        subscriptionId: sub._id,
        vendorId: sub.vendor._id,
        vendorName: sub.vendor.businessName || 'Vendor',
        weeklyMenu: sub.vendor.weeklyMenu || defaultWeeklyMenu()
      }));

    res.status(200).json({ menus });
  } catch (error) {
    console.error('Error fetching subscribed weekly menus:', error);
    res.status(500).json({ message: 'Server error fetching weekly menus' });
  }
};

// --- Get My Orders (derived from customer subscriptions) ---
exports.getMyOrders = async (req, res) => {
  try {
    const customerId = req.user.userId || req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const subscriptions = await Subscription.find({ customer: customerId })
      .populate('vendor', 'businessName deliveryType')
      .sort({ createdAt: -1 });

    const normalizePlanType = (planType) => {
      if (!planType) return 'Plan';
      return String(planType)
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const normalizeMealType = (mealType) => {
      if (!mealType) return '';
      const normalized = String(mealType).toLowerCase();
      if (normalized === 'nonveg') return 'Non-Veg';
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    };

    const formatStatus = (status, isExpiredByDate) => {
      if (isExpiredByDate) return 'Expired';
      const normalized = String(status || '').toLowerCase();
      if (!normalized) return 'Pending';
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    };

    const formattedOrders = subscriptions.map((sub) => {
      const statusValue = String(sub.status || '').toLowerCase();
      const endDate = sub.endDate ? new Date(sub.endDate) : null;
      const isExpiredByDate = Boolean(endDate && endDate < today);
      const isPast =
        isExpiredByDate ||
        ['cancelled', 'expired'].includes(statusValue);

      return {
        _id: sub._id,
        vendorName: sub.vendor?.businessName || 'Unknown Vendor',
        orderNumber: String(sub._id).slice(-6).toUpperCase(),
        status: formatStatus(sub.status, isExpiredByDate),
        planType: normalizePlanType(sub.planType),
        mealType: normalizeMealType(sub.mealType),
        orderDate: sub.createdAt,
        startDate: sub.startDate,
        endDate: sub.endDate,
        deliveryType: sub.vendor?.deliveryType || 'Delivery',
        totalAmount: sub.price || 0,
        isPast
      };
    });

    const activeOrders = formattedOrders.filter((order) => !order.isPast);
    const pastOrders = formattedOrders.filter((order) => order.isPast);

    res.status(200).json({
      activeOrders,
      pastOrders
    });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
};

// --- Homemade products marketplace for customers ---
exports.getHomemadeProducts = async (req, res) => {
  try {
    const items = await HomemadeItem.find({
      isActive: true,
      inStock: true,
      stockQuantity: { $gt: 0 }
    })
      .populate('vendor', 'businessName serviceArea')
      .sort({ createdAt: -1 });

    const formattedItems = items
      .filter((item) => item.vendor)
      .map((item) => ({
        _id: item._id,
        name: item.name,
        category: item.category,
        description: item.description,
        imageUrl: item.imageUrl,
        unit: item.unit,
        price: item.price,
        stockQuantity: item.stockQuantity,
        vendorId: item.vendor._id,
        vendorName: item.vendor.businessName,
        serviceArea: item.vendor.serviceArea
      }));

    res.status(200).json(formattedItems);
  } catch (error) {
    console.error("Error fetching homemade products:", error);
    res.status(500).json({ message: 'Server error fetching homemade products' });
  }
};

exports.placeHomemadeOrder = async (req, res) => {
  try {
    const customerId = req.user.userId || req.user.id;
    const { itemId, quantity } = req.body;

    if (!itemId) {
      return res.status(400).json({ message: 'itemId is required.' });
    }

    const parsedQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
    const item = await HomemadeItem.findById(itemId);
    if (!item || !item.isActive || !item.inStock) {
      return res.status(404).json({ message: 'Item is not available for ordering.' });
    }

    const previousStock = item.stockQuantity;
    const updatedItem = await HomemadeItem.findOneAndUpdate(
      {
        _id: itemId,
        isActive: true,
        inStock: true,
        stockQuantity: { $gte: parsedQuantity }
      },
      { $inc: { stockQuantity: -parsedQuantity } },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(400).json({ message: `Only ${previousStock} item(s) left in stock.` });
    }

    if (updatedItem.stockQuantity <= 0 || !updatedItem.isActive) {
      updatedItem.stockQuantity = Math.max(0, updatedItem.stockQuantity);
      updatedItem.inStock = false;
      await updatedItem.save();
    }

    const totalAmount = parsedQuantity * item.price;

    const order = await HomemadeOrder.create({
      customer: customerId,
      vendor: item.vendor,
      item: item._id,
      itemName: item.name,
      itemUnit: item.unit,
      pricePerUnit: item.price,
      quantity: parsedQuantity,
      totalAmount
    });

    await HomemadeStockLog.create({
      vendor: item.vendor,
      item: item._id,
      order: order._id,
      action: 'order_placed',
      quantityChange: -parsedQuantity,
      previousStock,
      newStock: updatedItem.stockQuantity,
      note: `Order placed by customer ${customerId}`
    });

    res.status(201).json({
      message: 'Order placed successfully.',
      order
    });
  } catch (error) {
    console.error("Error placing homemade order:", error);
    res.status(500).json({ message: 'Server error placing homemade order' });
  }
};

exports.getMyHomemadeOrders = async (req, res) => {
  try {
    const customerId = req.user.userId || req.user.id;
    const orders = await HomemadeOrder.find({ customer: customerId })
      .populate('vendor', 'businessName')
      .sort({ createdAt: -1 });

    const formattedOrders = orders.map((order) => ({
      _id: order._id,
      itemName: order.itemName,
      itemUnit: order.itemUnit,
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      status: order.status,
      vendorName: order.vendor?.businessName || 'Unknown Vendor',
      createdAt: order.createdAt
    }));

    res.status(200).json(formattedOrders);
  } catch (error) {
    console.error("Error fetching homemade orders:", error);
    res.status(500).json({ message: 'Server error fetching homemade orders' });
  }
};

// --- Customer Reviews (DB-backed) ---
exports.getCustomerReviews = async (req, res) => {
  try {
    const customerId = req.user.userId || req.user.id;

    const [allReviews, myReviews] = await Promise.all([
      Review.find({})
        .populate('vendor', 'businessName')
        .populate('customer', 'name')
        .sort({ createdAt: -1 }),
      Review.find({ customer: customerId })
        .populate('vendor', 'businessName')
        .sort({ createdAt: -1 })
    ]);

    const formattedAllReviews = allReviews
      .filter((review) => review.vendor && review.customer)
      .map((review) => ({
        _id: review._id,
        vendorId: review.vendor._id,
        vendorName: review.vendor.businessName,
        customerName: review.customer.name,
        rating: review.rating,
        text: review.text,
        createdAt: review.createdAt,
        isMine: String(review.customer._id) === String(customerId)
      }));

    const formattedMyReviews = myReviews
      .filter((review) => review.vendor)
      .map((review) => ({
        _id: review._id,
        vendorId: review.vendor._id,
        vendorName: review.vendor.businessName,
        rating: review.rating,
        text: review.text,
        createdAt: review.createdAt
      }));

    res.status(200).json({
      allReviews: formattedAllReviews,
      myReviews: formattedMyReviews
    });
  } catch (error) {
    console.error("Error fetching customer reviews:", error);
    res.status(500).json({ message: 'Server error fetching reviews' });
  }
};

exports.createOrUpdateReview = async (req, res) => {
  try {
    const customerId = req.user.userId || req.user.id;
    const { vendorId, rating, text } = req.body;

    if (!vendorId || !rating || !text) {
      return res.status(400).json({ message: 'vendorId, rating and text are required.' });
    }

    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: 'rating must be an integer between 1 and 5.' });
    }

    const cleanedText = String(text).trim();
    if (!cleanedText) {
      return res.status(400).json({ message: 'Review text is required.' });
    }

    const vendor = await VendorProfile.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found.' });
    }

    const review = await Review.findOneAndUpdate(
      { vendor: vendorId, customer: customerId },
      {
        vendor: vendorId,
        customer: customerId,
        rating: parsedRating,
        text: cleanedText
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate('vendor', 'businessName');

    await recomputeVendorRating(vendor._id);

    res.status(200).json({
      message: 'Review saved successfully.',
      review: {
        _id: review._id,
        vendorId: review.vendor._id,
        vendorName: review.vendor.businessName,
        rating: review.rating,
        text: review.text,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt
      }
    });
  } catch (error) {
    console.error("Error saving review:", error);
    res.status(500).json({ message: 'Server error saving review' });
  }
};

exports.deleteMyReview = async (req, res) => {
  try {
    const customerId = req.user.userId || req.user.id;
    const { reviewId } = req.params;

    const review = await Review.findOneAndDelete({ _id: reviewId, customer: customerId });
    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    await recomputeVendorRating(review.vendor);
    res.status(200).json({ message: 'Review deleted successfully.' });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: 'Server error deleting review' });
  }
};

// --- Get Customer Payment Details ---
exports.getCustomerPayments = async (req, res) => {
  try {
    const customerId = req.user.userId || req.user.id;

    // Fetch the active subscription for this customer
    const activeSub = await Subscription.findOne({
      customer: customerId,
      status: 'active' 
    }).populate('vendor', 'businessName');

    if (!activeSub) {
        return res.status(200).json({
            pendingAmount: 0,
            totalPaid: 0,
            thisMonth: 0,
            transactions: []
        });
    }

    const today = new Date();
    let baseDuration = 30;
    if (activeSub.planType.includes('weekly') || activeSub.planType.includes('7_days')) baseDuration = 7;
    if (activeSub.planType.includes('15_days')) baseDuration = 15;

    const skippedDaysCount = activeSub.skippedDates ? activeSub.skippedDates.length : 0;
    const totalSpan = baseDuration + skippedDaysCount;

    const startDate = new Date(activeSub.startDate || activeSub.createdAt);
    const fallbackEndDate = new Date(startDate);
    fallbackEndDate.setDate(fallbackEndDate.getDate() + totalSpan);
    const endDate = activeSub.endDate ? new Date(activeSub.endDate) : fallbackEndDate;

    const diffTime = endDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let pendingAmount = 0;
    let transactions = [];

    // Determine Pending Amount
    if (activeSub.paymentStatus === 'unpaid' || daysLeft <= 5) {
        pendingAmount = activeSub.price;
        // Add a "Pending" transaction record
        transactions.push({
            id: `pending-${activeSub._id}`,
            vendorName: activeSub.vendor.businessName,
            type: 'Subscription',
            status: 'pending',
            date: 'Due Now',
            method: 'Pending',
            amount: activeSub.price
        });
    }

    // Determine Total Paid & This Month (Simplification: Assuming if paid, they paid the price)
    // In a real app, you'd have a separate 'Transactions' table. Here we infer from the subscription state.
    let totalPaid = 0;
    let thisMonthPaid = 0;

    if (activeSub.paymentStatus === 'paid') {
        totalPaid += activeSub.price;
        
        // Check if paid this month
        const paymentDate = activeSub.lastPaymentDate ? new Date(activeSub.lastPaymentDate) : startDate;
        if (paymentDate.getMonth() === today.getMonth() && paymentDate.getFullYear() === today.getFullYear()) {
            thisMonthPaid += activeSub.price;
        }

        // Add a "Paid" transaction record
        const formattedDate = paymentDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        transactions.push({
            id: `paid-${activeSub._id}`,
            vendorName: activeSub.vendor.businessName,
            type: 'Subscription',
            status: 'paid',
            date: formattedDate,
            method: 'UPI / Cash', // Mock method
            amount: activeSub.price
        });
    }

    res.status(200).json({
      pendingAmount,
      totalPaid,
      thisMonth: thisMonthPaid,
      transactions
    });

  } catch (error) {
    console.error("Error fetching customer payments:", error);
    res.status(500).json({ message: 'Server error fetching payments' });
  }
};
