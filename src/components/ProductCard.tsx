import React, { useState } from 'react';
import { Heart, Package, ShoppingBag, Star } from 'lucide-react';
import { resolveImageUrl } from '../lib/api';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/commerce';
import type { Product } from '../types';

export function ProductCard({ product }: { product: Product }) {
  const { navigate } = useRouter();
  const { addToCart, isInWishlist, toggleWishlist } = useStore();
  const [imgError, setImgError] = useState(false);

  const saved = isInWishlist(product.id);
  const imageSrc = resolveImageUrl(product.images[0]);

  return (
    <article className="group bg-white border border-[#E5EAE7] rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/3] bg-[#F4F6F4] overflow-hidden">
        <a
          href={`/product/${product.slug}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/product/${product.slug}`);
          }}
          className="block w-full h-full"
        >
          {imageSrc && !imgError ? (
            <img
              src={imageSrc}
              alt={product.name}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#EEF4F0] to-[#DCE6DF] text-[#374151] p-4 text-center">
              <Package className="w-8 h-8 text-emerald-800 mb-2" />
              <span className="text-xs font-medium line-clamp-2">{product.name}</span>
            </div>
          )}
        </a>

        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            saved
              ? 'bg-emerald-700 text-white'
              : 'bg-white/90 text-[#374151] hover:bg-white hover:text-emerald-700'
          } shadow-sm`}
        >
          <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs text-[#6B7280] mb-1">
            <span className="truncate">{product.category?.name || 'Home Living'}</span>
            {product.rating > 0 && (
              <span className="inline-flex items-center gap-1 text-[#111827] font-medium tabular-nums shrink-0">
                <Star className="w-3.5 h-3.5 text-emerald-700 fill-emerald-700" />
                {product.rating.toFixed(1)}
              </span>
            )}
          </div>

          <a
            href={`/product/${product.slug}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/product/${product.slug}`);
            }}
            className="block font-display text-[15px] font-semibold text-[#111827] leading-snug line-clamp-2 hover:text-emerald-800 transition-colors"
          >
            {product.name}
          </a>
        </div>

        <div className="space-y-3 pt-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-base font-bold text-[#0B1914] tabular-nums">
              {formatCurrency(product.price)}
            </span>
            {product.mrp > product.price && (
              <span className="text-xs text-[#6B7280] line-through tabular-nums">
                {formatCurrency(product.mrp)}
              </span>
            )}
            {product.discountPercent > 0 && (
              <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                {product.discountPercent}% off
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={product.stock <= 0}
              onClick={() => addToCart(product, 1)}
              className="flex-1 h-10 px-3 inline-flex items-center justify-center gap-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap bg-[#0B1914] text-white hover:bg-emerald-800 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
