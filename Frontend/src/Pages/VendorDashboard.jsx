import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, IndianRupee, ChefHat, ClipboardList, Star, Calendar, UserPlus, MapPin,ArrowRight,
  Megaphone, PauseCircle, PhoneCall, Home,
  CheckCircle, Loader ,Settings, Store, ShoppingBag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VendorDashboard = () => {
  const navigate = useNavigate(); 
  const [activeTab, setActiveTab] = useState('deliveries');
  
  // --- DYNAMIC STATES ---
  const [dashboardData, setDashboardData] = useState(null);
  const [deliveryData, setDeliveryData] = useState({
    groupedList: {},
    totalDeliveries: 0,
    sessions: {
      morning: { totalDeliveries: 0, groupedList: {} },
      afternoon: { totalDeliveries: 0, groupedList: {} }
    },
    isVendorHoliday: false,
    holidayReason: ''
  });
  const [activeMealSession, setActiveMealSession] = useState('morning');
  const [isLoading, setIsLoading] = useState(true);
  const [markingDeliveryId, setMarkingDeliveryId] = useState('');
  const [resettingDeliveries, setResettingDeliveries] = useState(false);

  const currentDate = new Date().toLocaleDateString('en-IN', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  // --- FETCH DATA ON LOAD ---
  const fetchDashboardAndDeliveries = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch general dashboard stats
      const dashRes = await fetch('http://localhost:5000/api/vendor/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch the smart delivery list
      const deliveryRes = await fetch('http://localhost:5000/api/vendor/deliveries/today', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (dashRes.ok && deliveryRes.ok) {
        const dashData = await dashRes.json();
        const delData = await deliveryRes.json();
        
        setDashboardData(dashData);
        setDeliveryData(delData);
      } else {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } catch (error) {
      console.error("Vendor Dashboard Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDashboardAndDeliveries();
  }, [fetchDashboardAndDeliveries]);

  const markDelivery = async (subscriptionId, mealSlot) => {
    const actionKey = `${subscriptionId}:${mealSlot || 'afternoon'}`;
    try {
      setMarkingDeliveryId(actionKey);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/vendor/deliveries/${subscriptionId}/mark-delivered`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ session: mealSlot || 'afternoon' })
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || 'Failed to mark delivery.');
        return;
      }

      fetchDashboardAndDeliveries();
    } catch (error) {
      console.error('Error marking delivery:', error);
      alert('Server error while marking delivery.');
    } finally {
      setMarkingDeliveryId('');
    }
  };

  const resetAllDeliveries = async () => {
    const confirmed = window.confirm('Reset all delivered meals for today back to drop-off?');
    if (!confirmed) return;

    try {
      setResettingDeliveries(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/vendor/deliveries/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || 'Failed to reset deliveries.');
        return;
      }
      alert(data.message || 'Deliveries reset successfully.');
      fetchDashboardAndDeliveries();
    } catch (error) {
      console.error('Error resetting deliveries:', error);
      alert('Server error while resetting deliveries.');
    } finally {
      setResettingDeliveries(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-orange-600">
        <Loader className="animate-spin mb-4" size={48} />
        <p className="font-bold">Loading your kitchen...</p>
      </div>
    );
  }

  // Fallback to empty object if data is missing
  const business = dashboardData?.vendorProfile || {};
  const menu = dashboardData?.todaysMenu || null;
  const selectedSessionData = deliveryData?.sessions?.[activeMealSession] || { totalDeliveries: 0, groupedList: {} };
  const selectedDeliveredSessionData = deliveryData?.deliveredSessions?.[activeMealSession] || { totalDeliveries: 0, groupedList: {} };
  const hasReviews = Number(business.totalReviews || 0) > 0;
  const vendorRatingValue = hasReviews ? Number(business.rating || 0).toFixed(1) : "New";
  const vendorRatingSubtext = hasReviews
    ? `${business.totalReviews} customer review${business.totalReviews > 1 ? 's' : ''}`
    : "No customer reviews yet";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      
   {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back, <span className="font-semibold text-gray-800">{business.businessName || "Vendor"}</span>!
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          
          {/* NEW: PROFILE / SETTINGS BUTTON */}
          <button 
            onClick={() => navigate('/vendor-profile')} // Make sure this matches your App.js route!
            className="p-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-green-600 transition-colors shadow-sm"
            title="Kitchen Settings & Profile"
          >
            <Settings size={20} />
          </button>

          <button className="flex items-center gap-2 bg-white border border-red-200 text-red-600 px-4 py-2 rounded-xl font-bold hover:bg-red-50 hover:border-red-300 transition-all shadow-sm group">
            <PauseCircle size={20} className="group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Pause Deliveries</span>
          </button>

          <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl shadow-sm flex items-center gap-2 hidden md:flex">
            <Calendar size={18} className="text-orange-500" />
            <span className="text-sm font-medium text-gray-600">{currentDate}</span>
          </div> 
          
          <button onClick={() => navigate('/locations')} className="px-4 py-2 bg-orange-50 text-orange-700 text-sm font-bold rounded-xl border border-orange-200 hover:bg-orange-100 transition-colors flex items-center gap-2 shadow-sm">
            <MapPin size={16} /> <span className="hidden sm:inline">Locations</span>
          </button>
        </div>
      </div>

      {/* --- Stats Overview --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* UPDATED: Changed Title and mapped to stats.totalCustomers */}
        <button onClick={() => navigate('/CustomerDirectory')} className="text-left w-full">
          <StatsCard 
            title="Active Customers" 
            value={dashboardData?.stats?.totalCustomers || "0"} 
            subtext="Currently subscribed" 
            icon={<Users size={24} className="text-blue-600" />} 
            color="bg-blue-100" 
          />
        </button>

       
        
        {/* ... Rest of the stats cards ... */}
        <button onClick={() => navigate('/locations')} className="text-left w-full">
          <StatsCard title="Today's Deliveries" value={deliveryData.totalDeliveries || "0"} subtext="Meals to prepare" icon={<ClipboardList size={24} className="text-orange-600" />} color="bg-orange-100" />
        </button>
        <button onClick={() => navigate("/Reviews")} className="text-left w-full">
          <StatsCard
            title="Vendor Rating"
            value={vendorRatingValue}
            subtext={vendorRatingSubtext}
            icon={<Star size={24} className="text-yellow-500 fill-yellow-500" />}
            color="bg-yellow-100"
          />
        </button>
        <button onClick={() => navigate('/homemade-orders')} className="text-left w-full">
          <StatsCard
            title="Homemade Orders"
            value={dashboardData?.stats?.homemadeOrders || "0"}
            subtext={`${dashboardData?.stats?.homemadePendingOrders || 0} pending`}
            icon={<ShoppingBag size={24} className="text-emerald-600" />}
            color="bg-emerald-100"
          />
        </button>
      </div>

      {/* --- Main Content Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Delivery & Payments */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tab Navigation */}
          <div className="flex items-center gap-6 border-b border-gray-100 pb-2">
            <button onClick={() => setActiveTab('deliveries')} className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors relative ${activeTab === 'deliveries' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}>
              <ClipboardList size={18} /> Today's Deliveries ({deliveryData.totalDeliveries})
              {activeTab === 'deliveries' && <div className="absolute bottom-[-2px] left-0 w-full h-0.5 bg-orange-600 rounded-t-full"></div>}
            </button>
            <button onClick={() => setActiveTab('payments')} className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors relative ${activeTab === 'payments' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}>
              <IndianRupee size={18} /> Payment Status
              {activeTab === 'payments' && <div className="absolute bottom-[-2px] left-0 w-full h-0.5 bg-orange-600 rounded-t-full"></div>}
            </button>
          </div>

         {/* TAB 1: SMART DELIVERY LIST */}
          {activeTab === 'deliveries' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[300px] flex flex-col">
               <div className="px-6 pt-6 pb-2 flex items-center justify-between gap-3">
                 <div className="flex gap-2">
                   <button
                     onClick={() => setActiveMealSession('morning')}
                     className={`px-3 py-1.5 rounded-lg text-xs font-bold ${activeMealSession === 'morning' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}
                   >
                     Night ({deliveryData?.sessions?.morning?.totalDeliveries || 0})
                   </button>
                   <button
                     onClick={() => setActiveMealSession('afternoon')}
                     className={`px-3 py-1.5 rounded-lg text-xs font-bold ${activeMealSession === 'afternoon' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}
                   >
                     Afternoon ({deliveryData?.sessions?.afternoon?.totalDeliveries || 0})
                   </button>
                 </div>
                 <button
                   onClick={resetAllDeliveries}
                   disabled={resettingDeliveries}
                   className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60"
                 >
                   {resettingDeliveries ? 'Resetting...' : 'Reset Deliveries'}
                 </button>
               </div>
               {(selectedSessionData.totalDeliveries > 0 || selectedDeliveredSessionData.totalDeliveries > 0) ? (
                 <>
                   <div className="divide-y divide-gray-100 flex-1">
                     {/* SLICE(0, 2): Only show the top 2 locations on the dashboard */}
                     {Object.entries(selectedSessionData.groupedList).slice(0, 2).map(([location, students]) => (
                       <div key={location} className="p-6">
                         <div className="flex items-center justify-between mb-4">
                           <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                             <MapPin className="text-orange-500" size={20} />
                             {location}
                           </h3>
                           <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-bold border border-orange-100">
                             {students.length} Tiffins
                           </span>
                         </div>

                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-7">
                           {students.map((student, idx) => (
                             <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-orange-50/50 hover:border-orange-100 transition-colors group">
                               <div>
                                 <p className="font-bold text-gray-900 mb-1">{student.customerName}</p>
                                 <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                                    <span className="flex items-center gap-1"><Home size={12} className="text-gray-400"/> {student.roomNumber}</span>
                                    <span className="capitalize px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-[10px]">{student.mealType}</span>
                                  </div>
                                 <button
                                   onClick={() => markDelivery(student.subscriptionId, student.mealSlot)}
                                   disabled={markingDeliveryId === `${student.subscriptionId}:${student.mealSlot || 'afternoon'}`}
                                   className="mt-2 text-[11px] font-bold px-2.5 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                                 >
                                   {markingDeliveryId === `${student.subscriptionId}:${student.mealSlot || 'afternoon'}` ? 'Marking...' : 'Mark Delivered'}
                                 </button>
                               </div>
                               <a href={`tel:${student.phone}`} className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-green-600 hover:bg-green-50 hover:border-green-200 transition-colors shadow-sm shrink-0">
                                 <PhoneCall size={14} />
                               </a>
                             </div>
                           ))}
                         </div>
                       </div>
                     ))}
                   </div>

                   <div className="px-6 py-4 border-t border-green-100 bg-green-50/40">
                     <div className="flex items-center justify-between mb-3">
                       <h4 className="text-sm font-bold text-green-800">Delivered</h4>
                       <span className="text-[11px] font-bold px-2 py-1 rounded bg-green-100 text-green-700 border border-green-200">
                         {selectedDeliveredSessionData.totalDeliveries || 0}
                       </span>
                     </div>
                     {Object.entries(selectedDeliveredSessionData.groupedList).length > 0 ? (
                       <div className="space-y-2">
                         {Object.entries(selectedDeliveredSessionData.groupedList).slice(0, 2).map(([location, students]) => (
                           <div key={`delivered-${location}`} className="text-xs text-gray-700 bg-white border border-green-200 rounded-lg px-3 py-2">
                             <span className="font-semibold">{location}</span>: {students.length} delivered
                           </div>
                         ))}
                       </div>
                     ) : (
                       <p className="text-xs text-gray-500">No delivered meals in this session yet.</p>
                     )}
                   </div>
                   
                   {/* VIEW ALL BUTTON */}
                   <button 
                     onClick={() => navigate('/locations')} 
                     className="w-full p-4 bg-orange-50 text-orange-700 font-bold hover:bg-orange-100 transition-colors flex items-center justify-center gap-2 border-t border-orange-100 mt-auto"
                   >
                     View Full Location Summary <ArrowRight size={18} />
                   </button>
                 </>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-center p-12 mt-10">
                   <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-4 shadow-sm">
                     <CheckCircle size={32} />
                   </div>
                   <h3 className="text-xl font-bold text-gray-900 mb-2">Kitchen Closed!</h3>
                   <p className="text-gray-500 text-sm max-w-sm">
                     {deliveryData.isVendorHoliday
                      ? `Holiday marked for today: ${deliveryData.holidayReason || 'No reason provided'}. Drop-offs reduced to 0.`
                      : 'There are no scheduled deliveries for today.'}
                   </p>
                 </div>
               )}
            </div>
          )}

          {/* TAB 2: PAYMENT TRACKER */}
          {activeTab === 'payments' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[300px] flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4 shadow-sm border border-green-100">
                <IndianRupee size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Financial Overview</h3>
              <p className="text-gray-500 text-sm max-w-sm mb-6">
                Track pending renewals, manage student dues, and view your complete paid transaction history.
              </p>
              <button 
                onClick={() => navigate('/Payment_Status')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                Open Payment Records <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Menu & Actions */}
        <div className="space-y-8">
          
          {/* Daily Menu Card - NOW DYNAMIC! */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <ChefHat className="text-orange-500" size={20} /> Today's Menu
              </h3>
              <button onClick={() => navigate('/menu_management')} className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                Edit
              </button>
            </div>
            
            {menu ? (
              <div className="space-y-3 flex-1">
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <span className="text-xs font-bold text-orange-800 uppercase tracking-wide block mb-1">Lunch ({menu.lunch.time})</span>
                  <p className="text-gray-700 text-sm font-medium whitespace-pre-wrap">{menu.lunch.items}</p>
                </div>
                {menu.dinner && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Dinner ({menu.dinner.time})</span>
                    <p className="text-gray-700 text-sm font-medium whitespace-pre-wrap">{menu.dinner.items}</p>
                  </div>
                )}
              </div>
            ) : (
              /* EMPTY STATE: No Menu Uploaded */
              <div className="flex-1 flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-gray-100 rounded-xl">
                <ChefHat className="text-gray-300 mb-3" size={36} />
                <p className="text-gray-500 text-sm font-medium">You haven't set today's menu!</p>
                <button onClick={() => navigate('/menu_management')} className="mt-4 bg-orange-100 text-orange-700 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-orange-200 transition-colors shadow-sm">
                  Add Menu Now
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => navigate('/CustomerDirectory')} className="p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-400 hover:shadow-md transition-all group flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Users size={20} /></div>
              <span className="text-xs font-semibold text-gray-600">Add Student</span>
            </button>
            <button onClick={() => navigate('/menu_management')} className="p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-400 hover:shadow-md transition-all group flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Megaphone size={20} /></div>
              <span className="text-xs font-semibold text-gray-600">Announce</span>
            </button>
            <button onClick={() => navigate('/Add')} className="p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-400 hover:shadow-md transition-all group flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Store size={20} /></div>
              <span className="text-xs font-semibold text-gray-600">Homemade</span>
            </button>
            <button onClick={() => navigate('/homemade-orders')} className="p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-400 hover:shadow-md transition-all group flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><ShoppingBag size={20} /></div>
              <span className="text-xs font-semibold text-gray-600">Orders</span>
            </button>
            
            {/* REQUESTS BUTTON */}
            <button onClick={() => navigate('/students')} className="p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-400 hover:shadow-md transition-all group flex flex-col items-center gap-2 relative">
              <span className="absolute top-2 right-2 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><UserPlus size={20} /></div>
              <span className="text-xs font-semibold text-gray-600">Requests</span>
            </button>
            
            <button onClick={() => navigate("/Leave_manegment")} className="p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-400 hover:shadow-md transition-all group flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Calendar size={20} /></div>
              <span className="text-xs font-semibold text-gray-600">Mark Leave</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const StatsCard = ({ title, value, subtext, icon, color }) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>{icon}</div>    
  </div> 
); 

export default VendorDashboard;
