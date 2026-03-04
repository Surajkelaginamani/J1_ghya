import { useState } from "react";
import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  
  // UI State for the toggle switch (Customer, Vendor, Admin)
  const [userType, setUserType] = useState('Customer');
  
  // Backend State for form inputs
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Form Submission to Backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        
        // --- ADDED LOGIC: Check if the selected tab matches their actual role ---
        // (We use .toLowerCase() because your toggle says "Customer" but the database says "customer")
        if (data.user.role !== userType.toLowerCase()) {
           alert(`Login failed: This email is registered as a ${data.user.role}, but you selected ${userType}. Please select the correct tab to log in.`);
           return; // Stop the login process right here!
        }
        // ------------------------------------------------------------------------

        // If it matches, save the JWT token and user data to local storage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Smart Navigation
        if (data.user.role === 'vendor') {
          navigate("/Ven_Dashboard");
        } else if (data.user.role === 'customer') {
          navigate("/dashboard"); 
        } else {
          navigate("/"); 
        }
      } else {
        alert(data.message || "Invalid credentials. Please try again.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Server error. Please make sure your Node backend is running.");
    }
  };

  return (
    <div>
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center px-4 font-sans text-gray-900">
        
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8 md:p-10">
          
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4 text-orange-600">
              <ShoppingBag strokeWidth={2.5} size={32} />
              <span className="text-2xl font-bold tracking-tight">MealMitra</span>
            </div>
            <h2 className="text-xl font-semibold text-black">Welcome Back</h2>
            <p className="text-gray-500 text-sm mt-1">
              Sign in to your account to continue
            </p>
          </div>

          {/* User Type Toggle */}
          <div className="bg-gray-100 p-1.5 rounded-full flex justify-between items-center mb-8">
            {['Customer', 'Vendor', 'Admin'].map((type) => (
              <button
                key={type}
                type="button" // Prevents the button from submitting the form
                onClick={() => setUserType(type)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
                  userType === type
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-900">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="w-full bg-gray-50 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:bg-white transition-all border border-transparent focus:border-orange-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-900">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full bg-gray-50 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:bg-white transition-all border border-transparent focus:border-orange-300"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#EA580C] hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg shadow-orange-100"
            >
              Sign In as {userType}
            </button>
          </form>

          <div className="mt-6 text-center text-sm space-y-4">
            <p className="text-gray-500">
              Don't have an account?{' '}
              <span onClick={() => navigate("/sign_up")} className="text-orange-600 font-semibold hover:underline cursor-pointer">
                Sign up
              </span>
            </p> 
            <div>
              <span onClick={() => navigate("/")} className="text-gray-500 font-medium hover:text-gray-900 hover:underline transition-colors cursor-pointer">
                Back to Home
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;