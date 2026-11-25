import { prisma } from '../config/db.ts';
import type {
  User,
  Product,
  Category,
  Order,
  OrderItem,
  Address,
  Wishlist,
  Review,
  Coupon,
  ReturnRequest,
} from '@prisma/client';

export const Models = {
  User: prisma.user,
  AdminCredential: prisma.adminCredential,
  Category: prisma.category,
  Product: prisma.product,
  Address: prisma.address,
  Order: prisma.order,
  OrderItem: prisma.orderItem,
  Wishlist: prisma.wishlist,
  Review: prisma.review,
  Coupon: prisma.coupon,
  ReturnRequest: prisma.returnRequest,
};

export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function sanitizeUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isBlocked: user.isBlocked,
    createdAt: user.createdAt,
  };
}

export function serializeProduct(
  product: Product & { category?: Category | null; reviews?: Array<Review & { user?: Pick<User, 'id' | 'name'> }> }
) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    mrp: product.mrp,
    discountPercent: product.discountPercent,
    stock: product.stock,
    sku: product.sku,
    images: safeJsonParse<string[]>(product.images, []),
    rating: product.rating,
    reviewCount: product.reviewCount,
    soldCount: product.soldCount,
    isBestSeller: product.isBestSeller,
    isNewArrival: product.isNewArrival,
    isFeatured: product.isFeatured,
    categoryId: product.categoryId,
    category: product.category
      ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
          image: product.category.image,
        }
      : undefined,
    reviews: product.reviews
      ? product.reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          createdAt: r.createdAt,
          userName: r.user?.name || 'Verified Buyer',
          userId: r.userId,
        }))
      : undefined,
    createdAt: product.createdAt,
  };
}

export function serializeOrder(
  order: Order & {
    items?: OrderItem[];
    user?: Pick<User, 'id' | 'name' | 'email' | 'phone'> | null;
    returns?: ReturnRequest[];
  }
) {
  return {
    id: order.id,
    orderCode: order.orderCode,
    userId: order.userId,
    user: order.user || undefined,
    addressId: order.addressId,
    shippingAddress: safeJsonParse<Record<string, string>>(order.shippingAddressJson, {}),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    upiId: order.upiId,
    status: order.status,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    shippingFee: order.shippingFee,
    totalAmount: order.totalAmount,
    couponCode: order.couponCode,
    trackingHistory: safeJsonParse<Array<{ status: string; timestamp: string; note: string }>>(
      order.trackingHistoryJson,
      []
    ),
    items: order.items || [],
    returns: order.returns || [],
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export type {
  User,
  Product,
  Category,
  Order,
  OrderItem,
  Address,
  Wishlist,
  Review,
  Coupon,
  ReturnRequest,
};
