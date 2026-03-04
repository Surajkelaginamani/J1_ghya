import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, MapPin, Calendar, Leaf, Drumstick, UserPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Students = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('requests');
  
  // --- NEW: DYNAMIC STATES ---
  const [requests, setRequests] = useState([]);
  const [activeStudents, setActiveStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- FETCH DATA ON LOAD ---
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/vendor/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Split the data into Pending and Active!
        const pending = data.filter(sub => sub.status === 'pending');
        const active = data.filter(sub => sub.status === 'active');
        
        setRequests(pending);
        setActiveStudents(active);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- HANDLE ACCEPT / DECLINE ---
  const handleStatusUpdate = async (subscriptionId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/vendor/update-request', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subscriptionId, status: newStatus })
      });

      if (response.ok) {
        // Refresh the lists to instantly move the card!
        fetchStudents();
        alert(`Request successfully ${newStatus === 'active' ? 'accepted' : 'declined'}!`);
      } else {
        alert("Failed to update request.");
      }
    } catch (error) {
      console.error("Error updating request:", error);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex justify-center items-center font-bold text-gray-500">Loading students...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* --- Header --- */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/Ven_Dashboard")} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
            <p className="text-gray-500 text-sm">Review requests and manage active customers</p>
          </div>
        </div>

        {/* --- Tabs --- */}
        <div className="flex p-1 bg-white border border-gray-200 rounded-xl w-fit shadow-sm">
          <button onClick={() => setActiveTab('requests')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'requests' ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:text-gray-700'}`}>
            <UserPlus size={18} /> New Requests
            {requests.length > 0 && (
              <span className="bg-orange-600 text-white text-[10px] px-2 py-0.5 rounded-full ml-1">{requests.length}</span>
            )}
          </button>
          <button onClick={() => setActiveTab('active')} className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'active' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}>
            <Users size={18} /> Active Students
          </button>
        </div>

        {/* --- TAB 1: NEW REQUESTS --- */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Pending Approvals</h2>
            
            {requests.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl border border-gray-200 text-center text-gray-500 shadow-sm">
                No new student requests at the moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {requests.map(request => (
                  <div key={request._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:border-orange-300 transition-all">
                    
                    <div className="p-5 border-b border-gray-100 flex justify-between items-start">
                      <div>
                        {/* Dynamically display the customer's real name! */}
                        <h3 className="text-lg font-bold text-gray-900 capitalize">{request.customer?.name || "Unknown"}</h3>
                        <p className="text-sm text-gray-500">₹{request.price}</p>
                      </div>
                      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${request.mealType === 'veg' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {request.mealType === 'veg' ? <Leaf size={12} /> : <Drumstick size={12} />}
                        <span className="capitalize">{request.mealType}</span>
                      </span>
                    </div>

                    <div className="p-5 space-y-3 bg-gray-50/50">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <MapPin size={16} className="text-gray-400" />
                        <span className="font-medium capitalize">{request.customer?.location || "No address provided"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <UserPlus size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-900 capitalize">{request.planType.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Calendar size={16} className="text-gray-400" />
                        <span>Requested: <span className="font-semibold text-gray-900">
                          {new Date(request.createdAt).toLocaleDateString('en-IN')}
                        </span></span>
                      </div>
                    </div>

                    <div className="p-4 grid grid-cols-2 gap-3 border-t border-gray-100">
                      <button onClick={() => handleStatusUpdate(request._id, 'cancelled')} className="flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all">
                        <X size={18} /> Decline
                      </button>
                      <button onClick={() => handleStatusUpdate(request._id, 'active')} className="flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 shadow-md transition-all">
                        <Check size={18} /> Accept
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TAB 2: ACTIVE STUDENTS --- */}
        {activeTab === 'active' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Active Students ({activeStudents.length})</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {activeStudents.map(student => (
                <div key={student._id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <h3 className="font-bold text-gray-900 capitalize">{student.customer?.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{student.customer?.location}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-bold text-gray-900 capitalize">{student.planType.replace('_', ' ')}</span>
                    <span className="text-xs text-gray-500 capitalize">{student.mealType}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Students;