import React, { useState } from 'react';
import { PackageSearch, Search } from 'lucide-react';
import { api, resolveImageUrl } from '../lib/api';
import { OrderTimeline } from '../components/OrderTimeline';
import { formatCurrency } from '../utils/commerce';
import type { Order } from '../types';

export function TrackOrderPage() {
  const [orderCode, setOrderCode] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLookup = async (codeToFetch?: string) => {
    const code = (codeToFetch ?? orderCode).trim().toUpperCase();
    if (!code) return;
    setOrderCode(code);
    setLoading(true);
    setError('');
    try {
      const res = await api.trackOrder(code);
      setOrder(res.order);
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : 'Order not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLookup();
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 min-h-[70vh] space-y-8">
      <div className="bg-[#0B1914] text-white rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <PackageSearch className="w-7 h-7 text-emerald-400" />
          <div>
            <h1 className="font-display text-2xl font-bold">Track Your Order</h1>
            <p className="text-sm text-gray-300">
              Enter your HOME MURT Order ID to see live dispatch &amp; delivery progress.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <label htmlFor="track-order-input" className="sr-only">
            Order ID
          </label>
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="track-order-input"
              type="text"
              required
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
              placeholder="e.g. HM-2026-1002"
              className="w-full h-11 pl-10 pr-4 text-sm font-mono bg-white text-[#0B1914] rounded-xl focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="h-11 px-6 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
          >
            {loading ? 'Searching...' : 'Track Shipment'}
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-300">
          <span>Try active sample IDs:</span>
          {['HM-2026-1001', 'HM-2026-1002', 'HM-2026-1003', 'HM-2026-1004'].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => handleLookup(sample)}
              className="font-mono px-2.5 py-1 bg-[#162C24] hover:bg-emerald-800 text-emerald-200 rounded-md transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
          {error}
        </div>
      )}

      {order && (
        <section className="bg-white border border-[#E5EAE7] rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E5EAE7]">
            <div>
              <p className="text-xs text-[#6B7280]">Order Reference</p>
              <p className="font-mono text-lg font-bold text-[#0B1914]">{order.orderCode}</p>
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Destination</p>
              <p className="text-sm font-medium text-[#111827]">
                {order.shippingAddress.fullName} · {order.shippingAddress.city}, {order.shippingAddress.state}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Total Amount</p>
              <p className="text-base font-bold text-[#0B1914] tabular-nums">
                {formatCurrency(order.totalAmount)} ({order.paymentMethod})
              </p>
            </div>
          </div>

          <OrderTimeline status={order.status} history={order.trackingHistory} />

          <div className="pt-4 border-t border-[#E5EAE7] space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              Items in Shipment
            </h2>
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <img
                  src={resolveImageUrl(item.productImage)}
                  alt={item.productName}
                  referrerPolicy="no-referrer"
                  className="w-14 h-12 object-cover rounded-lg bg-[#F4F6F4]"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0B1914] truncate">{item.productName}</p>
                  <p className="text-xs text-[#6B7280] tabular-nums">
                    Qty {item.quantity} · {formatCurrency(item.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
