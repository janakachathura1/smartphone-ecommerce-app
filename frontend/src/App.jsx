import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import api from './lib/api';

import ComparePage from './pages/ComparePage';

// Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentPage from './pages/PaymentPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/user/DashboardPage';
import OrdersPage from './pages/user/OrdersPage';
import WishlistPage from './pages/user/WishlistPage';
import ProfilePage from './pages/user/ProfilePage';
import AddressesPage from './pages/user/AddressesPage';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminBrands from './pages/admin/AdminBrands';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminSettings from './pages/admin/AdminSettings';
import AdminReviews from './pages/admin/AdminReviews';
import AdminCheckout from './pages/admin/AdminCheckout';
import AdminReports from './pages/admin/AdminReports';
import AdminWarranty from './pages/admin/AdminWarranty';
import AdminRepairs from './pages/admin/AdminRepairs';
import AdminTradeIn from './pages/admin/AdminTradeIn';
import AdminAbandonedCarts from './pages/admin/AdminAbandonedCarts';
import NotFoundPage from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false },
  },
});

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

function PageTransitionLoader() {
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 2000); // 2 seconds loader duration
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/75 backdrop-blur-xl pointer-events-none animate-fade-in">
      <div className="relative w-16 h-16">
        {/* Outer Ring (Clockwise) */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-600 animate-spin" />
        {/* Inner Ring (Counter-Clockwise) */}
        <div className="absolute inset-1.5 rounded-full border-4 border-transparent border-t-secondary-400" style={{
          animation: 'spin-reverse 1.2s linear infinite'
        }} />
        {/* Center Dot */}
        <div className="absolute inset-[22px] rounded-full bg-primary-500 animate-pulse" />
      </div>
      <style>{`
        @keyframes spin-reverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
}

import { GoogleOAuthProvider } from '@react-oauth/google';

function SiteSettingsSync() {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (settings) {
      if (settings.shopName) {
        document.title = settings.shopName;
      }
      if (settings.logoUrl) {
        const link = document.querySelector("link[rel~='icon']");
        if (link) {
          link.href = settings.logoUrl;
          const lowerUrl = settings.logoUrl.toLowerCase();
          if (lowerUrl.endsWith('.png')) {
            link.type = 'image/png';
          } else if (lowerUrl.endsWith('.svg')) {
            link.type = 'image/svg+xml';
          } else if (lowerUrl.endsWith('.ico')) {
            link.type = 'image/x-icon';
          } else if (lowerUrl.endsWith('.webp')) {
            link.type = 'image/webp';
          } else if (lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg')) {
            link.type = 'image/jpeg';
          } else {
            link.removeAttribute('type');
          }
        }
      }
    }
  }, [settings]);

  return null;
}

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '450282233425-4t3sf40dr7tde2klu6d9s8tnh47ghqfn.apps.googleusercontent.com';

  return (
    <GoogleOAuthProvider clientId={googleClientId} locale="en">
      <QueryClientProvider client={queryClient}>
        <SiteSettingsSync />
        <BrowserRouter>
          <ScrollToTop />
          <PageTransitionLoader />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: { iconTheme: { primary: '#3b82f6', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public routes with main layout */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="shop" element={<ShopPage />} />
            <Route path="product/:slug" element={<ProductDetailPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="compare" element={<ComparePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected user routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="payment" element={<PaymentPage />} />
              <Route path="order-success/:id" element={<OrderSuccessPage />} />
              <Route path="account/dashboard" element={<DashboardPage />} />
              <Route path="account/orders" element={<OrdersPage />} />
              <Route path="account/wishlist" element={<WishlistPage />} />
              <Route path="account/profile" element={<ProfilePage />} />
              <Route path="account/addresses" element={<AddressesPage />} />
            </Route>
          </Route>

          {/* Admin routes */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="warranty" element={<AdminWarranty />} />
            <Route path="repairs" element={<AdminRepairs />} />
            <Route path="trade-ins" element={<AdminTradeIn />} />
            <Route path="abandoned-carts" element={<AdminAbandonedCarts />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="brands" element={<AdminBrands />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="/admin/checkout" element={<AdminRoute><AdminCheckout /></AdminRoute>} />
          <Route path="/admin/pos" element={<AdminRoute><AdminCheckout /></AdminRoute>} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </GoogleOAuthProvider>
  );
}
