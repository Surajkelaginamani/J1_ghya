import React from 'react'

const Section2 = () => {
  return (
   <div className="font-sans text-gray-900">
      
      {/* ================= SECTION 1: How It Works ================= */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Heading */}
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-black">
            How It Works for Customers
          </h2>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="border border-gray-100 rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Search Services</h3>
              <p className="text-gray-500 leading-relaxed">
                Find tiffin services near you based on location and preferences
              </p>
            </div>

            {/* Step 2 */}
            <div className="border border-gray-100 rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Subscribe</h3>
              <p className="text-gray-500 leading-relaxed">
                Choose daily, weekly, or monthly subscription plans
              </p>
            </div>

            {/* Step 3 */}
            <div className="border border-gray-100 rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Manage Holidays</h3>
              <p className="text-gray-500 leading-relaxed">
                Mark holidays and pause service anytime you need
              </p>
            </div>

            {/* Step 4 */}
            <div className="border border-gray-100 rounded-2xl p-8 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Enjoy Meals</h3>
              <p className="text-gray-500 leading-relaxed">
                Get fresh, homemade meals delivered to your doorstep
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SECTION 2: Key Features ================= */}
      <section className="bg-[#FFFBF5] py-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Heading */}
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-black">
            Key Features
          </h2>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center max-w-6xl mx-auto">
            
            {/* Feature 1 */}
            <div className="flex flex-col items-center">
              <div className="text-orange-600 mb-6">
                 <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Flexible Subscriptions</h3>
              <p className="text-gray-500 leading-relaxed max-w-sm">
                Choose from daily, weekly, or monthly plans that fit your needs
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center">
              <div className="text-orange-600 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Holiday Management</h3>
              <p className="text-gray-500 leading-relaxed max-w-sm">
                Easily pause or resume your service during holidays or travel
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center">
              <div className="text-orange-600 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                  <path d="M3 6h18"></path>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Homemade Products</h3>
              <p className="text-gray-500 leading-relaxed max-w-sm">
                Order pickles, papad, snacks and more from local home chefs
              </p>
            </div>
            
          </div>
        </div>
      </section>

      {/* Floating Help Button (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="bg-gray-900 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition">
          <span className="font-bold text-xl">?</span>
        </button>
      </div>

    </div>
  );
}

export default Section2
