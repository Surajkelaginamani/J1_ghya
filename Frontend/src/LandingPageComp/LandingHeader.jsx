import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

const LandingHeader = () => {
  const navigate = useNavigate();
  
  return (
    <div>
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        {/* Logo Section */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="text-orange-600">
            {/* Lucide Shopping Bag Icon */}
            <ShoppingBag size={32} strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-bold text-orange-600 tracking-tight">
            MealMitra
          </span>
        </div>

        {/* Nav Buttons */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => {
              navigate("/login");
            }} 
            className="text-gray-900 font-medium hover:text-orange-600 transition"
          >
            Sign In
          </button>
          <button 
            onClick={() => {
              navigate("/sign_up");
            }} 
            className="bg-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition"
          >
            Get Started
          </button>
        </div>
      </nav>
    </div>
  );
};

export default LandingHeader;