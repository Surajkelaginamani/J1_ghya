import React, { useState, useEffect } from 'react';
import { 
  Store, User as UserIcon, Mail, Phone, MapPin, Package, 
  IndianRupee, LogOut, Save, ArrowLeft, Loader2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VendorProfilePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // --- FORM STATE (Matches exactly what your backend sends) ---
  const [formData, setFormData] = useState({
    name: '',
    email: '', 
    phone: '',
    businessName: '',
    serviceArea: '',
    serviceType: '',
    foodType: '',
    deliveryType: '',
    monthlyFee: '',
    halfTiffinMonthlyPrice: '',
    singleTiffinPrice: ''
  });

  // --- 1. FETCH PROFILE DATA ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');

        const response = await fetch('http://localhost:5000/api/vendor/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setFormData(data);
        }
      } catch (error) {
        console.error("Error fetching vendor profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  // --- 2. HANDLE INPUT CHANGES ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // --- 3. SAVE PROFILE TO BACKEND ---
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/vendor/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        // We ensure numerical fields are actually sent as numbers
        body: JSON.stringify({
          ...formData,
          monthlyFee: Number(formData.monthlyFee),
          halfTiffinMonthlyPrice: Number(formData.halfTiffinMonthlyPrice),
          singleTiffinPrice: Number(formData.singleTiffinPrice)
        })
      });

      if (response.ok) {
        setMessage({ text: 'Business details updated successfully!', type: 'success' });
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll up to see the message
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
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

  if (isLoading) {
    return <div className="flex flex-col items-center justify-center min-h-screen text-green-600"><Loader2 className="animate-spin mb-4" size={48} /><p className="font-bold">Loading Kitchen Settings...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-20">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* --- Header --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/Ven_Dashboard')} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kitchen Settings</h1>
              <p className="text-gray-500 mt-1">Manage your business profile and pricing</p>
            </div>
          </div>
        </div>

        {/* Alert Message */}
        {message.text && (
          <div className={`p-4 rounded-xl font-bold shadow-sm flex items-center justify-between ${message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-8">
          
          {/* ================= SECTION 1: Business Identity ================= */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Store className="text-green-600" size={20} /> Business Identity
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-bold text-gray-700">Vendor / Business Name</label>
                <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Contact Person Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Mobile Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-bold text-gray-700">Email Address</label>
                <input type="email" value={formData.email} disabled className="w-full bg-gray-100 border border-gray-200 px-4 py-3 rounded-lg text-gray-500 cursor-not-allowed" />
                <p className="text-xs text-gray-400">Email address cannot be changed.</p>
              </div>
            </div>
          </div>

          {/* ================= SECTION 2: Service Details ================= */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MapPin className="text-green-600" size={20} /> Service Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-bold text-gray-700">Primary Service Area</label>
                <input type="text" name="serviceArea" value={formData.serviceArea} onChange={handleChange} required placeholder="e.g., Kothrud, Andheri West" className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Service Type</label>
                <select name="serviceType" value={formData.serviceType} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="tiffin">Daily Tiffin Service</option>
                  <option value="products">Homemade Products</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Food Type</label>
                <select name="foodType" value={formData.foodType} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="veg">Pure Veg</option>
                  <option value="nonveg">Non-Veg Only</option>
                  <option value="mix">Veg & Non-Veg</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Delivery Options</label>
                <select name="deliveryType" value={formData.deliveryType} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="delivery">Home Delivery Only</option>
                  <option value="pickup">Pickup Only</option>
                  <option value="both">Delivery & Pickup</option>
                </select>
              </div>
            </div>
          </div>

          {/* ================= SECTION 3: Pricing Strategy ================= */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <IndianRupee className="text-green-600" size={20} /> Pricing Strategy
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Monthly Full (₹)</label>
                <input type="number" name="monthlyFee" value={formData.monthlyFee} onChange={handleChange} required min="0" className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold text-gray-900" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Monthly Half (₹)</label>
                <input type="number" name="halfTiffinMonthlyPrice" value={formData.halfTiffinMonthlyPrice} onChange={handleChange} required min="0" className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold text-gray-900" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Single Trial (₹)</label>
                <input type="number" name="singleTiffinPrice" value={formData.singleTiffinPrice} onChange={handleChange} required min="0" className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold text-gray-900" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">Note: Changing these prices will only apply to NEW customers. Existing subscriptions will remain at their purchased price until they expire.</p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={isSaving} 
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-70"
            >
              {isSaving ? <><Loader2 size={20} className="animate-spin"/> Saving Updates...</> : <><Save size={20}/> Save All Changes</>}
            </button>
          </div>

        </form>

        {/* ================= SECTION 4: Danger Zone ================= */}
        <div className="bg-white border border-red-100 rounded-2xl p-6 md:p-8 shadow-sm mt-12">
          <h2 className="text-lg font-bold text-red-600 mb-4">Account Actions</h2>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-red-100 rounded-xl bg-red-50/50 gap-4">
            <div>
              <p className="font-bold text-gray-900 text-sm">Secure Logout</p>
              <p className="text-gray-500 text-xs mt-1">End your current session on this device. You will need to log in again to manage your kitchen.</p>
            </div>
            <button onClick={handleLogout} className="flex items-center justify-center gap-2 border border-red-200 bg-white text-red-600 px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors shadow-sm shrink-0">
              <LogOut size={18} /> Logout Now
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VendorProfilePage;