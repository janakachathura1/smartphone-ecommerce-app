import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RiStarFill, RiDeleteBin6Line, RiCheckLine, RiCloseLine, RiMailLine, RiChat1Line } from 'react-icons/ri';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { PageLoader, EmptyState } from '../../components/ui';

export default function AdminReviews() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' | 'messages'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');

  const { data: reviews, isLoading: loadingReviews } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => api.get('/admin/reviews').then(r => r.data.data.reviews)
  });

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: () => api.get('/contact').then(r => r.data.data)
  });

  const mutationUpdate = useMutation({
    mutationFn: ({ id, isApproved }) => api.put(`/admin/reviews/${id}`, { isApproved }),
    onSuccess: () => {
      toast.success('Review status updated');
      qc.invalidateQueries(['admin-reviews']);
    },
    onError: () => toast.error('Failed to update review')
  });

  const mutationDelete = useMutation({
    mutationFn: (id) => api.delete(`/admin/reviews/${id}`),
    onSuccess: () => {
      toast.success('Review deleted');
      qc.invalidateQueries(['admin-reviews']);
    },
    onError: () => toast.error('Failed to delete review')
  });

  const mutationDeleteMessage = useMutation({
    mutationFn: (id) => api.delete(`/contact/${id}`),
    onSuccess: () => {
      toast.success('Message deleted');
      qc.invalidateQueries(['admin-messages']);
    },
    onError: () => toast.error('Failed to delete message')
  });

  // Extract unique brands and categories for filtering
  const categories = ['All', ...new Set(reviews?.map(r => r.product?.category?.name).filter(Boolean))];
  const brands = ['All', ...new Set(reviews?.map(r => r.product?.brand?.name).filter(Boolean))];

  const filteredReviews = reviews?.filter(r => {
    const catMatch = selectedCategory === 'All' || r.product?.category?.name === selectedCategory;
    const brandMatch = selectedBrand === 'All' || r.product?.brand?.name === selectedBrand;
    return catMatch && brandMatch;
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to permanently delete this review?')) {
      mutationDelete.mutate(id);
    }
  };

  const handleDeleteMessage = (id) => {
    if (window.confirm('Delete this message?')) {
      mutationDeleteMessage.mutate(id);
    }
  };

  if (activeTab === 'reviews' && loadingReviews) return <PageLoader />;
  if (activeTab === 'messages' && loadingMessages) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-secondary-100 pb-4">
        <div className="flex gap-6">
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`text-xl font-black uppercase tracking-tight pb-2 border-b-2 transition-colors ${activeTab === 'reviews' ? 'border-primary-600 text-primary-600' : 'border-transparent text-secondary-400 hover:text-secondary-900'}`}
          >
            Product Reviews
          </button>
          <button 
            onClick={() => setActiveTab('messages')}
            className={`text-xl font-black uppercase tracking-tight pb-2 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'messages' ? 'border-primary-600 text-primary-600' : 'border-transparent text-secondary-400 hover:text-secondary-900'}`}
          >
            Contact Messages
            {messages?.length > 0 && <span className="bg-primary-100 text-primary-700 text-[10px] px-2 py-0.5 rounded-full">{messages.length}</span>}
          </button>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {activeTab === 'reviews' && (
            <>
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-secondary-100 rounded-2xl">
                <span className="text-xs font-black text-secondary-400 uppercase tracking-widest">Category</span>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-sm font-black text-primary-600 focus:outline-none bg-transparent"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-secondary-100 rounded-2xl">
                <span className="text-xs font-black text-secondary-400 uppercase tracking-widest">Brand</span>
                <select 
                  value={selectedBrand} 
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="text-sm font-black text-primary-600 focus:outline-none bg-transparent"
                >
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {activeTab === 'reviews' && (
        <>
          {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: reviews?.length || 0, color: 'secondary' },
          { label: 'Pending', value: reviews?.filter(r => !r.isApproved).length || 0, color: 'amber' },
          { label: 'Approved', value: reviews?.filter(r => r.isApproved).length || 0, color: 'emerald' },
          { label: 'Featured', value: reviews?.filter(r => r.rating === 5).length || 0, color: 'primary' },
        ].map(stat => (
          <div key={stat.label} className="card p-4 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-secondary-900 leading-none mb-1">{stat.value}</span>
            <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="card shadow-2xl shadow-secondary-100/50 overflow-hidden border-none">
        {!filteredReviews || filteredReviews.length === 0 ? (
          <EmptyState title="No Reviews Found" description="Try adjusting your filters or wait for new submissions." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary-50/50 border-b border-secondary-100">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">Customer Info</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">Product & Brand</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">Rating</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">User Comment</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-50">
                {filteredReviews.map((r) => (
                  <tr key={r.id} className="hover:bg-primary-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center font-black text-secondary-800 text-xs shadow-inner overflow-hidden">
                          {r.user?.avatar ? <img src={r.user.avatar} className="w-full h-full object-cover" /> : r.user?.firstName?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-secondary-900 leading-none mb-1">{r.user?.firstName} {r.user?.lastName}</div>
                          <div className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest">{r.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="font-black text-primary-600 uppercase italic tracking-tight mb-1 text-xs">
                         {r.product?.brand?.name}
                       </div>
                       <div className="text-secondary-800 font-bold max-w-[180px] truncate">{r.product?.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <RiStarFill key={i} size={14} className={i < r.rating ? 'text-amber-400' : 'text-secondary-100'} />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-sm font-medium text-secondary-600 line-clamp-2 leading-relaxed">
                        {r.comment || r.body}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {r.isApproved ? (
                          <button 
                            onClick={() => mutationUpdate.mutate({ id: r.id, isApproved: false })} 
                            className="w-10 h-10 flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-amber-100 hover:text-amber-600 rounded-xl transition-all" 
                            title="Hide Review"
                          >
                             <RiCheckLine size={20} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => mutationUpdate.mutate({ id: r.id, isApproved: true })} 
                            className="bg-amber-50 shadow-sm shadow-amber-200/50 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-amber-600 hover:bg-primary-600 hover:text-white transition-all flex items-center gap-2" 
                            title="Approve Review"
                          >
                             <RiCheckLine size={16} /> Approve
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(r.id)} 
                          className="w-10 h-10 flex items-center justify-center bg-secondary-50 text-secondary-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all" 
                          title="Delete"
                        >
                          <RiDeleteBin6Line size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {activeTab === 'messages' && (
        <div className="card shadow-2xl shadow-secondary-100/50 overflow-hidden border-none">
          {!messages || messages.length === 0 ? (
            <EmptyState title="No Messages" description="You have no contact messages yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary-50/50 border-b border-secondary-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">Contact Info</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">Subject</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">Message</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-50">
                  {messages.map((m) => (
                    <tr key={m.id} className="hover:bg-primary-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-secondary-900 leading-none mb-1">{m.name}</div>
                        <div className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest flex items-center gap-1">
                          <RiMailLine size={12} /> {m.email}
                        </div>
                        <div className="text-[10px] text-secondary-400 mt-1">{new Date(m.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-secondary-800 font-bold">{m.subject || 'No Subject'}</div>
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        <p className="text-sm font-medium text-secondary-600 line-clamp-3 leading-relaxed">
                          {m.message}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteMessage(m.id)} 
                          className="w-10 h-10 inline-flex items-center justify-center bg-secondary-50 text-secondary-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all" 
                          title="Delete"
                        >
                          <RiDeleteBin6Line size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
