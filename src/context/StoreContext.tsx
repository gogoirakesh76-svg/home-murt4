import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, setUserToken } from '../lib/api';
import type { CartItem, Category, Product, User } from '../types';

interface ToastState {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface StoreContextValue {
  user: User | null;
  authLoading: boolean;
  categories: Category[];
  cart: CartItem[];
  wishlist: Product[];
  toast: ToastState | null;
  showToast: (message: string, type?: 'success' | 'error') => void;
  refreshUser: () => Promise<void>;
  loginUser: (email: string, password: string) => Promise<User>;
  registerUser: (payload: { name: string; email: string; password: string; phone?: string }) => Promise<User>;
  logoutUser: () => Promise<void>;
  setUserDirect: (user: User) => void;
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  isInWishlist: (productId: number) => boolean;
  toggleWishlist: (product: Product) => Promise<boolean>;
}

const CART_STORAGE_KEY = 'hm_cart_v1';

function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>(loadCartFromStorage);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3200);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage quota errors
    }
  }, [cart]);

  const loadWishlist = useCallback(async () => {
    try {
      const data = await api.getWishlist();
      setWishlist(data.items);
    } catch {
      setWishlist([]);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.getSession();
      setUser(data.user);
      if (data.user) {
        await loadWishlist();
      } else {
        setWishlist([]);
      }
    } catch {
      setUser(null);
      setWishlist([]);
    } finally {
      setAuthLoading(false);
    }
  }, [loadWishlist]);

  useEffect(() => {
    refreshUser();
    api
      .getCategories()
      .then((res) => setCategories(res.categories))
      .catch(() => setCategories([]));
  }, [refreshUser]);

  const loginUser = useCallback(
    async (email: string, password: string) => {
      const res = await api.login({ email, password });
      setUserToken(res.token);
      setUser(res.user);
      await loadWishlist();
      return res.user;
    },
    [loadWishlist]
  );

  const registerUser = useCallback(
    async (payload: { name: string; email: string; password: string; phone?: string }) => {
      const res = await api.register(payload);
      setUserToken(res.token);
      setUser(res.user);
      setWishlist([]);
      return res.user;
    },
    []
  );

  const logoutUser = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUserToken(null);
      setUser(null);
      setWishlist([]);
    }
  }, []);

  const addToCart = useCallback(
    (product: Product, quantity: number = 1) => {
      if (product.stock <= 0) {
        showToast('This item is currently out of stock.', 'error');
        return;
      }
      setCart((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        if (existing) {
          const nextQty = Math.min(product.stock, existing.quantity + quantity);
          return prev.map((i) =>
            i.productId === product.id ? { ...i, quantity: nextQty, price: product.price, mrp: product.mrp, stock: product.stock } : i
          );
        }
        return [
          ...prev,
          {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            image: product.images[0] || '',
            price: product.price,
            mrp: product.mrp,
            stock: product.stock,
            quantity: Math.min(product.stock, Math.max(1, quantity)),
          },
        ];
      });
      showToast(`Added "${product.name}" to your bag.`);
    },
    [showToast]
  );

  const updateCartQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity: Math.min(i.stock, quantity) } : i
      )
    );
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const isInWishlist = useCallback(
    (productId: number) => wishlist.some((p) => p.id === productId),
    [wishlist]
  );

  const toggleWishlist = useCallback(
    async (product: Product) => {
      if (!user) {
        showToast('Sign in to save items to your wishlist.', 'error');
        return false;
      }
      const res = await api.toggleWishlist(product.id);
      setWishlist(res.items);
      showToast(res.saved ? 'Saved to your wishlist.' : 'Removed from wishlist.');
      return res.saved;
    },
    [user, showToast]
  );

  return (
    <StoreContext.Provider
      value={{
        user,
        authLoading,
        categories,
        cart,
        wishlist,
        toast,
        showToast,
        refreshUser,
        loginUser,
        registerUser,
        logoutUser,
        setUserDirect: setUser,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        isInWishlist,
        toggleWishlist,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
