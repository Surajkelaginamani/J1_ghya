import React, { useState } from 'react';
import { Store, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VendorForm = () => {
  const navigate = useNavigate();

  // 1. Add State to capture all vendor inputs
  const [formData, setFormData] = useState({
    businessName: '',
    name: '',
    phone: '',
    email: '',
    serviceType: '',
    serviceArea: '',
    foodType: '',
    deliveryType: '',
    monthlyFee: '',
    halfTiffinMonthlyPrice: '',
    singleTiffinPrice: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  });

  // 2. Handle input changes dynamically
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  // 3. Handle Form Submission to Backend
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents the page from refreshing
    
    // Validations
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (!formData.termsAccepted) {
      alert("Please agree to the Terms and Conditions.");
      return;
    }

    try {
      // Send data to Node.js backend
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'vendor', // Explicitly tell backend this is a vendor
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          // Vendor-specific details
          businessName: formData.businessName,
          serviceArea: formData.serviceArea,
          serviceType: formData.serviceType,
          foodType: formData.foodType,
          deliveryType: formData.deliveryType,
          monthlyFee: Number(formData.monthlyFee),
          halfTiffinMonthlyPrice: Number(formData.halfTiffinMonthlyPrice),
          singleTiffinPrice: Number(formData.singleTiffinPrice)
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Vendor Registration Successful! Welcome to MealMitra.");
        localStorage.setItem('token', data.token); // Save their session
        navigate("/Ven_Dashboard"); // Navigate to their new dashboard
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Error connecting to backend:", error);
      alert("Server error. Please make sure your Node backend is running.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F0FDF4] flex items-center justify-center py-12 px-4 font-sans text-gray-900">
      
      {/* Registration Card */}
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl p-8 md:p-10 relative">
        
        {/* Back Link */}
        <button onClick={() => navigate("/sign_up")} className="absolute top-8 left-8 text-gray-500 hover:text-gray-900 flex items-center gap-2 text-sm font-medium transition-colors">
          <ArrowLeft size={18} />
          Back to role selection
        </button>

        {/* Header Section */}
        <div className="mt-10 text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
            <Store size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Registration</h1>
          <p className="text-gray-500 text-sm mt-1">Join MealMitra to grow your food business</p>
        </div>

        {/* Form Section - Wired to handleSubmit */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Vendor Name / Business Name <span className="text-red-500">*</span></label>
            <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} required placeholder="Enter your business name" className="w-full bg-gray-50 border border-transparent px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Contact Person Name <span className="text-red-500">*</span></label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Your full name" className="w-full bg-gray-50 border border-transparent px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Mobile Number <span className="text-red-500">*</span></label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+91 9876543210" className="w-full bg-gray-50 border border-transparent px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Email <span className="text-red-500">*</span></label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="business@example.com" className="w-full bg-gray-50 border border-transparent px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Service Type <span className="text-red-500">*</span></label>
            <select name="serviceType" value={formData.serviceType} onChange={handleChange} required className="w-full bg-gray-50 border border-transparent px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all cursor-pointer">
              <option value="" disabled>Select service type</option>
              <option value="tiffin">Daily Tiffin Service</option>
              <option value="products">Homemade Products (Pickles, etc.)</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Service Area / Location <span className="text-red-500">*</span></label>
            <input type="text" name="serviceArea" value={formData.serviceArea} onChange={handleChange} required placeholder="Enter your service area" className="w-full bg-gray-50 border border-transparent px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Food Type <span className="text-red-500">*</span></label>
            <select name="foodType" value={formData.foodType} onChange={handleChange} required className="w-full bg-gray-50 border border-transparent px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all cursor-pointer">
              <option value="" disabled>Select food type</option>
              <option value="veg">Pure Veg</option>
              <option value="nonveg">Non-Veg Only</option>
              <option value="mix">Veg & Non-Veg</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Delivery Type <span className="text-red-500">*</span></label>
            <select name="deliveryType" value={formData.deliveryType} onChange={handleChange} required className="w-full bg-gray-50 border border-transparent px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all cursor-pointer">
              <option value="" disabled>Select delivery type</option>
              <option value="delivery">Home Delivery Only</option>
              <option value="pickup">Pickup Only</option>
              <option value="both">Delivery & Pickup</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Monthly Full Tiffin Fee (Rs.) <span className="text-red-500">*</span></label>
            <input type="number" min="0" step="1" name="monthlyFee" value={formData.monthlyFee} onChange={handleChange} required placeholder="e.g. 3000" className="w-full bg-gray-50 border border-transparent px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Half Tiffin Monthly Price (Rs.) <span className="text-red-500">*</span></label>
            <input type="number" min="0" step="1" name="halfTiffinMonthlyPrice" value={formData.halfTiffinMonthlyPrice} onChange={handleChange} required placeholder="e.g. 1800" className="w-full bg-gray-50 border border-transparent px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Single Tiffin Price (Today Only) (Rs.) <span className="text-red-500">*</span></label>
            <input type="number" min="0" step="1" name="singleTiffinPrice" value={formData.singleTiffinPrice} onChange={handleChange} required placeholder="e.g. 120" className="w-full bg-gray-50 border border-transparent px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Password <span className="text-red-500">*</span></label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Minimum 6 characters" className="w-full bg-gray-50 border border-transparent px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">Confirm Password <span className="text-red-500">*</span></label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="Re-enter your password" className="w-full bg-gray-50 border border-transparent px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all" />
          </div>

          <div className="flex items-start gap-3 pt-2">
            <div className="flex items-center h-5">
              <input id="terms" type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2 cursor-pointer" />
            </div>
            <label htmlFor="terms" className="text-sm text-gray-600">
              I agree to the <a href="#" className="text-green-600 hover:underline font-medium">Terms and Conditions</a> and <a href="#" className="text-green-600 hover:underline font-medium">Privacy Policy</a>
            </label>
          </div>
                                           
          {/* Submit Button */}         
          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-lg transition-colors shadow-lg shadow-green-200 mt-6">
            Create Vendor Account              
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Already have an account?{' '}
            {/* Fixed invalid <h1> tag inside <p> */}
            <span onClick={() => navigate("/login")} className="text-green-600 font-bold hover:underline cursor-pointer">
              Sign in
            </span>
          </p>
        </div>

      </div>
    </div>
  )
}

export default VendorForm;
