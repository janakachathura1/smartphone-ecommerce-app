import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  RiShoppingCartLine, RiWhatsappLine, RiTimeLine,
  RiUserLine, RiPhoneLine, RiCoupon3Line, RiMailLine
} from 'react-icons/ri';
import api from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import { PageLoader, EmptyState } from '../../components/ui';
import toast from 'react-hot-toast';

export default function AdminAbandonedCarts() {
  const [selectedCart, setSelectedCart] = useState(null);
  const [discountCode, setDiscountCode] = useState('SAVE5K');
  const [customDiscount, setCustomDiscount] = useState('5% Off');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-abandoned-carts'],
    queryFn: () => api.get('/admin/abandoned-carts').then((r) => r.data.data),
  });

  const carts = data?.carts || [];
  const totalPotentialRevenue = carts.reduce((sum, c) => sum + c.totalValue, 0);

  const handleSendWhatsApp = (cart) => {
    const customerPhone = cart.user?.phone || '';
    if (!customerPhone) {
      toast.error('No phone number available for this customer.');
      return;
    }

    // Clean phone number (convert 077... to 9477...)
    let cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '94' + cleanPhone.slice(1);
    }

    const itemsSummary = cart.items
      .map((i) => `• ${i.product?.name || 'Item'} (Qty: ${i.quantity})`)
      .join('%0A');

    const customerName = cart.user?.firstName || 'Valued Customer';

    const message = `Hi ${customerName}! 👋%0A%0AWe noticed you left some great smartphones in your shopping cart at *TechPulse Store*:%0A${itemsSummary}%0A%0A🔥 Use exclusive discount coupon *${discountCode}* to get *${customDiscount}* on your order today!%0A%0A👉 Complete your order now: ${window.location.origin}/cart%0A%0ANeed any help? Feel free to reply here! 😊`;

    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    toast.success('WhatsApp recovery chat opened!');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-secondary-900 tracking-tight flex items-center gap-2.5">
            <RiShoppingCartLine className="text-primary-600" />
            Abandoned Cart Recovery Hub
          </h1>
          <p className="text-xs text-secondary-500 font-medium mt-1">
            Re-engage customers who left items in their cart using 1-Click WhatsApp coupons & reminders
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 border-l-4 border-amber-500">
          <p className="text-xs font-bold text-secondary-500 uppercase">Abandoned Carts (&gt;2 hrs)</p>
          <p className="text-2xl font-black text-secondary-900 mt-1">{carts.length}</p>
        </div>
        <div className="card p-4 border-l-4 border-primary-500">
          <p className="text-xs font-bold text-secondary-500 uppercase">Recoverable Revenue Value</p>
          <p className="text-2xl font-black text-primary-600 mt-1">{formatPrice(totalPotentialRevenue)}</p>
        </div>
        <div className="card p-4 border-l-4 border-green-500">
          <p className="text-xs font-bold text-secondary-500 uppercase">Recovery Incentive Coupon</p>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="text"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              className="font-mono font-bold text-xs bg-secondary-100 px-2 py-1 rounded border border-secondary-300 w-28 uppercase"
            />
            <span className="text-xs text-secondary-500 font-semibold">({customDiscount})</span>
          </div>
        </div>
      </div>

      {/* Abandoned Carts Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : carts.length === 0 ? (
          <EmptyState
            title="No Abandoned Carts Right Now"
            description="Great news! There are no inactive carts awaiting recovery."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary-50 border-b border-secondary-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase">Cart Items & Total</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase">Inactive Duration</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-secondary-500 uppercase">Recovery Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {carts.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-secondary-900">
                        {c.user?.firstName ? `${c.user.firstName} ${c.user.lastName}` : 'Guest User'}
                      </p>
                      <p className="text-xs text-secondary-500 flex items-center gap-1 mt-0.5">
                        <RiPhoneLine size={12} /> {c.user?.phone || 'No Phone'}
                      </p>
                      {c.user?.email && (
                        <p className="text-[11px] text-secondary-400 flex items-center gap-1">
                          <RiMailLine size={11} /> {c.user.email}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        {c.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <span className="font-semibold text-secondary-800 line-clamp-1">
                              {item.quantity}x {item.product?.name || 'Device'}
                            </span>
                            {(item.color || item.storage) && (
                              <span className="text-[10px] text-secondary-400">
                                ({item.color} {item.storage})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs font-black text-primary-600 mt-1">
                        Total: {formatPrice(c.totalValue)}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md border border-amber-200">
                        <RiTimeLine size={12} />
                        {c.abandonedHours} hrs ago
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleSendWhatsApp(c)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-sm transition"
                      >
                        <RiWhatsappLine size={16} /> Send WhatsApp Offer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
