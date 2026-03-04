import React from 'react'
import { ShoppingBag, User, Store, ArrowRight } from 'lucide-react';
import { useNavigate  } from 'react-router-dom';
const Sign_up = () => {
    const navigate = useNavigate();

  return (
   <div className="min-h-screen bg-[#FFFBF5] flex flex-col items-center justify-center py-12 px-4 font-sans text-gray-900">
     
      {/* ================= Header Section ================= */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-2 mb-4 text-orange-600">
          <ShoppingBag strokeWidth={2.5} size={32} />
          <span className="text-2xl font-bold tracking-tight">MealMitra</span>
        </div>
        <h1 className="text-3xl font-bold text-black mb-2">Create Your Account</h1>
        <p className="text-gray-500">Choose how you want to use MealMitra</p>
      </div>

      {/* ================= Selection Cards ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
        
        {/* --- Card 1: Customer --- */}
        <div onClick={()=>{
            navigate("/customer_form")
        }} className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col items-center text-center hover:border-orange-500 hover:shadow-md transition-all cursor-pointer group">

          {/* Icon Circle */}
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-6">
            <User size={36} strokeWidth={2} />
          </div>

          {/* Titles */}
          <h2 className="text-xl font-bold mb-2">Register as Customer</h2>
          <p className="text-gray-500 text-sm mb-8 px-4">
            For users who want daily tiffin or homemade food
          </p>

          {/* Bullet List */}
          <div className="text-left w-full space-y-3 mb-8 px-2 md:px-8">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0"></div>
              <span className="text-gray-600 text-sm">Browse and subscribe to tiffin services</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0"></div>
              <span className="text-gray-600 text-sm">Order homemade products like pickles, papad</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0"></div>
              <span className="text-gray-600 text-sm">Manage subscriptions and holidays easily</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0"></div>
              <span className="text-gray-600 text-sm">Track orders and payments</span>
            </div>
          </div>

          {/* CTA Link */}
          <div className="mt-auto flex items-center gap-2 text-orange-600 font-semibold group-hover:gap-3 transition-all">
            Continue as Customer <ArrowRight size={18} />
          </div>
        </div>

        {/* --- Card 2: Vendor --- */}
        <div onClick={()=>{
            navigate("/vendor_form")
        }} className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col items-center text-center hover:border-green-500 hover:shadow-md transition-all cursor-pointer group">
          
          {/* Icon Circle */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
            <Store size={36} strokeWidth={2} />
          </div>

          {/* Titles */}
          <h2 className="text-xl font-bold mb-2">Register as Vendor</h2>
          <p className="text-gray-500 text-sm mb-8 px-4">
            For tiffin providers, home cooks, and small food sellers
          </p>

          {/* Bullet List */}
          <div className="text-left w-full space-y-3 mb-8 px-2 md:px-8">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></div>
              <span className="text-gray-600 text-sm">Reach customers looking for daily meals</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></div>
              <span className="text-gray-600 text-sm">Sell homemade food products</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></div>
              <span className="text-gray-600 text-sm">Manage orders and subscriptions</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></div>
              <span className="text-gray-600 text-sm">Grow your food business</span>
            </div>
          </div>

          {/* CTA Link */}
          <div className="mt-auto flex items-center gap-2 text-green-600 font-semibold group-hover:gap-3 transition-all">
            Continue as Vendor <ArrowRight size={18} />
          </div>
        </div>
      </div>
      {/* ================= Footer Links ================= */}
      <div className="mt-12 text-center space-y-4">
        <p className="text-gray-500 text-sm">
          Already have an account?{' '}
          <button onClick={()=>{
            navigate("/login") 
          }} className="text-orange-600 font-semibold hover:underline cursor-pointer bg-none border-none"> 
            Sign in here
          </button>
        </p>
        <div>
          <button onClick={()=>{
            navigate("/")
          }} className="text-gray-500 text-sm font-medium hover:text-gray-900 transition-colors cursor-pointer bg-none border-none">
            Back to Home
          </button>
        </div>
      </div>

    </div>
  )
}

export default Sign_up
