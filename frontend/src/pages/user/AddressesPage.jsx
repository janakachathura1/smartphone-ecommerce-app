import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RiAddLine, RiDeleteBin6Line, RiMapPinLine } from 'react-icons/ri';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { EmptyState, PageLoader } from '../../components/ui';
import UserLayout from './UserLayout';

export default function AddressesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: 'Home', fullName: '', phone: '', street: '', city: '', state: '', zipCode: '', country: 'Bangladesh', isDefault: false });

  const { data, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.get('/users/addresses').then((r) => r.data.data.addresses),
  });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/addresses', form);
      toast.success('Address saved!');
      qc.invalidateQueries(['addresses']);
      setShowForm(false);
      setForm({ label: 'Home', fullName: '', phone: '', street: '', city: '', state: '', zipCode: '', country: 'Bangladesh', isDefault: false });
    } catch {
      toast.error('Failed to save address');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/addresses/${id}`);
      toast.success('Address deleted');
      qc.invalidateQueries(['addresses']);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const f = (key, label, placeholder, type = 'text') => (
    <div>
      <label className="text-sm font-medium text-secondary-700 block mb-1.5">{label}</label>
      <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder} className="input text-sm" required />
    </div>
  );

  return (
    <UserLayout>
      <div className="card">
        <div className="flex items-center justify-between p-6 border-b border-secondary-100">
          <h1 className="text-xl font-bold text-secondary-900">My Addresses</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm py-2">
            <RiAddLine size={16} /> Add New
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSave} className="p-6 border-b border-secondary-100 bg-secondary-50 space-y-4">
            <h3 className="font-semibold text-secondary-900">New Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-secondary-700 block mb-1.5">Label</label>
                <select value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="input text-sm">
                  <option>Home</option><option>Work</option><option>Other</option>
                </select>
              </div>
              {f('fullName', 'Full Name', 'John Doe')}
              {f('phone', 'Phone', '+880 170 000 0000')}
              <div className="col-span-2">{f('street', 'Street Address', '123 Main Street')}</div>
              {f('city', 'City', 'Dhaka')}
              {f('state', 'State/Division', 'Dhaka Division')}
              {f('zipCode', 'Zip Code', '1200')}
              {f('country', 'Country', 'Bangladesh')}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
              <span className="text-sm text-secondary-700">Set as default address</span>
            </label>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary text-sm">Save Address</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </form>
        )}

        {isLoading ? (
          <PageLoader />
        ) : !data || data.length === 0 ? (
          <div className="p-8">
            <EmptyState icon={RiMapPinLine} title="No saved addresses" description="Add a shipping address to speed up checkout." />
          </div>
        ) : (
          <div className="divide-y divide-secondary-100">
            {data.map((addr) => (
              <div key={addr.id} className="p-5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge-primary text-xs">{addr.label}</span>
                    {addr.isDefault && <span className="badge-success text-xs">Default</span>}
                  </div>
                  <p className="font-semibold text-secondary-900 text-sm">{addr.fullName}</p>
                  <p className="text-secondary-500 text-sm">{addr.street}, {addr.city}, {addr.state} {addr.zipCode}</p>
                  <p className="text-secondary-500 text-sm">{addr.country} · {addr.phone}</p>
                </div>
                <button onClick={() => handleDelete(addr.id)} className="p-2 text-secondary-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <RiDeleteBin6Line size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
