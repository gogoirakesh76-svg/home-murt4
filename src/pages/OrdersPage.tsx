import React, { useEffect, useState } from 'react';
import { CheckCircle2, Package, RotateCcw, X } from 'lucide-react';
import { api, resolveImageUrl } from '../lib/api';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';
import { OrderTimeline } from '../components/OrderTimeline';
import { formatCurrency } from '../utils/commerce';
import type { Order } from '../types';

export function OrdersPage() {
  const { search, navigate } = useRouter();
  const { user, authLoading, showToast } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [returnOrder, setReturnOrder] = useState<Order | null>(null);
  const [returnType, setReturnType] = useState<'RETURN' | 'REPLACE'>('RETURN');
  const [returnReason, setReturnReason] = useState('Item damaged or scuffed on arrival');
  const [returnComments, setReturnComments] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const placedOrderCode = new URLSearchParams(search).get('placed');

  const fetchOrders = () => {
    setLoading(true);
    api
      .getMyOrders()
      .then((res) => setOrders(res.orders))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchOrders();
  }, [user]);

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnOrder) return;
    setSubmittingReturn(true);
    try {
      await api.requestReturn(returnOrder.id, {
        type: returnType,
        reason: returnReason,
        comments: returnComments,
      });
      showToast(`${returnType === 'RETURN' ? 'Return' : 'Replacement'} request submitted.`);
      setReturnOrder(null);
      setReturnComments('');
      fetchOrders();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to submit return request', 'error');
    } finally {
      setSubmittingReturn(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-4">
        {[1, 2].map((n) => (
          <div key={n} className="h-52 bg-[#F4F6F4] rounded-2xl animate-pulse" />
        ))}
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center">
        <Package className="w-10 h-10 text-emerald-700 mx-auto mb-3" />
        <h1 className="font-display text-2xl font-bold text-[#0B1914]">Sign in to view your orders</h1>
        <p className="text-sm text-[#6B7280] mt-2">
          Or track a specific shipment immediately using your Order ID.
        </p>
        <div className="flex justify-center gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/login?redirect=/orders')}
            className="px-6 py-2.5 text-sm font-semibold bg-emerald-700 text-white rounded-xl"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => navigate('/track-order')}
            className="px-6 py-2.5 text-sm font-semibold border border-[#D1DBD5] text-[#0B1914] rounded-xl"
          >
            Track by Order ID
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5EAE7]">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1914]">
            My Orders
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Live shipment timelines, invoices, and return requests
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="px-4 py-2 text-xs font-semibold bg-[#0B1914] hover:bg-emerald-800 text-white rounded-lg self-start"
        >
          Continue Shopping
        </button>
      </div>

      {placedOrderCode && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-900">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">
              Order <span className="font-mono">{placedOrderCode}</span> confirmed!
            </p>
            <p className="text-xs text-emerald-800 mt-0.5">
              We are preparing your shipment. Live status updates appear below.
            </p>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-[#F8FAF9] border border-[#E5EAE7] rounded-2xl p-10 text-center">
          <p className="font-display text-lg font-semibold text-[#0B1914]">No orders placed yet</p>
          <p className="text-sm text-[#6B7280] mt-1">
            Once you place an order, you can track delivery and request returns here.
          </p>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="mt-5 px-5 py-2.5 text-sm font-semibold bg-emerald-700 text-white rounded-lg"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const activeReturn = order.returns?.[0];
            return (
              <article
                key={order.id}
                className="bg-white border border-[#E5EAE7] rounded-2xl overflow-hidden"
              >
                <div className="bg-[#F8FAF9] px-5 py-4 border-b border-[#E5EAE7] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-6 text-xs">
                    <div>
                      <span className="text-[#6B7280] block">Order ID</span>
                      <span className="font-mono font-bold text-sm text-[#0B1914]">
                        {order.orderCode}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block">Placed On</span>
                      <span className="font-medium text-[#111827] tabular-nums">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block">Payment</span>
                      <span className="font-medium text-[#111827]">
                        {order.paymentMethod} · {order.paymentStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block">Total</span>
                      <span className="font-bold text-sm text-[#0B1914] tabular-nums">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!activeReturn && order.status !== 'CANCELLED' && (
                      <button
                        type="button"
                        onClick={() => setReturnOrder(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-[#D1DBD5] bg-white hover:border-emerald-700 text-[#0B1914] rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Return / Replace</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-6">
                  {/* Items */}
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <img
                          src={resolveImageUrl(item.productImage)}
                          alt={item.productName}
                          referrerPolicy="no-referrer"
                          className="w-16 h-14 object-cover rounded-lg bg-[#F4F6F4] shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#0B1914] truncate">
                            {item.productName}
                          </p>
                          <p className="text-xs text-[#6B7280] tabular-nums">
                            Qty: {item.quantity} × {formatCurrency(item.price)}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-[#0B1914] tabular-nums">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Shipping summary */}
                  <div className="text-xs text-[#4B5563] bg-[#F8FAF9] px-4 py-3 rounded-xl">
                    <span className="font-semibold text-[#0B1914]">Ship to: </span>
                    {order.shippingAddress.fullName} — {order.shippingAddress.line1},{' '}
                    {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                    {order.shippingAddress.postalCode}
                  </div>

                  {/* Return Request Status Banner */}
                  {activeReturn && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-bold">
                          {activeReturn.type === 'RETURN' ? 'Return' : 'Replacement'} Request ({activeReturn.status}):
                        </span>{' '}
                        {activeReturn.reason}
                        {activeReturn.adminNote && (
                          <span className="block text-amber-800 mt-0.5">
                            Admin Note: {activeReturn.adminNote}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Live Tracking Timeline */}
                  <OrderTimeline status={order.status} history={order.trackingHistory} />
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Return/Replace Modal */}
      {returnOrder && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="return-modal-title"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-[#E5EAE7] rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 id="return-modal-title" className="font-display text-lg font-bold text-[#0B1914]">
                Request Return / Replace
              </h2>
              <button
                type="button"
                onClick={() => setReturnOrder(null)}
                aria-label="Close modal"
                className="p-1 text-[#6B7280]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[#6B7280]">
              Order ID: <span className="font-mono font-semibold text-[#0B1914]">{returnOrder.orderCode}</span>
            </p>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Request Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['RETURN', 'REPLACE'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setReturnType(t)}
                      className={`py-2 text-xs font-semibold rounded-lg border ${
                        returnType === t
                          ? 'bg-[#0B1914] text-white border-[#0B1914]'
                          : 'bg-white text-[#374151] border-[#D1DBD5]'
                      }`}
                    >
                      {t === 'RETURN' ? 'Return & Refund' : 'Replace Item'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="return-reason" className="block text-xs font-semibold text-[#374151] mb-1">
                  Reason
                </label>
                <select
                  id="return-reason"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full h-10 px-3 text-sm border border-[#D1DBD5] rounded-lg"
                >
                  <option>Item damaged or scuffed on arrival</option>
                  <option>Received wrong variant or color</option>
                  <option>Missing parts or accessories</option>
                  <option>Size or finish did not fit my space</option>
                  <option>Product not working as expected</option>
                </select>
              </div>

              <div>
                <label htmlFor="return-comments" className="block text-xs font-semibold text-[#374151] mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  id="return-comments"
                  rows={3}
                  value={returnComments}
                  onChange={(e) => setReturnComments(e.target.value)}
                  placeholder="Describe the issue for faster approval..."
                  className="w-full p-3 text-sm border border-[#D1DBD5] rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setReturnOrder(null)}
                  className="flex-1 h-10 text-xs font-semibold border border-[#D1DBD5] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReturn}
                  className="flex-1 h-10 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg"
                >
                  {submittingReturn ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
