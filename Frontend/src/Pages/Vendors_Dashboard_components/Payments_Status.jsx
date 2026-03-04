import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, Search, Phone, MessageCircle, 
  CheckCircle, Calendar, X, Download, Share2, IndianRupee, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';

const AllCustomers = () => {
  const Navigate = useNavigate();
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // DYNAMIC STATE
  const [unpaidCustomers, setUnpaidCustomers] = useState([]);
  const [paidCustomers, setPaidCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- 1. FETCH PAYMENT RECORDS ---
  const fetchPayments = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return Navigate('/login');

      const response = await fetch('http://localhost:5000/api/vendor/payments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUnpaidCustomers(data.unpaidCustomers);
        setPaidCustomers(data.paidCustomers);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [Navigate]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // --- 2. HANDLE MARK AS PAID ---
  const handleMarkPaid = async (subscriptionId) => {
    if (!window.confirm("Are you sure you want to mark this as paid and renew their subscription?")) return;
    
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/vendor/payments/${subscriptionId}/mark-paid`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert("Payment Recorded successfully!");
        fetchPayments(); // Refresh the lists! The student will instantly jump from Unpaid to Paid.
      } else {
        alert("Failed to record payment.");
      }
    } catch {
      alert("Server error.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewReceipt = (student) => {
    setSelectedStudent(student);
    setShowReceipt(true);
  };

  const handleDownloadReceipt = (student) => {
    if (!student) return;

    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(234, 88, 12);
    doc.text('MealMitra Vendor Receipt', 105, 20, null, null, 'center');

    doc.setDrawColor(220, 220, 220);
    doc.line(20, 28, 190, 28);

    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text('Student Name:', 20, 45);
    doc.text(String(student.name || 'N/A'), 70, 45);

    doc.text('Hostel / Room:', 20, 55);
    doc.text(String(student.hostel || 'N/A'), 70, 55);

    doc.text('Plan Type:', 20, 65);
    doc.text(String(student.plan || 'N/A'), 70, 65);

    doc.text('Date & Time:', 20, 75);
    doc.text(String(student.date || 'N/A'), 70, 75);

    doc.text('Payment Method:', 20, 85);
    doc.text(String(student.method || 'N/A'), 70, 85);

    doc.setDrawColor(220, 220, 220);
    doc.line(20, 95, 190, 95);

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('TOTAL RECEIVED:', 20, 110);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs. ${student.amount ?? 0}`, 75, 110);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(130, 130, 130);
    doc.text('Generated from MealMitra Vendor Dashboard', 105, 140, null, null, 'center');

    const fileName = `MealMitra_Vendor_Receipt_${String(student.name || 'student').replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  };

  const handleShareReceipt = async (student) => {
    if (!student) return;
    const shareText = `MealMitra Receipt\nStudent: ${student.name}\nAmount: Rs. ${student.amount}\nDate: ${student.date}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MealMitra Receipt',
          text: shareText
        });
      } catch {
        // Intentionally ignore share cancel errors.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareText);
      alert('Receipt summary copied to clipboard.');
    } catch {
      alert('Unable to share on this device.');
    }
  };

  // Search Filtering
  const filteredUnpaid = unpaidCustomers.filter((c) => {
    const name = (c.name || '').toLowerCase();
    const hostel = (c.hostel || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return name.includes(query) || hostel.includes(query);
  });
  const filteredPaid = paidCustomers.filter((c) => {
    const name = (c.name || '').toLowerCase();
    const hostel = (c.hostel || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return name.includes(query) || hostel.includes(query);
  });

  if (isLoading) {
    return <div className="flex flex-col items-center justify-center min-h-screen text-orange-600"><Loader2 className="animate-spin mb-4" size={48} /><p className="font-bold">Loading Financials...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* --- Header --- */}
        <div className="flex items-center gap-4">
          <button onClick={()=> Navigate("/Ven_Dashboard")} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors shadow-sm">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Records</h1>
            <p className="text-gray-500 text-sm">Manage student dues and history</p>
          </div>
        </div>

        {/* --- Search & Filter --- */}
        <div className="flex gap-4">
          <div className="flex-1 relative shadow-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or hostel..." 
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* --- SECTION 1: UNPAID / PENDING --- */}
        {filteredUnpaid.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-6 bg-red-500 rounded-full"></div>
              Pending Renewals / Dues
              <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">
                {filteredUnpaid.length} Students
              </span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredUnpaid.map((student) => (
                <div key={student.id} className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-between group hover:border-red-300 transition-all">
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{student.name}</h3>
                      <p className="text-xs text-gray-500 mb-1">{student.hostel}, {student.room}</p>
                      <p className="text-[10px] font-bold uppercase text-gray-400">{student.plan}</p>
                    </div>
                    <div className="flex gap-2">
                      <a href={`https://wa.me/${student.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors" title="WhatsApp">
                        <MessageCircle size={18} />
                      </a>
                      <a href={`tel:${student.phone}`} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Call">
                        <Phone size={18} />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-red-600">₹{student.amount}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded mt-1 w-fit ${student.due.includes('Overdue') ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        {student.due}
                      </span>
                    </div>
                    
                    {/* NEW BUTTON: MARK AS PAID */}
                    <button 
                      onClick={() => handleMarkPaid(student.id)}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-600 hover:text-white transition-colors disabled:opacity-50"
                    >
                      <IndianRupee size={16} /> Mark Paid
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- SECTION 2: PAID / CLEARED --- */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-2 h-6 bg-green-500 rounded-full"></div>
            Active & Paid Students
            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">
              {filteredPaid.length} Safe
            </span>
          </h2>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">Student</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4 hidden sm:table-cell">Start Date</th>
                  <th className="p-4 hidden sm:table-cell">Method</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPaid.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500 sm:hidden">{student.date}</p>
                    </td>
                    <td className="p-4 font-bold text-gray-800">₹{student.amount}</td>
                    <td className="p-4 text-sm text-gray-500 hidden sm:table-cell">
                      <div className="flex items-center gap-1"><Calendar size={14} />{student.date}</div>
                    </td>
                    <td className="p-4 text-sm text-gray-500 hidden sm:table-cell">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium border border-gray-200">{student.method}</span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleViewReceipt(student)} className="text-orange-600 text-xs font-bold hover:underline">
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPaid.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500 italic">No paid records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* --- RECEIPT MODAL (Kept Exactly As You Designed It) --- */}
      {/* --- RECEIPT MODAL --- */}
      {showReceipt && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <button onClick={() => setShowReceipt(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20} className="text-gray-600" /></button>
            <div className="bg-orange-600 p-6 text-white text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3"><CheckCircle size={28} className="text-white" /></div>
              <h2 className="text-2xl font-bold">Payment Receipt</h2>
              <p className="text-orange-100 text-sm mt-1">Transaction Successful</p>
            </div>
            <div className="p-8">
              <div className="text-center mb-8">
                <p className="text-gray-500 text-sm mb-1">Total Amount Paid</p>
                <h3 className="text-4xl font-bold text-gray-900">₹{selectedStudent.amount}</h3>
              </div>
              
              {/* DETAILS LIST */}
              <div className="space-y-4 text-sm">
                <div className="flex justify-between py-3 border-b border-gray-100"><span className="text-gray-500">Student Name</span><span className="font-semibold text-gray-900">{selectedStudent.name}</span></div>
                <div className="flex justify-between py-3 border-b border-gray-100"><span className="text-gray-500">Hostel / Room</span><span className="font-semibold text-gray-900">{selectedStudent.hostel}</span></div>
                <div className="flex justify-between py-3 border-b border-gray-100"><span className="text-gray-500">Plan Type</span><span className="font-semibold text-gray-900 capitalize">{selectedStudent.plan}</span></div>
                <div className="flex justify-between py-3 border-b border-gray-100"><span className="text-gray-500">Leaves Deducted</span><span className="font-semibold text-red-500">{selectedStudent.leaves > 0 ? `-${selectedStudent.leaves} Days` : "None"}</span></div>
                
                {/* --- UPDATED LINE IS HERE --- */}
                <div className="flex justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-500">Date & Time</span>
                  <span className="font-semibold text-gray-900">{selectedStudent.date}</span>
                </div>
                {/* ---------------------------- */}

                <div className="flex justify-between py-3 border-b border-gray-100"><span className="text-gray-500">Payment Method</span><span className="font-semibold text-gray-900">{selectedStudent.method}</span></div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleDownloadReceipt(selectedStudent)}
                  className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Download size={18} /> Download
                </button>
                <button
                  onClick={() => handleShareReceipt(selectedStudent)}
                  className="flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  <Share2 size={18} /> Share
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 text-center text-xs text-gray-400 border-t border-gray-100">
              {/* Also updated the footer to show the exact time! */}
              Receipt generated by MealMitra • {selectedStudent.date}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllCustomers;
