import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import { printPDFInvoice, printShippingLabel } from '../../lib/pdfInvoice';
import toast from 'react-hot-toast';
import { PageLoader, EmptyState } from '../../components/ui';
import {
  RiShoppingCartLine, RiPrinterLine, RiTruckLine,
  RiWhatsappLine, RiShieldCheckLine, RiCheckDoubleLine
} from 'react-icons/ri';

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUS_OPTIONS = ['unpaid', 'paid', 'refunded'];
const COURIER_OPTIONS = ['Domex', 'Koombiyo', 'PromptX', 'Citypak', 'Pronto', 'DHL', 'Certis Lanka', 'In-House Rider'];

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
  const [fulfillOrder, setFulfillOrder] = useState(null);
  const [courierName, setCourierName] = useState('Domex');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [itemImeis, setItemImeis] = useState({});
  const [isFulfilling, setIsFulfilling] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((r) => r.data.data),
  });

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

  const openFulfillModal = (order) => {
    setFulfillOrder(order);
    setCourierName(order.courierName || 'Domex');
    setTrackingNumber(order.trackingNumber || '');
    const imeis = {};
    (order.items || []).forEach(item => {
      imeis[item.id] = item.imei || '';
    });
    setItemImeis(imeis);
  };

  const handleFulfillSubmit = async (e) => {
    e.preventDefault();
    if (!fulfillOrder) return;
    setIsFulfilling(true);
    try {
      await api.post(`/admin/orders/${fulfillOrder.id}/fulfill`, {
        courierName,
        trackingNumber,
        status: 'shipped',
        itemImeis,
      });
      toast.success(`Order #${fulfillOrder.orderNumber} dispatched & warranty registered!`);
      setFulfillOrder(null);
      qc.invalidateQueries(['admin-orders']);
      qc.invalidateQueries(['admin-warranties']);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fulfill order');
    } finally {
      setIsFulfilling(false);
    }
  };

  const sendWhatsAppUpdate = (order) => {
    const customerPhone = order.address?.phone || order.user?.phone;
    if (!customerPhone) {
      toast.error('Customer phone number not available');
      return;
    }
    let cleanPhone = customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '94' + cleanPhone.slice(1);

    const customerName = order.address?.fullName || order.user?.firstName || 'Customer';
    const trackingMsg = order.trackingNumber
      ? `%0A📦 *Courier:* ${order.courierName || 'Partner'}%0A🔢 *Tracking No:* ${order.trackingNumber}`
      : '';

    const text = `Hi ${customerName}! 👋%0A%0AYour order *#${order.orderNumber}* from *TechPulse Store* is currently *${order.status.toUpperCase()}*.${trackingMsg}%0A%0A💰 *Total Amount:* ${formatPrice(order.totalAmount)}%0A💳 *Payment:* ${order.paymentStatus === 'paid' ? 'PAID' : 'Cash on Delivery (COD)'}%0A%0AThank you for shopping with TechPulse! 🚀`;

    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
    toast.success('WhatsApp chat opened!');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Orders Management</h1>
          <p className="text-xs text-secondary-500 font-medium mt-0.5">
            Manage online orders, assign IMEI serials, print invoices & shipping labels
          </p>
        </div>
      </div>

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
                  {['Order #', 'Customer', 'Courier / Tracking', 'Total', 'Status', 'Payment', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-secondary-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-secondary-900">
                      #{order.orderNumber}
                      <p className="font-sans text-[11px] text-secondary-400 font-normal mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {order.notes === 'POS Walk-in Sale' ? (
                        <>
                          <p className="font-bold text-primary-600">POS Walk-in</p>
                          <p className="text-xs text-secondary-500 italic">In-Store Purchase</p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-secondary-900">{order.address?.fullName || `${order.user?.firstName} ${order.user?.lastName}`}</p>
                          <p className="text-xs text-secondary-500">{order.address?.phone || order.user?.phone || order.user?.email}</p>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {order.courierName ? (
                        <div>
                          <span className="font-bold text-xs bg-secondary-100 text-secondary-800 px-2 py-0.5 rounded">
                            {order.courierName}
                          </span>
                          {order.trackingNumber && (
                            <p className="font-mono text-[11px] text-secondary-500 mt-1">
                              Trk: {order.trackingNumber}
                            </p>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => openFulfillModal(order)}
                          className="text-xs text-primary-600 font-semibold hover:underline flex items-center gap-1"
                        >
                          <RiTruckLine size={13} /> Assign Courier & IMEI
                        </button>
                      )}
                    </td>
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
                      <p className="text-[10px] text-secondary-400 uppercase font-medium mt-0.5">
                        {order.paymentMethod}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* WhatsApp update */}
                        <button
                          onClick={() => sendWhatsAppUpdate(order)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Send WhatsApp Order Update"
                        >
                          <RiWhatsappLine size={17} />
                        </button>

                        {/* Fulfill / IMEI modal */}
                        <button
                          onClick={() => openFulfillModal(order)}
                          className="p-1.5 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                          title="Fulfill / Assign IMEI & Courier"
                        >
                          <RiShieldCheckLine size={17} />
                        </button>

                        {/* Thermal Shipping Label */}
                        <button
                          onClick={() => printShippingLabel(order, settings)}
                          className="p-1.5 text-secondary-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Print Courier Shipping Label"
                        >
                          <RiTruckLine size={17} />
                        </button>

                        {/* PDF Official Invoice */}
                        <button
                          onClick={() => printPDFInvoice(order, settings)}
                          className="p-1.5 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                          title="Print / Download PDF Invoice"
                        >
                          <RiPrinterLine size={17} />
                        </button>
                      </div>
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

      {/* Fulfill Order & IMEI Assignment Modal */}
      {fulfillOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-secondary-100 mb-4">
              <div>
                <h2 className="text-lg font-black text-secondary-900 flex items-center gap-2">
                  <RiTruckLine className="text-primary-600" />
                  Fulfill & Pack Order #{fulfillOrder.orderNumber}
                </h2>
                <p className="text-xs text-secondary-500 mt-0.5">
                  Assign IMEI numbers for automatic warranty registration & enter courier tracking.
                </p>
              </div>
              <button onClick={() => setFulfillOrder(null)} className="text-secondary-400 hover:text-secondary-700">✕</button>
            </div>

            <form onSubmit={handleFulfillSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">Courier Partner *</label>
                  <select
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    className="input py-2 text-sm"
                  >
                    {COURIER_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">Courier Tracking No</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. DMX-998823"
                    className="input py-2 font-mono text-sm"
                  />
                </div>
              </div>

              {/* Items & IMEI Input */}
              <div className="border-t pt-3 space-y-3">
                <p className="text-xs font-bold text-secondary-800 uppercase">Device Items & IMEI Serials:</p>
                {(fulfillOrder.items || []).map((item) => (
                  <div key={item.id} className="bg-secondary-50 p-3 rounded-xl border border-secondary-200">
                    <p className="font-bold text-secondary-900 text-xs">{item.productName || item.product?.name}</p>
                    <p className="text-[11px] text-secondary-500 mb-2">
                      Qty: {item.quantity} | {item.storage || ''} {item.color || ''}
                    </p>
                    <label className="block text-[11px] font-bold text-secondary-600 mb-1">
                      Device IMEI / Serial Number:
                    </label>
                    <input
                      type="text"
                      value={itemImeis[item.id] || ''}
                      onChange={(e) => setItemImeis({ ...itemImeis, [item.id]: e.target.value })}
                      placeholder="15-digit IMEI (e.g. 354890123456789)"
                      className="input py-1.5 text-xs font-mono bg-white"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-secondary-100">
                <button type="submit" disabled={isFulfilling} className="btn-primary flex-1">
                  {isFulfilling ? 'Fulfilling...' : 'Dispatch & Register Warranty'}
                </button>
                <button type="button" onClick={() => setFulfillOrder(null)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
