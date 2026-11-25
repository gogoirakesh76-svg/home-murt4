import React from 'react';
import { AlertTriangle, IndianRupee, Package, ShoppingCart, Users } from 'lucide-react';
import { formatCurrency } from '../../utils/commerce';
import type { AdminDashboardData } from '../../types';

export function AdminDashboardTab({
  data,
  onNavigateTab,
}: {
  data: AdminDashboardData | null;
  onNavigateTab: (tab: 'products' | 'orders' | 'returns') => void;
}) {
  if (!data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-24 bg-[#F4F6F4] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-[#F4F6F4] rounded-xl animate-pulse" />
      </div>
    );
  }

  const { stats, chartSeries, lowStockProducts, recentOrders } = data;
  const maxRevenue = Math.max(1000, ...chartSeries.map((d) => d.revenue));
  const maxOrders = Math.max(1, ...chartSeries.map((d) => d.orders));

  const kpis = [
    { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: IndianRupee },
    { label: 'Total Orders', value: String(stats.totalOrders), icon: ShoppingCart },
    { label: 'Registered Users', value: String(stats.totalUsers), icon: Users },
    { label: 'Active Products', value: String(stats.totalProducts), icon: Package },
    {
      label: 'Low Stock (≤5)',
      value: String(stats.lowStockCount),
      icon: AlertTriangle,
      warn: stats.lowStockCount > 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white border border-[#E5EAE7] rounded-xl p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-xs font-medium">{kpi.label}</span>
              <kpi.icon className={`w-4 h-4 ${kpi.warn ? 'text-amber-600' : 'text-emerald-700'}`} />
            </div>
            <p
              className={`font-display text-2xl font-bold mt-2 tabular-nums ${
                kpi.warn ? 'text-amber-700' : 'text-[#0B1914]'
              }`}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Orders & Revenue Graph + Low Stock Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-[#E5EAE7] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#0B1914]">
                Recent Orders &amp; Revenue (Last 7 Days)
              </h2>
              <p className="text-xs text-[#6B7280]">Daily order volume and non-cancelled revenue</p>
            </div>
            {stats.pendingReturns > 0 && (
              <button
                type="button"
                onClick={() => onNavigateTab('returns')}
                className="text-xs font-semibold text-amber-700 hover:underline tabular-nums"
              >
                {stats.pendingReturns} pending return{stats.pendingReturns > 1 ? 's' : ''}
              </button>
            )}
          </div>

          <div className="grid grid-cols-7 gap-2 items-end h-48 pt-4 border-b border-[#E5EAE7]">
            {chartSeries.map((day) => {
              const revHeight = day.revenue > 0 ? Math.max(10, Math.round((day.revenue / maxRevenue) * 140)) : 3;
              const ordHeight = day.orders > 0 ? Math.max(6, Math.round((day.orders / maxOrders) * 40)) : 3;
              return (
                <div key={day.label} className="flex flex-col items-center justify-end h-full gap-1.5 group">
                  <div className="text-[10px] font-mono text-[#4B5563] opacity-90 tabular-nums text-center">
                    {day.orders > 0 ? `${day.orders} ord` : '—'}
                  </div>
                  <div className="w-full flex items-end justify-center gap-1 flex-1">
                    <div
                      title={`${day.label}: ${formatCurrency(day.revenue)}`}
                      style={{ height: `${revHeight}px` }}
                      className={`w-4 sm:w-6 rounded-t transition-all ${
                        day.revenue > 0 ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-[#E5EAE7]'
                      }`}
                    />
                    <div
                      title={`${day.label}: ${day.orders} orders`}
                      style={{ height: `${ordHeight}px` }}
                      className={`w-2 rounded-t ${day.orders > 0 ? 'bg-[#0B1914]' : 'bg-[#E5EAE7]'}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-7 gap-2 pt-2">
            {chartSeries.map((day) => (
              <span key={day.label} className="text-[11px] text-[#6B7280] text-center truncate tabular-nums">
                {day.label}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-5 mt-4 text-xs text-[#4B5563]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-700 inline-block" />
              Revenue
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#0B1914] inline-block" />
              Order Count
            </span>
          </div>
        </div>

        {/* Low Stock List */}
        <div className="lg:col-span-5 bg-white border border-[#E5EAE7] rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-bold text-[#0B1914]">
              Low Stock Alerts
            </h2>
            <button
              type="button"
              onClick={() => onNavigateTab('products')}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Manage Stock
            </button>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-[#6B7280] py-6">All products have healthy stock levels (&gt;5 units).</p>
          ) : (
            <div className="divide-y divide-[#E5EAE7]">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-[#111827] truncate">{p.name}</p>
                    <p className="text-xs text-[#6B7280] font-mono">{p.sku}</p>
                  </div>
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md tabular-nums shrink-0">
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white border border-[#E5EAE7] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5EAE7] flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-[#0B1914]">Recent Orders</h2>
          <button
            type="button"
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            View All Orders
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F8FAF9] text-xs text-[#6B7280] border-b border-[#E5EAE7]">
              <tr>
                <th className="px-4 py-3 font-semibold">Order ID</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5EAE7]">
              {recentOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-[#F8FAF9]">
                  <td className="px-4 py-3 font-mono font-semibold text-[#0B1914]">{ord.orderCode}</td>
                  <td className="px-4 py-3 text-[#374151]">{ord.user?.name || ord.shippingAddress.fullName}</td>
                  <td className="px-4 py-3 font-medium text-emerald-800">{ord.status.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-xs text-[#6B7280]">{ord.paymentMethod}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {formatCurrency(ord.totalAmount)}
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
