import React from 'react';
import { ShoppingBag } from 'lucide-react';
import LandingHeader from '../LandingPageComp/LandingHeader';
import Section1 from '../LandingPageComp/Section1';
import Section2 from '../LandingPageComp/section2';
import Section3 from '../LandingPageComp/Section3';

const LandingPage = () => {
  return (
    <div>
      <div className='fixed top-0 left-0 w-full z-50 bg-white shadow-md'>
        <LandingHeader />
      </div>
      <div className='pt-10 gap-4'>
        <Section1 />
        <Section2 />
        <Section3 />
      </div>
      <footer className="bg-[#0F172A] text-gray-300 h-full py-16 font-sans">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Top Section: 4 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            
            {/* Column 1: Brand Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white mb-4">
                {/* Lucide Shopping Bag Icon */}
                <ShoppingBag size={28} strokeWidth={2.5} />
                <span className="text-2xl font-bold tracking-wide">MealMitra</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                Connecting you with delicious homemade meals and authentic food products
              </p>
            </div>

            {/* Column 2: For Customers */}
            <div>
              <h3 className="text-white font-bold text-lg mb-6">For Customers</h3>
              <ul className="space-y-4 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Browse Services</a></li>
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Subscriptions</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Homemade Products</a></li>
              </ul>
            </div>

            {/* Column 3: For Vendors */}
            <div>
              <h3 className="text-white font-bold text-lg mb-6">For Vendors</h3>
              <ul className="space-y-4 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Become a Vendor</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Vendor Portal</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>

            {/* Column 4: Contact */}
            <div>
              <h3 className="text-white font-bold text-lg mb-6">Contact</h3>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-gray-500">Email:</span>
                  <span className="text-white">support@mealmitra.com</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500">Phone:</span>
                  <span className="text-white">+91 9876543210</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500">Address:</span>
                  <span className="text-white">Mumbai, India</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Section: Divider & Copyright */}
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2026 MealMitra. All rights reserved.
            </p>
          </div>

        </div>
      </footer>
    </div>
  );
};

export default LandingPage;