import React, { useState, useEffect } from 'react';
import { 
  MapPin, Star, User, Clock, Info, 
  Utensils, Package, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom'; // Added useParams and useNavigate!

const VendorDetailsPage = () => {
  const { id } = useParams(); // Grabs the vendorId from the URL!
  const navigate = useNavigate();
  
  const [selectedPlan, setSelectedPlan] = useState('monthly_full');
  const [vendorInfo, setVendorInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- FETCH VENDOR DATA ON LOAD ---
  useEffect(() => {
    const fetchVendorDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/customer/vendors/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setVendorInfo(data);
        } else {
          alert("Vendor not found!");
          navigate('/dashboard/browse');
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendorDetails();
  }, [id, navigate]);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Determine the correct price based on what they selected
    let selectedPrice = pricing.monthlyFull;
    if (selectedPlan === 'monthly_half') selectedPrice = pricing.monthlyHalf;
    if (selectedPlan === 'single_trial') selectedPrice = pricing.singleTrial;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/customer/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vendorId: vendorInfo._id,
          planType: selectedPlan,
          price: selectedPrice,
          // You can also capture the textarea value in a state and send it here as specialRequests!
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message); // Shows "Request sent successfully!"
        navigate('/dashboard'); // Send them back to their dashboard
      } else {
        alert(data.message || "Failed to send request.");
      }
    } catch (error) {
      console.error("Error sending request:", error);
      alert("Server error. Please try again later.");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen text-gray-500 font-bold">Loading Vendor Details...</div>;
  }

  if (!vendorInfo) return null;

  // Fallback pricing since we haven't added these to the DB yet
// Pull the exact prices from your MongoDB database
  // Keeping the fallbacks (3000, 1800, 120) just in case a vendor forgot to fill them out!
  const pricing = {
    monthlyFull: vendorInfo.monthlyFee || 3000,
    monthlyHalf: vendorInfo.halfTiffinMonthlyPrice || 1800,
    singleTrial: vendorInfo.singleTiffinPrice || 120
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      
      {/* Header / Hero Section */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 mb-8">
        <div className="h-48 md:h-64 overflow-hidden relative bg-orange-100">
          <img 
            src="https://images.unsplash.com/photo-1565557623262-b51c2513a641?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" 
            alt="Vendor Cover" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{vendorInfo.businessName}</h1>
              <p className="text-gray-600 mb-4">Authentic homemade meals prepared fresh daily. High hygiene standards guaranteed.</p>
              
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-semibold border border-green-200 capitalize">
                  <Utensils size={14} /> {vendorInfo.foodType}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold border border-blue-200 capitalize">
                  <Package size={14} /> {vendorInfo.deliveryType}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm font-semibold border border-orange-200">
                  <Star size={14} className="fill-orange-700" /> New Rating
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- Left Column: Detailed Info --- */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-xl text-gray-900 mb-6 flex items-center gap-2">
              <Info className="text-orange-600" size={24} /> 
              Business Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <DetailItem icon={<User />} label="Contact Person" value={vendorInfo.ownerName} />
              <DetailItem icon={<MapPin />} label="Service Area" value={vendorInfo.serviceArea} />
              <DetailItem icon={<Clock />} label="Service Type" value="Lunch & Dinner" />
              <DetailItem icon={<ShieldCheck />} label="Food Quality" value="Home Cooked" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
             <h3 className="font-bold text-xl text-gray-900 mb-4">What's in the box?</h3>
             <ul className="space-y-3 text-gray-600">
               <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-green-500"/> 4 Roti / Chapati</li>
               <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-green-500"/> 1 Sabzi (Changes daily)</li>
               <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-green-500"/> Dal & Rice</li>
               <li className="flex items-center gap-2"><CheckCircle2 size={18} className="text-green-500"/> Salad & Pickle</li>
             </ul>
          </div>
        </div>

        {/* --- Right Column: Request Form --- */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-6">
            <h3 className="font-bold text-xl text-gray-900 mb-2">Send Request</h3>
            <p className="text-sm text-gray-500 mb-6">Choose a plan to join this tiffin service.</p>

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              
              {/* Option 1: Full Monthly */}
              <label className={`block p-4 border rounded-xl cursor-pointer transition-all ${selectedPlan === 'monthly_full' ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-gray-200 hover:border-orange-300'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" name="tiffin_plan" value="monthly_full" 
                      checked={selectedPlan === 'monthly_full'} onChange={(e) => setSelectedPlan(e.target.value)}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">Monthly Full Tiffin</p>
                      <p className="text-xs text-gray-500">Lunch & Dinner (30 days)</p>
                    </div>
                  </div>
                  <p className="font-bold text-gray-900">₹{pricing.monthlyFull}</p>
                </div>
              </label>

              {/* Option 2: Half Monthly */}
              <label className={`block p-4 border rounded-xl cursor-pointer transition-all ${selectedPlan === 'monthly_half' ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-gray-200 hover:border-orange-300'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" name="tiffin_plan" value="monthly_half"
                      checked={selectedPlan === 'monthly_half'} onChange={(e) => setSelectedPlan(e.target.value)}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">Half Tiffin Monthly</p>
                      <p className="text-xs text-gray-500">Lunch OR Dinner (30 days)</p>
                    </div>
                  </div>
                  <p className="font-bold text-gray-900">₹{pricing.monthlyHalf}</p>
                </div>
              </label>

              {/* Option 3: Trial */}
              <label className={`block p-4 border rounded-xl cursor-pointer transition-all ${selectedPlan === 'single_trial' ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-gray-200 hover:border-orange-300'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" name="tiffin_plan" value="single_trial"
                      checked={selectedPlan === 'single_trial'} onChange={(e) => setSelectedPlan(e.target.value)}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">1 Day Trial</p>
                      <p className="text-xs text-gray-500">Single Tiffin (Today Only)</p>
                    </div>
                  </div>
                  <p className="font-bold text-gray-900">₹{pricing.singleTrial}</p>
                </div>
              </label>

              <div className="pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Any special requests?</label>
                <textarea 
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none resize-none" 
                  rows="2" placeholder="E.g., Less spicy, no onions..."
                ></textarea>
              </div>

              <button type="submit" className="w-full bg-[#EA580C] hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm">
                Send Request
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

const DetailItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-1 text-gray-400">
      {React.cloneElement(icon, { size: 20 })}
    </div>
    <div>
      <p className="text-sm text-gray-500 mb-0.5">{label}</p>
      <p className="font-semibold text-gray-900 capitalize">{value}</p>
    </div>
  </div>
);

export default VendorDetailsPage;