import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, Mail, Phone, MapPin, Home, Lock, Bell, CreditCard, 
  LogOut, HelpCircle, Save 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // --- FORM STATE MATCHING YOUR SCHEMA ---
  const [formData, setFormData] = useState({
    name: '',
    email: '', 
    phone: '',
    location: '',    // Changed from address
    roomNumber: ''   // Changed from foodPreferences
  });

  const [toggles, setToggles] = useState({
    orderUpdates: true,
    paymentReminders: true,
    promos: false,
  });

  // --- 1. FETCH PROFILE DATA ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');

        const response = await fetch('http://localhost:5000/api/customer/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setFormData({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            location: data.location || '',
            roomNumber: data.roomNumber || ''
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  // --- 2. HANDLE INPUT CHANGES ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleToggle = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // --- 3. SAVE PROFILE TO BACKEND ---
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/customer/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          location: formData.location,
          roomNumber: formData.roomNumber
        })
      });

      if (response.ok) {
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      } else {
        setMessage({ text: 'Failed to update profile.', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'An error occurred.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // --- 4. HANDLE LOGOUT ---
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen text-gray-500 font-bold">Loading Profile...</div>;

  return (
    <>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account and delivery details</p>
        </div>
        {message.text && (
          <span className={`text-sm font-bold px-4 py-2 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </span>
        )}
      </div>

      <div className="space-y-8 pb-10">
        
        {/* ================= SECTION 1: Personal Information ================= */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Personal & Delivery Info</h2>
          
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <UserIcon size={16} className="text-gray-400" /> Full Name
                </label>
                <input 
                  type="text" name="name"
                  value={formData.name} onChange={handleChange} required
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Phone size={16} className="text-gray-400" /> Phone Number
                </label>
                <input 
                  type="tel" name="phone"
                  value={formData.phone} onChange={handleChange} required
                  placeholder="e.g., 9876543210"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all"
                />
              </div>
              
              <div className="space-y-1.5 md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Mail size={16} className="text-gray-400" /> Email Address
                </label>
                <input 
                  type="email" name="email"
                  value={formData.email} disabled
                  className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400">Email addresses cannot be changed directly.</p>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <MapPin size={16} className="text-gray-400" /> Hostel / Building Name
                </label>
                <input 
                  type="text" name="location"
                  value={formData.location} onChange={handleChange}
                  placeholder="e.g., Boys Hostel A, Sanjivani"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Home size={16} className="text-gray-400" /> Room / Flat Number
                </label>
                <input 
                  type="text" name="roomNumber"
                  value={formData.roomNumber} onChange={handleChange}
                  placeholder="e.g., Room 104" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all"
                />
              </div>

            </div>

            <button type="submit" disabled={isSaving} className="mt-4 bg-[#EA580C] hover:bg-orange-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70">
              {isSaving ? <><Save size={18} className="animate-spin" /> Saving...</> : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* ================= SECTION 2: Danger Zone ================= */}
        <div className="bg-white border border-red-100 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-red-600 mb-6">Account Actions</h2>
          <div className="space-y-4">
            
            <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50">
              <div>
                <p className="font-bold text-gray-900 text-sm">Logout</p>
                <p className="text-gray-500 text-xs">Sign out from your device safely</p>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-2 border border-red-200 bg-white text-red-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors shadow-sm">
                <LogOut size={16} /> Logout
              </button>
            </div>

          </div>
        </div>

      </div>
    </>
  );
};

export default ProfilePage;