import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { PageLoader } from '../../components/ui';
import { getInitials } from '../../lib/utils';

export default function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => api.get('/users', { params: { search, limit: 50 } }).then((r) => r.data.data),
  });

  const users = data?.users || [];

  const toggleStatus = async (id) => {
    try {
      const { data: res } = await api.patch(`/users/${id}/toggle-status`);
      toast.success(res.message);
      qc.invalidateQueries(['admin-users']);
    } catch {
      toast.error('Failed to update user status');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-secondary-900">Users Management</h1>

      <div className="card p-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="input text-sm py-2 max-w-sm" />
      </div>

      <div className="card overflow-hidden">
        {isLoading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary-50 border-b border-secondary-100">
                <tr>
                  {['User', 'Email', 'Phone', 'Role', 'Joined', 'Status', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-secondary-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {getInitials(u.firstName, u.lastName)}
                        </div>
                        <span className="font-medium text-secondary-900">{u.firstName} {u.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-secondary-600">{u.email}</td>
                    <td className="px-4 py-3 text-secondary-600">{u.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.role === 'admin' ? 'bg-primary-100 text-primary-700' : 'badge-success'} capitalize`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-secondary-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="px-4 py-3">
                      {u.role !== 'admin' && (
                        <button onClick={() => toggleStatus(u.id)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${u.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
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
