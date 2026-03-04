import React, { useEffect, useState } from 'react';
import { Loader2, ShoppingBag, Store, PackageCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomemadeStorePage = () => {
  const navigate = useNavigate();
  const rupee = '\u20B9';
  const [items, setItems] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState('');

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const [itemsRes, ordersRes] = await Promise.all([
        fetch('http://localhost:5000/api/customer/homemade-items', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/customer/homemade-orders', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData);
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setMyOrders(ordersData);
      }
    } catch (error) {
      console.error('Error fetching homemade marketplace data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const placeOrder = async (itemId) => {
    try {
      setIsSubmitting(itemId);
      const token = localStorage.getItem('token');
      const quantity = Math.max(1, Number(quantities[itemId] || 1));

      const response = await fetch('http://localhost:5000/api/customer/homemade-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ itemId, quantity })
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || 'Failed to place order.');
        return;
      }

      alert('Order placed successfully.');
      await fetchData();
    } catch (error) {
      console.error('Error placing homemade order:', error);
      alert('Server error while placing order.');
    } finally {
      setIsSubmitting('');
    }
  };

  const getStatusClass = (status) => {
    const value = String(status || '').toLowerCase();
    if (value === 'placed') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (value === 'confirmed') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (value === 'delivered') return 'bg-green-100 text-green-700 border-green-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-gray-600">
        <Loader2 size={20} className="animate-spin" />
        Loading homemade store...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Homemade Store</h1>
        <p className="text-gray-500 mt-1">Order homemade products directly from trusted vendors.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <PackageCheck size={20} className="text-green-600" />
          My Homemade Orders
        </h2>
        {myOrders.length === 0 ? (
          <p className="text-sm text-gray-500">No homemade orders yet.</p>
        ) : (
          <div className="space-y-3">
            {myOrders.slice(0, 5).map((order) => (
              <div key={order._id} className="border border-gray-100 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{order.itemName} x {order.quantity}</p>
                  <p className="text-sm text-gray-500">{order.vendorName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-orange-600">{rupee}{order.totalAmount}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold capitalize ${getStatusClass(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Store size={20} className="text-orange-600" />
          Available Products
        </h2>
        {items.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
            No homemade products are available right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((item) => (
              <div key={item._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <img
                  src={item.imageUrl || 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=800&q=80'}
                  alt={item.name}
                  className="w-full h-44 object-cover"
                />
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.vendorName} • {item.serviceArea}</p>
                    </div>
                    <span className="text-sm font-semibold px-2 py-1 rounded bg-orange-50 text-orange-700 border border-orange-100">
                      {item.category}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600">{item.description || 'Fresh homemade item from vendor.'}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-orange-600">{rupee}{item.price}</p>
                    <p className="text-xs text-gray-500">{item.unit}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">Stock: {item.stockQuantity}</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max={item.stockQuantity}
                        value={quantities[item._id] || 1}
                        onChange={(e) =>
                          setQuantities((prev) => ({ ...prev, [item._id]: e.target.value }))
                        }
                        className="w-16 p-2 border border-gray-200 rounded-lg text-sm"
                      />
                      <button
                        onClick={() => placeOrder(item._id)}
                        disabled={isSubmitting === item._id}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
                      >
                        <ShoppingBag size={16} />
                        {isSubmitting === item._id ? 'Ordering...' : 'Order'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomemadeStorePage;
