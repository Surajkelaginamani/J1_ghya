// layouts/DashboardLayout.jsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Menu, ShoppingCart } from 'lucide-react';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex text-gray-900">
      
      {/* The Single Sidebar Instance */}
      <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto h-screen">
        
        {/* Mobile Header (Only visible on small screens) */}
        <div className="md:hidden flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-orange-600">
            <ShoppingCart size={24} strokeWidth={2.5} />
            <span className="text-xl font-bold">MealMitra</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-700">
            <Menu size={24} />
          </button>
        </div>

        {/* This is where the page content (Dashboard, Browse, etc.) will appear */}
        <Outlet />
        
      </main>
    </div>
  );
};

export default DashboardLayout;