import React from 'react';
import { Heart } from 'lucide-react';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';

export function WishlistPage() {
  const { navigate } = useRouter();
  const { user, wishlist, authLoading } = useStore();

  if (authLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="h-64 bg-[#F4F6F4] rounded-2xl animate-pulse" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center">
        <Heart className="w-10 h-10 text-emerald-700 mx-auto mb-3" />
        <h1 className="font-display text-2xl font-bold text-[#0B1914]">Sign in to view your Wishlist</h1>
        <p className="text-sm text-[#6B7280] mt-2">
          Save your favorite furniture, lighting, and cookware across devices.
        </p>
        <button
          type="button"
          onClick={() => navigate('/login?redirect=/wishlist')}
          className="mt-6 px-6 py-3 text-sm font-semibold bg-emerald-700 text-white rounded-xl"
        >
          Sign In
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 min-h-[65vh]">
      <div className="flex items-baseline justify-between pb-6 border-b border-[#E5EAE7] mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1914]">
            Saved Wishlist
          </h1>
          <p className="text-sm text-[#6B7280] mt-1 tabular-nums">
            {wishlist.length} saved {wishlist.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="text-sm font-semibold text-emerald-700 hover:underline"
        >
          Explore Catalog
        </button>
      </div>

      {wishlist.length === 0 ? (
        <div className="bg-[#F8FAF9] border border-[#E5EAE7] rounded-2xl p-10 text-center">
          <p className="font-display text-lg font-semibold text-[#0B1914]">Your wishlist is empty</p>
          <p className="text-sm text-[#6B7280] mt-1">
            Tap the heart icon on any product card to save it for later.
          </p>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="mt-5 px-5 py-2.5 text-sm font-semibold bg-emerald-700 text-white rounded-lg"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
