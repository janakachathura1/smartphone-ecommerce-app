import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RiAddLine, RiDeleteBin6Line, RiCoupon2Line, RiCheckLine, RiCloseLine } from 'react-icons/ri';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { PageLoader } from '../../components/ui';
import { formatPrice } from '../../lib/utils';

const EMPTY_FORM = {
  code: '',
  discountType: 'percent',
  discountValue: '',
  minOrderValue: 0,
  maxUses: 100,
  expiresAt: '',
};

export default function AdminCoupons() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => api.get('/coupons/all').then((r) => r.data.data.coupons),
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/coupons', {
        ...form,
        code: form.code.toUpperCase(),
        discountValue: parseFloat(form.discountValue),
        minOrderValue: parseFloat(form.minOrderValue || 0),
        maxUses: parseInt(form.maxUses || 100),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      });
      toast.success('Coupon created!');
      qc.invalidateQueries(['admin-coupons']);
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id, isActive) => {
    try {
      await api.patch(`/coupons/${id}/toggle`);
      toast.success(isActive ? 'Coupon deactivated' : 'Coupon activated');
      qc.invalidateQueries(['admin-coupons']);
    } catch {
      toast.error('Failed to update coupon');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon permanently?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.success('Coupon deleted');
      qc.invalidateQueries(['admin-coupons']);
    } catch {
      toast.error('Failed to delete coupon');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Coupons</h1>
          <p className="text-secondary-500 text-sm mt-1">Manage discount codes and promotions</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          <RiAddLine size={16} /> Create Coupon
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card p-6 animate-slide-down">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-secondary-900 text-lg flex items-center gap-2">
              <RiCoupon2Line size={20} /> New Coupon
            </h2>
            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-secondary-100 rounded-xl text-secondary-500">
              <RiCloseLine size={18} />
            </button>
          </div>
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-secondary-600 block mb-1">Coupon Code *</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="TECH10"
                  className="input text-sm py-2 font-mono uppercase"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-secondary-600 block mb-1">Discount Type *</label>
                <select
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                  className="input text-sm py-2"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-secondary-600 block mb-1">
                  Discount Value * {form.discountType === 'percent' ? '(%)' : '($)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                  placeholder={form.discountType === 'percent' ? '10' : '50'}
                  className="input text-sm py-2"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-secondary-600 block mb-1">Min Order Value ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minOrderValue}
                  onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
                  placeholder="0"
                  className="input text-sm py-2"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-secondary-600 block mb-1">Max Uses</label>
                <input
                  type="number"
                  min="1"
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                  placeholder="100"
                  className="input text-sm py-2"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-secondary-600 block mb-1">Expires At (optional)</label>
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="input text-sm py-2"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5 pt-5 border-t border-secondary-100">
              <button type="submit" disabled={saving} className="btn-primary text-sm">
                {saving ? 'Creating...' : 'Create Coupon'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary-50 border-b border-secondary-100">
                <tr>
                  {['Code', 'Type', 'Value', 'Min Order', 'Uses', 'Expires', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {(coupons || []).map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-secondary-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-secondary-900 text-sm bg-secondary-100 px-2 py-1 rounded-lg">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize text-secondary-600">{coupon.discountType}</td>
                    <td className="px-4 py-3 font-semibold text-secondary-900">
                      {coupon.discountType === 'percent' ? `${coupon.discountValue}%` : formatPrice(coupon.discountValue)}
                    </td>
                    <td className="px-4 py-3 text-secondary-600">
                      {coupon.minOrderValue > 0 ? formatPrice(coupon.minOrderValue) : '—'}
                    </td>
                    <td className="px-4 py-3 text-secondary-600">
                      <span className={coupon.usedCount >= coupon.maxUses ? 'text-red-500 font-semibold' : ''}>
                        {coupon.usedCount}/{coupon.maxUses}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-secondary-500 text-xs">
                      {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${coupon.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggle(coupon.id, coupon.isActive)}
                          title={coupon.isActive ? 'Deactivate' : 'Activate'}
                          className={`p-1.5 rounded-lg transition-colors ${coupon.isActive ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'}`}
                        >
                          {coupon.isActive ? <RiCloseLine size={16} /> : <RiCheckLine size={16} />}
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="p-1.5 text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <RiDeleteBin6Line size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(coupons || []).length === 0 && (
              <div className="p-12 text-center">
                <RiCoupon2Line size={40} className="text-secondary-300 mx-auto mb-3" />
                <p className="text-secondary-500 font-medium">No coupons yet</p>
                <p className="text-secondary-400 text-sm">Create your first coupon to get started</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
