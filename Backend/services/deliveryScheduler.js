const cron = require('node-cron');
const DeliverySession = require('../models/DeliverySession');
const VendorProfile = require('../models/VendorProfile');
const Subscription = require('../models/Subscription');
const VendorHoliday = require('../models/VendorHoliday');

class DeliveryScheduler {
  constructor() {
    this.isInitialized = false;
  }

  // Helper method to convert Map to plain object for MongoDB storage
  mapToObject(map) {
    const obj = {};
    for (const [key, value] of map.entries()) {
      obj[key] = value;
    }
    return obj;
  }

  // Helper method to convert plain object back to Map
  objectToMap(obj) {
    const map = new Map();
    for (const [key, value] of Object.entries(obj)) {
      map.set(key, value);
    }
    return map;
  }

  // Initialize the scheduler
  init() {
    if (this.isInitialized) return;

    console.log('🚀 Initializing Delivery Scheduler...');

    // Schedule 12:30 PM - Morning session start
    cron.schedule('30 12 * * *', async () => {
      console.log('🍽️  Updating morning deliveries at 12:30 PM');
      await this.updateMorningDeliveries();
    }, {
      timezone: "Asia/Kolkata"
    });

    // Schedule 4:00 PM - Switch to afternoon session
    cron.schedule('0 16 * * *', async () => {
      console.log('🌅 Switching to afternoon deliveries at 4:00 PM');
      await this.updateAfternoonDeliveries();
    }, {
      timezone: "Asia/Kolkata"
    });

    // Schedule 8:00 PM - Complete day and prepare for next day
    cron.schedule('0 20 * * *', async () => {
      console.log('🌙 Completing deliveries and resetting for next day at 8:00 PM');
      await this.completeDayAndReset();
    }, {
      timezone: "Asia/Kolkata"
    });

    this.isInitialized = true;
    console.log('✅ Delivery Scheduler initialized successfully');
  }

  // Calculate deliveries for a specific session, considering holidays
  async calculateDeliveriesForSession(vendorId, dateKey, session) {
    try {
      // Get all active subscriptions for this vendor
      const activeSubscriptions = await Subscription.find({
        vendor: vendorId,
        status: 'active'
      }).populate('customer', 'name phone location roomNumber');

      if (!activeSubscriptions.length) {
        return { totalCount: 0, locationWise: new Map() };
      }

      // Filter out customers with holidays for this session
      const validDeliveries = activeSubscriptions.filter(sub => {
        // Check customer holidays
        if (sub.skippedDates && Array.isArray(sub.skippedDates)) {
          const hasHoliday = sub.skippedDates.some(holiday => {
            if (typeof holiday === 'string') {
              return holiday === dateKey;
            } else if (typeof holiday === 'object' && holiday.date) {
              if (holiday.date !== dateKey) return false;
              // Check if holiday affects this session
              return holiday.time === 'full_day' ||
                     (holiday.time === session) ||
                     (session === 'morning' && holiday.time === 'morning') ||
                     (session === 'afternoon' && holiday.time === 'afternoon') ||
                     (session === 'afternoon' && holiday.time === 'evening');
            }
            return false;
          });
          if (hasHoliday) return false;
        }

        // Check vendor holidays
        // (This will be checked separately in the main functions)

        return true;
      });

      // Group deliveries by location and create delivery entries
      const locationWise = new Map();
      let totalCount = 0;

      validDeliveries.forEach(sub => {
        const sessions = this.getDeliverySessionsByPlan(sub.planType);
        if (sessions.includes(session)) {
          const location = sub.customer?.location || 'Unspecified Location';

          if (!locationWise.has(location)) {
            locationWise.set(location, []);
          }

          locationWise.get(location).push({
            subscriptionId: sub._id,
            customerName: sub.customer?.name || 'Unknown',
            roomNumber: sub.customer?.roomNumber || 'N/A',
            phone: sub.customer?.phone || '',
            planType: sub.planType,
            mealType: sub.mealType || 'Standard',
            mealSlot: session
          });

          totalCount++;
        }
      });

      return { totalCount, locationWise };
    } catch (error) {
      console.error('Error calculating deliveries for session:', error);
      return { totalCount: 0, locationWise: new Map() };
    }
  }

  // Get delivery sessions based on plan type
  getDeliverySessionsByPlan(planType) {
    switch (planType) {
      case 'monthly_full':
        return ['morning', 'afternoon'];
      case 'monthly_half':
        return ['morning']; // Assuming half means lunch only
      default:
        return ['morning'];
    }
  }

  // Update morning deliveries at 12:30 PM
  async updateMorningDeliveries() {
    try {
      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // Get all vendors
      const vendors = await VendorProfile.find({});

      for (const vendor of vendors) {
        // Check if vendor has a holiday today
        const vendorHoliday = await VendorHoliday.findOne({
          vendor: vendor._id,
          dateKey: dateKey
        });

        if (vendorHoliday) {
          const holidayTime = vendorHoliday.time || 'full_day';
          if (holidayTime === 'full_day' || holidayTime === 'morning') {
            // Vendor holiday affects morning deliveries
            await DeliverySession.findOneAndUpdate(
              { vendor: vendor._id, date: dateKey },
              {
                currentSession: 'morning',
                morningDeliveries: {
                  totalCount: 0,
                  locationWise: {}
                },
                lastUpdated: new Date()
              },
              { upsert: true, new: true }
            );
            continue;
          }
        }

        // Calculate morning deliveries
        const morningData = await this.calculateDeliveriesForSession(vendor._id, dateKey, 'morning');

        // Update or create delivery session
        await DeliverySession.findOneAndUpdate(
          { vendor: vendor._id, date: dateKey },
          {
            currentSession: 'morning',
            morningDeliveries: {
              totalCount: morningData.totalCount,
              locationWise: this.mapToObject(morningData.locationWise)
            },
            lastUpdated: new Date()
          },
          { upsert: true, new: true }
        );

        console.log(`📊 Updated morning deliveries for vendor ${vendor.businessName}: ${morningData.totalCount} deliveries`);
      }
    } catch (error) {
      console.error('Error updating morning deliveries:', error);
    }
  }

  // Update afternoon deliveries at 4:00 PM
  async updateAfternoonDeliveries() {
    try {
      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // Get all vendors
      const vendors = await VendorProfile.find({});

      for (const vendor of vendors) {
        // Check if vendor has a holiday today
        const vendorHoliday = await VendorHoliday.findOne({
          vendor: vendor._id,
          dateKey: dateKey
        });

        if (vendorHoliday) {
          const holidayTime = vendorHoliday.time || 'full_day';
          if (holidayTime === 'full_day' || holidayTime === 'afternoon' || holidayTime === 'evening') {
            // Vendor holiday affects afternoon deliveries
            await DeliverySession.findOneAndUpdate(
              { vendor: vendor._id, date: dateKey },
              {
                currentSession: 'afternoon',
                afternoonDeliveries: {
                  totalCount: 0,
                  locationWise: {}
                },
                lastUpdated: new Date()
              },
              { upsert: true, new: true }
            );
            continue;
          }
        }

        // Calculate afternoon deliveries
        const afternoonData = await this.calculateDeliveriesForSession(vendor._id, dateKey, 'afternoon');

        // Update delivery session
        await DeliverySession.findOneAndUpdate(
          { vendor: vendor._id, date: dateKey },
          {
            currentSession: 'afternoon',
            afternoonDeliveries: {
              totalCount: afternoonData.totalCount,
              locationWise: this.mapToObject(afternoonData.locationWise)
            },
            lastUpdated: new Date()
          },
          { upsert: true, new: true }
        );

        console.log(`📊 Updated afternoon deliveries for vendor ${vendor.businessName}: ${afternoonData.totalCount} deliveries`);
      }
    } catch (error) {
      console.error('Error updating afternoon deliveries:', error);
    }
  }

  // Complete the day and reset for next day at 8:00 PM
  async completeDayAndReset() {
    try {
      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // Get all vendors
      const vendors = await VendorProfile.find({});

      for (const vendor of vendors) {
        // Mark current day as completed
        await DeliverySession.findOneAndUpdate(
          { vendor: vendor._id, date: dateKey },
          {
            currentSession: 'completed',
            lastUpdated: new Date()
          },
          { upsert: true, new: true }
        );

        console.log(`✅ Completed deliveries for vendor ${vendor.businessName} on ${dateKey}`);
      }

      // Optionally clean up old delivery sessions (older than 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      await DeliverySession.deleteMany({
        date: { $lt: sevenDaysAgo.toISOString().split('T')[0] }
      });

      console.log('🧹 Cleaned up old delivery sessions');
    } catch (error) {
      console.error('Error completing day and resetting:', error);
    }
  }

  // Manual trigger functions for testing
  async triggerMorningUpdate() {
    await this.updateMorningDeliveries();
  }

  async triggerAfternoonUpdate() {
    await this.updateAfternoonDeliveries();
  }

  async triggerDayComplete() {
    await this.completeDayAndReset();
  }

  // Manual trigger for updating deliveries for a specific session (for testing)
  async updateDeliveriesForSession(vendorId, session) {
    try {
      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // Check if vendor has a holiday today
      const vendorHoliday = await VendorHoliday.findOne({
        vendor: vendorId,
        dateKey: dateKey
      });

      if (vendorHoliday) {
        const holidayTime = vendorHoliday.time || 'full_day';
        const affectsSession = holidayTime === 'full_day' ||
          (holidayTime === 'morning' && session === 'morning') ||
          (holidayTime === 'afternoon' && session === 'afternoon') ||
          (holidayTime === 'evening' && session === 'afternoon');

        if (affectsSession) {
          // Update session with zero deliveries
          const updateData = {
            currentSession: session,
            lastUpdated: new Date()
          };
          updateData[`${session}Deliveries`] = { totalCount: 0 };

          await DeliverySession.findOneAndUpdate(
            { vendor: vendorId, date: dateKey },
            updateData,
            { upsert: true, new: true }
          );
          return;
        }
      }

      // Calculate deliveries for the session
      const sessionData = await this.calculateDeliveriesForSession(vendorId, dateKey, session);

      // Update delivery session
      const updateData = {
        currentSession: session,
        lastUpdated: new Date()
      };
      updateData[`${session}Deliveries`] = sessionData;

      await DeliverySession.findOneAndUpdate(
        { vendor: vendorId, date: dateKey },
        updateData,
        { upsert: true, new: true }
      );

      console.log(`📊 Manually updated ${session} deliveries for vendor: ${sessionData.totalCount} deliveries`);
    } catch (error) {
      console.error(`Error updating ${session} deliveries:`, error);
      throw error;
    }
  }
}

module.exports = new DeliveryScheduler();