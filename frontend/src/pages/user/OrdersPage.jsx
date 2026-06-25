import { useQuery } from '@tanstack/react-query';
import { RiShoppingBagLine, RiEyeLine } from 'react-icons/ri';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import { PageLoader, EmptyState } from '../../components/ui';
import UserLayout from './UserLayout';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders-all'],
    queryFn: () => api.get('/orders/my-orders?limit=50').then((r) => r.data.data),
  });

  const orders = data?.orders || [];

  return (
    <UserLayout>
      <div className="card">
        <div className="p-6 border-b border-secondary-100">
          <h1 className="text-xl font-bold text-secondary-900">My Orders</h1>
          <p className="text-secondary-500 text-sm mt-1">{data?.pagination?.total || 0} orders total</p>
        </div>

        {isLoading ? (
          <div className="p-10"><PageLoader /></div>
        ) : orders.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={RiShoppingBagLine}
              title="No orders yet"
              description="Start shopping to see your orders here."
              action={<Link to="/shop" className="btn-primary">Browse Products</Link>}
            />
          </div>
        ) : (
          <div className="divide-y divide-secondary-100">
            {orders.map((order) => (
              <div key={order.id} className="p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-bold text-secondary-900">#{order.orderNumber}</p>
                    <p className="text-xs text-secondary-500 mt-1">
                      Placed {new Date(order.createdAt).toLocaleDateString()} · {order.items?.length} item(s) · {order.paymentMethod?.toUpperCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${STATUS_COLORS[order.status] || ''} capitalize`}>{order.status}</span>
                    <span className="font-bold text-secondary-900">{formatPrice(order.totalAmount)}</span>
                  </div>
                </div>
                {order.items?.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                    {order.items.slice(0, 4).map((item) => (
                      <div key={item.id} className="flex-shrink-0 bg-secondary-50 rounded-xl px-3 py-2 text-xs text-secondary-700">
                        {item.productName} ×{item.quantity}
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <div className="flex-shrink-0 bg-secondary-50 rounded-xl px-3 py-2 text-xs text-secondary-500">
                        +{order.items.length - 4} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
