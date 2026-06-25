import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RiAddLine, RiDeleteBin6Line } from 'react-icons/ri';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { PageLoader } from '../../components/ui';

export default function AdminBrands() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');

  const { data: brands, isLoading: loadingBrands } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: () => api.get('/admin/brands').then((r) => r.data.data.brands),
  });

  const { data: categories, isLoading: loadingCats } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api.get('/admin/categories').then((r) => r.data.data.categories),
  });

  const handleAddBrand = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/brands', { name, slug });
      toast.success('Brand added!');
      qc.invalidateQueries({ queryKey: ['admin-brands'] });
      qc.invalidateQueries({ queryKey: ['brands'] });
      qc.invalidateQueries({ queryKey: ['pos-brands'] });
      setName(''); setSlug('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/categories', { name: catName, slug: catSlug });
      toast.success('Category added!');
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['nav-categories'] });
      qc.invalidateQueries({ queryKey: ['pos-categories'] });
      setCatName(''); setCatSlug('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleDeleteBrand = async (id) => {
    if (!window.confirm('Delete this brand?')) return;
    try {
      await api.delete(`/admin/brands/${id}`);
      toast.success('Brand deleted');
      qc.invalidateQueries({ queryKey: ['admin-brands'] });
      qc.invalidateQueries({ queryKey: ['brands'] });
      qc.invalidateQueries({ queryKey: ['pos-brands'] });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete brand');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      toast.success('Category deleted!');
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      qc.invalidateQueries({ queryKey: ['nav-categories'] });
      qc.invalidateQueries({ queryKey: ['pos-categories'] });
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to delete category'); }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-secondary-950 tracking-tight">Catalog Management</h1>
          <p className="text-secondary-500 text-sm font-medium">Manage Brands and Categories for your storefront.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Brands Container */}
        <div className="bg-white rounded-[2.5rem] border border-primary-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-primary-50">
            <h2 className="text-lg font-black text-secondary-950 flex items-center gap-2 uppercase tracking-widest text-xs">
              <div className="w-1.5 h-6 bg-primary-600 rounded-full" /> Brands
            </h2>
          </div>

          <div className="p-8 bg-primary-50/30 border-b border-primary-50">
            <form onSubmit={handleAddBrand} className="flex gap-3">
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')); }}
                placeholder="Brand name"
                className="input bg-white border-primary-100 focus:bg-white text-sm py-3 flex-1"
                required
              />
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="slug"
                className="input bg-white border-primary-100 focus:bg-white text-sm py-3 w-32 font-mono uppercase tracking-tighter"
                required
              />
              <button type="submit" disabled={saving} className="btn-primary py-3 px-5 shadow-lg shadow-primary-100">
                <RiAddLine size={24} />
              </button>
            </form>
          </div>

          {loadingBrands ? <PageLoader /> : (
            <div className="divide-y divide-primary-50 max-h-[500px] overflow-y-auto">
              {brands?.map((b) => (
                <div key={b.id} className="group flex items-center justify-between px-8 py-4 hover:bg-primary-50/50 transition-colors">
                  <div>
                    <p className="font-black text-secondary-950 text-base tracking-tight">{b.name}</p>
                    <p className="text-[10px] text-primary-500 font-bold uppercase tracking-widest">{b.slug}</p>
                  </div>
                  <button onClick={() => handleDeleteBrand(b.id)} className="p-2.5 text-secondary-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <RiDeleteBin6Line size={18} />
                  </button>
                </div>
              ))}
              {brands?.length === 0 && <p className="p-8 text-center text-secondary-400 text-sm italic">No brands added yet.</p>}
            </div>
          )}
        </div>

        {/* Categories Container */}
        <div className="bg-white rounded-[2.5rem] border border-secondary-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-secondary-50">
            <h2 className="text-lg font-black text-secondary-950 flex items-center gap-2 uppercase tracking-widest text-xs">
              <div className="w-1.5 h-6 bg-secondary-950 rounded-full" /> Categories
            </h2>
          </div>

          <div className="p-8 bg-secondary-50/30 border-b border-secondary-50">
            <form onSubmit={handleAddCategory} className="flex gap-3">
              <input
                value={catName}
                onChange={(e) => { setCatName(e.target.value); setCatSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')); }}
                placeholder="Category name"
                className="input bg-white border-secondary-200 focus:bg-white text-sm py-3 flex-1"
                required
              />
              <input
                value={catSlug}
                onChange={(e) => setCatSlug(e.target.value)}
                placeholder="slug"
                className="input bg-white border-secondary-200 focus:bg-white text-sm py-3 w-32 font-mono uppercase tracking-tighter"
                required
              />
              <button type="submit" disabled={saving} className="bg-secondary-950 text-white hover:bg-black p-3 rounded-2xl shadow-lg shadow-secondary-100 flex items-center justify-center transition-all">
                <RiAddLine size={24} />
              </button>
            </form>
          </div>

          {loadingCats ? <PageLoader /> : (
            <div className="divide-y divide-secondary-50 max-h-[500px] overflow-y-auto">
              {categories?.map((c) => (
                <div key={c.id} className="group flex items-center justify-between px-8 py-4 hover:bg-secondary-50/50 transition-colors">
                  <div>
                    <p className="font-black text-secondary-950 text-base tracking-tight">{c.name}</p>
                    <p className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest">{c.slug}</p>
                  </div>
                  <button onClick={() => handleDeleteCategory(c.id)} className="p-2.5 text-secondary-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <RiDeleteBin6Line size={18} />
                  </button>
                </div>
              ))}
              {categories?.length === 0 && <p className="p-8 text-center text-secondary-400 text-sm italic">No categories added yet.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
