import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, PackageCheck, RotateCcw, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomemadeOrdersPage = () => {
  const navigate = useNavigate();
  const rupee = '\u20B9';
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [restockQty, setRestockQty] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  const fetchAll = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [orderRes, itemRes, logRes] = await Promise.all([
        fetch('http://localhost:5000/api/vendor/homemade-orders', { headers }),
        fetch('http://localhost:5000/api/vendor/homemade-items', { headers }),
        fetch('http://localhost:5000/api/vendor/homemade-stock-logs', { headers })
      ]);

      if (orderRes.ok) setOrders(await orderRes.json());
      if (itemRes.ok) setItems(await itemRes.json());
      if (logRes.ok) setLogs(await logRes.json());
    } catch (error) {
      console.error('Error fetching homemade section data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const statusOrder = ['pending', 'confirmed', 'delivered', 'cancelled'];

  const normalizedOrders = useMemo(() => {
    return orders.map((order) => ({
      ...order,
      normalizedStatus: order.status === 'placed' ? 'pending' : order.status
    }));
  }, [orders]);

  const filteredOrders = normalizedOrders.filter((order) => order.normalizedStatus === activeTab);

  const updateOrderStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/vendor/homemade-orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || 'Failed to update order.');
        return;
      }
      await fetchAll();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const restockItem = async (itemId) => {
    try {
      const qty = Math.floor(Number(restockQty[itemId] || 0));
      if (!qty || qty <= 0) {
        alert('Enter a valid restock quantity.');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/vendor/homemade-items/${itemId}/restock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: qty })
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || 'Failed to restock item.');
        return;
      }
      setRestockQty((prev) => ({ ...prev, [itemId]: '' }));
      await fetchAll();
    } catch (error) {
      console.error('Error restocking item:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-gray-600">
        <Loader2 size={20} className="animate-spin" />
        Loading homemade orders...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/Ven_Dashboard')}
          className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors shadow-sm"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Homemade Orders</h1>
          <p className="text-gray-500 mt-1">Manage incoming homemade product orders and stock.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-wrap gap-2 mb-6">
            {statusOrder.map((status) => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize ${
                  activeTab === status ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No {activeTab} homemade orders.</p>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order._id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900">{order.itemName}</p>
                      <p className="text-sm text-gray-500">{order.customerName} ({order.customerPhone || 'No phone'})</p>
                      <p className="text-sm text-gray-500">Qty: {order.quantity} • {rupee}{order.totalAmount}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100 capitalize w-fit">
                      {order.normalizedStatus}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {order.normalizedStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(order._id, 'confirmed')}
                          className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order._id, 'cancelled')}
                          className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {order.normalizedStatus === 'confirmed' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, 'delivered')}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700"
                      >
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingBag size={18} className="text-blue-600" />
              Restock Items
            </h2>
            <div className="space-y-4 max-h-[420px] overflow-y-auto">
              {items.map((item) => (
                <div key={item._id} className="border border-gray-200 rounded-xl p-3">
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500 mb-2">Current Stock: {item.stockQuantity}</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={restockQty[item._id] || ''}
                      onChange={(e) => setRestockQty((prev) => ({ ...prev, [item._id]: e.target.value }))}
                      className="w-full p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg"
                      placeholder="Qty"
                    />
                    <button
                      onClick={() => restockItem(item._id)}
                      className="px-3 py-2 rounded-lg text-sm font-semibold bg-orange-600 text-white hover:bg-orange-700 flex items-center gap-1"
                    >
                      <RotateCcw size={14} />
                      Restock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <PackageCheck size={18} className="text-green-600" />
              Stock Activity
            </h2>
            <div className="space-y-3 max-h-[260px] overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-sm text-gray-500">No stock logs yet.</p>
              ) : (
                logs.slice(0, 20).map((log) => (
                  <div key={log._id} className="text-xs border border-gray-100 rounded-lg p-2">
                    <p className="font-semibold text-gray-900">{log.itemName}</p>
                    <p className="text-gray-600 capitalize">{log.action.replaceAll('_', ' ')}</p>
                    <p className="text-gray-500">
                      {log.previousStock} to {log.newStock} ({log.quantityChange > 0 ? '+' : ''}{log.quantityChange})
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomemadeOrdersPage;
