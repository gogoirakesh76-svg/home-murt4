export const FREE_SHIPPING_THRESHOLD = 999;
export const STANDARD_SHIPPING_FEE = 79;

export const ORDER_STATUS_SEQUENCE = [
  'PLACED',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
] as const;

export type OrderStatus = (typeof ORDER_STATUS_SEQUENCE)[number] | 'CANCELLED';

export interface CouponInput {
  discountPercent: number;
  minOrderAmount: number;
  maxDiscount: number;
  expiresAt: string | Date;
  isActive: boolean;
}

export interface CartTotalsInputItem {
  price: number;
  mrp: number;
  quantity: number;
}

export function computeDiscountPercent(price: number, mrp: number): number {
  if (!Number.isFinite(price) || !Number.isFinite(mrp) || mrp <= 0 || price >= mrp) {
    return 0;
  }
  return Math.round(((mrp - price) / mrp) * 100);
}

export function calculateCouponDiscount(
  subtotal: number,
  coupon: CouponInput | null,
  now: Date = new Date()
): { valid: boolean; discount: number; reason?: string } {
  if (!coupon) {
    return { valid: false, discount: 0, reason: 'Coupon not found' };
  }
  if (!coupon.isActive) {
    return { valid: false, discount: 0, reason: 'Coupon is inactive' };
  }
  const expiry = coupon.expiresAt instanceof Date ? coupon.expiresAt : new Date(coupon.expiresAt);
  if (Number.isNaN(expiry.getTime()) || expiry.getTime() < now.getTime()) {
    return { valid: false, discount: 0, reason: 'Coupon has expired' };
  }
  if (subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      discount: 0,
      reason: `Minimum order of ₹${Math.round(coupon.minOrderAmount)} required`,
    };
  }
  let discount = Math.round((subtotal * coupon.discountPercent) / 100);
  if (coupon.maxDiscount > 0) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  discount = Math.min(discount, subtotal);
  return { valid: true, discount };
}

export function calculateCartTotals(
  items: CartTotalsInputItem[],
  coupon: CouponInput | null = null,
  now: Date = new Date()
) {
  const subtotal = items.reduce(
    (sum, item) => sum + Math.max(0, item.price) * Math.max(0, item.quantity),
    0
  );
  const totalMrp = items.reduce(
    (sum, item) => sum + Math.max(0, item.mrp) * Math.max(0, item.quantity),
    0
  );
  const productSavings = Math.max(0, totalMrp - subtotal);

  let couponDiscount = 0;
  let couponError: string | undefined;
  if (coupon) {
    const res = calculateCouponDiscount(subtotal, coupon, now);
    if (res.valid) {
      couponDiscount = res.discount;
    } else {
      couponError = res.reason;
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
  const shippingFee =
    items.length === 0 || discountedSubtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : STANDARD_SHIPPING_FEE;
  const totalAmount = Math.max(0, discountedSubtotal + shippingFee);

  return {
    subtotal,
    totalMrp,
    productSavings,
    couponDiscount,
    couponError,
    shippingFee,
    totalAmount,
  };
}

export function getOrderTimelineIndex(status: string): number {
  const idx = ORDER_STATUS_SEQUENCE.indexOf(
    status as (typeof ORDER_STATUS_SEQUENCE)[number]
  );
  return idx;
}

export function formatCurrency(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}
