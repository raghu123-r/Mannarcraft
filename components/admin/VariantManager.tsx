'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Variant {
  _id?: string;
  name: string;
  sku?: string;
  price: number;
  mrp: number;
  stock: number;
  attributes?: Record<string, string>;
  isActive: boolean;
}

interface VariantManagerProps {
  productId: string;
}

export default function VariantManager({ productId }: VariantManagerProps) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [formData, setFormData] = useState<Variant>({
    name: '',
    price: 0,
    mrp: 0,
    stock: 0,
    isActive: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://mk-backend-a6c7.onrender.com/api';

  useEffect(() => {
    loadVariants();
  }, [productId]);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const loadVariants = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/admin/products/${productId}/variants`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setVariants(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load variants:', error);
      toast.error('Failed to load variants');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.price <= 0 || formData.mrp <= 0) {
      toast.error('Please fill all required fields');
      return;
    }

    if (formData.price > formData.mrp) {
      toast.error('Price cannot be greater than MRP');
      return;
    }

    try {
      const url = editingId
        ? `${API_BASE}/admin/products/${productId}/variants/${editingId}`
        : `${API_BASE}/admin/products/${productId}/variants`;

      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(editingId ? 'Variant updated!' : 'Variant created!');
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', price: 0, mrp: 0, stock: 0, isActive: true });
        loadVariants();
      } else {
        toast.error(data.message || 'Failed to save variant');
      }
    } catch (error) {
      console.error('Error saving variant:', error);
      toast.error('Failed to save variant');
    }
  };

  const handleEdit = (variant: Variant) => {
    setFormData({
      name: variant.name,
      sku: variant.sku,
      price: variant.price,
      mrp: variant.mrp,
      stock: variant.stock,
      isActive: variant.isActive,
    });
    setEditingId(variant._id || null);
    setShowForm(true);
  };

  const handleDelete = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;

    try {
      const res = await fetch(`${API_BASE}/admin/products/${productId}/variants/${variantId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Variant deleted!');
        loadVariants();
      } else {
        toast.error(data.message || 'Failed to delete variant');
      }
    } catch (error) {
      console.error('Error deleting variant:', error);
      toast.error('Failed to delete variant');
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setShowAdvanced(false);
    setFormData({ name: '', price: 0, mrp: 0, stock: 0, isActive: true });
  };

  if (loading) {
    return <div className="p-4">Loading variants...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Available Sizes & Prices</h3>
        <button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm"
        >
          + Add Size
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-semibold mb-3">{editingId ? 'Edit Size' : 'Add New Size'}</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">
                Size / Capacity <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g. 26 cm – 3.5 Litres"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Example: 18 cm – 1.3 L, 26 cm – 3.5 L, Small, Medium, Large
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Selling Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Original Price (MRP ₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Available Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
                required
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Available for Sale</span>
              </label>
            </div>

            {/* Advanced Options Toggle */}
            <div className="col-span-2">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                Show advanced options
              </button>
            </div>

            {/* SKU Field - Hidden by default */}
            {showAdvanced && (
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                  SKU <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.sku || ''}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Optional product code"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
              {editingId ? 'Update' : 'Add Size'}
            </button>
            <button type="button" onClick={cancelForm} className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">
              Cancel
            </button>
          </div>
        </form>
      )}

      {variants.length === 0 ? (
        <p className="text-gray-500 text-sm">No sizes added yet. Add different sizes or capacities to offer more options to customers.</p>
      ) : (
        <div className="space-y-2">
          {variants.map((variant) => (
            <div key={variant._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <div className="font-medium">{variant.name}</div>
                <div className="text-sm text-gray-600">
                  Selling: ₹{variant.price} | MRP: ₹{variant.mrp} | Stock: {variant.stock}
                  {!variant.isActive && <span className="ml-2 text-red-600">(Not Available)</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(variant)}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(variant._id!)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
