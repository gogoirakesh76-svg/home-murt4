import React, { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { api } from '../lib/api';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import type { Product } from '../types';

export function ShopPage() {
  const { search, navigate } = useRouter();
  const { categories } = useStore();

  const initialParams = new URLSearchParams(search);
  const [query, setQuery] = useState(initialParams.get('q') || '');
  const [category, setCategory] = useState(initialParams.get('category') || 'all');
  const [section, setSection] = useState(initialParams.get('section') || '');
  const [sort, setSort] = useState(initialParams.get('sort') || 'popularity');
  const [minRating, setMinRating] = useState(Number(initialParams.get('minRating') || 0));
  const [maxPrice, setMaxPrice] = useState<number>(Number(initialParams.get('maxPrice') || 0));
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync URL query param changes when navigating from navbar/home links
  useEffect(() => {
    const sp = new URLSearchParams(search);
    setQuery(sp.get('q') || '');
    setCategory(sp.get('category') || 'all');
    setSection(sp.get('section') || '');
    setSort(sp.get('sort') || 'popularity');
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .getProducts({
          q: query.trim() || undefined,
          category: category !== 'all' ? category : undefined,
          section: section || undefined,
          sort,
          minRating: minRating > 0 ? minRating : undefined,
          maxPrice: maxPrice > 0 ? maxPrice : undefined,
        })
        .then((res) => {
          if (!cancelled) setProducts(res.products);
        })
        .catch(() => {
          if (!cancelled) setProducts([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, category, section, sort, minRating, maxPrice]);

  const resetFilters = () => {
    setQuery('');
    setCategory('all');
    setSection('');
    setSort('popularity');
    setMinRating(0);
    setMaxPrice(0);
    navigate('/shop');
  };

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <label htmlFor="shop-search-input" className="block text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-2">
          Search Keywords
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="shop-search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by product name..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-[#D1DBD5] rounded-lg focus:outline-none focus:border-emerald-700"
          />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-2.5">
          Category
        </h3>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => {
              setCategory('all');
              setSection('');
            }}
            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
              category === 'all' && !section
                ? 'bg-[#0B1914] text-white font-semibold'
                : 'text-[#374151] hover:bg-[#F3F6F4]'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setCategory(cat.slug);
                setSection('');
              }}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${
                category === cat.slug
                  ? 'bg-[#0B1914] text-white font-semibold'
                  : 'text-[#374151] hover:bg-[#F3F6F4]'
              }`}
            >
              <span className="truncate">{cat.name}</span>
              <span className="text-xs opacity-70 tabular-nums">{cat.productCount ?? ''}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-2.5">
          Max Price
        </h3>
        <div className="space-y-1.5">
          {[
            { label: 'Any Price', val: 0 },
            { label: 'Under ₹5,000', val: 5000 },
            { label: 'Under ₹12,000', val: 12000 },
            { label: 'Under ₹25,000', val: 25000 },
          ].map((opt) => (
            <button
              key={opt.val}
              type="button"
              onClick={() => setMaxPrice(opt.val)}
              className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors ${
                maxPrice === opt.val
                  ? 'bg-emerald-700 text-white font-medium'
                  : 'text-[#374151] hover:bg-[#F3F6F4]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#4B5563] mb-2.5">
          Customer Rating
        </h3>
        <div className="space-y-1.5">
          {[
            { label: 'All Ratings', val: 0 },
            { label: '4.5★ & above', val: 4.5 },
            { label: '4.0★ & above', val: 4.0 },
          ].map((opt) => (
            <button
              key={opt.val}
              type="button"
              onClick={() => setMinRating(opt.val)}
              className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors ${
                minRating === opt.val
                  ? 'bg-emerald-700 text-white font-medium'
                  : 'text-[#374151] hover:bg-[#F3F6F4]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={resetFilters}
        className="w-full py-2 text-xs font-semibold text-[#374151] border border-[#D1DBD5] hover:bg-[#F3F6F4] rounded-lg transition-colors"
      >
        Reset All Filters
      </button>
    </div>
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5EAE7]">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1914]">
            {section === 'offers'
              ? 'Top Offers & Deals'
              : query
              ? `Results for "${query}"`
              : 'All Products'}
          </h1>
          <p className="text-sm text-[#6B7280] mt-1 tabular-nums">
            {loading ? 'Updating catalog...' : `${products.length} products available`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            className="lg:hidden inline-flex items-center gap-2 px-3.5 h-10 text-sm font-medium border border-[#D1DBD5] rounded-lg bg-white text-[#111827]"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>

          <label htmlFor="sort-select" className="sr-only">
            Sort products
          </label>
          <select
            id="sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 px-3 text-sm font-medium bg-white border border-[#D1DBD5] rounded-lg text-[#111827] focus:outline-none focus:border-emerald-700"
          >
            <option value="popularity">Sort: Popularity</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Newest First</option>
            <option value="discount">Highest Discount</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="lg:hidden mt-4 p-4 bg-[#F8FAF9] border border-[#E5EAE7] rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="font-display text-sm font-bold text-[#0B1914]">Filters</span>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              aria-label="Close filters"
              className="p-1 text-[#6B7280]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {filterPanel}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-24 bg-[#F8FAF9] border border-[#E5EAE7] rounded-xl p-5">
            {filterPanel}
          </div>
        </aside>

        <div className="lg:col-span-9">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-80 rounded-xl bg-[#F4F6F4] animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-[#F8FAF9] border border-[#E5EAE7] rounded-2xl p-10 text-center">
              <p className="font-display text-lg font-semibold text-[#0B1914]">
                No products match your filters
              </p>
              <p className="text-sm text-[#6B7280] mt-1">
                Try clearing a price ceiling or searching another category.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 px-5 py-2.5 text-sm font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors"
              >
                Show All Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
