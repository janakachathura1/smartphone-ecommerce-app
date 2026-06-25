import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  RiDashboardLine, RiShoppingBagLine, RiShoppingCartLine,
  RiUserLine, RiPriceTag3Line, RiLogoutBoxLine, RiMenuLine, RiCloseLine, RiCoupon2Line, RiSettings3Line, RiStarLine, RiStore2Line
} from 'react-icons/ri';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: RiDashboardLine, exact: true },
  { path: '/admin/products', label: 'Products', icon: RiShoppingBagLine },
  { path: '/admin/orders', label: 'Orders', icon: RiShoppingCartLine },
  { path: '/admin/users', label: 'Users', icon: RiUserLine },
  { path: '/admin/brands', label: 'Brands', icon: RiPriceTag3Line },
  { path: '/admin/reviews', label: 'Reviews', icon: RiStarLine },
  { path: '/admin/coupons', label: 'Coupons', icon: RiCoupon2Line },
  { path: '/admin/settings', label: 'Settings', icon: RiSettings3Line },
];

export default function AdminLayout() {
  const { user, logout, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((r) => r.data.data),
  });
  const shopName = settings?.shopName || 'TechPulse';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-secondary-800">
        <Link to="/" className={`flex items-center gap-3 ${isLoading ? 'animate-pulse' : ''}`}>
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt={shopName} className={`w-10 h-10 object-contain transition-all ${isLoading ? 'animate-bounce' : ''}`} />
          ) : (
            <div className={`w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center transition-all ${isLoading ? 'animate-bounce' : ''}`}>
              <span className="text-white font-bold text-lg">{shopName.charAt(0)}</span>
            </div>
          )}
          <div>
            <p className="text-white font-bold text-lg leading-none">{shopName}</p>
            <p className="text-secondary-400 text-xs mt-0.5">Admin Panel</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ path, label, icon: Icon, exact }) => (
          <NavLink
            key={path}
            to={path}
            end={exact}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-primary-600 text-white shadow-glow'
                  : 'text-secondary-400 hover:text-white hover:bg-secondary-800'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}

        {/* POS opens in new window */}
        <button
          onClick={() => {
            window.open('/admin/pos', '_blank', 'width=1400,height=900,menubar=no,toolbar=no,location=no,status=no');
            setSidebarOpen(false);
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 text-secondary-400 hover:text-white hover:bg-secondary-800"
        >
          <RiStore2Line size={20} />
          POS System ↗
        </button>
      </nav>

      <div className="p-4 border-t border-secondary-800">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.firstName?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-secondary-400 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-secondary-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all text-sm font-medium"
        >
          <RiLogoutBoxLine size={18} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-secondary-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 bg-secondary-900 flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-60 bg-secondary-900">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-secondary-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-secondary-100 text-secondary-600"
          >
            <RiMenuLine size={22} />
          </button>
          <h1 className="text-secondary-900 font-bold text-xl">Admin Dashboard</h1>
          <a href="/" target="_blank" className="text-sm text-primary-600 hover:underline">
            View Store ↗
          </a>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
