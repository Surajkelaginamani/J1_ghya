import React, { useState, useEffect } from 'react';
import { Search, MapPin, ChevronDown, Filter, Star, Package, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BrowseTiffinsPage = () => {
  const navigate = useNavigate();

  const [vendors, setVendors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/customer/vendors', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setVendors(data);
        }
      } catch (error) {
        console.error('Error fetching vendors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendors();
  }, []);

  const generateTags = (foodType, deliveryType) => {
    const tags = [];
    if (foodType === 'veg') tags.push('Veg');
    if (foodType === 'nonveg') tags.push('Non-Veg');
    if (foodType === 'mix') tags.push('Veg & Non-Veg');

    if (deliveryType === 'delivery' || deliveryType === 'both') tags.push('Delivery');
    if (deliveryType === 'pickup' || deliveryType === 'both') tags.push('Pickup');
    return tags;
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Browse Tiffin Services</h1>
        <p className="text-gray-500 mt-1">Discover delicious homemade meals near you</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" placeholder="Search by name, cuisine, or location..." className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all" />
        </div>
        <div className="w-full md:w-64 relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input type="text" defaultValue="Ahilyanagar" className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all" />
        </div>
        <div className="w-full md:w-48 relative">
          <select className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-100">
            <option>Relevance</option>
            <option>Price: Low to High</option>
            <option>Rating: High to Low</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-6">
            <div className="flex items-center gap-2 mb-6 text-gray-900">
              <Filter size={20} />
              <h3 className="font-bold text-lg">Filters</h3>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold mb-3">Food Type</h4>
              <label className="flex items-center gap-3 text-gray-600 cursor-pointer hover:text-orange-600">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                <span className="text-sm">Vegetarian Only</span>
              </label>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold mb-3">Service Type</h4>
              <div className="space-y-2">
                {['Delivery', 'Pickup', 'Dine In'].map((type) => (
                  <label key={type} className="flex items-center gap-3 text-gray-600 cursor-pointer hover:text-orange-600">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                    <span className="text-sm">{type}</span>
                  </label>
                ))}
              </div>
            </div>
            <button className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 hover:text-black transition-colors">
              Reset Filters
            </button>
          </div>
        </div>

        <div className="lg:col-span-3">
          {isLoading ? (
            <p className="text-gray-500 text-sm mb-4">Loading vendors...</p>
          ) : (
            <>
              <p className="text-gray-500 text-sm mb-4">{vendors.length} services found</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vendors.length > 0 ? (
                  vendors.map((vendor) => {
                    const totalReviews = Number(vendor.totalReviews || 0);
                    const ratingLabel = totalReviews > 0 ? Number(vendor.rating || 0).toFixed(1) : 'New';
                    const ratingMeta = totalReviews > 0
                      ? `${totalReviews} review${totalReviews > 1 ? 's' : ''}`
                      : 'No reviews yet';

                    return (
                      <ServiceCard
                        key={vendor._id}
                        navigate={navigate}
                        image="https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
                        title={vendor.businessName}
                        rating={ratingLabel}
                        ratingMeta={ratingMeta}
                        subtitle={`Service Area: ${vendor.serviceArea}`}
                        description={`Offering high-quality ${vendor.foodType} meals.`}
                        price="Starts at Rs100"
                        distance={vendor.serviceArea}
                        tags={generateTags(vendor.foodType, vendor.deliveryType)}
                        vendorId={vendor._id}
                      />
                    );
                  })
                ) : (
                  <p className="text-gray-500">No vendors found in your area yet.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

const ServiceCard = ({ navigate, image, title, rating, ratingMeta, subtitle, description, price, distance, tags, vendorId }) => (
  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300">
    <div className="h-48 overflow-hidden relative">
      <img src={image} alt={title} className="w-full h-full object-cover" />
    </div>

    <div className="p-5">
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-bold text-lg text-gray-900">{title}</h3>
        <div className="flex items-center gap-1 bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-xs font-bold">
          <Star size={12} className="fill-green-700" />
          {rating}
        </div>
      </div>

      <p className="text-gray-400 text-xs mb-2 -mt-1">{ratingMeta}</p>
      <p className="text-gray-500 text-sm mb-2">{subtitle}</p>
      <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
        {description}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag, index) => {
          if (tag === 'Veg') {
            return (
              <span key={index} className="px-2 py-1 rounded border border-green-500 text-green-600 text-xs font-semibold">Veg</span>
            );
          }
          return (
            <span key={index} className="flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-medium">
              {tag === 'Delivery' && <Package size={12} />}
              {tag === 'Pickup' && <Utensils size={12} />}
              {tag}
            </span>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-orange-600">{price}</span>
            <span className="text-gray-400 text-xs">/meal</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
            <MapPin size={12} />
            {distance}
          </div>
        </div>
        <button onClick={() => navigate(`/dashboard/Details_ven/${vendorId}`)} className="bg-[#EA580C] hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
          View Details
        </button>
      </div>
    </div>
  </div>
);

export default BrowseTiffinsPage;
