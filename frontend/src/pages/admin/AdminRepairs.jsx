import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RiToolsLine, RiSearchLine, RiAddLine, RiPrinterLine,
  RiPhoneLine, RiUserLine, RiTimeLine, RiMoneyDollarCircleLine,
  RiCheckDoubleLine
} from 'react-icons/ri';
import api from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import { PageLoader, EmptyState } from '../../components/ui';
import toast from 'react-hot-toast';

export default function AdminRepairs() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [printJob, setPrintJob] = useState(null);

  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    email: '',
    deviceModel: '',
    imei: '',
    passcode: '',
    issue: '',
    estimatedCost: 0,
    advancePaid: 0,
    technician: '',
    notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-repairs', search, statusFilter, page],
    queryFn: () =>
      api.get('/admin/repairs', {
        params: { search, status: statusFilter, page, limit: 15 },
      }).then((r) => r.data.data),
  });

  const repairs = data?.repairs || [];
  const pagination = data?.pagination;

  const createMutation = useMutation({
    mutationFn: (newRepair) => api.post('/admin/repairs', newRepair),
    onSuccess: (res) => {
      toast.success(`Job Ticket #${res.data?.data?.repair?.jobNumber} created!`);
      setShowCreateModal(false);
      setForm({
        customerName: '', phone: '', email: '', deviceModel: '', imei: '',
        passcode: '', issue: '', estimatedCost: 0, advancePaid: 0, technician: '', notes: '',
      });
      qc.invalidateQueries(['admin-repairs']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create repair ticket'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...patchData }) => api.put(`/admin/repairs/${id}`, patchData),
    onSuccess: () => {
      toast.success('Repair job status updated!');
      qc.invalidateQueries(['admin-repairs']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update repair job'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.phone.trim() || !form.deviceModel.trim() || !form.issue.trim()) {
      toast.error('Please fill in Customer Name, Phone, Device, and Issue.');
      return;
    }
    createMutation.mutate(form);
  };

  const triggerPrint = (job) => {
    setPrintJob(job);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'received': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'diagnosing': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'waiting_parts': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'in_repair': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'ready': return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-300 font-bold';
      default: return 'bg-secondary-100 text-secondary-600 border-secondary-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-secondary-900 tracking-tight flex items-center gap-2.5">
            <RiToolsLine className="text-primary-600" />
            Smartphone Repair & Service Job Tracker
          </h1>
          <p className="text-xs text-secondary-500 font-medium mt-1">
            Manage device repair tickets, technician assignments, costs, and customer receipts
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary text-sm shadow-md"
        >
          <RiAddLine size={18} /> New Repair Job Ticket
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
              placeholder="Search by Job #, Customer, Phone, IMEI, Device..."
              className="input pl-9 text-sm py-2 w-full"
            />
          </div>

          <div className="flex gap-1.5 flex-wrap w-full md:w-auto">
            {[
              ['', 'All Jobs'],
              ['received', '📥 Received'],
              ['diagnosing', '🔍 Diagnosing'],
              ['in_repair', '🔧 In Repair'],
              ['ready', '✅ Ready for Pickup'],
              ['delivered', '🤝 Delivered'],
            ].map(([st, label]) => (
              <button
                key={st}
                onClick={() => { setStatusFilter(st); setPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === st
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Repairs Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : repairs.length === 0 ? (
          <EmptyState
            title="No Repair Jobs Found"
            description="Create a new repair ticket when a customer brings a phone for service."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary-50 border-b border-secondary-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase">Job Ticket & Device</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase">Reported Issue</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase">Cost & Advance</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase">Status & Technician</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-secondary-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {repairs.map((r) => {
                  const balanceDue = (r.estimatedCost || 0) - (r.advancePaid || 0);

                  return (
                    <tr key={r.id} className="hover:bg-secondary-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black bg-primary-50 text-primary-700 px-2 py-0.5 rounded border border-primary-200">
                            {r.jobNumber}
                          </span>
                          <span className="text-[11px] text-secondary-400">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-bold text-secondary-900 mt-1">{r.deviceModel}</p>
                        {r.imei && <p className="font-mono text-[11px] text-secondary-500">IMEI: {r.imei}</p>}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-secondary-800">{r.customerName}</p>
                        <p className="text-xs text-secondary-500 flex items-center gap-1 mt-0.5">
                          <RiPhoneLine size={12} /> {r.phone}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 max-w-[200px]">
                        <p className="text-xs text-secondary-800 line-clamp-2">{r.issue}</p>
                        {r.passcode && (
                          <span className="text-[10px] bg-secondary-100 text-secondary-600 px-1.5 py-0.5 rounded font-mono mt-1 inline-block">
                            Passcode: {r.passcode}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-secondary-900 text-xs">Est: {formatPrice(r.estimatedCost)}</p>
                        <p className="text-[11px] text-green-600 font-semibold">Adv: {formatPrice(r.advancePaid)}</p>
                        {balanceDue > 0 && (
                          <p className="text-[11px] text-red-500 font-bold">Due: {formatPrice(balanceDue)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <select
                          value={r.status}
                          onChange={(e) => updateMutation.mutate({ id: r.id, status: e.target.value })}
                          className={`input text-xs py-1 px-2 border rounded-lg font-bold capitalize ${getStatusBadge(r.status)}`}
                        >
                          <option value="received">Received</option>
                          <option value="diagnosing">Diagnosing</option>
                          <option value="waiting_parts">Waiting for Parts</option>
                          <option value="in_repair">In Repair</option>
                          <option value="ready">Ready for Pickup</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <p className="text-[11px] text-secondary-500 mt-1">
                          Tech: <span className="font-semibold text-secondary-700">{r.technician || 'Unassigned'}</span>
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => triggerPrint(r)}
                          title="Print Customer Job Receipt"
                          className="p-2 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                        >
                          <RiPrinterLine size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="p-4 border-t border-secondary-100 flex items-center justify-between">
            <p className="text-xs text-secondary-500">{pagination.total} total repair jobs</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="btn-secondary text-xs py-1 px-3">Prev</button>
              <span className="text-xs text-secondary-700 py-1 px-2 font-bold">Page {page} of {pagination.pages}</span>
              <button onClick={() => setPage(page + 1)} disabled={page >= pagination.pages} className="btn-secondary text-xs py-1 px-3">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* New Repair Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-secondary-100 mb-4">
              <h2 className="text-lg font-black text-secondary-900 flex items-center gap-2">
                <RiToolsLine className="text-primary-600" />
                New Smartphone Repair Job
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
                    placeholder="e.g. Chamara Silva"
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
                    placeholder="e.g. 0712345678"
                    className="input py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">Device Model *</label>
                  <input
                    type="text"
                    value={form.deviceModel}
                    onChange={(e) => setForm({ ...form, deviceModel: e.target.value })}
                    placeholder="e.g. iPhone 13 / Galaxy S22"
                    className="input py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">IMEI / Serial</label>
                  <input
                    type="text"
                    value={form.imei}
                    onChange={(e) => setForm({ ...form, imei: e.target.value })}
                    placeholder="15-digit IMEI"
                    className="input py-2 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">Device Passcode / PIN</label>
                  <input
                    type="text"
                    value={form.passcode}
                    onChange={(e) => setForm({ ...form, passcode: e.target.value })}
                    placeholder="For testing after repair"
                    className="input py-2 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">Assigned Technician</label>
                  <input
                    type="text"
                    value={form.technician}
                    onChange={(e) => setForm({ ...form, technician: e.target.value })}
                    placeholder="e.g. Nuwan"
                    className="input py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary-700 mb-1">Reported Issue / Fault Description *</label>
                <textarea
                  rows={2}
                  value={form.issue}
                  onChange={(e) => setForm({ ...form, issue: e.target.value })}
                  placeholder="e.g. Screen cracked, battery draining fast, no charging..."
                  className="input py-2 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">Estimated Cost (LKR)</label>
                  <input
                    type="number"
                    value={form.estimatedCost}
                    onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })}
                    placeholder="12500"
                    className="input py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">Advance Paid (LKR)</label>
                  <input
                    type="number"
                    value={form.advancePaid}
                    onChange={(e) => setForm({ ...form, advancePaid: e.target.value })}
                    placeholder="2000"
                    className="input py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-secondary-100">
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                  {createMutation.isPending ? 'Creating Job Ticket...' : 'Create Job Ticket'}
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Job Sheet */}
      {printJob && (
        <div className="hidden print:block fixed inset-0 bg-white p-8 text-black z-[99999]">
          <div className="border-2 border-black p-6 rounded-xl max-w-xl mx-auto space-y-4">
            <div className="flex justify-between items-center border-b-2 pb-3">
              <div>
                <h1 className="text-xl font-black uppercase tracking-wide">Device Repair Job Sheet</h1>
                <p className="text-xs font-semibold text-secondary-600">TechPulse Smartphone Repair Center</p>
                <p className="text-[11px] text-secondary-500">Hotline: +94 77 123 4567 | Colombo, SL</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-lg font-black bg-black text-white px-3 py-1 rounded">
                  {printJob.jobNumber}
                </p>
                <p className="text-xs text-secondary-500 mt-1">{new Date(printJob.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-secondary-500 font-bold uppercase">Customer Name</p>
                <p className="font-bold text-sm">{printJob.customerName}</p>
              </div>
              <div>
                <p className="text-secondary-500 font-bold uppercase">Phone Number</p>
                <p className="font-bold text-sm">{printJob.phone}</p>
              </div>
              <div>
                <p className="text-secondary-500 font-bold uppercase">Device Model</p>
                <p className="font-bold text-sm">{printJob.deviceModel}</p>
              </div>
              <div>
                <p className="text-secondary-500 font-bold uppercase">IMEI / Serial</p>
                <p className="font-mono font-bold">{printJob.imei || 'N/A'}</p>
              </div>
            </div>

            <div className="border-t border-b py-2 text-xs">
              <p className="font-bold uppercase text-secondary-700">Problem / Issue Description:</p>
              <p className="font-semibold text-sm mt-0.5">{printJob.issue}</p>
            </div>

            <div className="flex justify-between items-center text-xs bg-secondary-100 p-3 rounded-lg font-bold">
              <div>
                <p>Estimated Cost: <span className="text-sm font-black">{formatPrice(printJob.estimatedCost)}</span></p>
                <p className="text-green-700">Advance Paid: {formatPrice(printJob.advancePaid)}</p>
              </div>
              <div className="text-right">
                <p className="text-red-600 text-sm font-black">
                  Balance Due: {formatPrice((printJob.estimatedCost || 0) - (printJob.advancePaid || 0))}
                </p>
              </div>
            </div>

            <div className="text-[10px] text-secondary-500 space-y-0.5 border-t pt-2">
              <p>• Goods left for over 30 days without collection will be disposed of.</p>
              <p>• Repair warranty is 30 days for the specific part repaired only.</p>
            </div>

            <div className="flex justify-between items-end pt-4 border-t">
              <div className="text-center">
                <div className="w-32 border-b border-black mb-1" />
                <p className="text-[10px] font-bold uppercase">Technician Signature</p>
              </div>
              <div className="text-center">
                <div className="w-32 border-b border-black mb-1" />
                <p className="text-[10px] font-bold uppercase">Customer Signature</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
