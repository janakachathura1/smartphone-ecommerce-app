import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RiExchangeLine, RiSearchLine, RiAddLine, RiCheckLine,
  RiCloseLine, RiPhoneLine, RiCoupon3Line, RiSmartphoneLine
} from 'react-icons/ri';
import api from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import { PageLoader, EmptyState } from '../../components/ui';
import toast from 'react-hot-toast';

export default function AdminTradeIn() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTradeIn, setSelectedTradeIn] = useState(null);
  const [valuationOffer, setValuationOffer] = useState('');

  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    email: '',
    deviceBrand: 'Apple',
    deviceModel: '',
    storage: '128GB',
    condition: 'good',
    batteryHealth: '88%',
    screenCondition: 'flawless',
    accessories: 'Box & Charging Cable',
    estimatedValue: 0,
    notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-trade-ins', search, statusFilter, page],
    queryFn: () =>
      api.get('/admin/trade-ins', {
        params: { search, status: statusFilter, page, limit: 15 },
      }).then((r) => r.data.data),
  });

  const tradeIns = data?.tradeIns || [];
  const pagination = data?.pagination;

  const createMutation = useMutation({
    mutationFn: (newTradeIn) => api.post('/admin/trade-ins', newTradeIn),
    onSuccess: () => {
      toast.success('Trade-in request registered!');
      setShowCreateModal(false);
      setForm({
        customerName: '', phone: '', email: '', deviceBrand: 'Apple',
        deviceModel: '', storage: '128GB', condition: 'good', batteryHealth: '88%',
        screenCondition: 'flawless', accessories: 'Box & Charging Cable',
        estimatedValue: 0, notes: '',
      });
      qc.invalidateQueries(['admin-trade-ins']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit trade-in'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...patchData }) => api.put(`/admin/trade-ins/${id}`, patchData),
    onSuccess: () => {
      toast.success('Trade-in valuation updated!');
      setSelectedTradeIn(null);
      qc.invalidateQueries(['admin-trade-ins']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update trade-in'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.phone.trim() || !form.deviceModel.trim()) {
      toast.error('Please fill in Customer Name, Phone, and Device Model.');
      return;
    }
    createMutation.mutate(form);
  };

  const handleApproveTradeIn = (t) => {
    const couponCode = `TRD-${t.requestCode.slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;
    const finalVal = valuationOffer ? parseFloat(valuationOffer) : t.estimatedValue;
    updateMutation.mutate({
      id: t.id,
      status: 'approved',
      offeredValue: finalVal,
      couponCode,
      notes: `Approved for Store Credit of ${formatPrice(finalVal)}. Coupon code: ${couponCode}`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-secondary-900 tracking-tight flex items-center gap-2.5">
            <RiExchangeLine className="text-primary-600" />
            Trade-In & Device Exchange Valuation Manager
          </h1>
          <p className="text-xs text-secondary-500 font-medium mt-1">
            Evaluate used phones, estimate trade-in valuations, and issue instant store credits
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary text-sm shadow-md"
        >
          <RiAddLine size={18} /> New Trade-In Request
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <RiSearchLine size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by Request Code, Customer, Phone, Model..."
              className="input pl-9 text-sm py-2 w-full"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {['', 'pending', 'inspected', 'approved', 'rejected'].map((st) => (
              <button
                key={st}
                onClick={() => { setStatusFilter(st); setPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                }`}
              >
                {st === '' ? 'All Status' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Trade-Ins Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : tradeIns.length === 0 ? (
          <EmptyState
            title="No Trade-In Requests Found"
            description="Record customer trade-ins when they bring an old phone for exchange."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary-50 border-b border-secondary-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase">Request & Device</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase">Condition & Battery</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase">Estimated / Offered Value</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase">Status & Coupon</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-secondary-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {tradeIns.map((t) => (
                  <tr key={t.id} className="hover:bg-secondary-50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black bg-secondary-100 text-secondary-800 px-2 py-0.5 rounded">
                          {t.requestCode}
                        </span>
                        <span className="text-[11px] text-secondary-400">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-bold text-secondary-900 mt-1">
                        {t.deviceBrand} {t.deviceModel} ({t.storage || '128GB'})
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-secondary-800">{t.customerName}</p>
                      <p className="text-xs text-secondary-500 flex items-center gap-1 mt-0.5">
                        <RiPhoneLine size={12} /> {t.phone}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="capitalize text-xs font-semibold px-2 py-0.5 bg-secondary-100 rounded-md">
                        Condition: {t.condition}
                      </span>
                      <p className="text-xs text-secondary-600 mt-1">
                        Battery: <span className="font-bold">{t.batteryHealth || 'N/A'}</span> | Screen: {t.screenCondition || 'Good'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-secondary-900">{formatPrice(t.offeredValue || t.estimatedValue)}</p>
                      {t.offeredValue && t.offeredValue !== t.estimatedValue && (
                        <p className="text-[11px] text-secondary-400 line-through">Est: {formatPrice(t.estimatedValue)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`badge ${
                        t.status === 'approved'
                          ? 'badge-success'
                          : t.status === 'rejected'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}>
                        {t.status.toUpperCase()}
                      </span>
                      {t.couponCode && (
                        <p className="font-mono text-xs text-primary-600 font-bold mt-1 flex items-center gap-1">
                          <RiCoupon3Line size={13} /> {t.couponCode}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-1">
                      {t.status === 'pending' && (
                        <>
                          <button
                            onClick={() => { setSelectedTradeIn(t); setValuationOffer(t.estimatedValue); }}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-xs"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateMutation.mutate({ id: t.id, status: 'rejected' })}
                            className="px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="p-4 border-t border-secondary-100 flex items-center justify-between">
            <p className="text-xs text-secondary-500">{pagination.total} total trade-in requests</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="btn-secondary text-xs py-1 px-3">Prev</button>
              <span className="text-xs text-secondary-700 py-1 px-2 font-bold">Page {page} of {pagination.pages}</span>
              <button onClick={() => setPage(page + 1)} disabled={page >= pagination.pages} className="btn-secondary text-xs py-1 px-3">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* New Trade-In Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-secondary-100 mb-4">
              <h2 className="text-lg font-black text-secondary-900 flex items-center gap-2">
                <RiExchangeLine className="text-primary-600" />
                New Device Trade-In Request
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-secondary-400 hover:text-secondary-700">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="e.g. Supun Perera"
                    className="input py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. 0771234567"
                    className="input py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">Brand</label>
                  <select
                    value={form.deviceBrand}
                    onChange={(e) => setForm({ ...form, deviceBrand: e.target.value })}
                    className="input py-2 text-sm"
                  >
                    <option value="Apple">Apple</option>
                    <option value="Samsung">Samsung</option>
                    <option value="Google">Google Pixel</option>
                    <option value="Xiaomi">Xiaomi</option>
                    <option value="OnePlus">OnePlus</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-secondary-700 mb-1">Device Model *</label>
                  <input
                    type="text"
                    value={form.deviceModel}
                    onChange={(e) => setForm({ ...form, deviceModel: e.target.value })}
                    placeholder="e.g. iPhone 12 Pro Max"
                    className="input py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">Storage</label>
                  <input
                    type="text"
                    value={form.storage}
                    onChange={(e) => setForm({ ...form, storage: e.target.value })}
                    placeholder="128GB"
                    className="input py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">Condition</label>
                  <select
                    value={form.condition}
                    onChange={(e) => setForm({ ...form, condition: e.target.value })}
                    className="input py-2 text-sm"
                  >
                    <option value="like_new">Like New (99%)</option>
                    <option value="good">Good Condition</option>
                    <option value="fair">Fair (Minor Marks)</option>
                    <option value="damaged">Damaged / Flaws</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">Battery Health</label>
                  <input
                    type="text"
                    value={form.batteryHealth}
                    onChange={(e) => setForm({ ...form, batteryHealth: e.target.value })}
                    placeholder="85%"
                    className="input py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary-700 mb-1">Estimated Valuation (LKR)</label>
                <input
                  type="number"
                  value={form.estimatedValue}
                  onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })}
                  placeholder="e.g. 115000"
                  className="input py-2 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-secondary-100">
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                  {createMutation.isPending ? 'Submitting...' : 'Register Trade-In'}
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval & Store Credit Modal */}
      {selectedTradeIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-up">
            <h2 className="text-lg font-black text-secondary-900 mb-2">Approve Trade-In Valuation</h2>
            <p className="text-xs text-secondary-600 mb-4">
              Device: <strong>{selectedTradeIn.deviceBrand} {selectedTradeIn.deviceModel}</strong> ({selectedTradeIn.customerName})
            </p>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-secondary-700 mb-1">Final Agreed Value (LKR)</label>
                <input
                  type="number"
                  value={valuationOffer}
                  onChange={(e) => setValuationOffer(e.target.value)}
                  className="input py-2 text-sm font-bold text-green-700"
                />
                <p className="text-[11px] text-secondary-500 mt-1">
                  An automatic unique discount coupon code will be generated for this amount.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-secondary-100">
                <button
                  type="button"
                  onClick={() => handleApproveTradeIn(selectedTradeIn)}
                  disabled={updateMutation.isPending}
                  className="btn-primary flex-1 bg-green-600 hover:bg-green-700"
                >
                  {updateMutation.isPending ? 'Approving...' : 'Confirm & Issue Store Credit'}
                </button>
                <button type="button" onClick={() => setSelectedTradeIn(null)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
