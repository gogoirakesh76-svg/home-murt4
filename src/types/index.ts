export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  isBlocked: boolean;
  createdAt: string;
  orderCount?: number;
  addressCount?: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount?: number;
}

export interface Review {
  id: number;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  userName: string;
  userId: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  mrp: number;
  discountPercent: number;
  stock: number;
  sku: string;
  images: string[];
  rating: number;
  reviewCount: number;
  soldCount: number;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isFeatured: boolean;
  categoryId: number;
  category?: Category;
  reviews?: Review[];
  createdAt: string;
}

export interface Address {
  id: number;
  userId: number;
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productImage: string;
  price: number;
  mrp: number;
  quantity: number;
}

export interface TrackingEvent {
  status: string;
  timestamp: string;
  note: string;
}

export interface ReturnRequest {
  id: number;
  orderId: number;
  userId: number;
  type: 'RETURN' | 'REPLACE';
  reason: string;
  comments: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  adminNote: string;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  order?: {
    id: number;
    orderCode: string;
    totalAmount: number;
    status: string;
    items?: OrderItem[];
  };
}

export interface Order {
  id: number;
  orderCode: string;
  userId: number;
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  addressId?: number | null;
  shippingAddress: {
    fullName: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  paymentMethod: 'COD' | 'UPI';
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  upiId: string;
  status: 'PLACED' | 'PACKED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  couponCode: string;
  trackingHistory: TrackingEvent[];
  items: OrderItem[];
  returns?: ReturnRequest[];
  createdAt: string;
}

export interface Coupon {
  id: number;
  code: string;
  description: string;
  discountPercent: number;
  minOrderAmount: number;
  maxDiscount: number;
  expiresAt: string;
  isActive: boolean;
  usageCount: number;
}

export interface CartItem {
  productId: number;
  slug: string;
  name: string;
  image: string;
  price: number;
  mrp: number;
  stock: number;
  quantity: number;
}

export interface AdminDashboardData {
  stats: {
    totalOrders: number;
    totalRevenue: number;
    totalUsers: number;
    totalProducts: number;
    pendingReturns: number;
    lowStockCount: number;
  };
  lowStockProducts: Product[];
  recentOrders: Order[];
  chartSeries: Array<{ label: string; orders: number; revenue: number }>;
}
