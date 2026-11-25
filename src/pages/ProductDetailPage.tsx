import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Heart,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Zap,
} from 'lucide-react';
import { api, resolveImageUrl } from '../lib/api';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../utils/commerce';
import type { Product } from '../types';

export function ProductDetailPage({ idOrSlug }: { idOrSlug: string }) {
  const { navigate } = useRouter();
  const { user, addToCart, isInWishlist, toggleWishlist, showToast } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Review form
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    setActiveImage(0);
    setQuantity(1);
    api
      .getProduct(idOrSlug)
      .then((res) => setProduct(res.product))
      .catch((err: Error) => setError(err.message || 'Product not found'))
      .finally(() => setLoading(false));
  }, [idOrSlug]);

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product, quantity);
    navigate('/cart');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!user) {
      showToast('Please sign in to submit a review.', 'error');
      navigate('/login');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await api.addReview(product.id, {
        rating,
        title: reviewTitle,
        comment: reviewComment,
      });
      if (res.product) {
        setProduct(res.product);
      }
      setReviewTitle('');
      setReviewComment('');
      showToast('Thank you! Your review has been published.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to post review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6 aspect-[4/3] bg-[#F4F6F4] rounded-2xl animate-pulse" />
          <div className="lg:col-span-6 space-y-4">
            <div className="h-8 w-2/3 bg-[#F4F6F4] rounded animate-pulse" />
            <div className="h-6 w-1/3 bg-[#F4F6F4] rounded animate-pulse" />
            <div className="h-32 w-full bg-[#F4F6F4] rounded animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-[#0B1914]">Product unavailable</h1>
        <p className="text-sm text-[#6B7280] mt-2">{error || 'Could not find this product.'}</p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="mt-6 px-5 py-2.5 text-sm font-semibold bg-emerald-700 text-white rounded-lg"
        >
          Back to Catalog
        </button>
      </main>
    );
  }

  const saved = isInWishlist(product.id);
  const images = product.images.length > 0 ? product.images : [''];
  const currentImg = resolveImageUrl(images[activeImage] || images[0]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <button
        type="button"
        onClick={() => navigate('/shop')}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#4B5563] hover:text-[#0B1914] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Catalog</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Image Gallery */}
        <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-24">
          <div className="aspect-[4/3] bg-[#F4F6F4] border border-[#E5EAE7] rounded-2xl overflow-hidden">
            {currentImg ? (
              <img
                src={currentImg}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#6B7280]">
                <Package className="w-12 h-12 mb-2 text-emerald-700" />
                <span className="text-sm">{product.name}</span>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  aria-label={`View image ${idx + 1}`}
                  className={`w-20 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-colors ${
                    activeImage === idx ? 'border-emerald-700' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={resolveImageUrl(img)}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-2">
              <button
                type="button"
                onClick={() => navigate(`/shop?category=${product.category?.slug || 'all'}`)}
                className="font-medium text-emerald-700 hover:underline"
              >
                {product.category?.name || 'Home Living'}
              </button>
              <span aria-hidden="true">·</span>
              <span className="font-mono">SKU: {product.sku || `HM-${product.id}`}</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1914] leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mt-3">
              <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B1914]">
                <Star className="w-4 h-4 text-emerald-700 fill-emerald-700" />
                <span className="tabular-nums">{product.rating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-[#6B7280] tabular-nums">
                {product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'}
              </span>
              <span aria-hidden="true" className="text-[#D1DBD5]">|</span>
              <span
                className={`text-sm font-medium ${
                  product.stock > 5
                    ? 'text-emerald-700'
                    : product.stock > 0
                    ? 'text-amber-700'
                    : 'text-red-700'
                }`}
              >
                {product.stock > 5
                  ? `In Stock (${product.stock} available)`
                  : product.stock > 0
                  ? `Low Stock — Only ${product.stock} left`
                  : 'Currently Out of Stock'}
              </span>
            </div>
          </div>

          <div className="py-4 border-y border-[#E5EAE7] flex items-baseline gap-3 flex-wrap">
            <span className="font-display text-3xl font-extrabold text-[#0B1914] tabular-nums">
              {formatCurrency(product.price)}
            </span>
            {product.mrp > product.price && (
              <span className="text-base text-[#6B7280] line-through tabular-nums">
                MRP {formatCurrency(product.mrp)}
              </span>
            )}
            {product.discountPercent > 0 && (
              <span className="text-sm font-bold text-emerald-700 tabular-nums">
                Save {product.discountPercent}%
              </span>
            )}
          </div>

          <p className="text-sm sm:text-base text-[#374151] leading-relaxed">
            {product.description}
          </p>

          {/* Quantity & Actions */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-[#374151]">Quantity</span>
              <div className="inline-flex items-center border border-[#D1DBD5] rounded-lg bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-10 h-10 flex items-center justify-center text-[#374151] hover:bg-[#F3F6F4]"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(Math.max(1, product.stock), q + 1))}
                  aria-label="Increase quantity"
                  className="w-10 h-10 flex items-center justify-center text-[#374151] hover:bg-[#F3F6F4]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={() => addToCart(product, quantity)}
                className="flex-1 h-12 px-6 bg-[#0B1914] hover:bg-[#162C24] text-white font-semibold text-sm rounded-xl inline-flex items-center justify-center gap-2 transition-colors disabled:bg-gray-200 disabled:text-gray-500"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={handleBuyNow}
                className="flex-1 h-12 px-6 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-xl inline-flex items-center justify-center gap-2 transition-colors disabled:bg-gray-200 disabled:text-gray-500"
              >
                <Zap className="w-4 h-4" />
                <span>Buy Now</span>
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
                className={`h-12 px-4 rounded-xl border inline-flex items-center justify-center gap-2 text-sm font-semibold transition-colors ${
                  saved
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-800'
                    : 'border-[#D1DBD5] bg-white text-[#374151] hover:border-emerald-700'
                }`}
              >
                <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                <span className="sm:hidden lg:inline">{saved ? 'Saved' : 'Wishlist'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#E5EAE7] text-xs text-[#4B5563]">
            <div className="flex items-center gap-2.5 bg-[#F8FAF9] p-3 rounded-lg">
              <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Free insured shipping on orders ₹999+</span>
            </div>
            <div className="flex items-center gap-2.5 bg-[#F8FAF9] p-3 rounded-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>7-day doorstep return &amp; replacement</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="mt-16 pt-10 border-t border-[#E5EAE7] grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5">
          <h2 className="font-display text-xl font-bold text-[#0B1914]">
            Customer Reviews
          </h2>
          <p className="text-sm text-[#6B7280] mt-1">
            Share your experience with this product.
          </p>

          <form onSubmit={handleReviewSubmit} className="mt-5 bg-[#F8FAF9] border border-[#E5EAE7] rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Your Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    aria-label={`Rate ${star} stars`}
                    className="p-1"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? 'text-emerald-700 fill-emerald-700' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="review-title" className="block text-xs font-semibold text-[#374151] mb-1">
                Review Headline
              </label>
              <input
                id="review-title"
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="Summary of your experience"
                className="w-full h-10 px-3 text-sm bg-white border border-[#D1DBD5] rounded-lg focus:outline-none focus:border-emerald-700"
              />
            </div>

            <div>
              <label htmlFor="review-comment" className="block text-xs font-semibold text-[#374151] mb-1">
                Review Details
              </label>
              <textarea
                id="review-comment"
                rows={3}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="What did you like about the build quality or design?"
                className="w-full p-3 text-sm bg-white border border-[#D1DBD5] rounded-lg focus:outline-none focus:border-emerald-700"
              />
            </div>

            <button
              type="submit"
              disabled={submittingReview}
              className="w-full h-10 bg-[#0B1914] hover:bg-emerald-800 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {submittingReview ? 'Submitting...' : user ? 'Publish Review' : 'Sign In to Review'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-4">
          {!product.reviews || product.reviews.length === 0 ? (
            <div className="bg-[#F8FAF9] border border-[#E5EAE7] rounded-xl p-8 text-center text-sm text-[#6B7280]">
              No reviews yet. Be the first buyer to share feedback.
            </div>
          ) : (
            product.reviews.map((rev) => (
              <div key={rev.id} className="border border-[#E5EAE7] rounded-xl p-5 bg-white">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      {rev.rating} ★
                    </span>
                    <span className="font-semibold text-sm text-[#0B1914]">
                      {rev.title || 'Verified Purchase'}
                    </span>
                  </div>
                  <span className="text-xs text-[#6B7280] tabular-nums">
                    {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-sm text-[#374151] mt-2 leading-relaxed">{rev.comment}</p>
                <p className="text-xs text-[#6B7280] mt-2">By {rev.userName}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
