import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, Clock, Download, CreditCard, Plus, Wallet, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from "jspdf";

const PaymentsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const rupee = '\u20B9';

  const [paymentData, setPaymentData] = useState({
    pendingAmount: 0,
    totalPaid: 0,
    thisMonth: 0,
    transactions: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      const response = await fetch('http://localhost:5000/api/customer/payments', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentData(data);
      } else {
        console.error('Failed to fetch payments');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchPayments();
    const intervalId = setInterval(fetchPayments, 30000);
    return () => clearInterval(intervalId);
  }, [fetchPayments]);

 // --- UPGRADED: FUNCTION TO DOWNLOAD PDF RECEIPT ---
  const handleDownloadReceipt = (transaction) => {
    // 1. Create a new PDF document
    const doc = new jsPDF();

    // 2. Add Header (MealMitra Branding)
    doc.setFontSize(22);
    doc.setTextColor(234, 88, 12); // MealMitra Orange
    doc.text("MealMitra Receipt", 105, 20, null, null, "center");

    // Divider Line
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 28, 190, 28);

    // 3. Add Transaction Details
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60); // Dark Gray
    doc.text(`Vendor Name:`, 20, 45);
    doc.text(transaction.vendorName, 65, 45);
    
    doc.text(`Transaction ID:`, 20, 55);
    doc.text(String(transaction.id), 65, 55);
    
    doc.text(`Date:`, 20, 65);
    doc.text(transaction.date, 65, 65);
    
    doc.text(`Payment Method:`, 20, 75);
    doc.text(transaction.method, 65, 75);
    
    doc.text(`Service Type:`, 20, 85);
    doc.text(transaction.type, 65, 85);

    // Divider Line
    doc.line(20, 95, 190, 95);

    // 4. Add Total and Status
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0); // Black
    doc.text(`TOTAL PAID:`, 20, 110);
    doc.setFont("helvetica", "bold");
    doc.text(`Rs. ${transaction.amount}`, 65, 110);
    
    doc.setFontSize(14);
    doc.setTextColor(34, 197, 94); // Green for success
    doc.text(`STATUS: SUCCESSFUL`, 20, 125);

    // 5. Add Footer
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150); // Light Gray
    doc.text("Thank you for using MealMitra! Keep eating healthy.", 105, 150, null, null, "center");

    // 6. Trigger the PDF Download!
    doc.save(`MealMitra_Receipt_${transaction.vendorName.replace(/\s+/g, '_')}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-orange-600">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="font-bold">Loading Billing Info...</p>
      </div>
    );
  }

  const filteredTransactions = paymentData.transactions.filter((t) =>
    (activeTab === 'all' ? true : t.status === activeTab)
  );

  const pendingCount = paymentData.transactions.filter((t) => t.status === 'pending').length;
  const paidCount = paymentData.transactions.filter((t) => t.status === 'paid').length;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Payments & Billing</h1>
        <p className="text-gray-500 mt-1">Manage your payment history and billing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <p className="text-gray-500 text-sm mb-2">Total Paid</p>
          <h3 className="text-3xl font-bold text-green-600">{rupee}{paymentData.totalPaid}</h3>
          <p className="text-gray-400 text-xs mt-1">{paidCount} transactions</p>
        </div>

        <div className="bg-white border border-red-200 rounded-xl p-6 shadow-sm bg-red-50/30">
          <p className="text-red-500 text-sm font-semibold mb-2 flex items-center gap-1"><Clock size={14} /> Pending Dues</p>
          <h3 className="text-3xl font-bold text-red-600">{rupee}{paymentData.pendingAmount}</h3>
          <p className="text-red-400 text-xs mt-1">{pendingCount} pending</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <p className="text-gray-500 text-sm mb-2">Paid This Month</p>
          <h3 className="text-3xl font-bold text-orange-600">{rupee}{paymentData.thisMonth}</h3>
          <p className="text-gray-400 text-xs mt-1">Current month</p>
        </div>
      </div>

      <div className="bg-gray-100 p-1 rounded-lg inline-flex mb-8">
        {['all', 'paid', 'pending'].map((tab) => {
          const count = tab === 'all'
            ? paymentData.transactions.length
            : (tab === 'paid' ? paidCount : pendingCount);
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-2 rounded-md text-sm font-semibold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>

      <div className="space-y-6 mb-10">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
            <p className="text-gray-500">No {activeTab} transactions found.</p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div key={transaction.id} className={`bg-white border rounded-xl p-6 shadow-sm ${transaction.status === 'pending' ? 'border-red-200' : 'border-gray-200'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{transaction.vendorName}</h3>
                  <p className="text-gray-500 text-sm">{transaction.type}</p>
                </div>
                <span className={`flex items-center gap-1 text-white text-xs font-bold px-2.5 py-1 rounded-full ${transaction.status === 'paid' ? 'bg-green-500' : 'bg-red-500'}`}>
                  {transaction.status === 'paid' ? <CheckCircle size={12} /> : <Clock size={12} />}
                  <span className="capitalize">{transaction.status}</span>
                </span>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="w-full md:w-auto">
                  <p className="text-gray-400 text-xs mb-1">Payment Date</p>
                  <p className={`font-semibold text-sm ${transaction.status === 'pending' ? 'text-red-600' : 'text-gray-900'}`}>{transaction.date}</p>
                </div>
                <div className="w-full md:w-auto">
                  <p className="text-gray-400 text-xs mb-1">Payment Method</p>
                  <div className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
                    {transaction.status === 'paid' ? <Wallet size={16} className="text-gray-400" /> : <Clock size={16} className="text-gray-400" />}
                    {transaction.method}
                  </div>
                </div>
                <div className="w-full md:w-auto text-left md:text-right">
                  <p className="text-gray-400 text-xs mb-1">Amount</p>
                  <p className="text-2xl font-bold text-orange-600 mb-2">{rupee}{transaction.amount}</p>

                  {transaction.status === 'pending' ? (
                    <button className="bg-[#EA580C] text-white px-6 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-700 transition-colors shadow-sm w-full md:w-auto">
                      Pay Now
                    </button>
                  ) : (
                    // --- ATTACHED FUNCTION TO BUTTON ---
                    <button 
                      onClick={() => handleDownloadReceipt(transaction)}
                      className="flex items-center justify-center gap-2 w-full md:w-auto border border-gray-200 px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors"
                    >
                      <Download size={14} /> Receipt
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mb-10">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Saved Payment Methods</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                <CreditCard size={24} />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">UPI</p>
                <p className="text-gray-500 text-xs">user@paytm</p>
              </div>
            </div>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
              Default
            </span>
          </div>

          <button className="bg-white border border-dashed border-gray-300 rounded-xl p-6 flex items-center justify-center gap-2 text-gray-600 font-semibold hover:border-orange-400 hover:text-orange-600 transition-colors">
            <Plus size={20} />
            Add Payment Method
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
        <h3 className="font-bold text-gray-900 mb-4">Payment Information</h3>
        <ul className="space-y-2 text-gray-600 text-sm list-disc list-inside">
          <li>All transactions are secure and encrypted</li>
          <li>Pay directly to your vendor via UPI or Cash</li>
          <li>Download receipts for tax purposes anytime</li>
          <li>Contact your vendor for refund policies</li>
        </ul>
      </div>
    </>
  );
};

export default PaymentsPage;