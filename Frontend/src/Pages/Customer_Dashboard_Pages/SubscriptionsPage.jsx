import React, { useState, useEffect } from 'react';
import { Calendar, Pause, X, Clock, Hourglass, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SubscriptionsPage = () => {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- HELPER FUNCTIONS FOR DATES ---
  // 1. Determine total days based on plan type string
  const getPlanDuration = (planType) => {
    const type = planType?.toLowerCase() || '';
    if (type.includes('weekly') || type.includes('7_days')) return 7;
    if (type.includes('15_days')) return 15;
    if (type.includes('monthly') || type.includes('30_days')) return 30;
    return 30; // Default fallback
  };

// 2. Calculate days left and progress (UPDATED WITH HOLIDAY LOGIC)
  const getSubscriptionStats = (sub) => {
    // Determine the base duration (e.g., 30 days)
    const baseDuration = getPlanDuration(sub.planType);
    
    // Count how many holidays the student has marked
    // Assume backend provides sub.skippedDates = ['2026-03-08', '2026-03-09']
    const skippedDaysCount = sub.skippedDates ? sub.skippedDates.length : 0;
    
    const startDate = new Date(sub.startDate || sub.updatedAt || sub.createdAt);
    const fallbackEndDate = new Date(startDate);
    fallbackEndDate.setDate(fallbackEndDate.getDate() + baseDuration + skippedDaysCount);
    const endDate = sub.endDate ? new Date(sub.endDate) : fallbackEndDate;

    const today = new Date();
    
    // Calculate difference in days between today and the new extended end date
    const diffTime = endDate.getTime() - today.getTime();
    const daysLeftOverall = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const calendarSpan = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const safeDaysLeft = Math.max(0, daysLeftOverall);
    const progressPercentage = Math.min(100, Math.max(0, ((calendarSpan - safeDaysLeft) / calendarSpan) * 100));

    return { 
      startDate, 
      endDate,
      totalDays: calendarSpan,
      daysLeft: safeDaysLeft, // How many calendar days until it expires
      progressPercentage,
      isExpiringSoon: safeDaysLeft > 0 && safeDaysLeft <= 3,
      isExpired: safeDaysLeft === 0
    };
  };

  // --- FETCH SUBSCRIPTIONS ON LOAD ---
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('http://localhost:5000/api/customer/subscriptions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSubscriptions(data);
        }
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptions();
  }, [navigate]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen text-gray-500 font-bold">Loading Subscriptions...</div>;
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Subscriptions</h1>
        <p className="text-gray-500 mt-1">Manage your active and pending tiffin subscriptions</p>
      </div>

      {/* --- MAP THROUGH DATABASE SUBSCRIPTIONS --- */}
      {subscriptions.length > 0 ? (
        subscriptions.map((sub) => {
          const stats = getSubscriptionStats(sub);

          return (
            <div key={sub._id} className={`bg-white border rounded-xl p-6 mb-8 shadow-sm transition-all ${stats.isExpiringSoon && sub.status === 'active' ? 'border-red-200' : 'border-gray-200'}`}>
              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Image Section */}
                <div className="shrink-0 relative">
                  <img
                    src="https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
                    alt="Tiffin Service"
                    className="w-full md:w-64 h-full min-h-[12rem] object-cover rounded-xl"
                  />
                  {stats.isExpiringSoon && sub.status === 'active' && (
                     <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-md">
                       <AlertCircle size={14} /> Expiring Soon
                     </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="flex-1 flex flex-col justify-between">
                  
                  {/* Top Row: Title, Status, Price */}
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-2">
                        {sub.vendor ? sub.vendor.businessName : 'Unknown Vendor'}
                      </h2>
                      
                      {/* DYNAMIC STATUS BADGE */}
                      {sub.status === 'pending' && (
                        <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide inline-flex items-center gap-1">
                          <Clock size={12} /> Pending Approval
                        </span>
                      )}
                      {sub.status === 'active' && !stats.isExpired && (
                        <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide inline-flex">
                          Active
                        </span>
                      )}
                      {(sub.status === 'cancelled' || stats.isExpired) && (
                        <span className="bg-gray-200 text-gray-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide inline-flex">
                          {stats.isExpired ? 'Expired' : sub.status}
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-4 sm:mt-0 text-left sm:text-right">
                      <p className="text-gray-500 text-xs mb-1">Total Amount</p>
                      <h3 className="text-3xl font-bold text-orange-600">₹{sub.price}</h3>
                      <p className="text-gray-400 text-xs capitalize">{sub.planType.replace('_', ' ')}</p>
                    </div>
                  </div>

                  {/* Details Grid & Progress Bar (ONLY SHOW IF ACTIVE) */}
                  {sub.status === 'active' && (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 font-medium flex items-center gap-1">
                          <Calendar size={14} className="text-gray-400"/> 
                          {stats.startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className={`font-bold flex items-center gap-1 ${stats.isExpiringSoon ? 'text-red-600' : 'text-orange-600'}`}>
                          <Hourglass size={14} /> 
                          {stats.daysLeft} Days Left
                        </span>
                        <span className="text-gray-600 font-medium">
                          {stats.endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`h-2.5 rounded-full transition-all duration-1000 ${stats.isExpiringSoon ? 'bg-red-500' : 'bg-orange-500'}`} 
                          style={{ width: `${stats.progressPercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-center text-xs text-gray-400 mt-2 mt-1">
                        {stats.totalDays - stats.daysLeft} out of {stats.totalDays} days completed
                      </p>
                    </div>
                  )}

                  {/* If pending, just show a message */}
                  {sub.status === 'pending' && (
                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm text-gray-600 mb-6 flex-1">
                      <p className="font-semibold text-gray-900 mb-1">Awaiting Vendor Confirmation</p>
                      Request sent on {new Date(sub.createdAt).toLocaleDateString('en-IN')}. You will be notified once they accept it.
                    </div>
                  )}

               {/* DYNAMIC ACTION BUTTONS */}
                  {sub.status === 'active' && (
                    <div className="flex flex-wrap gap-3 mt-auto">
                      {stats.isExpiringSoon && !stats.isExpired ? (
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors shadow-sm animate-pulse">
                          <RefreshCw size={16} /> Renew Now
                        </button>
                      ) : (
                        <button className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-black transition-colors shadow-sm">
                          <Pause size={16} /> Pause
                        </button>
                      )}
                      
                      {/* --- NEW BUTTON: Jump straight to the calendar --- */}
                      <button 
                        onClick={() => navigate('/dashboard/calendar')} 
                        className="flex items-center gap-2 px-5 py-2.5 border border-orange-200 bg-orange-50 text-orange-700 rounded-lg text-sm font-bold hover:bg-orange-100 transition-colors shadow-sm"
                      >
                        <Calendar size={16} /> Mark Holiday
                      </button>

                      <button className="flex items-center gap-2 px-5 py-2.5 border border-red-100 bg-white text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm">
                        <X size={16} /> Cancel
                      </button>
                    </div>
                  )}

                </div>

              </div>
            </div>
          );
        })
      ) : (
        /* EMPTY STATE: No subscriptions found */
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center shadow-sm">
          <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Subscriptions Yet</h2>
          <p className="text-gray-500 mb-6">You haven't requested any tiffin services. Start exploring to get delicious meals delivered!</p>
          <button onClick={() => navigate('/dashboard/browse')} className="bg-orange-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-orange-600 transition-colors">
            Browse Tiffins
          </button>
        </div>
      )}

      {/* Benefits Section */}
      <div className="bg-[#FFF7ED] border border-orange-100 rounded-xl p-8 mt-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Subscription Benefits</h3>
        <ul className="space-y-3 text-gray-600 text-sm">
          <BenefitItem text="Save up to 20% with monthly subscriptions" />
          <BenefitItem text="Pause your subscription anytime during holidays" />
          <BenefitItem text="Get priority delivery and customer support" />
          <BenefitItem text="Flexible meal customization options" />
        </ul>
      </div>
    </>
  );
};

const BenefitItem = ({ text }) => (
  <li className="flex items-start gap-3">
    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 shrink-0"></div>
    <span>{text}</span>
  </li>
);

export default SubscriptionsPage;
