import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { RiShoppingBagLine, RiHeartLine, RiMapPinLine, RiArrowRightLine, RiFileListLine } from 'react-icons/ri';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { formatPrice } from '../../lib/utils';
import UserLayout from './UserLayout';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { items: wishlistItems } = useWishlistStore();

  const { data: ordersData } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders/my-orders?limit=3').then((r) => r.data.data),
  });

  const recentOrders = ordersData?.orders || [];
  const totalOrders = ordersData?.pagination?.total || 0;

  const STATUS_COLOR = {
    pending: 'badge-warning',
    confirmed: 'badge-primary',
    processing: 'badge-primary',
    shipped: 'badge bg-purple-100 text-purple-700',
    delivered: 'badge-success',
    cancelled: 'badge-danger',
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="card p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-secondary-100 flex items-center justify-center text-secondary-800 text-lg font-black shadow-inner overflow-hidden flex-shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="capitalize">{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-secondary-900 leading-none mb-1.5">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className="text-secondary-500 text-sm">Here's a summary of your account activity.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Orders', value: totalOrders, icon: RiShoppingBagLine, color: 'primary', link: '/account/orders' },
            { label: 'Wishlist Items', value: wishlistItems.length, icon: RiHeartLine, color: 'red', link: '/account/wishlist' },
            { label: 'Addresses', value: '—', icon: RiMapPinLine, color: 'green', link: '/account/addresses' },
          ].map(({ label, value, icon: Icon, link }) => (
            <Link key={label} to={link} className="card-hover p-5 text-center group">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-200 transition-colors">
                <Icon size={20} className="text-primary-600" />
              </div>
              <p className="text-2xl font-black text-secondary-900">{value}</p>
              <p className="text-xs text-secondary-500 mt-1">{label}</p>
            </Link>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div className="flex items-center justify-between p-6 border-b border-secondary-100">
            <h2 className="font-bold text-secondary-900 flex items-center gap-2">
              <RiFileListLine size={20} /> Recent Orders
            </h2>
            <Link to="/account/orders" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              View All <RiArrowRightLine size={14} />
            </Link>
          </div>
          <div className="divide-y divide-secondary-100">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-secondary-500">
                <RiShoppingBagLine size={32} className="mx-auto mb-3 text-secondary-300" />
                <p>You haven't placed any orders yet.</p>
                <Link to="/shop" className="btn-primary mt-4 text-sm py-2">Start Shopping</Link>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="p-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-secondary-900 text-sm">#{order.orderNumber}</p>
                    <p className="text-xs text-secondary-500 mt-0.5">{order.items?.length} item(s) · {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-secondary-900">{formatPrice(order.totalAmount)}</p>
                    <span className={`${STATUS_COLOR[order.status] || 'badge'} mt-1 capitalize`}>{order.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
