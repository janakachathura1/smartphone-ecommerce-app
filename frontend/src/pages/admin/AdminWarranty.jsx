import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RiShieldCheckLine, RiSearchLine, RiAddLine, RiToolsLine,
  RiPrinterLine, RiPhoneLine
} from 'react-icons/ri';
import api from '../../lib/api';
import { PageLoader, EmptyState } from '../../components/ui';
import toast from 'react-hot-toast';

export default function AdminWarranty() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState(null);
  const [printCertificate, setPrintCertificate] = useState(null);

  const [form, setForm] = useState({
    imei: '',
    serialNo: '',
    productName: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    warrantyPeriod: '1 Year',
    warrantyType: 'Company Warranty',
    warrantyProvider: 'Authorized Distributor',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [claimForm, setClaimForm] = useState({
    issueDescription: '',
    repairCost: 0,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-warranties', search, statusFilter, page],
    queryFn: () =>
      api.get('/admin/warranties', {
        params: { search, status: statusFilter, page, limit: 15 },
      }).then((r) => r.data.data),
  });

  const warranties = data?.warranties || [];
  const pagination = data?.pagination;

  const createMutation = useMutation({
    mutationFn: (newWarranty) => api.post('/admin/warranties', newWarranty),
    onSuccess: () => {
      toast.success('Warranty registered successfully!');
      setShowRegisterModal(false);
      setForm({
        imei: '', serialNo: '', productName: '', customerName: '',
        customerPhone: '', customerEmail: '', warrantyPeriod: '1 Year',
        warrantyType: 'Company Warranty', warrantyProvider: 'Authorized Distributor',
        purchaseDate: new Date().toISOString().split('T')[0], notes: '',
      });
      qc.invalidateQueries(['admin-warranties']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to register warranty'),
  });

  const claimMutation = useMutation({
    mutationFn: (claimData) => api.post('/admin/warranties/claim', claimData),
    onSuccess: () => {
      toast.success('Warranty claim recorded!');
      setShowClaimModal(false);
      setClaimForm({ issueDescription: '', repairCost: 0 });
      qc.invalidateQueries(['admin-warranties']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to record claim'),
  });

  const updateClaimMutation = useMutation({
    mutationFn: ({ claimId, ...updateData }) => api.put(`/admin/warranties/claim/${claimId}`, updateData),
    onSuccess: () => {
      toast.success('Claim status updated!');
      qc.invalidateQueries(['admin-warranties']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update claim'),
  });

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!form.imei.trim() || !form.productName.trim() || !form.customerName.trim() || !form.customerPhone.trim()) {
      toast.error('Please fill in IMEI, Product, Customer Name, and Phone.');
      return;
    }
    createMutation.mutate(form);
  };

  const handleClaimSubmit = (e) => {
    e.preventDefault();
    if (!claimForm.issueDescription.trim()) {
      toast.error('Please enter the defect or issue description.');
      return;
    }
    claimMutation.mutate({
      warrantyId: selectedWarranty.id,
      ...claimForm,
    });
  };

  const openClaimModal = (w) => {
    setSelectedWarranty(w);
    setShowClaimModal(true);
  };

  const triggerPrint = (w) => {
    setPrintCertificate(w);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-secondary-900 tracking-tight flex items-center gap-2.5">
            <RiShieldCheckLine className="text-primary-600" />
            IMEI & Warranty Management
          </h1>
          <p className="text-xs text-secondary-500 font-medium mt-1">
            Track device IMEIs, serial numbers, company warranty validity, and customer claims
          </p>
        </div>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="btn-primary text-sm shadow-md"
        >
          <RiAddLine size={18} /> Register Device Warranty
        </button>
      </div>

      {/* Filters Bar */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <RiSearchLine size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by IMEI, Serial, Phone, or Customer..."
              className="input pl-9 text-sm py-2 w-full"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {['', 'active', 'claimed', 'expired'].map((st) => (
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

      {/* Warranties Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : warranties.length === 0 ? (
          <EmptyState
            title="No Warranty Records Found"
            description="Register your first smartphone or device warranty using the button above."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary-50 border-b border-secondary-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase">Device & IMEI</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase">Warranty Type & Period</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase">Purchase / Expiry</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-secondary-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-secondary-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {warranties.map((w) => {
                  const isExpired = new Date(w.expiresAt) < new Date();
                  const remainingDays = Math.ceil((new Date(w.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));

                  return (
                    <tr key={w.id} className="hover:bg-secondary-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-secondary-900 line-clamp-1">{w.productName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-xs bg-secondary-100 text-secondary-700 px-2 py-0.5 rounded font-bold">
                            IMEI: {w.imei}
                          </span>
                          {w.serialNo && (
                            <span className="font-mono text-[11px] text-secondary-500">
                              S/N: {w.serialNo}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-secondary-800">{w.customerName}</p>
                        <p className="text-xs text-secondary-500 flex items-center gap-1 mt-0.5">
                          <RiPhoneLine size={12} /> {w.customerPhone}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                          w.warrantyType === 'Company Warranty'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {w.warrantyType}
                        </span>
                        <p className="text-xs text-secondary-500 mt-1 font-medium">{w.warrantyPeriod}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-secondary-700">
                          {new Date(w.purchaseDate).toLocaleDateString()}
                        </p>
                        <p className={`text-xs font-bold mt-0.5 ${isExpired ? 'text-red-500' : remainingDays < 30 ? 'text-amber-600' : 'text-green-600'}`}>
                          {isExpired ? 'Expired' : `${remainingDays} days left`}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`badge ${
                          w.status === 'active' && !isExpired
                            ? 'badge-success'
                            : w.status === 'claimed'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}>
                          {w.status.toUpperCase()}
                        </span>
                        {w.claims?.length > 0 && (
                          <span className="block text-[10px] text-amber-600 font-bold mt-1">
                            {w.claims.length} Claim(s) recorded
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => triggerPrint(w)}
                          title="Print Warranty Certificate"
                          className="p-2 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                        >
                          <RiPrinterLine size={16} />
                        </button>
                        <button
                          onClick={() => openClaimModal(w)}
                          title="Record Warranty Claim"
                          className="p-2 text-secondary-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        >
                          <RiToolsLine size={16} />
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
            <p className="text-xs text-secondary-500">{pagination.total} total warranty records</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="btn-secondary text-xs py-1 px-3">Prev</button>
              <span className="text-xs text-secondary-700 py-1 px-2 font-bold">Page {page} of {pagination.pages}</span>
              <button onClick={() => setPage(page + 1)} disabled={page >= pagination.pages} className="btn-secondary text-xs py-1 px-3">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Register Warranty Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-secondary-100 mb-5">
              <h2 className="text-lg font-black text-secondary-900 flex items-center gap-2">
                <RiShieldCheckLine className="text-primary-600" />
                Register Device Warranty
              </h2>
              <button onClick={() => setShowRegisterModal(false)} className="text-secondary-400 hover:text-secondary-700">✕</button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-secondary-700 mb-1">IMEI Number (15 Digits) *</label>
                <input
                  type="text"
                  value={form.imei}
                  onChange={(e) => setForm({ ...form, imei: e.target.value })}
                  placeholder="e.g. 354890123456789"
                  className="input py-2 font-mono text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">Serial Number (Optional)</label>
                  <input
                    type="text"
                    value={form.serialNo}
                    onChange={(e) => setForm({ ...form, serialNo: e.target.value })}
                    placeholder="e.g. F2LZ80XXXX"
                    className="input py-2 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">Product / Model Name *</label>
                  <input
                    type="text"
                    value={form.productName}
                    onChange={(e) => setForm({ ...form, productName: e.target.value })}
                    placeholder="e.g. iPhone 16 Pro Max 256GB"
                    className="input py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="e.g. Kasun Perera"
                    className="input py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">Customer Phone *</label>
                  <input
                    type="text"
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    placeholder="e.g. 0771234567"
                    className="input py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">Warranty Type</label>
                  <select
                    value={form.warrantyType}
                    onChange={(e) => setForm({ ...form, warrantyType: e.target.value })}
                    className="input py-2 text-sm"
                  >
                    <option value="Company Warranty">Company Warranty (Official)</option>
                    <option value="Store Warranty">Store Warranty (Seller)</option>
                    <option value="AppleCare+">AppleCare+</option>
                    <option value="Checking Warranty">Checking Warranty (7 Days)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">Warranty Period</label>
                  <select
                    value={form.warrantyPeriod}
                    onChange={(e) => setForm({ ...form, warrantyPeriod: e.target.value })}
                    className="input py-2 text-sm"
                  >
                    <option value="1 Year">1 Year</option>
                    <option value="2 Years">2 Years</option>
                    <option value="6 Months">6 Months</option>
                    <option value="3 Months">3 Months</option>
                    <option value="1 Month">1 Month</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={form.purchaseDate}
                    onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                    className="input py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary-700 mb-1">Authorized Provider</label>
                  <input
                    type="text"
                    value={form.warrantyProvider}
                    onChange={(e) => setForm({ ...form, warrantyProvider: e.target.value })}
                    placeholder="e.g. Futureworld / GenNext"
                    className="input py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-secondary-100">
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                  {createMutation.isPending ? 'Registering...' : 'Register Device'}
                </button>
                <button type="button" onClick={() => setShowRegisterModal(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Claim Modal */}
      {showClaimModal && selectedWarranty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-secondary-100 mb-4">
              <div>
                <h2 className="text-lg font-black text-secondary-900 flex items-center gap-2">
                  <RiToolsLine className="text-amber-500" />
                  Record Warranty Claim
                </h2>
                <p className="text-xs text-secondary-500 font-mono mt-0.5">
                  Device: {selectedWarranty.productName} (IMEI: {selectedWarranty.imei})
                </p>
              </div>
              <button onClick={() => setShowClaimModal(false)} className="text-secondary-400 hover:text-secondary-700">✕</button>
            </div>

            <form onSubmit={handleClaimSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-secondary-700 mb-1">Issue / Defect Description *</label>
                <textarea
                  rows={3}
                  value={claimForm.issueDescription}
                  onChange={(e) => setClaimForm({ ...claimForm, issueDescription: e.target.value })}
                  placeholder="e.g. Display touch screen not responding, microphone issue..."
                  className="input py-2 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary-700 mb-1">Estimated Repair / Handling Cost (LKR)</label>
                <input
                  type="number"
                  value={claimForm.repairCost}
                  onChange={(e) => setClaimForm({ ...claimForm, repairCost: e.target.value })}
                  placeholder="0 (if free under warranty)"
                  className="input py-2 text-sm"
                />
              </div>

              {/* Existing Claims History */}
              {selectedWarranty.claims?.length > 0 && (
                <div className="bg-secondary-50 p-3 rounded-xl border border-secondary-200">
                  <p className="text-xs font-bold text-secondary-700 mb-2">Previous Claims History:</p>
                  <div className="space-y-2">
                    {selectedWarranty.claims.map((c) => (
                      <div key={c.id} className="text-xs bg-white p-2.5 rounded-lg border border-secondary-100 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-secondary-900">{c.claimNumber} - {c.issueDescription}</p>
                          <p className="text-[11px] text-secondary-500">{new Date(c.createdAt).toLocaleDateString()}</p>
                        </div>
                        <select
                          value={c.status}
                          onChange={(e) => updateClaimMutation.mutate({ claimId: c.id, status: e.target.value })}
                          className="input text-xs py-1 px-2"
                        >
                          <option value="received">Received</option>
                          <option value="under_inspection">Under Inspection</option>
                          <option value="sent_to_service">Sent to Service Center</option>
                          <option value="repaired">Repaired</option>
                          <option value="replaced">Replaced</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-secondary-100">
                <button type="submit" disabled={claimMutation.isPending} className="btn-primary flex-1">
                  {claimMutation.isPending ? 'Saving...' : 'Submit Warranty Claim'}
                </button>
                <button type="button" onClick={() => setShowClaimModal(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Certificate Template (Hidden on screen, visible during print) */}
      {printCertificate && (
        <div className="hidden print:block fixed inset-0 bg-white p-8 text-black z-[99999]">
          <div className="border-4 border-double border-secondary-800 p-8 rounded-2xl max-w-2xl mx-auto space-y-6">
            <div className="text-center border-b pb-4">
              <h1 className="text-2xl font-black uppercase tracking-wider text-secondary-900">Official Warranty Certificate</h1>
              <p className="text-sm font-semibold text-secondary-600">TechPulse Smartphone & Electronics</p>
              <p className="text-xs text-secondary-500">Colombo, Sri Lanka | Hotline: +94 77 123 4567</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-secondary-500 uppercase font-bold">Customer Name</p>
                <p className="font-bold text-base">{printCertificate.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-secondary-500 uppercase font-bold">Contact Phone</p>
                <p className="font-bold text-base">{printCertificate.customerPhone}</p>
              </div>
              <div>
                <p className="text-xs text-secondary-500 uppercase font-bold">Product Model</p>
                <p className="font-bold text-base">{printCertificate.productName}</p>
              </div>
              <div>
                <p className="text-xs text-secondary-500 uppercase font-bold">IMEI / Serial Number</p>
                <p className="font-mono font-bold text-base">{printCertificate.imei}</p>
              </div>
              <div>
                <p className="text-xs text-secondary-500 uppercase font-bold">Warranty Type</p>
                <p className="font-bold">{printCertificate.warrantyType} ({printCertificate.warrantyPeriod})</p>
              </div>
              <div>
                <p className="text-xs text-secondary-500 uppercase font-bold">Valid Until</p>
                <p className="font-bold text-green-700">{new Date(printCertificate.expiresAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="border-t pt-4 text-xs text-secondary-600 space-y-1">
              <p className="font-bold uppercase text-secondary-800">Terms & Conditions:</p>
              <p>1. Warranty covers manufacturer hardware defects only.</p>
              <p>2. Physical damage, liquid / water ingress, display breakage, or unauthorized repairs void this warranty.</p>
              <p>3. This original certificate or purchase invoice must be presented for any warranty claims.</p>
            </div>

            <div className="flex justify-between items-end pt-8 border-t">
              <div className="text-center">
                <div className="w-36 border-b border-black mb-1" />
                <p className="text-xs font-bold uppercase">Authorized Signature</p>
              </div>
              <div className="text-center">
                <div className="w-36 border-b border-black mb-1" />
                <p className="text-xs font-bold uppercase">Customer Signature</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
