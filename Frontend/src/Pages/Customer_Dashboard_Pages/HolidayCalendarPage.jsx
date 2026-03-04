import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Info, AlertCircle, Save, ChefHat } from 'lucide-react';

const HolidayCalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date()); 
  
  // --- NEW MULTI-SUBSCRIPTION STATES ---
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeSubscriptionId, setActiveSubscriptionId] = useState("");
  const [holidays, setHolidays] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const normalizeDateKey = (value) => {
    if (!value) return null;
    if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      const isoMatch = value.match(/^(\d{4}-\d{2}-\d{2})T/);
      if (isoMatch) return isoMatch[1];
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // --- 1. FETCH ALL ACTIVE SUBSCRIPTIONS ON LOAD ---
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const token = localStorage.getItem('token');
        // Fetch ALL subscriptions instead of just the dashboard summary
        const response = await fetch('http://localhost:5000/api/customer/subscriptions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Filter to only show 'active' subscriptions
          const activeSubs = data.filter(sub => sub.status === 'active');
          setSubscriptions(activeSubs);
          
          if (activeSubs.length > 0) {
            setActiveSubscriptionId(activeSubs[0]._id); // Default to the first one
          }
        }
      } catch (error) {
        console.error("Failed to fetch subscriptions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubscriptions();
  }, []);

  // --- 2. UPDATE CALENDAR WHEN DROPDOWN CHANGES ---
  useEffect(() => {
    if (!activeSubscriptionId) return;
    
    // Find the currently selected subscription
    const selectedSub = subscriptions.find(sub => sub._id === activeSubscriptionId);
    
    if (selectedSub) {
      const normalized = (selectedSub.skippedDates || [])
        .map(normalizeDateKey)
        .filter(Boolean);
      setHolidays([...new Set(normalized)].sort());
    }
  }, [activeSubscriptionId, subscriptions]);

  // --- HELPER FUNCTIONS ---
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const formatDateKey = (day) => `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const parseDateKeyAsLocal = (dateKey) => {
    const [year, month, day] = String(dateKey).split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  const isHoliday = (day) => holidays.includes(formatDateKey(day));

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // --- 3. LEAVE MARKING LOGIC (today or future only) ---
  const toggleHoliday = async (day) => {
    if (!activeSubscriptionId) return alert("Please select a subscription first.");

    const dateKey = formatDateKey(day);
    const selectedDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (selectedDateObj.getTime() < todayStart.getTime()) {
      alert("Past dates cannot be marked as holiday.");
      return;
    }

    const updatedHolidays = holidays.includes(dateKey) 
      ? holidays.filter(h => h !== dateKey) 
      : [...holidays, dateKey].sort();
    
    setHolidays(updatedHolidays);
    saveHolidaysToBackend(updatedHolidays);
  };

  const removeHoliday = (dateString) => {
    const selectedDateObj = parseDateKeyAsLocal(dateString);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (selectedDateObj.getTime() < todayStart.getTime()) {
      alert("Past holiday entries cannot be modified.");
      return;
    }

    const updatedHolidays = holidays.filter(h => h !== dateString);
    setHolidays(updatedHolidays);
    saveHolidaysToBackend(updatedHolidays);
  };

  // --- 4. SAVE TO DATABASE ---
  const saveHolidaysToBackend = async (updatedHolidays) => {
    if (!activeSubscriptionId) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/customer/subscriptions/${activeSubscriptionId}/holidays`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ skippedDates: updatedHolidays })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || "Failed to save holidays");

      const savedDates = (result?.subscription?.skippedDates || updatedHolidays)
        .map(normalizeDateKey)
        .filter(Boolean)
        .sort();
      setHolidays(savedDates);
      if (Array.isArray(result?.ignoredDates) && result.ignoredDates.length > 0) {
        alert("Some past dates were not saved.");
      }

      // Update local state so if they switch dropdowns and come back, the data is preserved
      setSubscriptions(prev => prev.map(sub => 
        sub._id === activeSubscriptionId ? { ...sub, skippedDates: savedDates } : sub
      ));

    } catch (error) {
      alert("Failed to save holiday. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500 font-bold">Loading Calendar...</div>;

  const currentYear = currentDate.getFullYear();
  const paddingDays = Array.from({ length: getFirstDayOfMonth(currentDate) });
  const daysArray = Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => i + 1);
  const holidaysInCurrentMonth = holidays.filter(h => h.startsWith(`${currentYear}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`)).length;

  return (
    <>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Holiday Calendar</h1>
          <p className="text-gray-500 mt-1">Mark your leave days to automatically extend your subscription</p>
        </div>
        {isSaving && <span className="text-sm text-orange-600 font-bold flex items-center gap-2"><Save size={16} className="animate-pulse" /> Saving...</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ================= LEFT COLUMN ================= */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* --- NEW: SUBSCRIPTION SELECTOR DROPDOWN --- */}
          {subscriptions.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <ChefHat size={18} className="text-orange-500"/> Select Service to Manage
              </label>
              <select 
                value={activeSubscriptionId}
                onChange={(e) => setActiveSubscriptionId(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-medium text-gray-800"
              >
                {subscriptions.map(sub => (
                  <option key={sub._id} value={sub._id}>
                    {sub.vendor?.businessName} ({sub.mealType} - {sub.planType.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl text-sm font-semibold">
              You do not have any active subscriptions to mark holidays for.
            </div>
          )}

          {/* Calendar Card */}
          <div className={`bg-white border border-gray-200 rounded-xl p-8 shadow-sm ${subscriptions.length === 0 && 'opacity-50 pointer-events-none'}`}>
            <h3 className="font-bold text-gray-900 mb-6">Select Holiday Dates</h3>
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-6">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft size={20} className="text-gray-500" /></button>
                <h4 className="font-bold text-lg text-gray-900">{["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][currentDate.getMonth()]} {currentYear}</h4>
                <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight size={20} className="text-gray-500" /></button>
              </div>

              <div className="grid grid-cols-7 text-center mb-4">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 text-center gap-y-4">
                {paddingDays.map((_, index) => <div key={`padding-${index}`} />)}
                {daysArray.map(day => (
                  <button 
                    key={day} onClick={() => toggleHoliday(day)}
                    className={`text-sm w-8 h-8 mx-auto flex items-center justify-center rounded-full transition-colors ${isHoliday(day) ? 'bg-[#EA580C] text-white shadow-md shadow-orange-200 font-semibold' : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* ================= RIGHT COLUMN (Summary Cards) ================= */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-6">Upcoming Holidays</h3>
            <div className="space-y-6">
              {holidays.slice(0, 5).map(date => (
                <HolidayItem key={date} date={new Date(date).toDateString()} name="Meal Skipped" onRemove={() => removeHoliday(date)} />
              ))}
              {holidays.length === 0 && <p className="text-gray-400 text-sm">No upcoming holidays for this service.</p>}
            </div>
          </div>

          <div className="bg-[#FFF7ED] border border-orange-100 rounded-xl p-5 flex items-start gap-3">
            <AlertCircle className="text-orange-600 shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="font-bold text-orange-800 text-sm mb-1">Important</h4>
              <p className="text-orange-700 text-xs leading-relaxed">
                Once a meal is prepared by the vendor (within 24 hours), it cannot be skipped.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const HolidayItem = ({ date, name, onRemove }) => (
  <div className="flex items-center justify-between group">
    <div>
      <p className="font-bold text-gray-900 text-sm">{date}</p>
      <p className="text-gray-500 text-xs">{name}</p>
    </div>
    <button onClick={onRemove} className="text-red-500 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity hover:underline">Remove</button>
  </div>
);

export default HolidayCalendarPage;
