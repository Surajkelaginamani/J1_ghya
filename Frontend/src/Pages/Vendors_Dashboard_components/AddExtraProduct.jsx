import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, Package, Store, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AddExtraProduct = () => {
  const navigate = useNavigate();
  const rupee = '\u20B9';

  const [form, setForm] = useState({
    name: '',
    category: 'Pickle',
    price: '',
    unit: 'per jar (500g)',
    description: '',
    imageUrl: '',
    stockQuantity: 1,
    inStock: true
  });

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const parseApiResponse = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }
    const text = await response.text();
    return { message: text || 'Unexpected server response.' };
  };

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/vendor/homemade-items', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await parseApiResponse(response);
        setItems(data);
      } else if (response.status === 404) {
        alert('Homemade inventory API not found on backend. Restart backend server and try again.');
      }
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/vendor/homemade-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          stockQuantity: Number(form.stockQuantity)
        })
      });

      const data = await parseApiResponse(response);
      if (!response.ok) {
        alert(data.message || 'Failed to add item.');
        return;
      }

      setForm({
        name: '',
        category: 'Pickle',
        price: '',
        unit: 'per jar (500g)',
        description: '',
        imageUrl: '',
        stockQuantity: 1,
        inStock: true
      });
      await fetchItems();
      alert('Item added to inventory.');
    } catch (error) {
      console.error('Error adding inventory item:', error);
      alert(`Request failed: ${error.message}. Check backend server on http://localhost:5000.`);
    } finally {
      setIsSaving(false);
    }
  };

  const updateItem = async (itemId, patch) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/vendor/homemade-items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(patch)
      });

      if (!response.ok) {
        const data = await parseApiResponse(response);
        alert(data.message || 'Failed to update item.');
        return;
      }
      await fetchItems();
    } catch (error) {
      console.error('Error updating inventory item:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/Ven_Dashboard')}
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors shadow-sm"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Homemade Inventory</h1>
              <p className="text-gray-500 text-sm">Add products that customers can directly order.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/homemade-orders')}
            className="px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-bold rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            Manage Orders & Restock
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form onSubmit={handleSubmit} className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package size={18} className="text-orange-600" />
              Add Homemade Item
            </h2>

            <input
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Product Name"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
            />

            <select
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
            >
              <option>Pickle</option>
              <option>Papad / Fryums</option>
              <option>Traditional Sweets</option>
              <option>Dry Snacks</option>
              <option>Beverages / Syrups</option>
              <option>Other</option>
            </select>

            <div className="flex gap-2">
              <input
                required
                type="number"
                min="1"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="Price"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
              />
              <input
                value={form.unit}
                onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
                placeholder="Unit"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
              />
            </div>

            <input
              type="number"
              min="0"
              value={form.stockQuantity}
              onChange={(e) => setForm((prev) => ({ ...prev, stockQuantity: e.target.value }))}
              placeholder="Stock Quantity"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
            />

            <input
              value={form.imageUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="Image URL (optional)"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
            />

            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Description"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl h-24 resize-none"
            />

            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={form.inStock}
                onChange={(e) => setForm((prev) => ({ ...prev, inStock: e.target.checked }))}
              />
              Available for orders
            </label>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <CheckCircle size={18} />
              {isSaving ? 'Saving...' : 'Add to Inventory'}
            </button>
          </form>

          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Store size={18} className="text-blue-600" />
              Your Inventory
            </h2>

            {isLoading ? (
              <div className="text-gray-500 text-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Loading inventory...
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-gray-500">No homemade items added yet.</p>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item._id} className="border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="font-bold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.category}</p>
                      <p className="text-sm text-orange-600 font-semibold">
                        {rupee}{item.price} • {item.unit}
                      </p>
                      <p className="text-xs text-gray-500">Stock: {item.stockQuantity}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateItem(item._id, { inStock: !item.inStock })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                          item.inStock
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {item.inStock ? 'In Stock' : 'Out of Stock'}
                      </button>

                      <button
                        onClick={() => updateItem(item._id, { isActive: !item.isActive })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                          item.isActive
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {item.isActive ? 'Active' : 'Hidden'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddExtraProduct;
