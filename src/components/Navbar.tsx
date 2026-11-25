import React, { useEffect, useRef, useState } from 'react';
import { Heart, Menu, Package, Search, ShoppingBag, User as UserIcon, X } from 'lucide-react';
import { api, resolveImageUrl } from '../lib/api';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/commerce';
import type { Product } from '../types';

export function Navbar() {
  const { path, navigate } = useRouter();
  const { user, cart, wishlist } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [liveResults, setLiveResults] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setLiveResults([]);
      return;
    }
    const timer = setTimeout(() => {
      api
        .getProducts({ q: trimmed })
        .then((res) => setLiveResults(res.products.slice(0, 5)))
        .catch(() => setLiveResults([]));
    }, 180);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    const trimmed = searchQuery.trim();
    navigate(trimmed ? `/shop?q=${encodeURIComponent(trimmed)}` : '/shop');
  };

  const navLinkClass = (target: string) =>
    `text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
      path === target ? 'text-emerald-700' : 'text-[#374151] hover:text-[#111827]'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5EAE7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden p-2 -ml-2 text-[#111827] rounded-lg hover:bg-[#F3F6F4]"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            className="font-display text-xl font-extrabold tracking-tight text-[#0B1914] whitespace-nowrap shrink-0"
          >
            HOME <span className="text-emerald-700">MURT</span>
          </a>
        </div>

        {/* Live Search Bar */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-md hidden sm:block">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <label htmlFor="global-search" className="sr-only">
              Search products
            </label>
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 pointer-events-none" />
            <input
              id="global-search"
              type="search"
              value={searchQuery}
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              placeholder="Search chairs, espresso, lighting, bedding..."
              className="w-full h-10 pl-10 pr-20 text-sm bg-[#F4F6F4] border border-[#E2E8E4] rounded-lg text-[#111827] placeholder:text-[#6B7280] focus:outline-none focus:bg-white focus:border-emerald-700 transition-colors"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1 text-xs font-semibold text-white bg-[#0B1914] hover:bg-emerald-800 rounded-md transition-colors whitespace-nowrap"
            >
              Search
            </button>
          </form>

          {showDropdown && liveResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white border border-[#E2E8E4] rounded-xl shadow-lg overflow-hidden z-50">
              {liveResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setShowDropdown(false);
                    navigate(`/product/${item.slug}`);
                  }}
                  className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-[#F4F6F4] text-left transition-colors border-b border-[#F3F6F4] last:border-b-0"
                >
                  <img
                    src={resolveImageUrl(item.images[0])}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 object-cover rounded-md bg-[#F4F6F4] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#111827] truncate">{item.name}</p>
                    <p className="text-xs text-[#6B7280] truncate">{item.category?.name}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#111827] tabular-nums shrink-0">
                    {formatCurrency(item.price)}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="w-full px-4 py-2 text-xs font-semibold text-emerald-700 bg-[#F8FAF9] hover:bg-[#EEF4F0] text-center"
              >
                View all results for "{searchQuery.trim()}"
              </button>
            </div>
          )}
        </div>

        {/* Zone 2 & 3: Nav Links + Primary Cart Action */}
        <div className="flex items-center gap-5 shrink-0">
          <nav className="hidden lg:flex items-center gap-6">
            <a
              href="/shop"
              onClick={(e) => {
                e.preventDefault();
                navigate('/shop');
              }}
              className={navLinkClass('/shop')}
            >
              Shop
            </a>
            <a
              href="/track-order"
              onClick={(e) => {
                e.preventDefault();
                navigate('/track-order');
              }}
              className={navLinkClass('/track-order')}
            >
              Track Order
            </a>
            <a
              href="/orders"
              onClick={(e) => {
                e.preventDefault();
                navigate('/orders');
              }}
              className={navLinkClass('/orders')}
            >
              My Orders
            </a>
            <a
              href="/wishlist"
              onClick={(e) => {
                e.preventDefault();
                navigate('/wishlist');
              }}
              className={navLinkClass('/wishlist')}
              aria-label={`Wishlist (${wishlist.length})`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Heart className="w-4 h-4" />
                <span>Wishlist{wishlist.length > 0 ? ` (${wishlist.length})` : ''}</span>
              </span>
            </a>
            <a
              href={user ? '/profile' : '/login'}
              onClick={(e) => {
                e.preventDefault();
                navigate(user ? '/profile' : '/login');
              }}
              className={navLinkClass(user ? '/profile' : '/login')}
            >
              <span className="inline-flex items-center gap-1.5">
                <UserIcon className="w-4 h-4" />
                <span className="max-w-[110px] truncate">{user ? user.name.split(' ')[0] : 'Sign In'}</span>
              </span>
            </a>
          </nav>

          <button
            type="button"
            onClick={() => navigate('/cart')}
            aria-label={`Open shopping bag with ${totalCartItems} items`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Bag</span>
            <span className="font-mono text-xs tabular-nums bg-emerald-900/60 px-1.5 py-0.5 rounded">
              {totalCartItems}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E5EAE7] bg-white px-4 py-4 space-y-3">
          <form
            onSubmit={(e) => {
              setMobileMenuOpen(false);
              handleSearchSubmit(e);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="flex-1 h-10 px-3 text-sm bg-[#F4F6F4] border border-[#E2E8E4] rounded-lg"
            />
            <button
              type="submit"
              className="h-10 px-4 text-sm font-semibold text-white bg-[#0B1914] rounded-lg"
            >
              Go
            </button>
          </form>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {[
              { label: 'Shop Catalog', to: '/shop', icon: ShoppingBag },
              { label: 'Track Order', to: '/track-order', icon: Package },
              { label: 'My Orders', to: '/orders', icon: Package },
              { label: `Wishlist (${wishlist.length})`, to: '/wishlist', icon: Heart },
              { label: user ? user.name.split(' ')[0] : 'Sign In', to: user ? '/profile' : '/login', icon: UserIcon },
            ].map((item) => (
              <button
                key={item.to}
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(item.to);
                }}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-[#111827] bg-[#F8FAF9] hover:bg-[#EEF4F0] rounded-lg text-left"
              >
                <item.icon className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
