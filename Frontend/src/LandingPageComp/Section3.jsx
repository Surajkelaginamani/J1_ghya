import React from 'react'

const Section3 = () => {
    const productCategories = [
    "Pickles", "Papad", "Snacks", "Spices", "Sweets"
  ];
  return (
   <div className="font-sans text-gray-900">
      
      {/* ================= SECTION 3: Explore Homemade Products ================= */}
      <section className="bg-[#FFFBF5] py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Heading */}
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
            Explore Homemade Products
          </h2>
          
          {/* Subtext */}
          <p className="text-gray-500 text-lg mb-10 max-w-2xl mx-auto">
            Discover authentic pickles, papad, snacks, and traditional products made with love by local vendors
          </p>

          {/* Categories Pills */}
          <div className="flex flex-wrap justify-center gap-4">
            {productCategories.map((category, index) => (
              <button 
                key={index}
                className="bg-white border border-gray-100 text-gray-800 px-8 py-3 rounded-full shadow-sm hover:shadow-md hover:border-orange-200 hover:text-orange-600 transition-all font-medium"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SECTION 4: For Vendors ================= */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-7xl mx-auto text-center">
          {/* Heading */}
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
            For Vendors
          </h2>
          
          {/* Subtext */}
          <p className="text-gray-500 text-lg mb-16 max-w-2xl mx-auto">
            Join MealMitra and grow your tiffin service or homemade food business
          </p>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            
            {/* Card 1 */}
            <div className="border border-gray-100 rounded-2xl p-10 text-center shadow-sm hover:shadow-lg transition-shadow">
              <div className="text-orange-600 mb-6 flex justify-center">
                {/* Icon: User/Search */}
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <circle cx="19" cy="11" r="2"></circle>
                  <path d="M19 13v6"></path> {/* Stylized 'more' icon */}
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Reach More Customers</h3>
              <p className="text-gray-500 leading-relaxed">
                Connect with customers looking for daily tiffin services
              </p>
            </div>

            {/* Card 2 */}
            <div className="border border-gray-100 rounded-2xl p-10 text-center shadow-sm hover:shadow-lg transition-shadow">
              <div className="text-orange-600 mb-6 flex justify-center">
                {/* Icon: Calendar */}
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                  <circle cx="12" cy="15" r="1.5" fill="currentColor"></circle>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Easy Management</h3>
              <p className="text-gray-500 leading-relaxed">
                Manage orders, subscriptions, and holidays effortlessly
              </p>
            </div>

            {/* Card 3 */}
            <div className="border border-gray-100 rounded-2xl p-10 text-center shadow-sm hover:shadow-lg transition-shadow">
              <div className="text-orange-600 mb-6 flex justify-center">
                {/* Icon: Success/Growth */}
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Grow Your Business</h3>
              <p className="text-gray-500 leading-relaxed">
                Build your reputation and expand your customer base
              </p>
            </div>

          </div>

          {/* CTA Button */}
          <button className="bg-[#EA580C] hover:bg-orange-700 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors shadow-lg shadow-orange-200">
            Start Selling Today
          </button>

        </div>
      </section>

    </div>
  );
}

export default Section3
