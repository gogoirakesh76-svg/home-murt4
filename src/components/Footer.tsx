import React from 'react';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';

export function Footer() {
  const { navigate } = useRouter();
  const { categories } = useStore();

  return (
    <footer className="bg-[#0B1914] text-white border-t border-[#183028] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <p className="font-display text-lg font-extrabold tracking-tight">
            HOME <span className="text-emerald-400">MURT</span>
          </p>
          <p className="mt-3 text-sm text-gray-300 leading-relaxed max-w-xs">
            Architectural furniture, precision kitchenware, and quiet smart home appliances delivered across India with verified warranties.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Categories</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            {categories.slice(0, 5).map((cat) => (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/shop?category=${cat.slug}`)}
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Customer Care</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>
              <button
                type="button"
                onClick={() => navigate('/track-order')}
                className="hover:text-emerald-400 transition-colors"
              >
                Track Your Order
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/orders')}
                className="hover:text-emerald-400 transition-colors"
              >
                Returns &amp; Replacements
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/wishlist')}
                className="hover:text-emerald-400 transition-colors"
              >
                Saved Wishlist
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="hover:text-emerald-400 transition-colors"
              >
                Account &amp; Addresses
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Store Operations</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>Free delivery on orders above ₹999</li>
            <li>Cash on Delivery &amp; Verified UPI</li>
            <li>7-day doorstep return &amp; replace</li>
            <li className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Admin Console
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#183028]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} HOME MURT Retail Pvt. Ltd. All rights reserved.</p>
          <p>Bengaluru · Mumbai · New Delhi</p>
        </div>
      </div>
    </footer>
  );
}
