import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Package, TrendingUp, Clock, Star, 
  Calendar, AlertTriangle, ChefHat, XCircle, CheckCircle, ChevronRight, Info, Bell, Store, BookOpen,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  
  // --- DYNAMIC STATES (Logic Untouched) ---
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Interactive States
  const [hasPendingBill, setHasPendingBill] = useState(false);
  const [isSkippedToday, setIsSkippedToday] = useState(false);

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
          setHasPendingBill(data.hasPendingBill); 
        } else {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
          }
        }
      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
          <ChefHat className="animate-bounce mb-4 text-orange-500" size={48} />
          <p className="font-bold text-slate-700">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">

        {/* --- REVAMPED ANNOUNCEMENTS (No more awkward scrolling) --- */}
        {dashboardData?.announcements && dashboardData.announcements.length > 0 && (
          <div className="space-y-3 mb-6">
            {dashboardData.announcements.map((ann, index) => (
              <div key={index} className="bg-blue-50/80 border border-blue-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 shadow-sm hover:shadow-md transition-shadow">
      
                <div className="flex-1">
                  <span className="inline-block px-2.5 py-1 bg-blue-200/50 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-lg mb-1.5 sm:mb-0 sm:mr-3">
                    {ann.type}
                  </span>
                  {ann.vendorName && (
                    <span className="inline-block px-2.5 py-1 bg-white text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-lg mb-1.5 sm:mb-0 sm:mr-3">
                      {ann.vendorName}
                    </span>
                  )}
                  <span className="text-sm font-semibold text-blue-900 leading-relaxed">{ann.text}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- PREMIUM PAYMENT ALERT BANNER --- */}
        {hasPendingBill && (
          <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-3xl p-6 sm:p-8 mb-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between shadow-lg shadow-red-200/50 gap-6">
            <div className="flex items-start md:items-center gap-4 sm:gap-5">
              <div className="bg-white/20 p-3 sm:p-4 rounded-2xl shrink-0 animate-pulse">
                <AlertTriangle size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold mb-1">Payment Due: ₹3,000</h3>
                <p className="text-red-100 text-sm font-medium">Your monthly subscription bill is pending. Please pay to avoid service interruption.</p>
              </div>
            </div>
            <button onClick={() => navigate('/billing')} className="w-full md:w-auto bg-white text-red-600 px-8 py-3.5 rounded-2xl font-bold hover:bg-red-50 shadow-md transition-all hover:-translate-y-1 whitespace-nowrap">
              Pay Now
            </button>
          </div>
        )}

        {/* --- DYNAMIC HEADER --- */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-2 text-lg">
            Welcome back, <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400 capitalize">{dashboardData?.user?.name || 'Student'}</span>! 🍽️
          </p>
        </div>

        {/* --- STATS CARDS GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <button onClick={() => navigate('/dashboard/subscriptions')} className="text-left w-full outline-none block group">
            <StatsCard title="Active Subscriptions" value={String(dashboardData?.stats?.activeSubscriptions || 0)} icon={<ShoppingCart size={24} className="text-orange-600" />} iconBg="bg-orange-100" />
          </button>
          <button onClick={() => navigate('/dashboard/orders')} className="text-left w-full outline-none block group">
            <StatsCard title="Total Orders" value={dashboardData?.stats?.totalOrders || "0"} icon={<Package size={24} className="text-emerald-600" />} iconBg="bg-emerald-100" />
          </button>
          <div className="text-left w-full block cursor-default">
            <StatsCard title="Monthly Spend" value={`₹${dashboardData?.stats?.monthlySpend || 0}`} icon={<TrendingUp size={24} className="text-blue-600" />} iconBg="bg-blue-100" />
          </div>
          <div className="text-left w-full block cursor-default">
            <StatsCard title="Next Delivery" value={dashboardData?.subscription ? "12:30 PM" : "--"} icon={<Clock size={24} className="text-purple-600" />} iconBg="bg-purple-100" />
          </div>
        </div>

        {/* --- MIDDLE SECTION: SUBSCRIPTION & MENU --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
          
          {/* Left: Active Subscription Box */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full relative overflow-hidden">
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h2 className="text-xl font-extrabold text-slate-900">Active Subscription</h2>
              <button onClick={() => navigate('/dashboard/subscriptions')} className="text-sm font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-4 py-2 rounded-xl transition-colors">Manage</button>
            </div>

            {dashboardData?.subscription ? (
              <div className="flex flex-col h-full relative z-10">
                <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-5 flex gap-5 items-center mb-6 hover:border-orange-200 transition-colors">
                  <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-orange-500 shadow-sm shrink-0">
                    <ChefHat size={32} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-900">{dashboardData.subscription.vendor.businessName}</h3>
                    <p className="text-slate-500 text-sm capitalize font-medium mt-0.5">{dashboardData.subscription.planType} Plan • {dashboardData.subscription.mealType}</p>
                    <span className="inline-block mt-2 bg-emerald-100 text-emerald-700 text-[10px] uppercase font-bold px-2.5 py-1 rounded-md">
                      Active
                    </span>
                  </div>
                </div>

                {/* SKIP MEAL ACTION */}
                <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900">Eating out today?</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Pause delivery to save your credits.</p>
                  </div>
                  <button onClick={() => setIsSkippedToday(!isSkippedToday)} className={`w-full sm:w-auto px-5 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${isSkippedToday ? 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100' : 'bg-slate-900 text-white hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-md'}`}>
                    {isSkippedToday ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    {isSkippedToday ? 'Meal Skipped' : 'Skip Today'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-10 h-full relative z-10">
                <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-5 shadow-sm">
                  <ShoppingCart size={36} />
                </div>
                <h3 className="text-slate-800 font-bold text-lg mb-2">No Active Subscriptions</h3>
                <p className="text-slate-500 text-sm mb-6 max-w-xs">You haven't subscribed to any tiffin services yet. Let's find you some great food!</p>
                <button onClick={() => navigate('/dashboard/browse')} className="bg-orange-500 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-md hover:shadow-lg hover:-translate-y-1 flex items-center gap-2">
                  Browse Tiffins <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Right: Today's Menu */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/50 rounded-bl-[100px] -z-0"></div>
            
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <ChefHat className="text-orange-500" size={24} /> What's Cooking?
              </h2>
              <button onClick={() => navigate('/dashboard/weekly-menus')} className="text-sm font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-4 py-2 rounded-xl transition-colors">
                Weekly Menus
              </button>
            </div>
            
            {dashboardData?.todaysMenu ? (
              <div className="space-y-4 flex-1 relative z-10">
                <div className="p-5 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl border border-orange-100">
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider block mb-2 flex items-center gap-1.5"><Clock size={12}/> Lunch ({dashboardData.todaysMenu.lunch.time})</span>
                  <p className="text-slate-800 font-semibold leading-relaxed">{dashboardData.todaysMenu.lunch.items}</p>
                </div>
                
                {dashboardData.todaysMenu.dinner && (
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2 flex items-center gap-1.5"><Clock size={12}/> Dinner ({dashboardData.todaysMenu.dinner.time})</span>
                    <p className="text-slate-800 font-semibold leading-relaxed">{dashboardData.todaysMenu.dinner.items}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-10 h-full border-2 border-dashed border-slate-200 rounded-3xl relative z-10 bg-slate-50/30">
                <Info className="text-slate-300 mb-4" size={40} />
                <p className="text-slate-600 font-semibold text-base mb-1">No menu updated for today yet.</p>
                <p className="text-slate-400 text-sm">Check back closer to delivery time!</p>
              </div>
            )}
          </div>
        </div>
        
        {/* --- QUICK ACTIONS --- */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-extrabold text-slate-900">Quick Links</h2>
            <div className="h-px bg-slate-200 flex-1 ml-2"></div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <QuickActionBtn onClick={() => navigate('browse')} icon={<ShoppingCart size={24} />} label="Browse Tiffins" color="text-orange-600" bg="bg-orange-50" />
            <QuickActionBtn onClick={() => navigate('calendar')} icon={<Calendar size={24} />} label="My Calendar" color="text-blue-600" bg="bg-blue-50" />
            <QuickActionBtn onClick={() => navigate('/dashboard/orders')} icon={<Package size={24} />} label="Track Orders" color="text-emerald-600" bg="bg-emerald-50" />
            <QuickActionBtn onClick={() => navigate('reviews')} icon={<Star size={24} />} label="Write Review" color="text-yellow-600" bg="bg-yellow-50" />
            <QuickActionBtn onClick={() => navigate('/dashboard/homemade-store')} icon={<Store size={24} />} label="Home Store" color="text-purple-600" bg="bg-purple-50" />
            <QuickActionBtn onClick={() => navigate('/dashboard/weekly-menus')} icon={<BookOpen size={24} />} label="Weekly Menus" color="text-pink-600" bg="bg-pink-50" />
          </div>
        </div>

      </div>
    </div>
  );
};

// --- HELPER COMPONENTS ---
const StatsCard = ({ title, value, icon, iconBg }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md hover:border-orange-200 hover:-translate-y-1 transition-all duration-300">
    <div>
      <p className="text-slate-500 text-sm font-semibold mb-1">{title}</p>
      <h3 className="text-3xl font-extrabold text-slate-900">{value}</h3>
    </div>
    <div className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center justify-center shrink-0`}>
      {icon}
    </div>
  </div>
);

const QuickActionBtn = ({ icon, label, onClick, color, bg }) => (
  <button 
    onClick={onClick}
    className="bg-white border border-slate-100 p-6 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-orange-200 hover:shadow-md hover:-translate-y-1 transition-all group"
  >
    <div className={`w-14 h-14 ${bg} ${color} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <span className="font-bold text-sm text-slate-700 group-hover:text-slate-900 text-center">{label}</span>
  </button>
);

export default CustomerDashboard;
