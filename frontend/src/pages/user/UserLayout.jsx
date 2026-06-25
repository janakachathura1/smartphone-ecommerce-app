import { Link, NavLink, Outlet } from 'react-router-dom';
import { RiUserLine, RiShoppingBagLine, RiHeartLine, RiMapPinLine, RiLockLine, RiDashboardLine } from 'react-icons/ri';
import { useAuthStore } from '../../store/authStore';
import { getInitials } from '../../lib/utils';

const navLinks = [
  { to: '/account/dashboard', label: 'Dashboard', icon: RiDashboardLine },
  { to: '/account/orders', label: 'My Orders', icon: RiShoppingBagLine },
  { to: '/account/wishlist', label: 'Wishlist', icon: RiHeartLine },
  { to: '/account/profile', label: 'Profile', icon: RiUserLine },
  { to: '/account/addresses', label: 'Addresses', icon: RiMapPinLine },
];

export default function UserLayout({ children }) {
  const { user } = useAuthStore();
  return (
    <div className="bg-secondary-50 min-h-screen py-8">
      <div className="container-custom">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 mb-4 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-blue-400 flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                {getInitials(user?.firstName, user?.lastName)}
              </div>
              <p className="font-bold text-secondary-900">{user?.firstName} {user?.lastName}</p>
              <p className="text-secondary-500 text-sm">{user?.email}</p>
            </div>
            <div className="card overflow-hidden">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} end={to === '/account/dashboard'} className={({ isActive }) => `flex items-center gap-3 px-5 py-3.5 text-sm font-medium border-b border-secondary-100 last:border-0 transition-colors ${isActive ? 'text-primary-600 bg-primary-50' : 'text-secondary-700 hover:bg-secondary-50'}`}>
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
          {/* Content */}
          <div className="lg:col-span-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
