import React, { useState } from 'react';
import { User, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CoustomerForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // 1. Add State to capture inputs (MATCHING YOUR MONGOOSE SCHEMA EXACTLY)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',     // e.g., Hostel A
    roomNumber: '',   // NEW: e.g., Room 104
    password: '',
    confirmPassword: ''
  });

  // 2. Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Handle Form Submission to Backend
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setIsLoading(true);

    try {
      // Send data to Node.js backend
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          roomNumber: formData.roomNumber, // Send room number to backend
          password: formData.password,
          role: 'customer' 
        })
      });

      const data = await response.json();

      // FIXED LOGIC: Only navigate IF response is actually ok
      if (response.ok) {
        // Save the JWT token to local storage so they stay logged in
        localStorage.setItem('token', data.token);
        navigate("/dashboard"); 
      } else {
        alert(data.message || data.error || "Registration failed");
      }
    } catch (error) {
      console.error("Error connecting to backend:", error);
      alert("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center py-12 px-4 font-sans text-gray-900">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl p-8 md:p-10 relative">
        <button onClick={() => navigate("/sign_up")} className="absolute top-8 left-8 text-gray-500 hover:text-gray-900 flex items-center gap-2 text-sm font-medium transition-colors">
          <ArrowLeft size={18} /> Back
        </button>

        <div className="mt-8 text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-4 shadow-inner">
            <User size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Registration</h1>
          <p className="text-gray-500 text-sm mt-1">Create your account to start ordering delicious meals</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-sm font-bold text-gray-700">Full Name <span className="text-red-500">*</span></label>
              <input type="text" name="name" onChange={handleChange} required placeholder="Enter your full name" className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow" />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700">Email Address <span className="text-red-500">*</span></label>
              <input type="email" name="email" onChange={handleChange} required placeholder="you@example.com" className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow" />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700">Mobile Number <span className="text-red-500">*</span></label>
              <input type="tel" name="phone" onChange={handleChange} required placeholder="e.g., 9876543210" className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow" />
            </div>

            {/* Location / Hostel */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700">Hostel / Building Name <span className="text-red-500">*</span></label>
              <input type="text" name="location" onChange={handleChange} required placeholder="e.g., Boys Hostel A" className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow" />
            </div>

            {/* Room Number */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700">Room Number <span className="text-red-500">*</span></label>
              <input type="text" name="roomNumber" onChange={handleChange} required placeholder="e.g., Room 104" className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow" />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700">Password <span className="text-red-500">*</span></label>
              <input type="password" name="password" onChange={handleChange} required placeholder="Minimum 6 characters" className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow" />
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-gray-700">Confirm Password <span className="text-red-500">*</span></label>
              <input type="password" name="confirmPassword" onChange={handleChange} required placeholder="Re-enter your password" className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[#EA580C] hover:bg-orange-700 text-white font-bold py-3.5 rounded-lg transition-colors shadow-lg shadow-orange-200 mt-6 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <><Loader2 className="animate-spin" size={20} /> Creating Account...</> : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-gray-500 text-sm">
            Already have an account? <span onClick={() => navigate("/login")} className="text-orange-600 font-bold hover:underline cursor-pointer">Sign in</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoustomerForm;