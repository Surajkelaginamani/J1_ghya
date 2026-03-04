import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Search, Phone, MessageCircle, 
  MapPin, Package, Clock, X as CloseIcon, Loader, Hourglass 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CustomerDirectory = () => {
  const navigate = useNavigate();
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- DYNAMIC STATES ---
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- HELPER FUNCTIONS FOR DATES ---
  const getPlanDuration = (planType) => {
    const type = planType?.toLowerCase() || '';
    if (type.includes('weekly') || type.includes('7_days')) return 7;
    if (type.includes('15_days')) return 15;
    if (type.includes('monthly') || type.includes('30_days')) return 30;
    return 30; // Default fallback
  };

  const calculateDaysLeft = (sub) => {
    const baseDuration = getPlanDuration(sub.planType);
    const skippedDaysCount = sub.skippedDates ? sub.skippedDates.length : 0;
    const totalSpan = baseDuration + skippedDaysCount;

    const startDate = new Date(sub.startDate || sub.updatedAt || sub.createdAt);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + totalSpan);

    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, Math.min(daysLeft, totalSpan));
  };

  // --- FETCH DATA ON LOAD ---
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');

        const response = await fetch('http://localhost:5000/api/vendor/students', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          
          // Map backend data to match your UI structure
          const formattedCustomers = data
            .filter(sub => sub.status === 'active') // Only show ACTIVE customers
            .map(sub => ({
              id: sub._id,
              name: sub.customer?.name || "Unknown Customer",
              hostel: sub.customer?.location || "N/A",
              room: sub.customer?.roomNumber || "N/A",
              plan: sub.planType ? sub.planType.replace('_', ' ').toUpperCase() : "STANDARD",
              type: sub.mealType || "Veg",
              phone: sub.customer?.phone || "",
              planDuration: "Subscription",
              startDate: new Date(sub.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
              status: sub.status.charAt(0).toUpperCase() + sub.status.slice(1),
              daysLeft: calculateDaysLeft(sub) // Add the calculated days left!
            }));

          setCustomers(formattedCustomers);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [navigate]);

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    customer.hostel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex flex-col items-center justify-center min-h-screen text-orange-600"><Loader className="animate-spin mb-4" size={48} /><p className="font-bold">Loading directory...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 relative">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* --- Header --- */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
               onClick={()=> navigate("/Ven_Dashboard")}
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Active Customers</h1>
              <p className="text-gray-500 text-sm">View and contact your active students</p>
            </div>
          </div>
          
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-xl font-bold border border-green-200 shadow-sm">
            {customers.length} Total Active
          </div>
        </div>

        {/* --- Search Bar --- */}
        <div className="relative shadow-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by student name or hostel..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm transition-shadow"
          />
        </div>

        {/* --- Customer List --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
          <div className="divide-y divide-gray-100">
            {filteredCustomers.map(student => (
              <div 
                key={student.id} 
                onClick={() => setSelectedStudent(student)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-orange-50/50 transition-colors cursor-pointer group gap-4 sm:gap-0"
              >
                {/* 1. Student Basic Info */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-700 font-bold text-lg shrink-0 shadow-sm">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-orange-600 transition-colors leading-tight">{student.name}</h3>
                    <p className="text-sm text-gray-500">{student.hostel}, {student.room}</p>
                    <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${student.type.toLowerCase().includes('veg') && !student.type.toLowerCase().includes('non') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {student.type} • {student.plan}
                    </span>
                  </div>
                </div>

                {/* 2. Days Left & Actions Container */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0">
                  
                  {/* Days Left Badge */}
                  <div className="flex flex-col items-start sm:items-end">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">Status</p>
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                      student.daysLeft <= 3 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}>
                      <Hourglass size={14} /> 
                      {student.daysLeft} Days Left
                    </span>
                  </div>

                  {/* COMMUNICATION BUTTONS */}
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    {student.phone ? (
                      <>
                        <a 
                          href={`https://wa.me/${student.phone.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-2.5 bg-[#E8F8F5] text-[#128C7E] rounded-xl border border-[#C3EAE3] hover:bg-[#D1F2EB] hover:shadow-sm transition-all flex items-center justify-center"
                          title="WhatsApp Student"
                        >
                          <MessageCircle size={20} />
                        </a>
                        <a 
                          href={`tel:${student.phone}`}
                          className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200 hover:bg-blue-100 hover:shadow-sm transition-all flex items-center justify-center"
                          title="Call Student"
                        >
                          <Phone size={20} />
                        </a>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No phone</span>
                    )}
                  </div>

                </div>
              </div>
            ))}
            
            {filteredCustomers.length === 0 && (
              <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                <Search className="text-gray-300 mb-3" size={40} />
                <p className="font-medium">No customers found matching "{searchTerm}"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* STUDENT DETAILS MODAL (POPUP)             */}
      {/* ========================================= */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 p-2 bg-black/20 text-white rounded-full hover:bg-black/40 transition-colors z-10"
            >
              <CloseIcon size={20} />
            </button>

            {/* Modal Header (Profile Banner) */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-400 p-8 text-center relative">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-3xl font-bold text-orange-600 shadow-md border-4 border-orange-200/50">
                {selectedStudent.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-2xl font-bold text-white">{selectedStudent.name}</h2>
              <span className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                selectedStudent.daysLeft <= 3 ? 'bg-red-500 text-white border border-red-400' : 'bg-green-400/30 text-green-50 border border-green-400/40'
              }`}>
                <Hourglass size={12} /> {selectedStudent.daysLeft} Days Remaining
              </span>
            </div>

            {/* Modal Body (Details) */}
            <div className="p-6">
              
              {/* Quick Contact Buttons inside Modal */}
              {selectedStudent.phone && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <a href={`tel:${selectedStudent.phone}`} className="flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 rounded-xl font-bold hover:bg-blue-100 border border-blue-100 transition-colors shadow-sm">
                    <Phone size={18} /> Call
                  </a>
                  <a href={`https://wa.me/${selectedStudent.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-3 bg-[#E8F8F5] text-[#128C7E] rounded-xl font-bold hover:bg-[#D1F2EB] border border-[#C3EAE3] transition-colors shadow-sm">
                    <MessageCircle size={18} /> WhatsApp
                  </a>
                </div>
              )}

              {/* Information Grid */}
              <div className="space-y-4 text-sm bg-gray-50 p-5 rounded-2xl border border-gray-100">
                
                {/* Delivery Address */}
                <div className="flex items-start gap-3 border-b border-gray-200 pb-3">
                  <MapPin className="text-gray-400 mt-0.5" size={20} />
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Delivery Address</p>
                    <p className="font-semibold text-gray-900 text-base">{selectedStudent.hostel}</p>
                    <p className="text-gray-600">{selectedStudent.room}</p>
                  </div>
                </div>

                {/* Contact Number */}
                <div className="flex items-start gap-3 border-b border-gray-200 pb-3">
                  <Phone className="text-gray-400 mt-0.5" size={20} />
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Contact Number</p>
                    <p className="font-semibold text-gray-900 text-base">{selectedStudent.phone || "No phone provided"}</p>
                  </div>
                </div>

                {/* Tiffin Plan */}
                <div className="flex items-start gap-3 border-b border-gray-200 pb-3">
                  <Package className="text-gray-400 mt-0.5" size={20} />
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tiffin Plan</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="font-semibold text-gray-900">{selectedStudent.planDuration}</span>
                      <span className="text-gray-300">•</span>
                      <span className="font-semibold text-gray-900">{selectedStudent.plan}</span>
                      <span className="text-gray-300">•</span>
                      <span className={`font-bold uppercase ${selectedStudent.type.toLowerCase().includes('veg') && !selectedStudent.type.toLowerCase().includes('non') ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedStudent.type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Joined Date */}
                <div className="flex items-start gap-3">
                  <Clock className="text-gray-400 mt-0.5" size={20} />
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Joined Date</p>
                    <p className="font-semibold text-gray-900">{selectedStudent.startDate}</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDirectory;