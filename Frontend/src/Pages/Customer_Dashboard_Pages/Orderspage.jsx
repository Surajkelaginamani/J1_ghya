import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, Package, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active');
  const [orders, setOrders] = useState({ activeOrders: [], pastOrders: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const rupee = '\u20B9';

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('http://localhost:5000/api/customer/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        setOrders({
          activeOrders: data.activeOrders || [],
          pastOrders: data.pastOrders || []
        });
      } catch (fetchError) {
        console.error('Error fetching orders:', fetchError);
        setError('Unable to load your orders right now.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  const getStatusBadgeClass = (status) => {
    const value = String(status || '').toLowerCase();
    if (value === 'active' || value === 'confirmed') return 'bg-blue-500 text-white';
    if (value === 'pending') return 'bg-yellow-500 text-white';
    if (value === 'paused') return 'bg-purple-500 text-white';
    if (value === 'cancelled' || value === 'expired') return 'bg-gray-500 text-white';
    return 'bg-green-500 text-white';
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    return new Date(dateValue).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const activeOrders = orders.activeOrders || [];
  const pastOrders = orders.pastOrders || [];
  const selectedOrders = activeTab === 'active' ? activeOrders : pastOrders;

  if (isLoading) {
    return <div className="text-gray-500 font-semibold">Loading orders...</div>;
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-500 mt-1">Track and manage your food orders</p>
      </div>

      <div className="bg-gray-100 p-1 rounded-xl inline-flex mb-8">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'active'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Active Orders ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'past'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Past Orders ({pastOrders.length})
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6 mb-10">
        {selectedOrders.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            {activeTab === 'active' ? 'No active orders found.' : 'No past orders found.'}
          </div>
        ) : (
          selectedOrders.map((order) => (
            <div key={order._id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{order.vendorName}</h3>
                  <p className="text-gray-500 text-sm">Order #{order.orderNumber}</p>
                </div>
                <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${getStatusBadgeClass(order.status)}`}>
                  {String(order.status).toLowerCase() === 'pending' ? <Clock size={12} /> : <CheckCircle size={12} />}
                  {order.status}
                </span>
              </div>

              <div className="mb-6">
                <p className="text-gray-500 text-sm mb-2">Order Details</p>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 pl-1">
                  <li>{order.planType} Plan</li>
                  <li>{order.mealType} Meal</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-8 mb-6 pb-6 border-b border-gray-100">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Order Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(order.orderDate)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Delivery Type</p>
                  <div className="flex items-center gap-2 font-semibold text-gray-900">
                    <Truck size={16} className="text-orange-600" />
                    {order.deliveryType || 'Delivery'}
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">End Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(order.endDate)}</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-orange-600">{rupee}{order.totalAmount}</p>
                </div>
                <button className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                  <Package size={16} />
                  Order Info
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
        <h3 className="font-bold text-gray-900 mb-4">Order Status Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <span className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full min-w-[80px] text-center">
              Pending
            </span>
            <span className="text-gray-600 text-sm">Order placed, awaiting confirmation</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full min-w-[80px] text-center">
              Active
            </span>
            <span className="text-gray-600 text-sm">Your meal plan is currently running</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full min-w-[80px] text-center">
              Paused
            </span>
            <span className="text-gray-600 text-sm">Delivery is temporarily paused</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-gray-500 text-white text-xs font-bold px-3 py-1 rounded-full min-w-[80px] text-center">
              Expired
            </span>
            <span className="text-gray-600 text-sm">Order period has ended</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrdersPage;
