const VendorProfile = require('../models/VendorProfile');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Announcement = require('../models/Announcement');
const Review = require('../models/Review');
const HomemadeItem = require('../models/HomemadeItem');
const HomemadeOrder = require('../models/HomemadeOrder');
const HomemadeStockLog = require('../models/HomemadeStockLog');
const VendorHoliday = require('../models/VendorHoliday');
const DeliveryStatus = require('../models/DeliveryStatus');

const parseBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return fallback;
};

const normalizeDateKey = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  const dateKey = raw.includes('T') ? raw.slice(0, 10) : raw;
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? dateKey : null;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const getDeliverySessionsByPlan = (planType) => {
  const plan = String(planType || '').toLowerCase();
  if (plan.includes('full')) return ['morning', 'afternoon'];
  if (plan.includes('half')) return ['afternoon'];
  if (plan.includes('single')) return ['afternoon'];
  return ['afternoon'];
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

  if (!lunchItems && !dinnerItems) {
    return null;
  }

  return {
    day: dayName,
    lunch: { time: '12:30 PM', items: lunchItems || 'No lunch menu set.' },
    dinner: dinnerItems ? { time: '8:00 PM', items: dinnerItems } : null
  };
};

const adjustVendorSubscriptionsEndDate = async (vendorId, daysDelta) => {
  const subscriptions = await Subscription.find({
    vendor: vendorId,
    status: { $in: ['active', 'paused'] }
  }).select('_id endDate');

  if (!subscriptions.length) {
    return 0;
  }

  const bulkOps = subscriptions.map((sub) => {
    const currentEndDate = new Date(sub.endDate);
    const nextEndDate = new Date(currentEndDate.getTime() + (daysDelta * ONE_DAY_MS));
    return {
      updateOne: {
        filter: { _id: sub._id },
        update: { $set: { endDate: nextEndDate } }
      }
    };
  });

  await Subscription.bulkWrite(bulkOps);
  return subscriptions.length;
};

// GET /api/vendor/dashboard
// Fetch dashboard data for a vendor (analytics, pending requests, etc.)
exports.getVendorDashboard = async (req, res) => {
  try {
    const vendorId = req.user.userId; // From the JWT token

    // 1. Get the vendor's profile
    const vendorProfile = await VendorProfile.findOne({ vendorId });
    
    if (!vendorProfile) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    // 2. Get all pending subscription requests for this vendor
    const pendingRequests = await Subscription.find({
      vendor: vendorProfile._id,
      status: 'pending'
    }).populate('customer', 'name email phone'); // Get customer details

    // 3. Get all active subscriptions for this vendor
    const activeSubscriptions = await Subscription.find({
      vendor: vendorProfile._id,
      status: 'active'
    }).populate('customer', 'name email phone');

    const homemadeOrderCount = await HomemadeOrder.countDocuments({ vendor: vendorProfile._id });
    const homemadePendingOrders = await HomemadeOrder.countDocuments({
      vendor: vendorProfile._id,
      status: { $in: ['placed', 'confirmed'] }
    });

    // 4. Calculate basic stats
    const totalCustomers = activeSubscriptions.length;
    const monthlyRevenue = activeSubscriptions.reduce((sum, sub) => sum + sub.price, 0);
    const todaysMenu = buildTodaysMenuFromWeekly(vendorProfile.weeklyMenu);

    res.status(200).json({
      vendorProfile,
      pendingRequests,
      activeSubscriptions,
      todaysMenu,
      stats: {
        totalCustomers,
        monthlyRevenue,
        pendingRequestsCount: pendingRequests.length,
        homemadeOrders: homemadeOrderCount,
        homemadePendingOrders
      }
    });

  } catch (error) {
    console.error("Vendor Dashboard Error:", error);
    res.status(500).json({ message: 'Server error fetching vendor dashboard' });
  }
};

// GET /api/vendor/reviews
exports.getVendorReviews = async (req, res) => {
  try {
    const vendorProfile = await VendorProfile.findOne({ vendorId: req.user.userId });
    if (!vendorProfile) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const reviews = await Review.find({ vendor: vendorProfile._id })
      .populate('customer', 'name')
      .sort({ createdAt: -1 });

    const formattedReviews = reviews.map((review) => ({
      _id: review._id,
      student: review.customer?.name || 'Unknown',
      rating: review.rating,
      text: review.text,
      createdAt: review.createdAt
    }));

    res.status(200).json({
      averageRating: Number(vendorProfile.rating || 0),
      totalReviews: Number(vendorProfile.totalReviews || 0),
      reviews: formattedReviews
    });
  } catch (error) {
    console.error("Error fetching vendor reviews:", error);
    res.status(500).json({ message: 'Server error fetching reviews' });
  }
};

// POST /api/vendor/approve-request/:subscriptionId
// Vendor approves a pending subscription request
exports.approveSubscriptionRequest = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const vendorId = req.user.userId;

    // 1. Find the subscription and verify it belongs to this vendor
    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription request not found' });
    }

    const vendorProfile = await VendorProfile.findOne({ vendorId });
    if (subscription.vendor.toString() !== vendorProfile._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized: This is not your request' });
    }

    // 2. Update status to 'active'
    subscription.status = 'active';
    await subscription.save();

    res.status(200).json({ message: 'Subscription approved!', subscription });

  } catch (error) {
    console.error("Approval Error:", error);
    res.status(500).json({ message: 'Server error approving request' });
  }
};

// POST /api/vendor/reject-request/:subscriptionId
// Vendor rejects a pending subscription request
exports.rejectSubscriptionRequest = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const vendorId = req.user.userId;

    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription request not found' });
    }

    const vendorProfile = await VendorProfile.findOne({ vendorId });
    if (subscription.vendor.toString() !== vendorProfile._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized: This is not your request' });
    }

    // Update status to 'cancelled'
    subscription.status = 'cancelled';
    await subscription.save();

    res.status(200).json({ message: 'Subscription rejected!', subscription });

  } catch (error) {
    console.error("Rejection Error:", error);
    res.status(500).json({ message: 'Server error rejecting request' });
  }
};

// --- 1. Fetch Students (Pending & Active) ---
exports.getVendorStudents = async (req, res) => {
  try {
    const userId = req.user.userId;
    const vendorProfile = await VendorProfile.findOne({ vendorId: userId });

    if (!vendorProfile) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    // Find all subscriptions linked to this vendor, and populate the customer's name and email!
    const students = await Subscription.find({ vendor: vendorProfile._id })
      .populate('customer', 'name email location') 
      .sort({ createdAt: -1 });

    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: 'Server error fetching students' });
  }
};

// --- 2. Update Request Status (Accept/Decline) ---
exports.updateRequestStatus = async (req, res) => {
  try {
    const { subscriptionId, status } = req.body; // status will be 'active' or 'cancelled'

    // Find the subscription and update its status
    const updatedSubscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      { status: status },
      { new: true }
    ).populate('customer', 'name');

    if (!updatedSubscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.status(200).json({ 
      message: `Request successfully marked as ${status}`, 
      subscription: updatedSubscription 
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: 'Server error updating status' });
  }
};
// --- Fetch Menu & Announcements ---
exports.getCommunicationData = async (req, res) => {
  try {
    const vendorProfile = await VendorProfile.findOne({ vendorId: req.user.userId });
    if (!vendorProfile) return res.status(404).json({ message: 'Profile not found' });

    const announcements = await Announcement.find({ vendorId: vendorProfile._id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.status(200).json({
      weeklyMenu: vendorProfile.weeklyMenu,
      announcements
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// --- Update Weekly Menu ---
exports.updateWeeklyMenu = async (req, res) => {
  try {
    const { weeklyMenu } = req.body;
    if (!weeklyMenu || typeof weeklyMenu !== 'object') {
      return res.status(400).json({ message: 'weeklyMenu is required.' });
    }
    
    const updatedProfile = await VendorProfile.findOneAndUpdate(
      { vendorId: req.user.userId },
      { weeklyMenu: weeklyMenu },
      { new: true }
    );
    if (!updatedProfile) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    res.status(200).json({ message: 'Menu updated successfully!', weeklyMenu: updatedProfile.weeklyMenu });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating menu' });
  }
};

// --- Post Announcement ---
exports.postAnnouncement = async (req, res) => {
  try {
    const { type, text, date } = req.body;
    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: 'Announcement text is required.' });
    }

    const vendorProfile = await VendorProfile.findOne({ vendorId: req.user.userId });
    if (!vendorProfile) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    await Announcement.create({
      vendorId: vendorProfile._id,
      type: type || 'General',
      text: String(text).trim(),
      date
    });

    const announcements = await Announcement.find({ vendorId: vendorProfile._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(201).json({ message: 'Announcement posted!', announcements });
  } catch (error) {
    console.error("Error posting announcement:", error);
    res.status(500).json({ message: 'Server error posting announcement' });
  }
};

// --- Get Daily Delivery List (Smart Grouping & Holiday Filter) ---
exports.getDailyDeliveryList = async (req, res) => {
  try {
    // 1. Get the Vendor Profile using your specific auth setup
    const vendorProfile = await VendorProfile.findOne({ vendorId: req.user.userId });
    if (!vendorProfile) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    // Allow optional date query for date-specific delivery planning.
    const today = new Date();
    const todayDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const requestedDateKey = normalizeDateKey(req.query.date);
    const targetDateKey = requestedDateKey || todayDateString;

    // If vendor marked this date as a holiday, there should be no drop-offs.
    const vendorHoliday = await VendorHoliday.findOne({
      vendor: vendorProfile._id,
      dateKey: targetDateKey
    });
    if (vendorHoliday) {
      return res.status(200).json({
        date: targetDateKey,
        totalDeliveries: 0,
        groupedList: {},
        sessions: {
          morning: { totalDeliveries: 0, groupedList: {} },
          afternoon: { totalDeliveries: 0, groupedList: {} }
        },
        deliveredGroupedList: {},
        deliveredSessions: {
          morning: { totalDeliveries: 0, groupedList: {} },
          afternoon: { totalDeliveries: 0, groupedList: {} }
        },
        isVendorHoliday: true,
        holidayReason: vendorHoliday.reason || 'Vendor holiday'
      });
    }

    // 2. Fetch all ACTIVE subscriptions for this vendor
    // We populate the 'customer' field to get their name, phone, location, and roomNumber
    const allActiveSubs = await Subscription.find({ 
      vendor: vendorProfile._id, 
      status: 'active' 
    }).populate('customer', 'name phone location roomNumber');

    // 3. The Filter: Remove anyone who has marked today as a holiday
    const deliveriesToday = allActiveSubs.filter(sub => {
      // If skippedDates doesn't exist or today is NOT in the array, they get food!
      return !sub.skippedDates || !sub.skippedDates.includes(targetDateKey);
    });

    const deliveredRecords = await DeliveryStatus.find({
      vendor: vendorProfile._id,
      dateKey: targetDateKey
    }).select('subscription session');
    const deliveredKeys = new Set(
      deliveredRecords.map((record) => `${String(record.subscription)}:${record.session || 'afternoon'}`)
    );

    const deliveryEntries = [];
    deliveriesToday.forEach((sub) => {
      const sessions = getDeliverySessionsByPlan(sub.planType);
      sessions.forEach((session) => {
        deliveryEntries.push({
          ...sub.toObject(),
          deliverySession: session
        });
      });
    });

    const pendingDeliveries = deliveryEntries.filter(
      (entry) => !deliveredKeys.has(`${String(entry._id)}:${entry.deliverySession}`)
    );
    const deliveredEntries = deliveryEntries.filter(
      (entry) => deliveredKeys.has(`${String(entry._id)}:${entry.deliverySession}`)
    );

    const groupByLocation = (entries) => entries.reduce((acc, sub) => {
      if (!sub.customer) return acc;
      const location = sub.customer.location || 'Unspecified Location';
      if (!acc[location]) acc[location] = [];
      acc[location].push({
        subscriptionId: sub._id,
        customerName: sub.customer.name,
        roomNumber: sub.customer.roomNumber || 'N/A',
        phone: sub.customer.phone,
        planType: sub.planType,
        mealType: sub.mealType,
        mealSlot: sub.deliverySession
      });
      return acc;
    }, {});

    const morningEntries = pendingDeliveries.filter((entry) => entry.deliverySession === 'morning');
    const afternoonEntries = pendingDeliveries.filter((entry) => entry.deliverySession === 'afternoon');
    const deliveredMorningEntries = deliveredEntries.filter((entry) => entry.deliverySession === 'morning');
    const deliveredAfternoonEntries = deliveredEntries.filter((entry) => entry.deliverySession === 'afternoon');

    const groupedDeliveries = groupByLocation(pendingDeliveries);
    const morningGrouped = groupByLocation(morningEntries);
    const afternoonGrouped = groupByLocation(afternoonEntries);
    const deliveredGrouped = groupByLocation(deliveredEntries);
    const deliveredMorningGrouped = groupByLocation(deliveredMorningEntries);
    const deliveredAfternoonGrouped = groupByLocation(deliveredAfternoonEntries);

    // 5. Send it back to the React frontend
    res.status(200).json({ 
      date: targetDateKey,
      totalDeliveries: pendingDeliveries.length,
      groupedList: groupedDeliveries,
      sessions: {
        morning: { totalDeliveries: morningEntries.length, groupedList: morningGrouped },
        afternoon: { totalDeliveries: afternoonEntries.length, groupedList: afternoonGrouped }
      },
      deliveredGroupedList: deliveredGrouped,
      deliveredSessions: {
        morning: { totalDeliveries: deliveredMorningEntries.length, groupedList: deliveredMorningGrouped },
        afternoon: { totalDeliveries: deliveredAfternoonEntries.length, groupedList: deliveredAfternoonGrouped }
      },
      deliveredCount: deliveredRecords.length,
      isVendorHoliday: false,
      holidayReason: ''
    });

  } catch (error) {
    console.error("Error fetching delivery list:", error);
    res.status(500).json({ message: 'Server error fetching delivery list' });
  }
};

// --- 1. Fetch Students (Pending & Active) ---
exports.getVendorStudents = async (req, res) => {
  try {
    const userId = req.user.userId;
    const vendorProfile = await VendorProfile.findOne({ vendorId: userId });

    if (!vendorProfile) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    // UPDATE THIS LINE to include phone and roomNumber
    const students = await Subscription.find({ vendor: vendorProfile._id })
      .populate('customer', 'name email phone location roomNumber') 
      .sort({ createdAt: -1 });

    res.status(200).json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: 'Server error fetching students' });
  }
};

// --- Get Vendor Profile Settings ---
exports.getVendorProfileSettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get base user info (Name, Phone, Email)
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Get specific vendor business info
    const vendorProfile = await VendorProfile.findOne({ vendorId: userId });
    if (!vendorProfile) return res.status(404).json({ message: 'Vendor profile not found' });

    // Combine them into one clean object for the frontend
    res.status(200).json({
      name: user.name,
      email: user.email,
      phone: user.phone,
      businessName: vendorProfile.businessName,
      serviceArea: vendorProfile.serviceArea,
      serviceType: vendorProfile.serviceType,
      foodType: vendorProfile.foodType,
      deliveryType: vendorProfile.deliveryType,
      monthlyFee: vendorProfile.monthlyFee,
      halfTiffinMonthlyPrice: vendorProfile.halfTiffinMonthlyPrice,
      singleTiffinPrice: vendorProfile.singleTiffinPrice
    });

  } catch (error) {
    console.error("Error fetching vendor profile settings:", error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

// --- Update Vendor Profile Settings ---
exports.updateVendorProfileSettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      name, phone, businessName, serviceArea, serviceType, 
      foodType, deliveryType, monthlyFee, halfTiffinMonthlyPrice, singleTiffinPrice 
    } = req.body;

    // 1. Update base user details
    await User.findByIdAndUpdate(userId, { name, phone });

    // 2. Update vendor business details
    const updatedProfile = await VendorProfile.findOneAndUpdate(
      { vendorId: userId },
      { 
        businessName, serviceArea, serviceType, foodType, 
        deliveryType, monthlyFee, halfTiffinMonthlyPrice, singleTiffinPrice 
      },
      { new: true } // Returns the updated document
    );

    res.status(200).json({ message: 'Profile updated successfully!', profile: updatedProfile });

  } catch (error) {
    console.error("Error updating vendor profile:", error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

// --- Get Payment Status (Unpaid vs Paid) ---
exports.getPaymentRecords = async (req, res) => {
  try {
    const vendorProfile = await VendorProfile.findOne({ vendorId: req.user.userId });
    if (!vendorProfile) return res.status(404).json({ message: 'Vendor profile not found' });

    const activeSubs = await Subscription.find({ 
      vendor: vendorProfile._id, 
      status: 'active' 
    }).populate('customer', 'name phone location roomNumber');

    const unpaidCustomers = [];
    const paidCustomers = [];
    const today = new Date();

    activeSubs.forEach(sub => {
      if (!sub.customer) return;

      let baseDuration = 30; 
      if (sub.planType.includes('weekly') || sub.planType.includes('7_days')) baseDuration = 7;
      if (sub.planType.includes('15_days')) baseDuration = 15;

      const skippedDaysCount = sub.skippedDates ? sub.skippedDates.length : 0;
      const totalSpan = baseDuration + skippedDaysCount;

      const startDate = new Date(sub.startDate || sub.createdAt);
      const fallbackEndDate = new Date(startDate);
      fallbackEndDate.setDate(fallbackEndDate.getDate() + totalSpan);
      const endDate = sub.endDate ? new Date(sub.endDate) : fallbackEndDate;

      const diffTime = endDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Format the Exact Date and Time for the Receipt!
      const formattedPaymentDate = sub.lastPaymentDate 
        ? new Date(sub.lastPaymentDate).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
          }) 
        : 'Not Paid Yet';

      const customerData = {
        id: sub._id,
        name: sub.customer.name,
        amount: sub.price,
        hostel: sub.customer.location || 'N/A',
        room: sub.customer.roomNumber || '',
        phone: sub.customer.phone || '',
        plan: `${sub.planType.replace('_', ' ')} (${sub.mealType})`,
        leaves: skippedDaysCount,
        daysLeft: daysLeft,
        exactPaymentDate: formattedPaymentDate // Send the exact time to React
      };

      // NEW LOGIC: If they explicitly have 'unpaid' status OR they have 5 or fewer days left
      if (sub.paymentStatus === 'unpaid' || daysLeft <= 5) {
        let dueText = "Due soon";
        
        if (sub.paymentStatus === 'unpaid') dueText = "New Request (Unpaid)";
        else if (daysLeft < 0) dueText = `Overdue by ${Math.abs(daysLeft)} Days`;
        else if (daysLeft === 0) dueText = "Today";
        else dueText = `In ${daysLeft} Days`;

        unpaidCustomers.push({ ...customerData, due: dueText });
      } else {
        // They are Paid, Active, and have plenty of days left
        paidCustomers.push({ 
          ...customerData, 
          date: customerData.exactPaymentDate, // This now contains Date + Time
          method: "Cash / UPI" 
        });
      }
    });

    res.status(200).json({ unpaidCustomers, paidCustomers });
  } catch (error) {
    console.error("Error fetching payment records:", error);
    res.status(500).json({ message: 'Server error fetching payments' });
  }
};

// --- Mark Student as Paid (Renew Subscription) ---
exports.markAsPaid = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const vendorProfile = await VendorProfile.findOne({ vendorId: req.user.userId });
    if (!vendorProfile) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (String(subscription.vendor) !== String(vendorProfile._id)) {
      return res.status(403).json({ message: 'Unauthorized payment update request' });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({ message: 'Only active subscriptions can be marked as paid' });
    }

    // Update payment status and renew plan window from now.
    subscription.startDate = new Date();
    subscription.skippedDates = [];
    subscription.paymentStatus = 'paid';
    subscription.lastPaymentDate = new Date();
    const updatedSub = await subscription.save();

    if (!updatedSub) return res.status(404).json({ message: 'Subscription not found' });

    res.status(200).json({ message: 'Payment recorded successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating payment' });
  }
};

// --- Homemade Inventory (Vendor) ---
exports.getVendorHomemadeItems = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const vendorProfile = await VendorProfile.findOne({ vendorId: userId });
    if (!vendorProfile) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const items = await HomemadeItem.find({ vendor: vendorProfile._id }).sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    console.error("Error fetching vendor homemade items:", error);
    res.status(500).json({ message: 'Server error fetching homemade items' });
  }
};

exports.markDeliveryCompleted = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const vendorProfile = await VendorProfile.findOne({ vendorId: userId });
    if (!vendorProfile) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const { subscriptionId } = req.params;
    const session = String(req.body?.session || 'afternoon').toLowerCase();
    if (!['morning', 'afternoon'].includes(session)) {
      return res.status(400).json({ message: 'session must be morning or afternoon.' });
    }
    const today = new Date();
    const todayDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const dateKey = normalizeDateKey(req.body?.date) || todayDateString;

    const vendorHoliday = await VendorHoliday.findOne({
      vendor: vendorProfile._id,
      dateKey
    });
    if (vendorHoliday) {
      return res.status(400).json({ message: 'Cannot mark delivery on a vendor holiday.' });
    }

    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      vendor: vendorProfile._id,
      status: 'active'
    }).populate('customer', '_id');

    if (!subscription || !subscription.customer) {
      return res.status(404).json({ message: 'Active subscription not found for this vendor.' });
    }

    const allowedSessions = getDeliverySessionsByPlan(subscription.planType);
    if (!allowedSessions.includes(session)) {
      return res.status(400).json({ message: `This subscription does not have ${session} delivery.` });
    }

    if (subscription.skippedDates && subscription.skippedDates.includes(dateKey)) {
      return res.status(400).json({ message: 'Customer is on leave for this date.' });
    }

    const existingStatus = await DeliveryStatus.findOne({
      vendor: vendorProfile._id,
      subscription: subscription._id,
      dateKey,
      session
    });
    if (existingStatus) {
      return res.status(200).json({ message: 'Delivery already marked as completed.' });
    }

    await DeliveryStatus.create({
      vendor: vendorProfile._id,
      subscription: subscription._id,
      customer: subscription.customer._id,
      dateKey,
      session,
      deliveredAt: new Date()
    });

    res.status(200).json({ message: 'Delivery marked as completed.' });
  } catch (error) {
    console.error("Error marking delivery completed:", error);
    if (error && error.code === 11000) {
      return res.status(200).json({ message: 'Delivery already marked as completed.' });
    }
    res.status(500).json({ message: 'Server error marking delivery' });
  }
};

exports.resetVendorDailyDeliveries = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const vendorProfile = await VendorProfile.findOne({ vendorId: userId });
    if (!vendorProfile) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const today = new Date();
    const todayDateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const dateKey = normalizeDateKey(req.body?.date) || todayDateString;

    const result = await DeliveryStatus.deleteMany({
      vendor: vendorProfile._id,
      dateKey
    });

    res.status(200).json({
      message: `Reset completed. ${result.deletedCount || 0} delivered meal record(s) moved back to drop-off.`,
      deletedCount: result.deletedCount || 0,
      date: dateKey
    });
  } catch (error) {
    console.error("Error resetting vendor daily deliveries:", error);
    res.status(500).json({ message: 'Server error resetting deliveries' });
  }
};

exports.createVendorHomemadeItem = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const vendorProfile = await VendorProfile.findOne({ vendorId: userId });
    if (!vendorProfile) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const {
      name,
      category,
      price,
      unit,
      description,
      imageUrl,
      inStock,
      stockQuantity
    } = req.body;

    if (!name || price === undefined || price === null || String(name).trim() === '') {
      return res.status(400).json({ message: 'name and price are required.' });
    }

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ message: 'price must be a valid number greater than 0.' });
    }

    const parsedStockRaw = Number(stockQuantity);
    const parsedStock = Number.isFinite(parsedStockRaw) ? Math.max(0, Math.floor(parsedStockRaw)) : 0;
    const parsedInStock = parseBoolean(inStock, true) && parsedStock > 0;

    const item = await HomemadeItem.create({
      vendor: vendorProfile._id,
      name: String(name).trim(),
      category: category ? String(category).trim() : 'Other',
      price: parsedPrice,
      unit: unit ? String(unit).trim() : 'per unit',
      description: description ? String(description).trim() : '',
      imageUrl: imageUrl ? String(imageUrl).trim() : '',
      stockQuantity: parsedStock,
      inStock: parsedInStock
    });

    await HomemadeStockLog.create({
      vendor: vendorProfile._id,
      item: item._id,
      action: 'item_created',
      quantityChange: parsedStock,
      previousStock: 0,
      newStock: parsedStock,
      note: 'Initial stock set while creating item'
    });

    res.status(201).json({ message: 'Item added to inventory.', item });
  } catch (error) {
    console.error("Error creating homemade item:", error);
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error creating homemade item' });
  }
};

exports.restockVendorHomemadeItem = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const vendorProfile = await VendorProfile.findOne({ vendorId: userId });
    if (!vendorProfile) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const { itemId } = req.params;
    const addQuantity = Math.floor(Number(req.body.quantity));
    if (!Number.isFinite(addQuantity) || addQuantity <= 0) {
      return res.status(400).json({ message: 'quantity must be a positive integer.' });
    }

    const item = await HomemadeItem.findOne({ _id: itemId, vendor: vendorProfile._id });
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    const previousStock = item.stockQuantity;
    item.stockQuantity += addQuantity;
    if (item.stockQuantity > 0) {
      item.inStock = true;
    }
    await item.save();

    await HomemadeStockLog.create({
      vendor: vendorProfile._id,
      item: item._id,
      action: 'restock',
      quantityChange: addQuantity,
      previousStock,
      newStock: item.stockQuantity,
      note: req.body.note ? String(req.body.note).trim() : 'Manual restock by vendor'
    });

    res.status(200).json({ message: 'Item restocked successfully.', item });
  } catch (error) {
    console.error("Error restocking homemade item:", error);
    res.status(500).json({ message: 'Server error restocking homemade item' });
  }
};

exports.updateVendorHomemadeItem = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const vendorProfile = await VendorProfile.findOne({ vendorId: userId });
    if (!vendorProfile) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const { itemId } = req.params;
    const item = await HomemadeItem.findOne({ _id: itemId, vendor: vendorProfile._id });
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    if (req.body.name !== undefined) item.name = String(req.body.name).trim();
    if (req.body.category !== undefined) item.category = String(req.body.category).trim();
    if (req.body.unit !== undefined) item.unit = String(req.body.unit).trim();
    if (req.body.description !== undefined) item.description = String(req.body.description).trim();
    if (req.body.imageUrl !== undefined) item.imageUrl = String(req.body.imageUrl).trim();
    if (req.body.isActive !== undefined) item.isActive = parseBoolean(req.body.isActive, item.isActive);
    if (req.body.inStock !== undefined) item.inStock = parseBoolean(req.body.inStock, item.inStock);
    if (req.body.price !== undefined) {
      const parsedPrice = Number(req.body.price);
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({ message: 'price must be a valid number greater than 0.' });
      }
      item.price = parsedPrice;
    }
    if (req.body.stockQuantity !== undefined) {
      const parsedStockRaw = Number(req.body.stockQuantity);
      if (!Number.isFinite(parsedStockRaw) || parsedStockRaw < 0) {
        return res.status(400).json({ message: 'stockQuantity must be a valid number 0 or more.' });
      }
      item.stockQuantity = Math.floor(parsedStockRaw);
    }

    if (Number(item.stockQuantity) <= 0) {
      item.stockQuantity = 0;
      item.inStock = false;
    }

    await item.save();
    res.status(200).json({ message: 'Inventory item updated.', item });
  } catch (error) {
    console.error("Error updating homemade item:", error);
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error updating homemade item' });
  }
};

exports.getVendorHomemadeOrders = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const vendorProfile = await VendorProfile.findOne({ vendorId: userId });
    if (!vendorProfile) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const orders = await HomemadeOrder.find({ vendor: vendorProfile._id })
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });

    const formattedOrders = orders.map((order) => ({
      _id: order._id,
      itemId: order.item,
      itemName: order.itemName,
      itemUnit: order.itemUnit,
      quantity: order.quantity,
      totalAmount: order.totalAmount,
      status: order.status,
      customerName: order.customer?.name || 'Unknown Customer',
      customerPhone: order.customer?.phone || '',
      createdAt: order.createdAt
    }));

    res.status(200).json(formattedOrders);
  } catch (error) {
    console.error("Error fetching vendor homemade orders:", error);
    res.status(500).json({ message: 'Server error fetching homemade orders' });
  }
};

exports.updateVendorHomemadeOrderStatus = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const vendorProfile = await VendorProfile.findOne({ vendorId: userId });
    if (!vendorProfile) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const { orderId } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['confirmed', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status update.' });
    }

    const order = await HomemadeOrder.findOne({ _id: orderId, vendor: vendorProfile._id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({ message: `Order already ${order.status}.` });
    }

    // If vendor cancels, restore stock back.
    if (status === 'cancelled' && order.status !== 'cancelled') {
      const item = await HomemadeItem.findById(order.item);
      if (item) {
        const previousStock = item.stockQuantity;
        item.stockQuantity += order.quantity;
        if (item.stockQuantity > 0) {
          item.inStock = true;
        }
        await item.save();

        await HomemadeStockLog.create({
          vendor: vendorProfile._id,
          item: item._id,
          order: order._id,
          action: 'order_cancelled_restore',
          quantityChange: order.quantity,
          previousStock,
          newStock: item.stockQuantity,
          note: 'Stock restored after order cancellation'
        });
      }
    }

    order.status = status;
    await order.save();

    res.status(200).json({ message: `Order marked as ${status}.`, order });
  } catch (error) {
    console.error("Error updating homemade order status:", error);
    res.status(500).json({ message: 'Server error updating homemade order status' });
  }
};

exports.getVendorHomemadeStockLogs = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const vendorProfile = await VendorProfile.findOne({ vendorId: userId });
    if (!vendorProfile) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const logs = await HomemadeStockLog.find({ vendor: vendorProfile._id })
      .populate('item', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    const formattedLogs = logs.map((log) => ({
      _id: log._id,
      itemName: log.item?.name || 'Unknown Item',
      action: log.action,
      quantityChange: log.quantityChange,
      previousStock: log.previousStock,
      newStock: log.newStock,
      note: log.note,
      createdAt: log.createdAt
    }));

    res.status(200).json(formattedLogs);
  } catch (error) {
    console.error("Error fetching stock logs:", error);
    res.status(500).json({ message: 'Server error fetching stock logs' });
  }
};

// --- Vendor Holidays (DB-backed) ---
exports.getVendorHolidays = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const vendorProfile = await VendorProfile.findOne({ vendorId: userId });
    if (!vendorProfile) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const holidays = await VendorHoliday.find({ vendor: vendorProfile._id }).sort({ dateKey: 1 });
    res.status(200).json(holidays);
  } catch (error) {
    console.error("Error fetching vendor holidays:", error);
    res.status(500).json({ message: 'Server error fetching holidays' });
  }
};

exports.addVendorHoliday = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const vendorProfile = await VendorProfile.findOne({ vendorId: userId });
    if (!vendorProfile) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const { date, reason } = req.body;
    const dateKey = normalizeDateKey(date);
    if (!dateKey) {
      return res.status(400).json({ message: 'Valid holiday date is required in YYYY-MM-DD format.' });
    }

    const existingHoliday = await VendorHoliday.findOne({ vendor: vendorProfile._id, dateKey });
    if (existingHoliday) {
      return res.status(400).json({ message: 'Holiday already marked for this date.' });
    }

    const modifiedCount = await adjustVendorSubscriptionsEndDate(vendorProfile._id, 1);

    const holiday = await VendorHoliday.create({
      vendor: vendorProfile._id,
      dateKey,
      reason: reason ? String(reason).trim() : '',
      extendedSubscriptions: modifiedCount
    });

    res.status(201).json({
      message: `Holiday added. Extended ${holiday.extendedSubscriptions} active subscription(s) by 1 day.`,
      holiday
    });
  } catch (error) {
    console.error("Error adding vendor holiday:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Holiday already exists for this date.' });
    }
    res.status(500).json({ message: 'Server error adding holiday' });
  }
};

exports.deleteVendorHoliday = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const vendorProfile = await VendorProfile.findOne({ vendorId: userId });
    if (!vendorProfile) {
      return res.status(404).json({ message: 'Vendor profile not found' });
    }

    const { holidayId } = req.params;
    const holiday = await VendorHoliday.findOneAndDelete({ _id: holidayId, vendor: vendorProfile._id });
    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found.' });
    }

    const modifiedCount = await adjustVendorSubscriptionsEndDate(vendorProfile._id, -1);

    res.status(200).json({
      message: `Holiday removed. Rolled back 1 day for ${modifiedCount} active subscription(s).`
    });
  } catch (error) {
    console.error("Error deleting vendor holiday:", error);
    res.status(500).json({ message: 'Server error deleting holiday' });
  }
};
