import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, Copy, ShieldCheck, Tag, Truck } from 'lucide-react';
import { api, resolveImageUrl } from '../lib/api';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import type { Coupon, Product } from '../types';

const HERO_IMAGE = '/src/assets/images/hero_living_room_1795528776734.jpg';

export function HomePage() {
  const { navigate } = useRouter();
  const { categories, showToast } = useStore();
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.getProducts({ section: 'best_sellers', sort: 'popularity' }),
      api.getProducts({ section: 'new_arrivals', sort: 'newest' }),
      api.getPublicCoupons(),
    ])
      .then(([bestRes, newRes, couponRes]) => {
        setBestSellers(bestRes.products.slice(0, 4));
        setNewArrivals(newRes.products.slice(0, 4));
        setCoupons(couponRes.coupons.slice(0, 3));
      })
      .catch(() => {
        // Errors handled gracefully by empty states
      })
      .finally(() => setLoading(false));
  }, []);

  const copyCoupon = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(code);
    showToast(`Coupon "${code}" copied for checkout.`);
    setTimeout(() => setCopiedCode(null), 2200);
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="bg-[#0B1914] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-400">
              HOME MURT · Curated Living
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-[1.12] tracking-tight text-balance">
              Thoughtful furniture, kitchenware &amp; calm home tech.
            </h1>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-md">
              Built for Indian homes with solid hardwood, vitrified enamel, and quiet acoustics—delivered fast with transparent pricing and doorstep support.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="px-6 py-3 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg inline-flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <span>Shop All Products</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/track-order')}
                className="px-5 py-3 text-sm font-semibold border border-emerald-700/80 text-emerald-100 hover:bg-emerald-950 rounded-lg transition-colors whitespace-nowrap"
              >
                Track an Order
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#1D362D] text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Free delivery ₹999+</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>COD &amp; UPI ready</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>7-day easy returns</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="relative h-64 sm:h-80 lg:h-full min-h-[340px] rounded-2xl overflow-hidden bg-[#132920]">
              <img
                src={HERO_IMAGE}
                alt="Modern living room furnished with forest-green linen sofa, oak coffee table, and brass lamp"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-emerald-300">Featured Living Collection</p>
                  <p className="font-display text-lg font-semibold text-white">
                    Solstice Linen &amp; Oak Series
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/shop?category=furniture-seating')}
                  className="px-4 py-2 text-xs font-semibold bg-white text-[#0B1914] hover:bg-emerald-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  View Furniture
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-6">
        <div className="flex items-baseline justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B1914]">
              Shop by Category
            </h2>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Six curated departments for every room
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 whitespace-nowrap"
          >
            <span>Browse all</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => navigate(`/shop?category=${cat.slug}`)}
              className="group text-left bg-[#F8FAF9] hover:bg-white border border-[#E5EAE7] hover:border-emerald-700 rounded-xl p-3 transition-all"
            >
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-[#EEF2EF] mb-3">
                <img
                  src={resolveImageUrl(cat.image)}
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="font-display text-sm font-semibold text-[#111827] leading-snug line-clamp-1">
                {cat.name}
              </p>
              <p className="text-xs text-[#6B7280] mt-0.5 tabular-nums">
                {cat.productCount ?? 0} items
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-baseline justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B1914]">
              Best Sellers
            </h2>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Most ordered essentials rated by verified buyers
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/shop?sort=popularity')}
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 whitespace-nowrap"
          >
            <span>View all</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-80 rounded-xl bg-[#F4F6F4] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Active Offers & Coupons Section */}
      {coupons.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="bg-[#F3F7F4] border border-[#D8E5DC] rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                  Member Offers &amp; Promo Codes
                </p>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B1914] mt-1">
                  Save extra at checkout with active HOME MURT coupons
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/shop?section=offers')}
                className="px-4 py-2 text-xs font-semibold bg-[#0B1914] text-white hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
              >
                Shop 25%+ Off Deals
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="bg-white border border-[#DCE5DF] rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-bold text-emerald-800 tracking-wide">
                      {coupon.code}
                    </p>
                    <p className="text-xs text-[#4B5563] mt-1 line-clamp-2">
                      {coupon.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyCoupon(coupon.code)}
                    className="px-3 py-2 text-xs font-semibold bg-[#F3F7F4] hover:bg-emerald-700 hover:text-white text-[#0B1914] rounded-lg inline-flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    {copiedCode === coupon.code ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-baseline justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#0B1914]">
              New Arrivals
            </h2>
            <p className="text-sm text-[#6B7280] mt-0.5">
              Fresh studio releases added this season
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/shop?sort=newest')}
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 whitespace-nowrap"
          >
            <span>See newest</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-80 rounded-xl bg-[#F4F6F4] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
