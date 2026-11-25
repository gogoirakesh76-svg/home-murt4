import React, { useEffect, useState } from 'react';
import { Check, Plus, ShieldAlert, ShieldCheck, Trash2, X } from 'lucide-react';
import { api } from '../../lib/api';
import { formatCurrency, ORDER_STATUS_SEQUENCE } from '../../utils/commerce';
import type { Address, Coupon, Order, ReturnRequest, User } from '../../types';

export function AdminOrdersTab({
  onToast,
  onChanged,
}: {
  onToast: (msg: string, type?: 'success' | 'error') => void;
  onChanged: () => void;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = () => {
    setLoading(true);
    api
      .adminGetOrders()
      .then((res) => setOrders(res.orders))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      await api.adminUpdateOrderStatus(orderId, status);
      onToast(`Order updated to ${status.replace(/_/g, ' ')}.`);
      loadOrders();
      onChanged();
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Status update failed', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold text-[#0B1914]">
        All Orders ({orders.length})
      </h2>
      <div className="space-y-4">
        {loading ? (
          <div className="h-40 bg-[#F4F6F4] rounded-xl animate-pulse" />
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-[#E5EAE7] rounded-xl p-5 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#E5EAE7]">
                <div className="space-y-0.5">
                  <p className="font-mono text-sm font-bold text-[#0B1914]">{order.orderCode}</p>
                  <p className="text-xs text-[#6B7280]">
                    {order.user?.name} ({order.user?.email}) · {order.paymentMethod} ({order.paymentStatus})
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-[#0B1914] tabular-nums">
                    {formatCurrency(order.totalAmount)}
                  </span>
                  <label className="sr-only" htmlFor={`status-${order.id}`}>
                    Order status for {order.orderCode}
                  </label>
                  <select
                    id={`status-${order.id}`}
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className="h-9 px-3 text-xs font-semibold bg-[#F8FAF9] border border-[#D1DBD5] rounded-lg"
                  >
                    {[...ORDER_STATUS_SEQUENCE, 'CANCELLED'].map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#4B5563]">
                <div>
                  <p className="font-semibold text-[#111827] mb-1">Delivery Address</p>
                  <p>
                    {order.shippingAddress.fullName} ({order.shippingAddress.phone})
                  </p>
                  <p>
                    {order.shippingAddress.line1}, {order.shippingAddress.city},{' '}
                    {order.shippingAddress.state} — {order.shippingAddress.postalCode}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-[#111827] mb-1">Items</p>
                  {order.items.map((item) => (
                    <p key={item.id} className="tabular-nums">
                      {item.quantity} × {item.productName} ({formatCurrency(item.price)})
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function AdminReturnsTab({
  onToast,
  onChanged,
}: {
  onToast: (msg: string, type?: 'success' | 'error') => void;
  onChanged: () => void;
}) {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReturns = () => {
    setLoading(true);
    api
      .adminGetReturns()
      .then((res) => setReturns(res.returns))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReturns();
  }, []);

  const resolve = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.adminResolveReturn(
        id,
        status,
        status === 'APPROVED' ? 'Approved by HOME MURT support' : 'Request declined after review'
      );
      onToast(`Return request ${status.toLowerCase()}.`);
      loadReturns();
      onChanged();
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Action failed', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold text-[#0B1914]">
        Return &amp; Replacement Requests ({returns.length})
      </h2>
      {loading ? (
        <div className="h-32 bg-[#F4F6F4] rounded-xl animate-pulse" />
      ) : returns.length === 0 ? (
        <p className="text-sm text-[#6B7280] bg-white border border-[#E5EAE7] rounded-xl p-6">
          No return requests submitted yet.
        </p>
      ) : (
        <div className="space-y-3">
          {returns.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-[#E5EAE7] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-[#0B1914]">
                    {r.order?.orderCode}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-emerald-800">{r.type}</span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={`font-bold ${
                      r.status === 'APPROVED'
                        ? 'text-emerald-700'
                        : r.status === 'REJECTED'
                        ? 'text-red-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#111827]">{r.reason}</p>
                {r.comments && <p className="text-xs text-[#4B5563]">{r.comments}</p>}
                <p className="text-xs text-[#6B7280]">
                  Customer: {r.user?.name} ({r.user?.email})
                </p>
              </div>

              {r.status === 'PENDING' && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => resolve(r.id, 'APPROVED')}
                    className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => resolve(r.id, 'REJECTED')}
                    className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminCouponsTab({
  onToast,
}: {
  onToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountPercent, setDiscountPercent] = useState('15');
  const [minOrderAmount, setMinOrderAmount] = useState('1000');
  const [maxDiscount, setMaxDiscount] = useState('600');
  const [expiresAt, setExpiresAt] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  const loadCoupons = () => {
    api
      .adminGetCoupons()
      .then((res) => setCoupons(res.coupons))
      .catch(() => {});
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.adminCreateCoupon({
        code: code.trim().toUpperCase(),
        description: description.trim(),
        discountPercent: Number(discountPercent),
        minOrderAmount: Number(minOrderAmount),
        maxDiscount: Number(maxDiscount),
        expiresAt,
      });
      setCode('');
      setDescription('');
      onToast('Coupon created.');
      loadCoupons();
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to create coupon', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-lg font-bold text-[#0B1914]">Offers &amp; Coupons</h2>

      <form
        onSubmit={handleCreate}
        className="bg-[#F8FAF9] border border-[#E5EAE7] rounded-xl p-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end"
      >
        <div>
          <label className="block text-xs font-semibold text-[#374151] mb-1">Coupon Code *</label>
          <input
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="FESTIVE15"
            className="w-full h-10 px-3 text-sm font-mono uppercase bg-white border border-[#D1DBD5] rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#374151] mb-1">Offer % *</label>
          <input
            type="number"
            required
            min={1}
            max={90}
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            className="w-full h-10 px-3 text-sm bg-white border border-[#D1DBD5] rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#374151] mb-1">Min Order (₹)</label>
          <input
            type="number"
            min={0}
            value={minOrderAmount}
            onChange={(e) => setMinOrderAmount(e.target.value)}
            className="w-full h-10 px-3 text-sm bg-white border border-[#D1DBD5] rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#374151] mb-1">Max Cap (₹)</label>
          <input
            type="number"
            min={0}
            value={maxDiscount}
            onChange={(e) => setMaxDiscount(e.target.value)}
            className="w-full h-10 px-3 text-sm bg-white border border-[#D1DBD5] rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#374151] mb-1">Expiry Date *</label>
          <input
            type="date"
            required
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full h-10 px-3 text-sm bg-white border border-[#D1DBD5] rounded-lg"
          />
        </div>
        <button
          type="submit"
          className="h-10 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Create</span>
        </button>
      </form>

      <div className="bg-white border border-[#E5EAE7] rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#F8FAF9] text-xs text-[#6B7280] border-b border-[#E5EAE7]">
            <tr>
              <th className="px-4 py-3 font-semibold">Code</th>
              <th className="px-4 py-3 font-semibold text-right">Discount</th>
              <th className="px-4 py-3 font-semibold text-right">Min Order</th>
              <th className="px-4 py-3 font-semibold">Expires</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5EAE7]">
            {coupons.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-mono font-bold text-emerald-800">{c.code}</td>
                <td className="px-4 py-3 text-right tabular-nums">{c.discountPercent}%</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(c.minOrderAmount)}</td>
                <td className="px-4 py-3 text-xs tabular-nums">
                  {new Date(c.expiresAt).toLocaleDateString('en-IN')}
                </td>
                <td className="px-4 py-3 text-xs font-semibold">
                  {c.isActive ? (
                    <span className="text-emerald-700">Active</span>
                  ) : (
                    <span className="text-[#6B7280]">Paused</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await api.adminToggleCoupon(c.id);
                      loadCoupons();
                    }}
                    className="text-xs font-semibold text-[#0B1914] hover:underline"
                  >
                    {c.isActive ? 'Pause' : 'Enable'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await api.adminDeleteCoupon(c.id);
                      loadCoupons();
                    }}
                    aria-label={`Delete coupon ${c.code}`}
                    className="text-red-700 hover:text-red-800 inline-flex align-middle"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminUsersTab({
  onToast,
}: {
  onToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [users, setUsers] = useState<User[]>([]);

  const loadUsers = () => {
    api
      .adminGetUsers()
      .then((res) => setUsers(res.users))
      .catch(() => {});
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleBlock = async (u: User) => {
    try {
      await api.adminToggleBlockUser(u.id);
      onToast(`${u.name} ${u.isBlocked ? 'unblocked' : 'blocked'}.`);
      loadUsers();
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Action failed', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold text-[#0B1914]">
        Registered Users ({users.length})
      </h2>
      <div className="bg-white border border-[#E5EAE7] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F8FAF9] text-xs text-[#6B7280] border-b border-[#E5EAE7]">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email / Phone</th>
                <th className="px-4 py-3 font-semibold text-right">Orders</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAE7]">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-semibold text-[#0B1914]">{u.name}</td>
                  <td className="px-4 py-3 text-xs text-[#4B5563]">
                    {u.email}
                    {u.phone && <span className="block">{u.phone}</span>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{u.orderCount ?? 0}</td>
                  <td className="px-4 py-3 text-xs font-semibold">
                    {u.isBlocked ? (
                      <span className="text-red-700">Blocked</span>
                    ) : (
                      <span className="text-emerald-700">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => toggleBlock(u)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg ${
                        u.isBlocked
                          ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          : 'bg-red-50 text-red-800 hover:bg-red-100'
                      }`}
                    >
                      {u.isBlocked ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                      <span>{u.isBlocked ? 'Unblock' : 'Block'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AdminAddressesTab() {
  const [addresses, setAddresses] = useState<Address[]>([]);

  useEffect(() => {
    api
      .adminGetAddresses()
      .then((res) => setAddresses(res.addresses))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold text-[#0B1914]">
        User Delivery Addresses ({addresses.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div key={addr.id} className="bg-white border border-[#E5EAE7] rounded-xl p-4 text-sm space-y-1">
            <p className="font-semibold text-[#0B1914]">
              {addr.fullName} · <span className="font-normal text-[#4B5563]">{addr.phone}</span>
            </p>
            <p className="text-xs text-[#4B5563]">
              {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} — {addr.postalCode}
            </p>
            {addr.user && (
              <p className="text-xs text-[#6B7280] pt-1">
                Account: {addr.user.name} ({addr.user.email})
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
