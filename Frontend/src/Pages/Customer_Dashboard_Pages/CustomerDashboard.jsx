import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Package, TrendingUp, Clock, Star, 
  Calendar, AlertTriangle, ChefHat, XCircle, CheckCircle, ChevronRight, Info, Bell, Store, BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  
  // --- 1. NEW DYNAMIC STATES ---
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Interactive States
  const [hasPendingBill, setHasPendingBill] = useState(false); // Default to false until we build billing
  const [isSkippedToday, setIsSkippedToday] = useState(false);

// --- CustomerDashboard.jsx (Inside the useEffect) ---
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');

        const response = await fetch('http://localhost:5000/api/customer/dashboard', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();

        if (response.ok) {
          setDashboardData(data);
          
          // NEW: Read the flag from the backend! 
          setHasPendingBill(data.hasPendingBill); 
          
        } else {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);
  // Show a loading screen while waiting for the backend
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-500 font-bold">Loading your dashboard...</p></div>;
  }
const tickerStyles = `
    @keyframes scroll {
      0% { transform: translateX(100%); }
      100% { transform: translateX(-100%); }
    }
    .animate-ticker {
      display: inline-block;
      white-space: nowrap;
      animation: scroll 20s linear infinite;
    }
    .animate-ticker:hover {
      animation-play-state: paused; /* Pauses when student hovers to read */
    }
  `;
  return (
    <div className="pb-10">
      <style>{tickerStyles}</style>

      {/* --- NEW ANNOUNCEMENT TICKER --- */}
      {dashboardData?.announcements && dashboardData.announcements.length > 0 && (
        <div className="bg-blue-600 text-white overflow-hidden py-2.5 px-4 mb-6 shadow-md flex items-center">
          <Bell size={18} className="shrink-0 mr-3 text-blue-200" />
          <div className="w-full overflow-hidden relative">
            <div className="animate-ticker font-medium text-sm flex gap-10">
              {dashboardData.announcements.map((ann, index) => (
                <span key={index} className="flex items-center gap-2">
                  <span className="bg-white/20 px-2 py-0.5 rounded text-xs uppercase font-bold tracking-wider">
                    {ann.type}
                  </span>
                  {ann.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Payment Alert Banner */}
      {hasPendingBill && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-500 mt-1 shrink-0" size={24} />
            <div>
              <p className="text-red-800 font-bold text-lg">Payment Due: ₹3,000</p>
              <p className="text-red-600 text-sm mt-0.5">Your monthly subscription bill is pending. Please pay to avoid service interruption.</p>
            </div>
          </div>
          <button onClick={() => navigate('/billing')} className="w-full sm:w-auto bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-700 shadow-md transition-colors whitespace-nowrap">
            Pay Now
          </button>
        </div>
      )}

      {/* Dashboard Header - NOW DYNAMIC! */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, <span className="font-bold text-orange-600 capitalize">{dashboardData?.user?.name || 'Student'}</span>! Here's your overview.
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <button onClick={() => navigate('/dashboard/subscriptions')} className="text-left w-full block hover:scale-105 transition-transform">
          <StatsCard title="Active Subscriptions" value={String(dashboardData?.stats?.activeSubscriptions || 0)} icon={<ShoppingCart size={24} className="text-orange-400" />} />
        </button>
        <button onClick={() => navigate('/dashboard/orders')} className="text-left w-full block hover:scale-105 transition-transform">
          <StatsCard title="Total Orders" value={dashboardData?.stats?.totalOrders || "0"} icon={<Package size={24} className="text-green-400" />} />
        </button>
        <div className="text-left w-full block cursor-default">
          <StatsCard title="Monthly Spend" value={`₹${dashboardData?.stats?.monthlySpend || 0}`} icon={<TrendingUp size={24} className="text-blue-400" />} />
        </div>
        <div className="text-left w-full block cursor-default">
          <StatsCard title="Next Delivery" value={dashboardData?.subscription ? "12:30 PM" : "--"} icon={<Clock size={24} className="text-purple-400" />} />
        </div>
      </div>

      {/* Middle Section: Active Subscription & Today's Menu */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Left: Active Subscription Box */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">Active Subscription</h2>
            <button onClick={() => navigate('/dashboard/subscriptions')} className="text-sm font-semibold text-orange-600 hover:underline">Manage</button>
          </div>

          {/* DYNAMIC CHECK: Do they have a subscription? */}
          {dashboardData?.subscription ? (
            <>
              <div className="border border-gray-100 rounded-xl p-4 flex gap-4 items-center">
                <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center text-orange-500 shrink-0">
                  <ChefHat size={32} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900">{dashboardData.subscription.vendor.businessName}</h3>
                  <p className="text-gray-500 text-sm capitalize">{dashboardData.subscription.planType} Plan ({dashboardData.subscription.mealType})</p>
                  <span className="inline-block mt-1 bg-green-100 text-green-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
              </div>

              {/* SKIP MEAL ACTION */}
              <div className="mt-auto pt-6 border-t border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-gray-900">Eating out today?</p>
                  <p className="text-xs text-gray-500">Pause delivery to save your credits.</p>
                </div>
                <button onClick={() => setIsSkippedToday(!isSkippedToday)} className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${isSkippedToday ? 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                  {isSkippedToday ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  {isSkippedToday ? 'Meal Skipped' : 'Skip Today'}
                </button>
              </div>
            </>
          ) : (
            /* EMPTY STATE: No subscription found */
            <div className="flex flex-col items-center justify-center text-center py-6 h-full">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
                <ShoppingCart size={32} />
              </div>
              <h3 className="text-gray-900 font-bold mb-1">No Active Subscriptions</h3>
              <p className="text-gray-500 text-sm mb-4">You haven't subscribed to any tiffin services yet.</p>
              <button onClick={() => navigate('/dashboard/browse')} className="bg-orange-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-600 transition-colors">
                Browse Tiffins
              </button>
            </div>
          )}
        </div>

        {/* Right: Today's Menu */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ChefHat className="text-orange-500" size={20} /> What's Cooking Today?
            </h2>
            <button onClick={() => navigate('/dashboard/weekly-menus')} className="text-sm font-semibold text-orange-600 hover:underline">
              Weekly Menus
            </button>
          </div>
          
          {dashboardData?.todaysMenu ? (
            <div className="space-y-4 flex-1">
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                <span className="text-xs font-bold text-orange-800 uppercase tracking-wide block mb-1">Lunch ({dashboardData.todaysMenu.lunch.time})</span>
                <p className="text-gray-800 font-medium">{dashboardData.todaysMenu.lunch.items}</p>
              </div>
              
              {dashboardData.todaysMenu.dinner && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <span className="text-xs font-bold text-blue-800 uppercase tracking-wide block mb-1">Dinner ({dashboardData.todaysMenu.dinner.time})</span>
                  <p className="text-gray-800 font-medium">{dashboardData.todaysMenu.dinner.items}</p>
                </div>
              )}
            </div>
          ) : (
            /* EMPTY STATE: No menu found */
            <div className="flex flex-col items-center justify-center text-center py-6 h-full border-2 border-dashed border-gray-100 rounded-xl">
              <Info className="text-gray-300 mb-2" size={32} />
              <p className="text-gray-500 font-medium text-sm">No menu updated for today yet.</p>
              <p className="text-gray-400 text-xs mt-1">Check back closer to delivery time!</p>
            </div>
          )}
        </div>

      </div>

      {/* ... (Keep the rest of your Quick Actions exactly the same below this line) ... */}
      
      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <QuickActionBtn onClick={() => navigate('browse')} icon={<ShoppingCart size={24} />} label="Browse Tiffins" />
          <QuickActionBtn onClick={() => navigate('calendar')} icon={<Calendar size={24} />} label="My Calendar" />
          <QuickActionBtn onClick={() => navigate('/dashboard/orders')} icon={<Package size={24} />} label="Track Orders" />
          <QuickActionBtn onClick={() => navigate('reviews')} icon={<Star size={24} />} label="Write a Review" />
          <QuickActionBtn onClick={() => navigate('/dashboard/homemade-store')} icon={<Store size={24} />} label="Homemade Store" />
          <QuickActionBtn onClick={() => navigate('/dashboard/weekly-menus')} icon={<BookOpen size={24} />} label="Weekly Menus" />
        </div>
      </div>

    </div>
  );
};

// Helper Components
const StatsCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
      {icon}
    </div>
  </div>
);

const QuickActionBtn = ({ icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-orange-500 hover:text-orange-600 hover:shadow-md transition-all group"
  >
    <div className="text-gray-600 group-hover:text-orange-500 transition-colors">
      {icon}
    </div>
    <span className="font-bold text-sm text-gray-800 group-hover:text-orange-600">{label}</span>
  </button>
);

export default CustomerDashboard;
