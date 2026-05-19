import React, { useEffect, useMemo, useState } from 'react';
import { ChefHat, CalendarDays } from 'lucide-react';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const WeeklyMenusPage = () => {
  const [menus, setMenus] = useState([]);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [isLoading, setIsLoading] = useState(true);

  const todayDay = useMemo(() => days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1], []);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://meal-mitra-vhcd.onrender.com/api/customer/subscribed-weekly-menus', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setMenus(data.menus || []);
          setSelectedDay(todayDay);
        }
      } catch (error) {
        console.error('Error fetching weekly menus:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenus();
  }, [todayDay]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500 font-bold">Loading weekly menus...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Weekly Menus</h1>
          <p className="text-gray-500 mt-1">Menus from your subscribed vendors</p>
        </div>
        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
          Today: {todayDay}
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-3 flex flex-wrap gap-2">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
              selectedDay === day ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {menus.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <ChefHat size={34} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-700 font-bold">No active subscriptions found</p>
          <p className="text-gray-500 text-sm mt-1">Subscribe to a vendor to view weekly menu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {menus.map((entry) => {
            const dayMenu = entry.weeklyMenu?.[selectedDay] || { lunch: '', dinner: '' };
            return (
              <div key={entry.subscriptionId} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-gray-900 text-lg">{entry.vendorName}</h3>
                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                  <CalendarDays size={13} /> {selectedDay}
                </p>

                <div className="mt-4 space-y-3">
                  <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
                    <p className="text-[11px] font-bold uppercase text-orange-700 tracking-wide">Lunch</p>
                    <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{dayMenu.lunch || 'Menu not set'}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <p className="text-[11px] font-bold uppercase text-blue-700 tracking-wide">Dinner</p>
                    <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{dayMenu.dinner || 'Menu not set'}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WeeklyMenusPage;

