import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, IndianRupee, ChefHat, ClipboardList, Star, Calendar, UserPlus, MapPin, ArrowRight,
  Megaphone, PauseCircle, PhoneCall, Home,
  CheckCircle, Loader, Settings, Store, ShoppingBag
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
  const [vendorStatus, setVendorStatus] = useState('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [activeMealSession, setActiveMealSession] = useState('morning');
  const [markingDeliveryId, setMarkingDeliveryId] = useState('');
  const [resettingDeliveries, setResettingDeliveries] = useState(false);

  const currentDate = new Date().toLocaleDateString('en-IN', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  const getIndiaTimeMinutes = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(new Date());

    const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0);
    const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0);
    return hour * 60 + minute;
  };

  const getSessionHeaderState = (currentSession) => {
    const currentMinutes = getIndiaTimeMinutes();
    const morningStart = 12 * 60 + 30;
    const afternoonStart = 16 * 60;
    const dayComplete = 20 * 60;

    if (currentMinutes >= dayComplete) {
      return {
        label: 'Day Completed',
        dotClassName: 'bg-slate-400',
        nextUpdate: 'Tomorrow 12:30 PM'
      };
    }

    if (currentMinutes < morningStart) {
      return {
        label: 'Morning Session Starts Soon',
        dotClassName: 'bg-slate-400',
        nextUpdate: '12:30 PM'
      };
    }

    if (currentMinutes < afternoonStart) {
      return {
        label: 'Morning Session Active',
        dotClassName: 'bg-orange-500 animate-pulse',
        nextUpdate: '4:00 PM'
      };
    }

    if (currentSession === 'completed') {
      return {
        label: 'Day Completed',
        dotClassName: 'bg-slate-400',
        nextUpdate: 'Tomorrow 12:30 PM'
      };
    }

    return {
      label: 'Afternoon Session Active',
      dotClassName: 'bg-orange-500 animate-pulse',
      nextUpdate: '8:00 PM'
    };
  };

  // --- FETCH DATA ON LOAD ---
  const fetchDashboardAndDeliveries = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // First check vendor approval status
      const profileRes = await fetch('https://meal-mitra-vhcd.onrender.com/api/vendor/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        
        // Set vendor status from profile for the UI card state
        setVendorStatus(profileData.status || profileData.vendorProfile?.status || 'pending');

      } else if (profileRes.status === 404) {
        // Vendor profile not found -> keep pending status and keep user in place
        setVendorStatus('pending');
      } else {
        const shouldLogout = profileRes.status === 401 || profileRes.status === 403;
        if (shouldLogout) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }
      }

      const dashRes = await fetch('https://meal-mitra-vhcd.onrender.com/api/vendor/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const deliveryRes = await fetch('https://meal-mitra-vhcd.onrender.com/api/vendor/deliveries/today', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (dashRes.ok && deliveryRes.ok) {
        const dashData = await dashRes.json();
        const delData = await deliveryRes.json();

        setDashboardData(dashData);
        setDeliveryData(delData);

        const status = dashData.vendorProfile?.status || 'pending';
        setVendorStatus(status);

        if (status !== 'approved') {
          // leave the vendor on the same path; show locked UI in render
          setIsLoading(false);
          return;
        }

      } else {
        const shouldLogout =
          dashRes.status === 401 ||
          dashRes.status === 403 ||
          deliveryRes.status === 401 ||
          deliveryRes.status === 403;

        if (shouldLogout) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
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
      const response = await fetch(`https://meal-mitra-vhcd.onrender.com/api/vendor/deliveries/${subscriptionId}/mark-delivered`, {
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
      const response = await fetch('https://meal-mitra-vhcd.onrender.com/api/vendor/deliveries/reset', {
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-orange-600">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center">
          <Loader className="animate-spin mb-4 text-orange-500" size={48} />
          <p className="font-bold text-slate-700">Warming up your kitchen...</p>
        </div>
      </div>
    );
  }

  if (vendorStatus !== 'approved') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl bg-white/90 border border-slate-300 shadow-xl rounded-2xl p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Dashboard Access Locked</h2>
          <p className="text-slate-700 mb-6">
            Your vendor account is currently <strong className="text-orange-600">{vendorStatus}</strong>. Admin approval is required to use the full dashboard.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 text-slate-600">
            <p className="font-semibold text-slate-800 mb-2">Next steps:</p>
            <ul className="list-disc list-inside gap-2 flex flex-col">
              <li>Wait for admin review and approval.</li>
              <li>Once approved, refresh this page to get access.</li>
              <li>If you need help, contact admin or support.</li>
            </ul>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              navigate('/login');
            }}
            className="w-full px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
          >
            Logout
          </button>
        </div>
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
  const sessionHeaderState = getSessionHeaderState(deliveryData.currentSession);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div>
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-500">
              <Calendar size={16} className="text-orange-500" />
              <span>{currentDate}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Dashboard
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              Welcome back, <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">{business.businessName || "Vendor"}</span>!
            </p>
            {/* Current Session Info */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200">
                <div className={`w-2 h-2 rounded-full ${sessionHeaderState.dotClassName}`}></div>
                <span className="text-sm font-bold text-orange-700">
                  {sessionHeaderState.label}
                </span>
              </div>
              <div className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                Next update: {sessionHeaderState.nextUpdate}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => navigate('/vendor-profile')}
              className="p-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl hover:bg-white hover:text-orange-600 hover:shadow-md transition-all duration-300"
              title="Kitchen Settings & Profile"
            >
              <Settings size={20} />
            </button>

            <button className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-all duration-300 shadow-sm group">
              <PauseCircle size={20} className="group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Pause Deliveries</span>
            </button>
            
            <button 
              onClick={() => navigate('/locations')} 
              className="px-5 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold rounded-2xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
            >
              <MapPin size={18} /> <span className="hidden sm:inline">Locations</span>
            </button>
          </div>
        </div>

        {/* --- Stats Overview --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <button onClick={() => navigate('/CustomerDirectory')} className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-2xl text-left">
            <StatsCard 
              title="Active Customers" 
              value={dashboardData?.stats?.totalCustomers || "0"} 
              subtext="Currently subscribed" 
              icon={<Users size={26} className="text-blue-600" />} 
              color="bg-blue-50" 
            />
          </button>

          <button onClick={() => navigate('/locations')} className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-2xl text-left">
            <StatsCard 
              title="Today's Deliveries" 
              value={deliveryData.totalDeliveries || "0"} 
              subtext="Meals to prepare" 
              icon={<ClipboardList size={26} className="text-orange-600" />} 
              color="bg-orange-50" 
            />
          </button>

          <button onClick={() => navigate("/Reviews")} className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-2xl text-left">
            <StatsCard
              title="Vendor Rating"
              value={vendorRatingValue}
              subtext={vendorRatingSubtext}
              icon={<Star size={26} className="text-yellow-500 fill-yellow-500" />}
              color="bg-yellow-50"
            />
          </button>

          <button onClick={() => navigate('/homemade-orders')} className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-2xl text-left">
            <StatsCard
              title="Homemade Orders"
              value={dashboardData?.stats?.homemadeOrders || "0"}
              subtext={`${dashboardData?.stats?.homemadePendingOrders || 0} pending`}
              icon={<ShoppingBag size={26} className="text-emerald-600" />}
              color="bg-emerald-50"
            />
          </button>
        </div>

        {/* --- Main Content Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Delivery & Payments */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Modern Segmented Tab Navigation - FIXED FOR MOBILE */}
            <div className="flex w-full bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
              <button 
                onClick={() => setActiveTab('deliveries')} 
                className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-2 py-2.5 sm:py-3 text-[11px] sm:text-sm font-bold rounded-xl transition-all ${activeTab === 'deliveries' ? 'bg-slate-50 text-orange-600 shadow-sm border border-slate-200/60' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'}`}
              >
                <ClipboardList size={18} className="shrink-0" />
                <span className="text-center leading-tight">Deliveries ({deliveryData.totalDeliveries})</span>
              </button>
              <button 
                onClick={() => setActiveTab('payments')} 
                className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-2 py-2.5 sm:py-3 text-[11px] sm:text-sm font-bold rounded-xl transition-all ${activeTab === 'payments' ? 'bg-slate-50 text-orange-600 shadow-sm border border-slate-200/60' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'}`}
              >
                <IndianRupee size={18} className="shrink-0" />
                <span className="text-center leading-tight">Payment Status</span>
              </button>
            </div>

            {/* TAB 1: SMART DELIVERY LIST */}
            {activeTab === 'deliveries' && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px] flex flex-col">
                 <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 border-b border-slate-100">
                   <div className="flex bg-slate-200/50 p-1 rounded-xl w-fit">
                     <button
                       onClick={() => setActiveMealSession('morning')}
                       className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeMealSession === 'morning' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                       Morning ({deliveryData?.sessions?.morning?.totalDeliveries || 0})
                     </button>
                     <button
                       onClick={() => setActiveMealSession('afternoon')}
                       className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeMealSession === 'afternoon' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                       Afternoon ({deliveryData?.sessions?.afternoon?.totalDeliveries || 0})
                     </button>
                   </div>
                   <button
                     onClick={resetAllDeliveries}
                     disabled={resettingDeliveries}
                     className="text-xs font-bold px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                   >
                     {resettingDeliveries ? 'Resetting...' : 'Reset Deliveries'}
                   </button>
                 </div>

                 {(selectedSessionData.totalDeliveries > 0 || selectedDeliveredSessionData.totalDeliveries > 0) ? (
                   <>
                     <div className="divide-y divide-slate-100 flex-1">
                       {Object.entries(selectedSessionData.groupedList || {}).slice(0, 2).map(([location, students]) => {
                         const studentArray = Array.isArray(students) ? students : [];
                         return (
                         <div key={location} className="p-6">
                           <div className="flex items-center justify-between mb-5">
                             <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                               <MapPin className="text-orange-500" size={22} />
                               {location}
                             </h3>
                             <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-xs font-bold">
                               {studentArray.length} Tiffins
                             </span>
                           </div>

                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             {studentArray.map((student, idx) => (
                               <div key={idx} className="flex flex-col p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-orange-200 transition-all group">
                                 <div className="flex justify-between items-start mb-3">
                                   <div>
                                     <p className="font-bold text-slate-800 text-base">{student.customerName}</p>
                                     <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500 font-medium">
                                        <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md"><Home size={12} className="text-slate-400"/> {student.roomNumber}</span>
                                        <span className="capitalize px-2 py-1 bg-blue-50 text-blue-600 rounded-md">{student.mealType}</span>
                                     </div>
                                   </div>
                                   <a href={`tel:${student.phone}`} className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-green-600 hover:bg-green-500 hover:text-white hover:border-green-500 transition-colors shadow-sm shrink-0">
                                     <PhoneCall size={16} />
                                   </a>
                                 </div>
                                 <button
                                   onClick={() => markDelivery(student.subscriptionId, student.mealSlot)}
                                   disabled={markingDeliveryId === `${student.subscriptionId}:${student.mealSlot || 'afternoon'}`}
                                   className="mt-auto w-full text-xs font-bold py-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-green-500 hover:text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                                 >
                                   <CheckCircle size={14} />
                                   {markingDeliveryId === `${student.subscriptionId}:${student.mealSlot || 'afternoon'}` ? 'Marking...' : 'Mark Delivered'}
                                 </button>
                               </div>
                             ))}
                           </div>
                         </div>
                         );
                       })}
                     </div>

                     <div className="px-6 py-5 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-100">
                       <div className="flex items-center justify-between mb-4">
                         <h4 className="text-sm font-bold text-green-800 flex items-center gap-2">
                           <CheckCircle size={16} className="text-green-600" /> Delivered Successfully
                         </h4>
                         <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-green-200 text-green-800">
                           {selectedDeliveredSessionData.totalDeliveries || 0}
                         </span>
                       </div>
                       {Object.entries(selectedDeliveredSessionData.groupedList || {}).length > 0 ? (
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           {Object.entries(selectedDeliveredSessionData.groupedList || {}).slice(0, 4).map(([location, students]) => {
                             const studentArray = Array.isArray(students) ? students : [];
                             return (
                             <div key={`delivered-${location}`} className="text-sm text-slate-600 bg-white shadow-sm border border-green-100 rounded-xl px-4 py-3 flex justify-between items-center">
                               <span className="font-semibold text-slate-800 truncate pr-2">{location}</span>
                               <span className="shrink-0 bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">{studentArray.length} done</span>
                             </div>
                             );
                           })}
                         </div>
                       ) : (
                         <p className="text-sm text-green-600/70 italic">No delivered meals in this session yet.</p>
                       )}
                     </div>
                     
                     {/* VIEW ALL BUTTON */}
                     <button 
                       onClick={() => navigate('/locations')} 
                       className="w-full p-5 bg-orange-50 text-orange-600 font-bold hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2 mt-auto"
                     >
                       View Full Location Summary <ArrowRight size={18} />
                     </button>
                   </>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-center p-12 mt-10">
                     <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mb-6 shadow-sm border border-slate-100">
                       <CheckCircle size={40} />
                     </div>
                     <h3 className="text-2xl font-bold text-slate-800 mb-3">Kitchen Closed!</h3>
                     <p className="text-slate-500 text-base max-w-sm leading-relaxed">
                       {deliveryData.isVendorHoliday
                        ? `Holiday marked for today: ${deliveryData.holidayReason || 'No reason provided'}. Drop-offs reduced to 0.`
                        : 'There are no scheduled deliveries for today. Time to relax!'}
                     </p>
                   </div>
                 )}
              </div>
            )}

            {/* TAB 2: PAYMENT TRACKER */}
            {activeTab === 'payments' && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-500"></div>
                <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-100">
                  <IndianRupee size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">Financial Overview</h3>
                <p className="text-slate-500 text-base max-w-md mb-8 leading-relaxed">
                  Track pending renewals, manage student dues, and view your complete paid transaction history in one secure place.
                </p>
                <button 
                  onClick={() => navigate('/Payment_Status')}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-1 flex items-center gap-3"
                >
                  Open Payment Records <ArrowRight size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Menu & Actions */}
          <div className="space-y-6">
            
            {/* Daily Menu Card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-[100px] -z-0 opacity-50"></div>
              
              <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className="font-extrabold text-xl text-slate-800 flex items-center gap-2">
                  <ChefHat className="text-orange-500" size={24} /> Today's Menu
                </h3>
                <button onClick={() => navigate('/menu_management')} className="text-sm bg-orange-50 text-orange-600 hover:bg-orange-100 px-3 py-1.5 rounded-lg font-bold transition-colors">
                  Edit
                </button>
              </div>
              
              {menu ? (
                <div className="space-y-4 flex-1 relative z-10">
                  <div className="p-5 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl border border-orange-100">
                    <span className="text-xs font-bold text-orange-600 uppercase tracking-wider block mb-2 flex items-center gap-1"><Calendar size={12}/> Lunch ({menu.lunch.time})</span>
                    <p className="text-slate-800 text-sm font-semibold whitespace-pre-wrap leading-relaxed">{menu.lunch.items}</p>
                  </div>
                  {menu.dinner && (
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2 flex items-center gap-1"><Calendar size={12}/> Dinner ({menu.dinner.time})</span>
                      <p className="text-slate-700 text-sm font-semibold whitespace-pre-wrap leading-relaxed">{menu.dinner.items}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl relative z-10 bg-slate-50/50">
                  <ChefHat className="text-slate-300 mb-4" size={48} />
                  <p className="text-slate-600 text-sm font-medium">You haven't set today's menu!</p>
                  <button onClick={() => navigate('/menu_management')} className="mt-5 bg-orange-500 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-orange-600 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                    Add Menu Now
                  </button>
                </div>
              )}
            </div>

            {/* Quick Actions Grid */}
            <h3 className="font-bold text-slate-800 text-lg px-2">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-4">
              <ActionCard icon={<Users size={22} />} label="Add Student" color="text-blue-600" bg="bg-blue-50" onClick={() => navigate('/CustomerDirectory')} />
              <ActionCard icon={<Megaphone size={22} />} label="Announce" color="text-purple-600" bg="bg-purple-50" onClick={() => navigate('/menu_management')} />
              <ActionCard icon={<Store size={22} />} label="Homemade" color="text-emerald-600" bg="bg-emerald-50" onClick={() => navigate('/Add')} />
              <ActionCard icon={<ShoppingBag size={22} />} label="Orders" color="text-teal-600" bg="bg-teal-50" onClick={() => navigate('/homemade-orders')} />
              
              <button onClick={() => navigate('/students')} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-orange-300 hover:-translate-y-1 transition-all group flex flex-col items-center gap-3 relative">
                <span className="absolute top-3 right-3 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </span>
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><UserPlus size={22} /></div>
                <span className="text-sm font-bold text-slate-700">Requests</span>
              </button>
              
              <ActionCard icon={<Calendar size={22} />} label="Mark Leave" color="text-red-600" bg="bg-red-50" onClick={() => navigate("/Leave_manegment")} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Extracted Helper Components for cleaner code
const StatsCard = ({ title, value, subtext, icon, color }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md hover:border-orange-200 hover:-translate-y-1 transition-all duration-300">
    <div>
      <p className="text-slate-500 text-sm font-semibold mb-1">{title}</p>
      <h3 className="text-3xl font-extrabold text-slate-900">{value}</h3>
      {subtext && <p className="text-xs text-slate-400 mt-1 font-medium">{subtext}</p>}
    </div>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>{icon}</div>    
  </div> 
); 

const ActionCard = ({ icon, label, color, bg, onClick }) => (
  <button 
    onClick={onClick} 
    className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-orange-300 hover:-translate-y-1 transition-all group flex flex-col items-center gap-3 text-center"
  >
    <div className={`w-12 h-12 ${bg} ${color} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shrink-0`}>
      {icon}
    </div>
    <span className="text-sm font-bold text-slate-700 leading-tight">{label}</span>
  </button>
);

export default VendorDashboard;

