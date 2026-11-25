import React, { useEffect, useState } from 'react';
import { LogOut, MapPin, Plus, Trash2, User as UserIcon } from 'lucide-react';
import { api } from '../lib/api';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';
import type { Address } from '../types';

export function ProfilePage() {
  const { navigate } = useRouter();
  const { user, authLoading, logoutUser, setUserDirect, showToast } = useStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrForm, setAddrForm] = useState({
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: true,
  });

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPhone(user.phone);
    setAddrForm((prev) => ({ ...prev, fullName: user.name, phone: user.phone }));
    api
      .getAddresses()
      .then((res) => setAddresses(res.addresses))
      .catch(() => {});
  }, [user]);

  if (authLoading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="h-48 bg-[#F4F6F4] rounded-2xl animate-pulse" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-[#0B1914]">Sign in to view profile</h1>
        <p className="text-sm text-[#6B7280] mt-2">
          Access your saved addresses, profile details, and order history.
        </p>
        <button
          type="button"
          onClick={() => navigate('/login?redirect=/profile')}
          className="mt-6 px-6 py-3 text-sm font-semibold bg-emerald-700 text-white rounded-xl"
        >
          Sign In
        </button>
      </main>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.updateProfile({ name, phone });
      setUserDirect(res.user);
      showToast('Profile updated.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addAddress(addrForm);
      const res = await api.getAddresses();
      setAddresses(res.addresses);
      setShowAddressForm(false);
      setAddrForm({
        fullName: user.name,
        phone: user.phone,
        line1: '',
        line2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        isDefault: false,
      });
      showToast('Delivery address saved.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add address', 'error');
    }
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      await api.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      showToast('Address removed.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete address', 'error');
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    showToast('Signed out.');
    navigate('/');
  };

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5EAE7]">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1914]">
            Account &amp; Addresses
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">{user.email}</p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-[#D1DBD5] text-[#111827] hover:bg-[#F3F6F4] rounded-lg self-start"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Profile Card */}
        <section className="lg:col-span-5 bg-white border border-[#E5EAE7] rounded-2xl p-6">
          <h2 className="font-display text-lg font-bold text-[#0B1914] inline-flex items-center gap-2 mb-4">
            <UserIcon className="w-4 h-4 text-emerald-700" />
            <span>Personal Information</span>
          </h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label htmlFor="prof-name" className="block text-xs font-semibold text-[#374151] mb-1">
                Full Name
              </label>
              <input
                id="prof-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-[#D1DBD5] rounded-lg focus:outline-none focus:border-emerald-700"
              />
            </div>
            <div>
              <label htmlFor="prof-phone" className="block text-xs font-semibold text-[#374151] mb-1">
                Phone Number
              </label>
              <input
                id="prof-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-[#D1DBD5] rounded-lg focus:outline-none focus:border-emerald-700"
              />
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="w-full h-10 bg-[#0B1914] hover:bg-emerald-800 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </section>

        {/* Saved Addresses */}
        <section className="lg:col-span-7 bg-white border border-[#E5EAE7] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#0B1914] inline-flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>Saved Delivery Addresses</span>
            </h2>
            <button
              type="button"
              onClick={() => setShowAddressForm((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddressForm ? 'Cancel' : 'Add Address'}</span>
            </button>
          </div>

          {showAddressForm && (
            <form onSubmit={handleAddAddress} className="p-4 bg-[#F8FAF9] border border-[#E5EAE7] rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Recipient Full Name"
                value={addrForm.fullName}
                onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })}
                className="h-10 px-3 text-sm bg-white border border-[#D1DBD5] rounded-lg"
              />
              <input
                type="tel"
                required
                placeholder="Phone Number"
                value={addrForm.phone}
                onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                className="h-10 px-3 text-sm bg-white border border-[#D1DBD5] rounded-lg"
              />
              <input
                type="text"
                required
                placeholder="Street Address / Flat No."
                value={addrForm.line1}
                onChange={(e) => setAddrForm({ ...addrForm, line1: e.target.value })}
                className="sm:col-span-2 h-10 px-3 text-sm bg-white border border-[#D1DBD5] rounded-lg"
              />
              <input
                type="text"
                required
                placeholder="City"
                value={addrForm.city}
                onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                className="h-10 px-3 text-sm bg-white border border-[#D1DBD5] rounded-lg"
              />
              <input
                type="text"
                required
                placeholder="State"
                value={addrForm.state}
                onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                className="h-10 px-3 text-sm bg-white border border-[#D1DBD5] rounded-lg"
              />
              <input
                type="text"
                required
                placeholder="Postal Code"
                value={addrForm.postalCode}
                onChange={(e) => setAddrForm({ ...addrForm, postalCode: e.target.value })}
                className="h-10 px-3 text-sm bg-white border border-[#D1DBD5] rounded-lg"
              />
              <button
                type="submit"
                className="h-10 bg-[#0B1914] text-white text-xs font-semibold rounded-lg"
              >
                Save Address
              </button>
            </form>
          )}

          {addresses.length === 0 ? (
            <p className="text-sm text-[#6B7280] py-4">No saved addresses yet.</p>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-4 border border-[#E5EAE7] rounded-xl flex items-start justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#0B1914]">
                      {addr.fullName} · <span className="font-normal text-[#4B5563]">{addr.phone}</span>
                      {addr.isDefault && (
                        <span className="ml-2 text-xs font-semibold text-emerald-700">Default</span>
                      )}
                    </p>
                    <p className="text-xs text-[#4B5563] mt-1">
                      {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} — {addr.postalCode}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteAddress(addr.id)}
                    aria-label={`Delete address ${addr.line1}`}
                    className="p-2 text-[#6B7280] hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
