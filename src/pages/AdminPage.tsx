import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  Package,
  RotateCcw,
  ShoppingCart,
  Tag,
  Users,
} from 'lucide-react';
import { api, setAdminToken } from '../lib/api';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';
import { AdminDashboardTab } from '../components/admin/AdminDashboardTab';
import { AdminProductsTab } from '../components/admin/AdminProductsTab';
import {
  AdminAddressesTab,
  AdminCouponsTab,
  AdminOrdersTab,
  AdminReturnsTab,
  AdminUsersTab,
} from '../components/admin/AdminOperationsTabs';
import type { AdminDashboardData } from '../types';

type AdminTab = 'dashboard' | 'products' | 'orders' | 'returns' | 'offers' | 'users' | 'addresses';

export function AdminPage() {
  const { navigate } = useRouter();
  const { categories, showToast } = useStore();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminUser, setAdminUser] = useState<{ email: string; role: string } | null>(null);
  const [setupMode, setSetupMode] = useState<'env' | 'claimed' | 'unclaimed'>('env');
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDashboard = useCallback(() => {
    api
      .getAdminDashboard()
      .then((res) => setDashboardData(res))
      .catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([
      api.getAdminStatus().catch(() => ({ configured: true, mode: 'env' as const })),
      api.getAdminSession().catch(() => ({ admin: null })),
    ])
      .then(([statusRes, meRes]) => {
        setSetupMode(statusRes.mode);
        if (meRes?.admin) {
          setAdminUser(meRes.admin);
          fetchDashboard();
        }
      })
      .finally(() => setCheckingAuth(false));
  }, [fetchDashboard]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSubmitting(true);
    try {
      const res =
        setupMode === 'unclaimed'
          ? await api.setupFirstAdmin({ email: email.trim(), password })
          : await api.adminLogin({ email: email.trim(), password });

      setAdminToken(res.token);
      setAdminUser(res.admin);
      setSetupMode(setupMode === 'unclaimed' ? 'claimed' : setupMode);
      fetchDashboard();
      showToast('Signed in to HOME MURT Admin Console.');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.adminLogout();
    } finally {
      setAdminToken(null);
      setAdminUser(null);
      setDashboardData(null);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0B1914] flex items-center justify-center text-white text-sm">
        Verifying admin session...
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-[#0B1914] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <span className="font-display text-lg font-extrabold text-[#0B1914]">
              HOME <span className="text-emerald-700">MURT</span>
            </span>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs font-semibold text-[#4B5563] hover:text-[#0B1914] inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Storefront</span>
            </button>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1">
              <Lock className="w-3.5 h-3.5" />
              <span>Protected Admin Console</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-[#0B1914]">
              {setupMode === 'unclaimed' ? 'Claim Admin Account' : 'Administrator Sign In'}
            </h1>
            <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
              {setupMode === 'unclaimed'
                ? 'No ADMIN_EMAIL / ADMIN_PASSWORD_HASH env variables are set yet. Create your first-run admin credentials below to lock setup.'
                : 'Sign in using your configured administrator email and password.'}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-semibold text-[#374151] mb-1">
                Admin Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@homemurt.com"
                className="w-full h-11 px-3 text-sm border border-[#D1DBD5] rounded-lg focus:outline-none focus:border-emerald-700"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold text-[#374151] mb-1">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                minLength={setupMode === 'unclaimed' ? 8 : 4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={setupMode === 'unclaimed' ? 'Minimum 8 characters' : 'Enter admin password'}
                className="w-full h-11 px-3 text-sm border border-[#D1DBD5] rounded-lg focus:outline-none focus:border-emerald-700"
              />
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-[#0B1914] hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {submitting
                ? 'Authenticating...'
                : setupMode === 'unclaimed'
                ? 'Set Up & Enter Console'
                : 'Sign In to Admin'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const navItems: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'returns', label: 'Returns', icon: RotateCcw },
    { id: 'offers', label: 'Offers & Coupons', icon: Tag },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col lg:flex-row">
      {/* Dark Forest Sidebar */}
      <aside className="lg:w-64 bg-[#0B1914] text-white shrink-0 flex flex-col justify-between p-4 lg:p-5">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="font-display text-lg font-extrabold tracking-tight">
              HOME <span className="text-emerald-400">MURT</span>
            </span>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs text-gray-300 hover:text-white inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Store</span>
            </button>
          </div>

          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-emerald-700 text-white'
                      : 'text-gray-300 hover:bg-[#162C24] hover:text-white'
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:block pt-6 border-t border-[#183028] space-y-3">
          <div className="text-xs">
            <p className="text-gray-400">Signed in as</p>
            <p className="font-medium text-white truncate">{adminUser.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold bg-[#162C24] hover:bg-red-900/60 text-gray-200 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-[#E5EAE7] px-6 py-4 flex items-center justify-between">
          <h1 className="font-display text-lg font-bold text-[#0B1914]">
            Admin Console / {navItems.find((n) => n.id === activeTab)?.label}
          </h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-3 py-1.5 text-xs font-semibold border border-[#D1DBD5] rounded-lg hover:bg-[#F3F6F4]"
            >
              View Storefront
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="lg:hidden px-3 py-1.5 text-xs font-semibold bg-[#0B1914] text-white rounded-lg"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 max-w-6xl">
          {activeTab === 'dashboard' && (
            <AdminDashboardTab
              data={dashboardData}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}
          {activeTab === 'products' && (
            <AdminProductsTab
              categories={categories}
              onToast={showToast}
              onChanged={fetchDashboard}
            />
          )}
          {activeTab === 'orders' && (
            <AdminOrdersTab onToast={showToast} onChanged={fetchDashboard} />
          )}
          {activeTab === 'returns' && (
            <AdminReturnsTab onToast={showToast} onChanged={fetchDashboard} />
          )}
          {activeTab === 'offers' && <AdminCouponsTab onToast={showToast} />}
          {activeTab === 'users' && <AdminUsersTab onToast={showToast} />}
          {activeTab === 'addresses' && <AdminAddressesTab />}
        </main>
      </div>
    </div>
  );
}
