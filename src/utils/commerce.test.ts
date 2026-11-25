import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeDiscountPercent,
  calculateCouponDiscount,
  calculateCartTotals,
  getOrderTimelineIndex,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
} from './commerce';

test('computeDiscountPercent computes rounded savings percentage', () => {
  assert.equal(computeDiscountPercent(799, 999), 20);
  assert.equal(computeDiscountPercent(1000, 1000), 0);
  assert.equal(computeDiscountPercent(1200, 1000), 0);
});

test('calculateCouponDiscount enforces minimum order, max cap, and expiry', () => {
  const activeCoupon = {
    discountPercent: 15,
    minOrderAmount: 1000,
    maxDiscount: 500,
    expiresAt: '2027-12-31T23:59:59Z',
    isActive: true,
  };
  const now = new Date('2026-11-24T00:00:00Z');

  assert.deepEqual(calculateCouponDiscount(800, activeCoupon, now), {
    valid: false,
    discount: 0,
    reason: 'Minimum order of ₹1000 required',
  });

  assert.deepEqual(calculateCouponDiscount(2000, activeCoupon, now), {
    valid: true,
    discount: 300,
  });

  assert.deepEqual(calculateCouponDiscount(5000, activeCoupon, now), {
    valid: true,
    discount: 500,
  });

  const expiredCoupon = { ...activeCoupon, expiresAt: '2025-01-01T00:00:00Z' };
  assert.equal(calculateCouponDiscount(2000, expiredCoupon, now).valid, false);
});

test('calculateCartTotals computes subtotal, shipping threshold, and coupon discount', () => {
  const belowThreshold = calculateCartTotals([
    { price: 500, mrp: 700, quantity: 1 },
  ]);
  assert.equal(belowThreshold.subtotal, 500);
  assert.equal(belowThreshold.shippingFee, STANDARD_SHIPPING_FEE);
  assert.equal(belowThreshold.totalAmount, 500 + STANDARD_SHIPPING_FEE);

  const aboveThreshold = calculateCartTotals([
    { price: FREE_SHIPPING_THRESHOLD, mrp: 1499, quantity: 1 },
  ]);
  assert.equal(aboveThreshold.shippingFee, 0);
  assert.equal(aboveThreshold.totalAmount, FREE_SHIPPING_THRESHOLD);
});

test('getOrderTimelineIndex resolves 5-stage tracking sequence and cancelled orders', () => {
  assert.equal(getOrderTimelineIndex('PLACED'), 0);
  assert.equal(getOrderTimelineIndex('OUT_FOR_DELIVERY'), 3);
  assert.equal(getOrderTimelineIndex('DELIVERED'), 4);
  assert.equal(getOrderTimelineIndex('CANCELLED'), -1);
});
