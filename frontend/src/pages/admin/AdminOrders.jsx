import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import toast from 'react-hot-toast';
import { PageLoader, EmptyState } from '../../components/ui';
import { RiShoppingCartLine } from 'react-icons/ri';

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUS_OPTIONS = ['unpaid', 'paid', 'refunded'];
const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminOrders() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter, page],
    queryFn: () => api.get('/orders', { params: { status: statusFilter, page, limit: 20 } }).then((r) => r.data.data),
  });

  const orders = data?.orders || [];
  const pagination = data?.pagination;

  const updateStatus = async (orderId, status, paymentStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status, paymentStatus });
      toast.success('Order updated!');
      qc.invalidateQueries(['admin-orders']);
    } catch {
      toast.error('Failed to update order');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-secondary-900">Orders Management</h1>

      <div className="card p-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-secondary-700">Filter by Status:</label>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input text-sm py-2 px-3 w-auto">
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </div>
        {pagination && <p className="text-sm text-secondary-500 ml-auto">{pagination.total} orders</p>}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary-50 border-b border-secondary-100">
                <tr>
                  {['Order #', 'Customer', 'Date', 'Items', 'Total', 'Status', 'Payment', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-secondary-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-secondary-900">#{order.orderNumber}</td>
                    <td className="px-4 py-3">
                      {order.notes === 'POS Walk-in Sale' ? (
                        <>
                          <p className="font-bold text-primary-600">POS Walk-in</p>
                          <p className="text-xs text-secondary-500 italic">In-Store Purchase</p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-secondary-900">{order.user?.firstName} {order.user?.lastName}</p>
                          <p className="text-xs text-secondary-500">{order.user?.email}</p>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 text-secondary-500 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-secondary-700">{order.items?.length}</td>
                    <td className="px-4 py-3 font-bold text-secondary-900">{formatPrice(order.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value, undefined)}
                        className={`badge ${STATUS_COLORS[order.status] || ''} capitalize cursor-pointer border-0 bg-opacity-80 text-xs py-1 px-2 rounded-full`}
                        style={{ appearance: 'none' }}
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize bg-white text-secondary-900">{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.paymentStatus}
                        onChange={(e) => updateStatus(order.id, undefined, e.target.value)}
                        className="text-xs border border-secondary-200 rounded-lg px-2 py-1 capitalize focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        {PAYMENT_STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-secondary-500 capitalize">{order.paymentMethod}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && (
              <EmptyState icon={RiShoppingCartLine} title="No orders found" description="Orders will appear here once customers start purchasing." />
            )}
          </div>
        )}
        {pagination && pagination.pages > 1 && (
          <div className="p-4 border-t border-secondary-100 flex items-center justify-between">
            <p className="text-sm text-secondary-500">{pagination.total} total orders</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="btn-secondary text-xs py-1.5 px-3">Prev</button>
              <span className="text-sm py-1.5 px-2">Page {page} of {pagination.pages}</span>
              <button onClick={() => setPage(page + 1)} disabled={page >= pagination.pages} className="btn-secondary text-xs py-1.5 px-3">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
