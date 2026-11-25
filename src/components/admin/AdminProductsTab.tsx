import React, { useEffect, useState } from 'react';
import { Edit2, Plus, Trash2, Upload, X } from 'lucide-react';
import { api, resolveImageUrl } from '../../lib/api';
import { computeDiscountPercent, formatCurrency } from '../../utils/commerce';
import type { Category, Product } from '../../types';

export function AdminProductsTab({
  categories,
  onToast,
  onChanged,
}: {
  categories: Category[];
  onToast: (msg: string, type?: 'success' | 'error') => void;
  onChanged: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    mrp: '',
    discountPercent: '',
    stock: '10',
    sku: '',
    categoryId: categories[0]?.id ? String(categories[0].id) : '1',
    images: [] as string[],
    imageUrlInput: '',
    isBestSeller: false,
    isNewArrival: true,
    isFeatured: false,
  });

  const loadProducts = () => {
    setLoading(true);
    api
      .getProducts({ sort: 'newest' })
      .then((res) => setProducts(res.products))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm({
      name: '',
      description: '',
      price: '',
      mrp: '',
      discountPercent: '',
      stock: '15',
      sku: `HM-${Date.now().toString().slice(-4)}`,
      categoryId: categories[0]?.id ? String(categories[0].id) : '1',
      images: ['/src/assets/images/product_smart_lamp_1795528779890.jpg'],
      imageUrlInput: '',
      isBestSeller: false,
      isNewArrival: true,
      isFeatured: false,
    });
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      mrp: String(p.mrp),
      discountPercent: String(p.discountPercent),
      stock: String(p.stock),
      sku: p.sku,
      categoryId: String(p.categoryId),
      images: p.images,
      imageUrlInput: '',
      isBestSeller: p.isBestSeller,
      isNewArrival: p.isNewArrival,
      isFeatured: p.isFeatured,
    });
    setShowForm(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.adminUploadImage(file);
      setForm((prev) => ({ ...prev, images: [...prev.images, res.url] }));
      onToast('Image uploaded.');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const priceNum = Number(form.price);
      const mrpNum = Number(form.mrp || form.price);
      const offerNum =
        form.discountPercent !== ''
          ? Number(form.discountPercent)
          : computeDiscountPercent(priceNum, mrpNum);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: priceNum,
        mrp: mrpNum,
        discountPercent: offerNum,
        stock: Number(form.stock),
        sku: form.sku.trim(),
        categoryId: Number(form.categoryId),
        images: form.images,
        isBestSeller: form.isBestSeller,
        isNewArrival: form.isNewArrival,
        isFeatured: form.isFeatured,
      };

      if (editingId) {
        await api.adminUpdateProduct(editingId, payload);
        onToast('Product updated.');
      } else {
        await api.adminCreateProduct(payload);
        onToast('Product created.');
      }

      setShowForm(false);
      loadProducts();
      onChanged();
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Product) => {
    try {
      await api.adminDeleteProduct(p.id);
      onToast(`Deleted "${p.name}".`);
      loadProducts();
      onChanged();
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-[#0B1914]">
            Products ({products.length})
          </h2>
          <p className="text-xs text-[#6B7280]">Add, edit pricing/offers, upload photos, or update stock</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSave}
          className="bg-[#F8FAF9] border border-[#D8E5DC] rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-[#0B1914]">
              {editingId ? 'Edit Product' : 'New Product'}
            </h3>
            <button type="button" onClick={() => setShowForm(false)} aria-label="Close form">
              <X className="w-4 h-4 text-[#6B7280]" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#374151] mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full h-10 px-3 text-sm bg-white border border-[#D1DBD5] rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Category *</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full h-10 px-3 text-sm bg-white border border-[#D1DBD5] rounded-lg"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">SKU</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full h-10 px-3 text-sm font-mono bg-white border border-[#D1DBD5] rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Selling Price (₹) *</label>
              <input
                type="number"
                required
                min={1}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full h-10 px-3 text-sm bg-white border border-[#D1DBD5] rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">MRP (₹) *</label>
              <input
                type="number"
                required
                min={1}
                value={form.mrp}
                onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                className="w-full h-10 px-3 text-sm bg-white border border-[#D1DBD5] rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Offer %</label>
              <input
                type="number"
                min={0}
                max={95}
                placeholder="Auto from MRP"
                value={form.discountPercent}
                onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                className="w-full h-10 px-3 text-sm bg-white border border-[#D1DBD5] rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Stock *</label>
              <input
                type="number"
                required
                min={0}
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full h-10 px-3 text-sm bg-white border border-[#D1DBD5] rounded-lg"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block text-xs font-semibold text-[#374151] mb-1">Description *</label>
              <textarea
                rows={2}
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full p-3 text-sm bg-white border border-[#D1DBD5] rounded-lg"
              />
            </div>

            {/* Image Upload & URLs */}
            <div className="sm:col-span-2 lg:col-span-4 space-y-2">
              <label className="block text-xs font-semibold text-[#374151]">
                Product Images (Upload file or paste URL)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-white border border-[#D1DBD5] hover:border-emerald-700 rounded-lg cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileUpload} className="hidden" />
                </label>

                <input
                  type="text"
                  value={form.imageUrlInput}
                  onChange={(e) => setForm({ ...form, imageUrlInput: e.target.value })}
                  placeholder="Or paste image path/URL..."
                  className="flex-1 min-w-[200px] h-9 px-3 text-xs bg-white border border-[#D1DBD5] rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!form.imageUrlInput.trim()) return;
                    setForm((prev) => ({
                      ...prev,
                      images: [...prev.images, prev.imageUrlInput.trim()],
                      imageUrlInput: '',
                    }));
                  }}
                  className="px-3 h-9 text-xs font-semibold bg-[#0B1914] text-white rounded-lg"
                >
                  Add URL
                </button>
              </div>

              {form.images.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {form.images.map((url, idx) => (
                    <div key={`${url}-${idx}`} className="relative w-16 h-14 rounded-lg overflow-hidden border border-[#D1DBD5]">
                      <img src={resolveImageUrl(url)} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== idx),
                          }))
                        }
                        aria-label="Remove image"
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/70 text-white rounded-full flex items-center justify-center text-[10px]"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-5 text-xs font-medium text-[#374151]">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isBestSeller}
                  onChange={(e) => setForm({ ...form, isBestSeller: e.target.checked })}
                  className="accent-emerald-700"
                />
                Best Seller
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isNewArrival}
                  onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })}
                  className="accent-emerald-700"
                />
                New Arrival
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                  className="accent-emerald-700"
                />
                Featured
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-xs font-semibold border border-[#D1DBD5] rounded-lg bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg"
            >
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      )}

      {/* Products Table */}
      <div className="bg-white border border-[#E5EAE7] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F8FAF9] text-xs text-[#6B7280] border-b border-[#E5EAE7]">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold text-right">Price / MRP</th>
                <th className="px-4 py-3 font-semibold text-right">Offer</th>
                <th className="px-4 py-3 font-semibold text-right">Stock</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAE7]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-[#6B7280]">
                    Loading products...
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8FAF9]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveImageUrl(p.images[0])}
                          alt={p.name}
                          className="w-11 h-9 object-cover rounded bg-[#F4F6F4] shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0B1914] truncate max-w-[240px]">{p.name}</p>
                          <p className="text-xs font-mono text-[#6B7280]">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#4B5563]">{p.category?.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className="font-semibold text-[#0B1914]">{formatCurrency(p.price)}</span>
                      <span className="text-xs text-[#6B7280] line-through ml-1.5">{formatCurrency(p.mrp)}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-semibold text-emerald-700 tabular-nums">
                      {p.discountPercent}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      <span className={p.stock <= 5 ? 'text-amber-700 font-bold' : 'text-[#111827]'}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          aria-label={`Edit ${p.name}`}
                          className="p-1.5 text-[#374151] hover:text-emerald-700 hover:bg-[#EEF4F0] rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          aria-label={`Delete ${p.name}`}
                          className="p-1.5 text-[#374151] hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
