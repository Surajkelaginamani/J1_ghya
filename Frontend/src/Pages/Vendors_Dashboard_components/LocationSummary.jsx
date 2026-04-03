import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, MapPin, Package, Navigation,
  ChevronDown, ChevronUp, Leaf, Drumstick, Loader
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LocationSummary = () => {
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [deliveredLocations, setDeliveredLocations] = useState([]);
  const [totalDeliveriesToday, setTotalDeliveriesToday] = useState(0);
  const [holidayInfo, setHolidayInfo] = useState({ isVendorHoliday: false, reason: '' });
  const [sessionData, setSessionData] = useState({
    morning: { totalDeliveries: 0, groupedList: {} },
    afternoon: { totalDeliveries: 0, groupedList: {} }
  });
  const [deliveredSessionData, setDeliveredSessionData] = useState({
    morning: { totalDeliveries: 0, groupedList: {} },
    afternoon: { totalDeliveries: 0, groupedList: {} }
  });
  const [activeMealSession, setActiveMealSession] = useState('morning');
  const [isLoading, setIsLoading] = useState(true);
  const [markingDeliveryId, setMarkingDeliveryId] = useState('');
  const [resettingDeliveries, setResettingDeliveries] = useState(false);

  const normalizeStudents = (students) => {
    if (Array.isArray(students)) return students;
    if (!students || typeof students !== 'object') return [];
    if (students.customerName || students.subscriptionId) return [students];
    if (Array.isArray(students.students)) return students.students;
    if (Array.isArray(students.entries)) return students.entries;
    if (Array.isArray(students.items)) return students.items;

    return Object.values(students).flatMap((entry) => {
      if (Array.isArray(entry)) return entry;
      if (entry && typeof entry === 'object') {
        if (entry.customerName || entry.subscriptionId) return [entry];
        if (Array.isArray(entry.students)) return entry.students;
        if (Array.isArray(entry.entries)) return entry.entries;
        if (Array.isArray(entry.items)) return entry.items;
      }
      return [];
    });
  };

  const getStudentCount = (students, studentList) => {
    if (Array.isArray(students)) return students.length;
    if (!students || typeof students !== 'object') return studentList.length;
    if (typeof students.totalCount === 'number') return students.totalCount;
    if (typeof students.count === 'number') return students.count;
    if (typeof students.totalDeliveries === 'number') return students.totalDeliveries;
    return studentList.length;
  };

  const buildLocations = (groupedList = {}) => Object.entries(groupedList).map(([locationName, students], index) => {
    const studentList = normalizeStudents(students);
    const totalTiffins = getStudentCount(students, studentList);
    let vegCount = 0;
    let nonVegCount = 0;
    studentList.forEach((s) => {
      if (s.mealType && s.mealType.toLowerCase().includes('non')) nonVegCount++;
      else vegCount++;
    });

    return {
      id: `${locationName}-${index}`,
      name: locationName,
      type: 'Delivery Area',
      totalTiffins,
      breakdown: { veg: vegCount, nonVeg: nonVegCount },
      isExpanded: false,
      students: studentList.map((s) => ({
        subscriptionId: s.subscriptionId,
        mealSlot: s.mealSlot,
        name: s.customerName,
        room: s.roomNumber || 'N/A',
        type: s.mealType || 'Veg',
        phone: s.phone
      }))
    };
  });

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      const response = await fetch('http://localhost:5000/api/vendor/deliveries/today', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const resolvedSession =
          data.currentSession === 'morning' || data.currentSession === 'afternoon'
            ? data.currentSession
            : activeMealSession;
        const selectedSessionPreview = (data.sessions && data.sessions[resolvedSession]) || { groupedList: {} };
        const firstLocationEntry = Object.entries(selectedSessionPreview.groupedList || {})[0];

        console.log('LocationSummary deliveries payload:', {
          currentSession: data.currentSession,
          resolvedSession,
          totalDeliveries: data.totalDeliveries,
          sessionTotals: {
            morning: data.sessions?.morning?.totalDeliveries,
            afternoon: data.sessions?.afternoon?.totalDeliveries
          },
          firstLocationEntry
        });
        console.log('LocationSummary first location name:', firstLocationEntry?.[0]);
        console.log('LocationSummary first location raw payload:', firstLocationEntry?.[1]);

        setTotalDeliveriesToday(data.totalDeliveries);
        setHolidayInfo({
          isVendorHoliday: Boolean(data.isVendorHoliday),
          reason: data.holidayReason || ''
        });
        setSessionData(data.sessions || {
          morning: { totalDeliveries: 0, groupedList: {} },
          afternoon: { totalDeliveries: 0, groupedList: {} }
        });
        setDeliveredSessionData(data.deliveredSessions || {
          morning: { totalDeliveries: 0, groupedList: {} },
          afternoon: { totalDeliveries: 0, groupedList: {} }
        });

        if (resolvedSession !== activeMealSession) {
          setActiveMealSession(resolvedSession);
        }

        const selectedSession = selectedSessionPreview;
        const selectedDeliveredSession = (data.deliveredSessions && data.deliveredSessions[resolvedSession]) || { groupedList: {} };
        setLocations(buildLocations(selectedSession.groupedList));
        setDeliveredLocations(buildLocations(selectedDeliveredSession.groupedList));
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [navigate, activeMealSession]);

  const toggleExpand = (id) => {
    setLocations(locations.map((loc) =>
      loc.id === id ? { ...loc, isExpanded: !loc.isExpanded } : loc
    ));
  };

  const toggleDeliveredExpand = (id) => {
    setDeliveredLocations(deliveredLocations.map((loc) =>
      loc.id === id ? { ...loc, isExpanded: !loc.isExpanded } : loc
    ));
  };

  const markDelivery = async (subscriptionId, mealSlot) => {
    const actionKey = `${subscriptionId}:${mealSlot || 'afternoon'}`;
    try {
      setMarkingDeliveryId(actionKey);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/vendor/deliveries/${subscriptionId}/mark-delivered`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ session: mealSlot || 'afternoon' })
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || 'Failed to mark delivery.');
        return;
      }
      fetchLocations();
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
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || 'Failed to reset deliveries.');
        return;
      }
      alert(data.message || 'Deliveries reset successfully.');
      fetchLocations();
    } catch (error) {
      console.error('Error resetting deliveries:', error);
      alert('Server error while resetting deliveries.');
    } finally {
      setResettingDeliveries(false);
    }
  };

  if (isLoading) {
    return <div className="flex flex-col items-center justify-center min-h-screen text-orange-600"><Loader className="animate-spin mb-4" size={48} /><p className="font-bold">Loading routes...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/Ven_Dashboard')}
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Location Summary</h1>
              <p className="text-gray-500 text-sm">Pack and route your deliveries</p>
            </div>
          </div>

          <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-xl font-bold flex items-center gap-2 border border-orange-200 w-full sm:w-auto justify-center">
            <Package size={20} />
            {totalDeliveriesToday} Total Tiffins
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveMealSession('morning')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${activeMealSession === 'morning' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}
              >
                Night ({sessionData.morning?.totalDeliveries || 0})
              </button>
              <button
                onClick={() => setActiveMealSession('afternoon')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${activeMealSession === 'afternoon' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}
              >
                Afternoon ({sessionData.afternoon?.totalDeliveries || 0})
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

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Pending Drop-offs</h2>
            <span className="text-xs font-semibold text-orange-700 bg-orange-100 border border-orange-200 px-2.5 py-1 rounded-full">
              {sessionData?.[activeMealSession]?.totalDeliveries || 0} pending
            </span>
          </div>

          {locations.length > 0 ? locations.map((loc) => (
            <div key={loc.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div
                onClick={() => toggleExpand(loc.id)}
                className="p-5 cursor-pointer hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{loc.name}</h2>
                    <p className="text-sm text-gray-500 font-medium">{loc.type}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 self-end md:self-auto">
                  <div className="flex gap-2">
                    {loc.breakdown.veg > 0 && (
                      <span className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded text-xs font-bold">
                        <Leaf size={12} /> {loc.breakdown.veg} Veg
                      </span>
                    )}
                    {loc.breakdown.nonVeg > 0 && (
                      <span className="flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded text-xs font-bold">
                        <Drumstick size={12} /> {loc.breakdown.nonVeg} Non-Veg
                      </span>
                    )}
                  </div>

                  <div className="text-right flex items-center gap-3 border-l border-gray-200 pl-4">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Drop-offs</p>
                      <p className="text-2xl font-black text-gray-900">{loc.totalTiffins}</p>
                    </div>
                    {loc.isExpanded ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                  </div>
                </div>
              </div>

              {loc.isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-700">Detailed Packing List</h3>
                    <button className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                      <Navigation size={14} /> Navigate
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {loc.students.map((student, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center group">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{student.room}</p>
                          <p className="text-xs text-gray-500">{student.name}</p>
                          <button
                            onClick={() => markDelivery(student.subscriptionId, student.mealSlot)}
                            disabled={markingDeliveryId === `${student.subscriptionId}:${student.mealSlot || 'afternoon'}`}
                            className="mt-1 text-[10px] font-bold px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                          >
                            {markingDeliveryId === `${student.subscriptionId}:${student.mealSlot || 'afternoon'}` ? 'Marking...' : 'Mark Delivered'}
                          </button>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                          student.type.toLowerCase().includes('non')
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {student.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Deliveries Today</h2>
              <p className="text-gray-500 text-sm">
                {holidayInfo.isVendorHoliday
                  ? `Vendor holiday: ${holidayInfo.reason || 'No reason provided'}. Drop-offs reduced to 0.`
                  : 'Everyone must be on holiday!'}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Delivered</h2>
            <span className="text-xs font-semibold text-green-700 bg-green-100 border border-green-200 px-2.5 py-1 rounded-full">
              {deliveredSessionData?.[activeMealSession]?.totalDeliveries || 0} delivered
            </span>
          </div>

          {deliveredLocations.length > 0 ? deliveredLocations.map((loc) => (
            <div key={loc.id} className="bg-white rounded-2xl border border-green-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div
                onClick={() => toggleDeliveredExpand(loc.id)}
                className="p-5 cursor-pointer hover:bg-green-50/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{loc.name}</h2>
                    <p className="text-sm text-gray-500 font-medium">Delivered meals</p>
                  </div>
                </div>

                <div className="text-right flex items-center gap-3 border-l border-gray-200 pl-4 self-end md:self-auto">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Delivered</p>
                    <p className="text-2xl font-black text-green-700">{loc.totalTiffins}</p>
                  </div>
                  {loc.isExpanded ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                </div>
              </div>

              {loc.isExpanded && (
                <div className="border-t border-green-100 bg-green-50/30 p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {loc.students.map((student, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg border border-green-200 shadow-sm flex justify-between items-center">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{student.room}</p>
                          <p className="text-xs text-gray-500">{student.name}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider bg-green-100 text-green-800">
                          Delivered
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center text-sm text-gray-500">
              No delivered meals in this session yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationSummary;
