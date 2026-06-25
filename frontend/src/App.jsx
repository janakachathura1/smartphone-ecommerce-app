import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import api from './lib/api';

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
import NotFoundPage from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false },
  },
});

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function PageTransitionLoader() {
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((r) => r.data.data),
    staleTime: Infinity,
    enabled: !!localStorage.getItem('token') || true // Always try to get settings
  });

  const shopName = settings?.shopName || 'TechPulse';

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/40 backdrop-blur-2xl transition-all duration-700 animate-fade-in pointer-events-none">
      <div className="relative flex flex-col items-center space-y-8">
        {/* Compact Spinner Element */}
        <div className="relative w-24 h-24 flex items-center justify-center">
           <div className="absolute inset-0 rounded-full border-[1.5px] border-primary-100 border-t-primary-600 animate-spin" />
           <div className="w-12 h-12 bg-white border border-primary-100 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200/40 animate-pulse">
              <span className="text-primary-600 font-black text-xl italic">{shopName.charAt(0)}</span>
           </div>
        </div>

        {/* Minimalist Branded Text */}
        <div className="text-center">
          <h2 className="text-2xl font-black text-secondary-950 tracking-[0.2em] uppercase italic shimmer-text opacity-95">
            {shopName}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-4">
             <div className="w-1 h-1 rounded-full bg-secondary-950 animate-pulse" />
             <p className="text-[10px] font-black text-secondary-950 tracking-[0.4em] uppercase opacity-70">
                Establishing Channel
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
            <Route path="users" element={<AdminUsers />} />
            <Route path="brands" element={<AdminBrands />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="/admin/checkout" element={<AdminRoute><AdminCheckout /></AdminRoute>} />
          <Route path="/admin/pos" element={<AdminRoute><AdminCheckout /></AdminRoute>} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
