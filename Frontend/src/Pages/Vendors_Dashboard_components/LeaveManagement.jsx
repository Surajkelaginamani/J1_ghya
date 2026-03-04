import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, CalendarOff, CalendarDays,
  Trash2, Plus, Info, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LeaveManagement = () => {
  const navigate = useNavigate();

  const [holidays, setHolidays] = useState([]);
  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parseApiResponse = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) return response.json();
    return { message: await response.text() };
  };

  const fetchHolidays = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/vendor/holidays', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await parseApiResponse(response);
      if (!response.ok) {
        console.error('Failed to fetch holidays:', data.message);
        return;
      }
      setHolidays(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching holidays:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const currentMonthLeaves = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return holidays.filter((h) => String(h.dateKey || '').startsWith(monthKey)).length;
  }, [holidays]);

  const getStatus = (dateKey) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(`${dateKey}T00:00:00`);
    return date < today ? 'Past' : 'Upcoming';
  };

  const handleMarkLeave = async (e) => {
    e.preventDefault();
    if (!newDate) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/vendor/holidays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ date: newDate, reason: newReason })
      });

      const data = await parseApiResponse(response);
      if (!response.ok) {
        alert(data.message || 'Failed to add holiday.');
        return;
      }

      alert(data.message || 'Holiday marked successfully.');
      setNewDate('');
      setNewReason('');
      fetchHolidays();
    } catch (error) {
      console.error('Error adding holiday:', error);
      alert('Server error while adding holiday.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (holidayId, status) => {
    if (status === 'Past') {
      alert('Past holidays cannot be removed.');
      return;
    }
    if (!window.confirm('Remove this holiday and rollback 1 day extension for active subscriptions?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/vendor/holidays/${holidayId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await parseApiResponse(response);
      if (!response.ok) {
        alert(data.message || 'Failed to delete holiday.');
        return;
      }

      alert(data.message || 'Holiday removed.');
      fetchHolidays();
    } catch (error) {
      console.error('Error deleting holiday:', error);
      alert('Server error while deleting holiday.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-gray-600">
        <Loader2 size={20} className="animate-spin" />
        Loading holiday data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/Ven_Dashboard')}
            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
            <p className="text-gray-500 text-sm">Mark holidays and extend active subscriptions by 1 day.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
              <CalendarOff size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Leaves This Month</p>
              <h2 className="text-3xl font-bold text-gray-900">{currentMonthLeaves} Days</h2>
            </div>
          </div>

          <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 flex items-start gap-3">
            <Info className="text-orange-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-bold text-orange-900 mb-1">Subscription Extension</h3>
              <p className="text-sm text-orange-800/80">
                Every vendor holiday adds 1 day to end-date of all active customer subscriptions.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Plus className="text-orange-600" size={20} />
                Mark a Holiday
              </h2>

              <form onSubmit={handleMarkLeave} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Select Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Reason (Optional)</label>
                  <input
                    type="text"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    placeholder="e.g., Kitchen Maintenance"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-60"
                  >
                    <CalendarOff size={18} />
                    {isSubmitting ? 'Saving...' : 'Confirm Holiday'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CalendarDays className="text-gray-500" size={20} />
                  Holiday Record
                </h2>
              </div>

              <div className="divide-y divide-gray-100">
                {holidays.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 font-medium">
                    No holidays recorded yet.
                  </div>
                ) : (
                  holidays.map((holiday) => {
                    const status = getStatus(holiday.dateKey);
                    return (
                      <div key={holiday._id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className={`mt-1 w-2 h-2 rounded-full ${status === 'Upcoming' ? 'bg-orange-500 animate-pulse' : 'bg-gray-300'}`} />
                          <div>
                            <p className="font-bold text-gray-900 text-lg">
                              {new Date(`${holiday.dateKey}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-sm text-gray-500">{holiday.reason || 'No reason provided'}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Extended subscriptions: {holiday.extendedSubscriptions || 0}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${status === 'Upcoming' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                            {status}
                          </span>

                          {status === 'Upcoming' && (
                            <button
                              onClick={() => handleDelete(holiday._id, status)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Cancel Holiday"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;
