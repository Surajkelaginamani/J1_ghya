import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, Store, FileText, CheckCircle, 
  XCircle, Phone, Mail, MapPin, AlertTriangle, ChevronRight,
  Search, Activity, UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  // --- REAL DATA STATES ---
  const [pendingVendors, setPendingVendors] = useState([]);
  const [activeVendors, setActiveVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const handleAdminFormChange = (e) => {
    setAdminForm({ ...adminForm, [e.target.name]: e.target.value });
  };

  // --- FETCH PENDING & ACTIVE VENDORS ---
  const fetchVendors = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');

      const [pendingResponse, approvedResponse] = await Promise.all([
        fetch('http://localhost:5000/api/auth/pending-vendors', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/auth/approved-vendors', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingVendors(pendingData.vendors);
      } else if (pendingResponse.status === 403) {
        setFetchError('You need admin rights to view pending vendor requests.');
        setPendingVendors([]);
      } else {
        console.error('Failed to fetch pending vendors');
        setPendingVendors([]);
      }

      if (approvedResponse.ok) {
        const approvedData = await approvedResponse.json();
        setActiveVendors(approvedData.vendors.map(v => ({ ...v, students: Math.floor(Math.random() * 350 + 15) })));
      } else {
        console.error('Failed to fetch approved vendors');
        setActiveVendors([]);
      }

    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();

    // Auto refresh pending and approved vendor lists in case new vendor requests arrive
    const intervalId = setInterval(fetchVendors, 15000); // every 15 seconds
    return () => clearInterval(intervalId);
  }, []);


  // Handle Create Admin
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(adminForm)
      });

      const data = await response.json();

      if (response.ok) {
        alert(`SUCCESS: Admin ${adminForm.name} created successfully!`);
        setAdminForm({ name: '', email: '', password: '', phone: '' });
        setShowCreateAdmin(false);
      } else {
        alert(data.message || 'Failed to create admin');
      }
    } catch (error) {
      console.error('Create Admin Error:', error);
      alert('Server error. Please try again.');
    }
  };

  // --- HANDLE ADMIN VENDOR APPROVE ---
  const handleApprove = async (vendor) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/approve-vendor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vendorId: vendor.id,
          action: 'approve'
        })
      });

      if (response.ok) {
        await fetchVendors();
        alert(`SUCCESS: ${vendor.businessName} has been approved! Their Vendor Dashboard is now unlocked.`);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to approve vendor');
      }
    } catch (error) {
      console.error('Approve Vendor Error:', error);
      alert('Server error. Please try again.');
    }
  };

  const handleReject = async (vendorId) => {
    const rejectionReason = prompt('Please provide a reason for rejection (optional):');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/approve-vendor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vendorId: vendorId,
          action: 'reject',
          rejectionReason: rejectionReason
        })
      });

      if (response.ok) {
        await fetchVendors();
        alert('Vendor application has been rejected.');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to reject vendor');
      }
    } catch (error) {
      console.error('Reject Vendor Error:', error);
      alert('Server error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* --- TOP NAVIGATION BAR --- */}
      <nav className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ShieldCheck size={28} className="text-emerald-400" />
            <span className="text-xl font-bold tracking-wide">MealMitra Admin Command</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-300 text-sm font-medium">Superadmin Session</span>
            <button onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              navigate('/');
            }} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 space-y-8 mt-4">
          {fetchError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {fetchError}
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={fetchVendors}
              className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
            >
              Refresh queue
            </button>
          </div>
        {/* --- STATS OVERVIEW --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="Pending Approvals" value={pendingVendors.length} icon={<AlertTriangle size={24} className="text-amber-500" />} color="bg-amber-50" textColor="text-amber-600" />
          <StatCard title="Total Active Vendors" value={activeVendors.length} icon={<Store size={24} className="text-emerald-500" />} color="bg-emerald-50" textColor="text-emerald-600" />
          <StatCard title="Total Students" value="482" icon={<Users size={24} className="text-blue-500" />} color="bg-blue-50" textColor="text-blue-600" />
          <StatCard title="System Status" value="Online" icon={<Activity size={24} className="text-indigo-500" />} color="bg-indigo-50" textColor="text-indigo-600" />
        </div>

        {/* --- CREATE ADMIN BUTTON --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Admin Management</h2>
              <p className="text-sm text-slate-500">Create additional admin accounts for system management.</p>
            </div>
            <button 
              onClick={() => setShowCreateAdmin(true)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm transition-colors"
            >
              <UserPlus size={18} /> Create Admin
            </button>
          </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            <button onClick={() => setActiveTab('pending')} className={`flex items-center gap-2 px-8 py-4 font-bold text-sm transition-all ${activeTab === 'pending' ? 'bg-white text-slate-900 border-t-2 border-t-amber-500 shadow-[0_1px_0_0_white]' : 'text-slate-500 hover:text-slate-700'}`}>
              <FileText size={18} /> Verification Queue
              {pendingVendors.length > 0 && (
                <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full ml-1">{pendingVendors.length}</span>
              )}
            </button>
            <button onClick={() => setActiveTab('active')} className={`flex items-center gap-2 px-8 py-4 font-bold text-sm transition-all ${activeTab === 'active' ? 'bg-white text-slate-900 border-t-2 border-t-emerald-500 shadow-[0_1px_0_0_white]' : 'text-slate-500 hover:text-slate-700'}`}>
              <Store size={18} /> Active Vendors
            </button>
          </div>

          {/* TAB 1: PENDING VERIFICATIONS */}
          {activeTab === 'pending' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">New Vendor Registrations</h2>
                  <p className="text-sm text-slate-500">Contact the vendor and verify documents before approving.</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="Search applications..." className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                </div>
              </div>

              {pendingVendors.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CheckCircle size={48} className="mx-auto mb-4 text-emerald-400 opacity-50" />
                  <p className="text-lg font-medium text-slate-600">All caught up!</p>
                  <p className="text-sm">No pending vendor applications to review.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingVendors.map(vendor => (
                    <div key={vendor.id} className="border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors bg-white">
                      <div className="flex flex-col lg:flex-row justify-between gap-6">
                        
                        {/* Vendor Info Section */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-slate-900">{vendor.businessName}</h3>
                            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                              {vendor.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                              <p className="text-sm flex items-center gap-2 text-slate-600"><Users size={16} className="text-slate-400"/> Owner: <span className="font-semibold text-slate-900">{vendor.ownerName}</span></p>
                              <p className="text-sm flex items-center gap-2 text-slate-600"><Phone size={16} className="text-slate-400"/> {vendor.phone}</p>
                              <p className="text-sm flex items-center gap-2 text-slate-600"><Mail size={16} className="text-slate-400"/> {vendor.email}</p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm flex items-center gap-2 text-slate-600"><MapPin size={16} className="text-slate-400"/> {vendor.location}</p>
                              <p className="text-sm flex items-center gap-2 text-slate-600"><Store size={16} className="text-slate-400"/> Food: <span className="font-semibold">{vendor.foodType}</span></p>
                              <p className="text-sm flex items-center gap-2 text-slate-600"><FileText size={16} className="text-slate-400"/> Applied: {vendor.appliedDate}</p>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons Section */}
                        <div className="flex flex-col justify-center gap-3 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 min-w-[200px]">
                          <button 
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-sm transition-colors"
                            onClick={() => alert(`Initiating call to ${vendor.phone}...`)}
                          >
                            <Phone size={16} /> Contact Vendor
                          </button>
                          
                          <div className="flex gap-2">
                            <button onClick={() => handleReject(vendor.id)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-bold transition-colors">
                              <XCircle size={16} /> Reject
                            </button>
                            <button onClick={() => handleApprove(vendor)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-colors">
                              <CheckCircle size={16} /> Approve
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACTIVE VENDORS */}
          {activeTab === 'active' && (
            <div className="p-6">
               <h2 className="text-lg font-bold text-slate-900 mb-6">Approved & Active Vendors</h2>
               <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                 <table className="w-full text-left text-sm text-slate-600">
                   <thead className="bg-slate-50 text-slate-900 font-bold uppercase text-xs">
                     <tr>
                       <th className="px-6 py-4">Business Name</th>
                       <th className="px-6 py-4">Owner</th>
                       <th className="px-6 py-4">Active Students</th>
                       <th className="px-6 py-4 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {activeVendors.map(v => (
                       <tr key={v.id} className="hover:bg-slate-50/50">
                         <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                            <Store size={16} className="text-slate-400" /> {v.businessName}
                         </td>
                         <td className="px-6 py-4">{v.ownerName}</td>
                         <td className="px-6 py-4">
                           <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-bold">{v.students}</span>
                         </td>
                         <td className="px-6 py-4 text-right">
                           <button className="text-slate-400 hover:text-slate-900 font-semibold flex items-center justify-end gap-1 ml-auto">
                             Manage <ChevronRight size={16} />
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

        </div>
      </div>

      {/* --- CREATE ADMIN MODAL --- */}
      {showCreateAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Create New Admin</h3>
              <button 
                onClick={() => setShowCreateAdmin(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={adminForm.name}
                  onChange={handleAdminFormChange}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Full Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={adminForm.email}
                  onChange={handleAdminFormChange}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="admin@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={adminForm.password}
                  onChange={handleAdminFormChange}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={adminForm.phone}
                  onChange={handleAdminFormChange}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="+91 98765 43210"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateAdmin(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors"
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Component for Stats
const StatCard = ({ title, value, icon, color, textColor }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-slate-500 text-sm font-semibold mb-1">{title}</p>
      <h3 className="text-3xl font-black text-slate-900">{value}</h3>
    </div>
    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${color} ${textColor}`}>
      {icon}
    </div>
  </div>
);

export default AdminDashboard;