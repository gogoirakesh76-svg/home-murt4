import React from 'react';
import { RouterProvider, useRouter } from './context/RouterContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartCheckoutPage } from './pages/CartCheckoutPage';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';
import { OrdersPage } from './pages/OrdersPage';
import { WishlistPage } from './pages/WishlistPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { AdminPage } from './pages/AdminPage';

function ToastBanner() {
  const { toast } = useStore();
  if (!toast) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${
        toast.type === 'error' ? 'bg-red-700' : 'bg-[#0B1914] border border-emerald-600'
      }`}
    >
      {toast.message}
    </div>
  );
}

function AppRoutes() {
  const { path } = useRouter();

  if (path === '/admin' || path.startsWith('/admin/')) {
    return (
      <>
        <AdminPage />
        <ToastBanner />
      </>
    );
  }

  let page: React.ReactNode = <HomePage />;

  if (path === '/shop') {
    page = <ShopPage />;
  } else if (path.startsWith('/product/')) {
    const idOrSlug = decodeURIComponent(path.replace('/product/', '').split('/')[0]);
    page = <ProductDetailPage idOrSlug={idOrSlug} />;
  } else if (path === '/cart' || path === '/checkout') {
    page = <CartCheckoutPage />;
  } else if (path === '/login') {
    page = <AuthPage initialMode="login" />;
  } else if (path === '/register') {
    page = <AuthPage initialMode="register" />;
  } else if (path === '/profile') {
    page = <ProfilePage />;
  } else if (path === '/orders') {
    page = <OrdersPage />;
  } else if (path === '/wishlist') {
    page = <WishlistPage />;
  } else if (path === '/track-order') {
    page = <TrackOrderPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111827]">
      <Navbar />
      <div className="flex-1">{page}</div>
      <Footer />
      <ToastBanner />
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <StoreProvider>
        <AppRoutes />
      </StoreProvider>
    </RouterProvider>
  );
}
