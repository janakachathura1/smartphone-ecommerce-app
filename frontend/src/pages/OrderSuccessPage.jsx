import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { RiCheckboxCircleLine, RiFileList3Line, RiShoppingBagLine } from 'react-icons/ri';
import api from '../lib/api';
import { formatPrice } from '../lib/utils';
import { PageLoader } from '../components/ui';

export default function OrderSuccessPage() {
  const { id } = useParams();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then((r) => r.data.data.order),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="bg-secondary-50 min-h-screen flex items-center justify-center py-12">
      <div className="max-w-lg w-full mx-4">
        <div className="card p-8 text-center animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <RiCheckboxCircleLine size={44} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-black text-secondary-900 mb-2">Order Placed!</h1>
          <p className="text-secondary-500 mb-6">
            Thank you for your purchase. Your order has been confirmed and will be processed shortly.
          </p>

          {order && (
            <div className="bg-secondary-50 rounded-2xl p-5 text-left space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-secondary-500">Order Number</span>
                <span className="font-bold text-secondary-900">#{order.orderNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary-500">Status</span>
                <span className="badge-warning capitalize">{order.status}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary-500">Payment</span>
                <span className="font-medium text-secondary-900 capitalize">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm font-bold">
                <span className="text-secondary-700">Total Paid</span>
                <span className="text-secondary-900">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Link to="/account/orders" className="flex-1 btn-outline py-3">
              <RiFileList3Line size={18} /> Track Order
            </Link>
            <Link to="/shop" className="flex-1 btn-primary py-3">
              <RiShoppingBagLine size={18} /> Shop More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
