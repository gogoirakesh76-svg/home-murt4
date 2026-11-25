import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Smartphone,
  Tag,
  Trash2,
  Truck,
} from 'lucide-react';
import { api, resolveImageUrl } from '../lib/api';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';
import { calculateCartTotals, formatCurrency } from '../utils/commerce';
import type { Address, Coupon } from '../types';

export function CartCheckoutPage() {
  const { navigate } = useRouter();
  const { user, cart, updateCartQuantity, removeFromCart, clearCart, showToast } = useStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | 'new'>('new');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [saveAddress, setSaveAddress] = useState(true);

  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI'>('COD');
  const [upiId, setUpiId] = useState('');

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [publicCoupons, setPublicCoupons] = useState<Coupon[]>([]);
  const [couponMessage, setCouponMessage] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getPublicCoupons()
      .then((res) => setPublicCoupons(res.coupons))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    setFullName((prev) => prev || user.name);
    setPhone((prev) => prev || user.phone);
    api
      .getAddresses()
      .then((res) => {
        setAddresses(res.addresses);
        if (res.addresses.length > 0) {
          const def = res.addresses.find((a) => a.isDefault) || res.addresses[0];
          setSelectedAddressId(def.id);
        }
      })
      .catch(() => {});
  }, [user]);

  const totals = calculateCartTotals(
    cart.map((c) => ({ price: c.price, mrp: c.mrp, quantity: c.quantity })),
    appliedCoupon
  );

  const handleApplyCoupon = async (codeOverride?: string) => {
    const code = (codeOverride ?? couponInput).trim().toUpperCase();
    if (!code) return;
    setCouponMessage('');
    try {
      const res = await api.validateCoupon(code, totals.subtotal);
      setAppliedCoupon(res.coupon);
      setCouponInput(res.coupon.code);
      setCouponMessage(`Applied ${res.coupon.code}: -${formatCurrency(res.discountAmount)}`);
      showToast(`Coupon ${res.coupon.code} applied.`);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponMessage(err instanceof Error ? err.message : 'Invalid coupon');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      showToast('Please sign in to complete your order.', 'error');
      navigate('/login?redirect=/cart');
      return;
    }

    if (cart.length === 0) {
      setError('Your shopping bag is empty.');
      return;
    }

    if (paymentMethod === 'UPI' && (!upiId.trim() || !upiId.includes('@'))) {
      setError('Please enter a valid UPI ID (e.g. yourname@okaxis).');
      return;
    }

    setPlacingOrder(true);
    try {
      const payload: Parameters<typeof api.placeOrder>[0] = {
        items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        paymentMethod,
        upiId: paymentMethod === 'UPI' ? upiId.trim() : undefined,
        couponCode: appliedCoupon && !totals.couponError ? appliedCoupon.code : undefined,
      };

      if (selectedAddressId !== 'new') {
        payload.addressId = selectedAddressId;
      } else {
        payload.address = {
          fullName: fullName.trim(),
          phone: phone.trim(),
          line1: line1.trim(),
          line2: line2.trim(),
          city: city.trim(),
          state: stateName.trim(),
          postalCode: postalCode.trim(),
          country: 'India',
        };
        payload.saveAddress = saveAddress;
      }

      const res = await api.placeOrder(payload);
      clearCart();
      showToast(`Order ${res.order.orderCode} confirmed!`);
      navigate(`/orders?placed=${encodeURIComponent(res.order.orderCode)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place order.');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (cart.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="bg-[#F8FAF9] border border-[#E5EAE7] rounded-2xl p-10">
          <ShoppingBag className="w-10 h-10 text-emerald-700 mx-auto mb-3" />
          <h1 className="font-display text-2xl font-bold text-[#0B1914]">
            Your shopping bag is empty
          </h1>
          <p className="text-sm text-[#6B7280] mt-2">
            Explore curated furniture, kitchenware, and smart home essentials.
          </p>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="mt-6 px-6 py-3 text-sm font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition-colors"
          >
            Browse Catalog
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1914] mb-6">
        Shopping Bag &amp; Checkout
      </h1>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Cart Items + Delivery Address + Payment */}
        <div className="lg:col-span-7 space-y-6">
          {/* Cart Items */}
          <section className="bg-white border border-[#E5EAE7] rounded-2xl p-5 space-y-4">
            <h2 className="font-display text-base font-bold text-[#0B1914]">
              Items ({cart.reduce((s, i) => s + i.quantity, 0)})
            </h2>
            <div className="divide-y divide-[#E5EAE7]">
              {cart.map((item) => (
                <div key={item.productId} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                  <img
                    src={resolveImageUrl(item.image)}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-24 h-20 object-cover rounded-lg bg-[#F4F6F4] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => navigate(`/product/${item.slug}`)}
                      className="font-display text-sm font-semibold text-[#0B1914] hover:text-emerald-700 text-left line-clamp-1"
                    >
                      {item.name}
                    </button>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-sm font-bold text-[#0B1914] tabular-nums">
                        {formatCurrency(item.price)}
                      </span>
                      {item.mrp > item.price && (
                        <span className="text-xs text-[#6B7280] line-through tabular-nums">
                          {formatCurrency(item.mrp)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-4 mt-3">
                      <div className="inline-flex items-center border border-[#D1DBD5] rounded-lg">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                          aria-label={`Decrease quantity for ${item.name}`}
                          className="w-8 h-8 flex items-center justify-center hover:bg-[#F3F6F4]"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                          aria-label={`Increase quantity for ${item.name}`}
                          className="w-8 h-8 flex items-center justify-center hover:bg-[#F3F6F4]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        aria-label={`Remove ${item.name}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Delivery Address */}
          <section className="bg-white border border-[#E5EAE7] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-[#0B1914] inline-flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span>Delivery Address</span>
              </h2>
              {!user && (
                <button
                  type="button"
                  onClick={() => navigate('/login?redirect=/cart')}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Sign in for saved addresses
                </button>
              )}
            </div>

            {addresses.length > 0 && (
              <div className="space-y-2.5">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                      selectedAddressId === addr.id
                        ? 'border-emerald-700 bg-emerald-50/40'
                        : 'border-[#E5EAE7] hover:bg-[#F8FAF9]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="selectedAddress"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 accent-emerald-700"
                    />
                    <div className="text-sm">
                      <p className="font-semibold text-[#0B1914]">
                        {addr.fullName} · <span className="font-normal text-[#4B5563]">{addr.phone}</span>
                      </p>
                      <p className="text-xs text-[#4B5563] mt-0.5">
                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} — {addr.postalCode}
                      </p>
                    </div>
                  </label>
                ))}

                <label
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    selectedAddressId === 'new'
                      ? 'border-emerald-700 bg-emerald-50/40'
                      : 'border-[#E5EAE7] hover:bg-[#F8FAF9]'
                  }`}
                >
                  <input
                    type="radio"
                    name="selectedAddress"
                    checked={selectedAddressId === 'new'}
                    onChange={() => setSelectedAddressId('new')}
                    className="accent-emerald-700"
                  />
                  <span className="text-sm font-semibold text-[#0B1914]">
                    Deliver to a new address
                  </span>
                </label>
              </div>
            )}

            {selectedAddressId === 'new' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label htmlFor="addr-name" className="block text-xs font-medium text-[#374151] mb-1">
                    Full Name *
                  </label>
                  <input
                    id="addr-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Recipient full name"
                    className="w-full h-10 px-3 text-sm border border-[#D1DBD5] rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label htmlFor="addr-phone" className="block text-xs font-medium text-[#374151] mb-1">
                    Mobile Number *
                  </label>
                  <input
                    id="addr-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full h-10 px-3 text-sm border border-[#D1DBD5] rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="addr-line1" className="block text-xs font-medium text-[#374151] mb-1">
                    Street Address / House No. *
                  </label>
                  <input
                    id="addr-line1"
                    type="text"
                    required
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    placeholder="Flat 402, Emerald Residency, MG Road"
                    className="w-full h-10 px-3 text-sm border border-[#D1DBD5] rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="addr-line2" className="block text-xs font-medium text-[#374151] mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    id="addr-line2"
                    type="text"
                    value={line2}
                    onChange={(e) => setLine2(e.target.value)}
                    placeholder="Near Metro Station"
                    className="w-full h-10 px-3 text-sm border border-[#D1DBD5] rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label htmlFor="addr-city" className="block text-xs font-medium text-[#374151] mb-1">
                    City *
                  </label>
                  <input
                    id="addr-city"
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bengaluru"
                    className="w-full h-10 px-3 text-sm border border-[#D1DBD5] rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label htmlFor="addr-state" className="block text-xs font-medium text-[#374151] mb-1">
                    State *
                  </label>
                  <input
                    id="addr-state"
                    type="text"
                    required
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="Karnataka"
                    className="w-full h-10 px-3 text-sm border border-[#D1DBD5] rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label htmlFor="addr-pin" className="block text-xs font-medium text-[#374151] mb-1">
                    PIN / Postal Code *
                  </label>
                  <input
                    id="addr-pin"
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="560038"
                    className="w-full h-10 px-3 text-sm border border-[#D1DBD5] rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>
                {user && (
                  <div className="flex items-center pt-5">
                    <label className="inline-flex items-center gap-2 text-xs text-[#374151] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                        className="accent-emerald-700"
                      />
                      <span>Save this address to my account</span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Payment Method */}
          <section className="bg-white border border-[#E5EAE7] rounded-2xl p-5 space-y-4">
            <h2 className="font-display text-base font-bold text-[#0B1914]">
              Payment Method
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 transition-colors ${
                  paymentMethod === 'COD'
                    ? 'border-emerald-700 bg-emerald-50/40'
                    : 'border-[#E5EAE7] hover:bg-[#F8FAF9]'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="mt-1 accent-emerald-700"
                />
                <div>
                  <p className="text-sm font-semibold text-[#0B1914] inline-flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-700" />
                    <span>Cash on Delivery (COD)</span>
                  </p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Pay via cash or QR on doorstep delivery.
                  </p>
                </div>
              </label>

              <label
                className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 transition-colors ${
                  paymentMethod === 'UPI'
                    ? 'border-emerald-700 bg-emerald-50/40'
                    : 'border-[#E5EAE7] hover:bg-[#F8FAF9]'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'UPI'}
                  onChange={() => setPaymentMethod('UPI')}
                  className="mt-1 accent-emerald-700"
                />
                <div>
                  <p className="text-sm font-semibold text-[#0B1914] inline-flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-700" />
                    <span>UPI Instant Pay (Demo)</span>
                  </p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Enter your UPI VPA for instant demo confirmation.
                  </p>
                </div>
              </label>
            </div>

            {paymentMethod === 'UPI' && (
              <div className="pt-1">
                <label htmlFor="upi-id" className="block text-xs font-medium text-[#374151] mb-1">
                  Enter UPI ID *
                </label>
                <input
                  id="upi-id"
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="username@okaxis"
                  className="w-full sm:max-w-sm h-10 px-3 text-sm border border-[#D1DBD5] rounded-lg focus:outline-none focus:border-emerald-700"
                />
              </div>
            )}
          </section>
        </div>

        {/* Right: Order Summary & Coupons */}
        <aside className="lg:col-span-5 lg:sticky lg:top-24 bg-[#F8FAF9] border border-[#E5EAE7] rounded-2xl p-6 space-y-5">
          <h2 className="font-display text-lg font-bold text-[#0B1914]">Order Summary</h2>

          {/* Coupon Application */}
          <div className="space-y-2.5 pb-4 border-b border-[#E5EAE7]">
            <label htmlFor="coupon-code-input" className="block text-xs font-semibold text-[#374151]">
              Apply Promo Coupon
            </label>
            <div className="flex gap-2">
              <input
                id="coupon-code-input"
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="WELCOME10"
                className="flex-1 h-10 px-3 text-sm font-mono uppercase bg-white border border-[#D1DBD5] rounded-lg focus:outline-none focus:border-emerald-700"
              />
              <button
                type="button"
                onClick={() => handleApplyCoupon()}
                className="px-4 h-10 text-xs font-semibold bg-[#0B1914] hover:bg-emerald-800 text-white rounded-lg transition-colors"
              >
                Apply
              </button>
            </div>
            {couponMessage && (
              <p className={`text-xs font-medium ${appliedCoupon ? 'text-emerald-700' : 'text-red-700'}`}>
                {couponMessage}
              </p>
            )}
            {publicCoupons.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {publicCoupons.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleApplyCoupon(c.code)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-semibold bg-white border border-[#D1DBD5] hover:border-emerald-700 rounded-md text-[#0B1914]"
                  >
                    <Tag className="w-3 h-3 text-emerald-700" />
                    {c.code}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Breakdown */}
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-[#4B5563]">
              <span>Subtotal</span>
              <span className="tabular-nums font-medium text-[#111827]">
                {formatCurrency(totals.subtotal)}
              </span>
            </div>
            {totals.productSavings > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Catalog Savings</span>
                <span className="tabular-nums font-medium">
                  -{formatCurrency(totals.productSavings)}
                </span>
              </div>
            )}
            {totals.couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Coupon ({appliedCoupon?.code})</span>
                <span className="tabular-nums font-semibold">
                  -{formatCurrency(totals.couponDiscount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-[#4B5563]">
              <span>Delivery Fee</span>
              <span className="tabular-nums font-medium text-[#111827]">
                {totals.shippingFee === 0 ? 'FREE' : formatCurrency(totals.shippingFee)}
              </span>
            </div>
            <div className="pt-3 border-t border-[#D1DBD5] flex justify-between items-baseline">
              <span className="font-display text-base font-bold text-[#0B1914]">Total Payable</span>
              <span className="font-display text-xl font-extrabold text-[#0B1914] tabular-nums">
                {formatCurrency(totals.totalAmount)}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
              {error}
            </div>
          )}

          {!user ? (
            <button
              type="button"
              onClick={() => navigate('/login?redirect=/cart')}
              className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              Sign In to Place Order
            </button>
          ) : (
            <button
              type="submit"
              disabled={placingOrder}
              className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-xl inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{placingOrder ? 'Placing Order...' : `Place Order · ${formatCurrency(totals.totalAmount)}`}</span>
            </button>
          )}
        </aside>
      </form>
    </main>
  );
}
