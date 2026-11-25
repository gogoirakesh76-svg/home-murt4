import type {
  Address,
  AdminDashboardData,
  Category,
  Coupon,
  Order,
  Product,
  ReturnRequest,
  User,
} from '../types';

const rawBaseUrl = (import.meta.env.VITE_API_URL || '')
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

function resolveApiBaseUrl(): string {
  if (!rawBaseUrl) return '';
  if (typeof window !== 'undefined') {
    const isLocalTarget = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(rawBaseUrl);
    const isLocalBrowser =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isUnifiedDevServer =
      isLocalBrowser && (window.location.port === '3000' || window.location.port === '8080');
    if (isLocalTarget && (!isLocalBrowser || isUnifiedDevServer)) {
      return '';
    }
  }
  return rawBaseUrl;
}

export const API_BASE_URL = resolveApiBaseUrl();

// Keep JWT tokens strictly in JS memory (httpOnly cookies handle reload persistence)
let userTokenInMemory: string | null = null;
let adminTokenInMemory: string | null = null;

export function setUserToken(token: string | null) {
  userTokenInMemory = token;
}

export function setAdminToken(token: string | null) {
  adminTokenInMemory = token;
}

export function resolveImageUrl(path: string | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  if (path.startsWith('/uploads/') && API_BASE_URL) {
    return `${API_BASE_URL}${path}`;
  }
  return path;
}

interface RequestOptions extends RequestInit {
  isAdmin?: boolean;
  isFormData?: boolean;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { isAdmin = false, isFormData = false, headers = {}, ...rest } = options;
  const token = isAdmin ? adminTokenInMemory : userTokenInMemory;

  const finalHeaders: Record<string, string> = {
    'X-Requested-With': 'XMLHttpRequest',
    ...(headers as Record<string, string>),
  };

  if (!isFormData && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json';
  }
  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers: finalHeaders,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  // Customer Auth
  register: (payload: { name: string; email: string; password: string; phone?: string }) =>
    request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () => request<{ message: string }>('/api/auth/logout', { method: 'POST' }),

  getSession: () => request<{ user: User | null }>('/api/auth/session'),

  getMe: () => request<{ user: User }>('/api/auth/me'),

  updateProfile: (payload: { name: string; phone: string }) =>
    request<{ user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Catalog & Reviews
  getCategories: () => request<{ categories: Category[] }>('/api/categories'),

  getProducts: (params: {
    q?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    sort?: string;
    section?: string;
  } = {}) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set('q', params.q);
    if (params.category && params.category !== 'all') sp.set('category', params.category);
    if (params.minPrice) sp.set('minPrice', String(params.minPrice));
    if (params.maxPrice) sp.set('maxPrice', String(params.maxPrice));
    if (params.minRating) sp.set('minRating', String(params.minRating));
    if (params.sort) sp.set('sort', params.sort);
    if (params.section) sp.set('section', params.section);
    const qs = sp.toString();
    return request<{ products: Product[] }>(`/api/products${qs ? `?${qs}` : ''}`);
  },

  getProduct: (idOrSlug: string | number) =>
    request<{ product: Product }>(`/api/products/${encodeURIComponent(String(idOrSlug))}`),

  addReview: (productId: number, payload: { rating: number; title?: string; comment: string }) =>
    request<{ product: Product }>(`/api/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // User Addresses & Wishlist
  getAddresses: () => request<{ addresses: Address[] }>('/api/user/addresses'),

  addAddress: (payload: Omit<Address, 'id' | 'userId' | 'createdAt'>) =>
    request<{ address: Address }>('/api/user/addresses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteAddress: (id: number) =>
    request<{ message: string }>(`/api/user/addresses/${id}`, { method: 'DELETE' }),

  getWishlist: () => request<{ items: Product[] }>('/api/user/wishlist'),

  toggleWishlist: (productId: number) =>
    request<{ saved: boolean; items: Product[] }>('/api/user/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    }),

  // Orders, Coupons, Tracking & Returns
  getPublicCoupons: () => request<{ coupons: Coupon[] }>('/api/coupons'),

  validateCoupon: (code: string, subtotal: number) =>
    request<{ valid: boolean; coupon: Coupon; discountAmount: number }>('/api/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal }),
    }),

  placeOrder: (payload: {
    items: Array<{ productId: number; quantity: number }>;
    paymentMethod: 'COD' | 'UPI';
    upiId?: string;
    couponCode?: string;
    addressId?: number;
    address?: {
      fullName: string;
      phone: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country?: string;
    };
    saveAddress?: boolean;
  }) =>
    request<{ order: Order }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMyOrders: () => request<{ orders: Order[] }>('/api/orders/my'),

  trackOrder: (orderCode: string) =>
    request<{ order: Order }>(`/api/orders/track/${encodeURIComponent(orderCode.trim())}`),

  requestReturn: (orderId: number, payload: { type: 'RETURN' | 'REPLACE'; reason: string; comments?: string }) =>
    request<{ returnRequest: ReturnRequest }>(`/api/orders/${orderId}/return`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Admin Auth & Management
  getAdminStatus: () =>
    request<{ configured: boolean; mode: 'env' | 'claimed' | 'unclaimed' }>('/api/admin/auth/status', {
      isAdmin: true,
    }),

  setupFirstAdmin: (payload: { email: string; password: string }) =>
    request<{ token: string; admin: { email: string; role: string } }>('/api/admin/auth/setup', {
      method: 'POST',
      body: JSON.stringify(payload),
      isAdmin: true,
    }),

  adminLogin: (payload: { email: string; password: string }) =>
    request<{ token: string; admin: { email: string; role: string } }>('/api/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      isAdmin: true,
    }),

  adminLogout: () =>
    request<{ message: string }>('/api/admin/auth/logout', { method: 'POST', isAdmin: true }),

  getAdminSession: () =>
    request<{ admin: { email: string; role: string } | null }>('/api/admin/auth/session', { isAdmin: true }),

  getAdminMe: () =>
    request<{ admin: { email: string; role: string } }>('/api/admin/auth/me', { isAdmin: true }),

  getAdminDashboard: () =>
    request<AdminDashboardData>('/api/admin/dashboard', { isAdmin: true }),

  adminCreateProduct: (payload: Record<string, unknown>) =>
    request<{ product: Product }>('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(payload),
      isAdmin: true,
    }),

  adminUpdateProduct: (id: number, payload: Record<string, unknown>) =>
    request<{ product: Product }>(`/api/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      isAdmin: true,
    }),

  adminDeleteProduct: (id: number) =>
    request<{ message: string }>(`/api/admin/products/${id}`, {
      method: 'DELETE',
      isAdmin: true,
    }),

  adminUploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return request<{ url: string }>('/api/admin/upload', {
      method: 'POST',
      body: formData,
      isFormData: true,
      isAdmin: true,
    });
  },

  adminGetOrders: () => request<{ orders: Order[] }>('/api/admin/orders', { isAdmin: true }),

  adminUpdateOrderStatus: (id: number, status: string, note?: string) =>
    request<{ order: Order }>(`/api/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
      isAdmin: true,
    }),

  adminGetReturns: () => request<{ returns: ReturnRequest[] }>('/api/admin/returns', { isAdmin: true }),

  adminResolveReturn: (id: number, status: 'APPROVED' | 'REJECTED' | 'COMPLETED', adminNote?: string) =>
    request<{ returnRequest: ReturnRequest }>(`/api/admin/returns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNote }),
      isAdmin: true,
    }),

  adminGetCoupons: () => request<{ coupons: Coupon[] }>('/api/admin/coupons', { isAdmin: true }),

  adminCreateCoupon: (payload: {
    code: string;
    description: string;
    discountPercent: number;
    minOrderAmount: number;
    maxDiscount: number;
    expiresAt: string;
  }) =>
    request<{ coupon: Coupon }>('/api/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(payload),
      isAdmin: true,
    }),

  adminToggleCoupon: (id: number) =>
    request<{ coupon: Coupon }>(`/api/admin/coupons/${id}/toggle`, {
      method: 'PATCH',
      isAdmin: true,
    }),

  adminDeleteCoupon: (id: number) =>
    request<{ message: string }>(`/api/admin/coupons/${id}`, {
      method: 'DELETE',
      isAdmin: true,
    }),

  adminGetUsers: () => request<{ users: User[] }>('/api/admin/users', { isAdmin: true }),

  adminToggleBlockUser: (id: number) =>
    request<{ user: User }>(`/api/admin/users/${id}/block`, {
      method: 'PATCH',
      isAdmin: true,
    }),

  adminGetAddresses: () => request<{ addresses: Address[] }>('/api/admin/addresses', { isAdmin: true }),
};
