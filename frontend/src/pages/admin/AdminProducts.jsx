import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RiAddLine, RiEditLine, RiDeleteBin6Line, RiSearchLine, RiUploadCloud2Line } from 'react-icons/ri';
import api from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import toast from 'react-hot-toast';
import { PageLoader, EmptyState } from '../../components/ui';

const EMPTY_PRODUCT = {
  name: '', slug: '', description: '', shortDesc: '', sku: '',
  brandId: '', categoryId: '', basePrice: '', discountPercent: 0,
  stock: 0, ram: '', storage: '', battery: '', display: '',
  processor: '', camera: '', frontCamera: '', os: '', has5G: false,
  weight: '', isFeatured: false, isNewArrival: false, isBestSeller: false,
  colors: '[]', storageOptions: '[]',
  images: [],
};

const ProductField = ({ k, label, type = 'text', half = false, options, form, setForm }) => (
  <div className={half ? '' : 'col-span-2'}>
    <label className="text-xs font-medium text-secondary-600 block mb-1">{label}</label>
    {options ? (
      <select value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="input text-sm py-2">
        <option value="">Select {label}</option>
        {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    ) : (
      <input type={type} value={form[k] ?? ''} onChange={(e) => setForm({ ...form, [k]: type === 'checkbox' ? e.target.checked : e.target.value })} className="input text-sm py-2" />
    )}
  </div>
);

export default function AdminProducts() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data: brandsData } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: () => api.get('/admin/brands').then((r) => r.data.data.brands),
  });

  const { data: catsData } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api.get('/admin/categories').then((r) => r.data.data.categories),
  });

  const selectedCategorySlug = catsData?.find(c => c.id === selectedCategoryId)?.slug || '';
  const selectedBrandSlug = brandsData?.find(b => b.id === selectedBrandId)?.slug || '';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-products', search, page, selectedCategorySlug, selectedBrandSlug],
    queryFn: () => api.get('/products', { params: { search, page, limit: 15, category: selectedCategorySlug, brand: selectedBrandSlug } }).then((r) => r.data.data),
  });

  const products = data?.products || [];
  const pagination = data?.pagination;

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...EMPTY_PRODUCT,
      categoryId: selectedCategoryId || '',
      brandId: selectedBrandId || ''
    });
    setShowForm(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    const colors = typeof p.colors === 'string' ? p.colors : JSON.stringify(p.colors || []);
    const storageOptions = typeof p.storageOptions === 'string' ? p.storageOptions : JSON.stringify(p.storageOptions || []);
    setForm({ ...p, colors, storageOptions, images: p.images?.map(img => img.url) || [] });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const {
        id, createdAt, updatedAt, brand, category, images: formImages, reviews, finalPrice: _,
        ...sanitizedData
      } = form;

      const payload = {
        ...sanitizedData,
        basePrice: parseFloat(form.basePrice),
        discountPercent: parseFloat(form.discountPercent || 0),
        stock: parseInt(form.stock || 0),
        has5G: form.has5G === true || form.has5G === 'true',
        isFeatured: form.isFeatured === true || form.isFeatured === 'true',
        isNewArrival: form.isNewArrival === true || form.isNewArrival === 'true',
        isBestSeller: form.isBestSeller === true || form.isBestSeller === 'true',
        images: form.images?.filter(Boolean) || [],
      };
      if (editing) {
        await api.put(`/products/${editing.id}`, payload);
        toast.success('Product updated!');
      } else {
        await api.post('/products', payload);
        toast.success('Product created!');
      }
      qc.invalidateQueries(['admin-products']);
      closeForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deactivated');
      refetch();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const uploadFileHandler = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadingImage(true);
    try {
      const uploadPromises = files.map(file => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      });

      const responses = await Promise.all(uploadPromises);
      const newUrls = responses.map(r => r.data.data.url);
      setForm((prev) => ({ ...prev, images: [...(prev.images || []), ...newUrls] }));
      toast.success(`${newUrls.length} image(s) uploaded successfully`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index) => {
    const updated = [...form.images];
    updated.splice(index, 1);
    setForm({ ...form, images: updated });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary-900">Products</h1>
        <button onClick={openCreate} className="btn-primary text-sm"><RiAddLine size={16} /> Add Product</button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-sm">
            <RiSearchLine size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search products..." className="input pl-9 text-sm py-2 w-full" />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <select
              value={selectedCategoryId}
              onChange={(e) => { setSelectedCategoryId(e.target.value); setPage(1); }}
              className="input text-sm py-2 bg-secondary-50 min-w-[150px]"
            >
              <option value="">All Categories</option>
              {catsData?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={selectedBrandId}
              onChange={(e) => { setSelectedBrandId(e.target.value); setPage(1); }}
              className="input text-sm py-2 bg-secondary-50 min-w-[150px]"
            >
              <option value="">All Brands</option>
              {brandsData?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary-50 border-b border-secondary-100">
                <tr>
                  {['Product', 'SKU', 'Brand', 'Price', 'Stock', 'Featured', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.images?.[0]?.url || 'https://placehold.co/40x40'} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-secondary-100" onError={(e) => { e.target.src = 'https://placehold.co/40x40'; }} />
                        <div>
                          <p className="font-medium text-secondary-900 line-clamp-1 max-w-[200px]">{p.name}</p>
                          <p className="text-xs text-secondary-400">{p.category?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-secondary-500 font-mono text-xs">{p.sku}</td>
                    <td className="px-4 py-3 text-secondary-700">{p.brand?.name}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-secondary-900">{formatPrice(p.finalPrice)}</p>
                      {p.discountPercent > 0 && <p className="text-xs text-red-500">-{p.discountPercent}%</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${p.stock === 0 ? 'badge-danger' : p.stock <= 10 ? 'badge-warning' : 'badge-success'}`}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {p.isFeatured && <span className="badge-primary text-xs">Featured</span>}
                        {p.isNewArrival && <span className="badge-new text-xs">New</span>}
                        {p.isBestSeller && <span className="badge bg-amber-100 text-amber-700 text-xs">Best</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><RiEditLine size={16} /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><RiDeleteBin6Line size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && <EmptyState title="No products found" description="Add your first product to get started." />}
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="p-4 border-t border-secondary-100 flex items-center justify-between">
            <p className="text-sm text-secondary-500">{pagination.total} total products</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="btn-secondary text-xs py-1.5 px-3">Prev</button>
              <span className="text-sm text-secondary-700 py-1.5 px-2">Page {page} of {pagination.pages}</span>
              <button onClick={() => setPage(page + 1)} disabled={page >= pagination.pages} className="btn-secondary text-xs py-1.5 px-3">Next</button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-secondary-100">
              <h2 className="font-bold text-secondary-900 text-lg">{editing ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={closeForm} className="p-2 hover:bg-secondary-100 rounded-xl text-secondary-500">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <ProductField
                  k="name"
                  label="Product Name *"
                  form={form}
                  setForm={(updated) => {
                    if (!editing) {
                      const slug = updated.name.toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '');

                      // Only generate SKU if it's currently empty and name has at least 2 chars
                      let sku = updated.sku;
                      if (!sku && updated.name.length >= 2) {
                        sku = updated.name.substring(0, 3).toUpperCase() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
                      }

                      setForm({ ...updated, slug, sku });
                    } else {
                      setForm(updated);
                    }
                  }}
                />
                <ProductField k="slug" label="Slug *" half form={form} setForm={setForm} />
                <ProductField k="sku" label="SKU *" half form={form} setForm={setForm} />
                <ProductField k="brandId" label="Brand *" half options={brandsData || []} form={form} setForm={setForm} />
                <ProductField k="categoryId" label="Category *" half options={catsData || []} form={form} setForm={setForm} />
                <ProductField k="basePrice" label="Base Price *" type="number" half form={form} setForm={setForm} />
                <ProductField k="discountPercent" label="Discount %" type="number" half form={form} setForm={setForm} />
                <ProductField k="stock" label="Stock *" type="number" half form={form} setForm={setForm} />
                <ProductField k="ram" label="RAM" half form={form} setForm={setForm} />
                <ProductField k="storage" label="Storage" half form={form} setForm={setForm} />
                <ProductField k="battery" label="Battery" half form={form} setForm={setForm} />
                <ProductField k="display" label="Display" half form={form} setForm={setForm} />
                <ProductField k="processor" label="Processor" half form={form} setForm={setForm} />
                <ProductField k="camera" label="Camera" half form={form} setForm={setForm} />
                <ProductField k="os" label="OS" half form={form} setForm={setForm} />
                <ProductField k="weight" label="Weight" half form={form} setForm={setForm} />
                <ProductField k="shortDesc" label="Short Description" form={form} setForm={setForm} />
                <div className="col-span-2">
                  <label className="text-xs font-medium text-secondary-600 block mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="input resize-none text-sm py-2" />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-black text-secondary-950 uppercase tracking-widest block mb-3 ml-1">Product Images</label>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {form.images?.map((url, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border border-secondary-100 bg-secondary-50">
                        <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                        {idx === 0 && (
                          <div className="absolute bottom-0 left-0 right-0 bg-primary-600/90 text-[8px] font-black text-white text-center py-1 uppercase tracking-widest">
                            Primary
                          </div>
                        )}
                      </div>
                    ))}
                    <label className="flex flex-col items-center justify-center gap-2 aspect-square rounded-2xl border-2 border-dashed border-secondary-200 hover:border-primary-500 hover:bg-primary-50/30 transition-all cursor-pointer text-secondary-400 hover:text-primary-600">
                      {uploadingImage ? <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /> : <RiUploadCloud2Line size={24} />}
                      <span className="text-[10px] font-black uppercase tracking-widest">{uploadingImage ? 'Uploading...' : 'Add Photos'}</span>
                      <input type="file" multiple onChange={uploadFileHandler} className="hidden" accept="image/*" disabled={uploadingImage} />
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add image URL manually..."
                      className="input text-sm py-2 flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (e.target.value) {
                            setForm({ ...form, images: [...(form.images || []), e.target.value] });
                            e.target.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-secondary-400 mt-2 ml-1 italic font-medium">Tip: First image in the list will be used as the primary display image.</p>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-medium text-secondary-600 block mb-1">Colors (JSON array, e.g. ["Black","White"])</label>
                  <input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} className="input text-sm py-2 font-mono" />
                </div>
                <div className="col-span-2 bg-secondary-50 p-4 rounded-xl border border-secondary-200">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-black text-secondary-900 uppercase tracking-widest">Storage Options & Prices</label>
                    <button
                      type="button"
                      onClick={() => {
                        let currentOptions = [];
                        try { currentOptions = JSON.parse(form.storageOptions || "[]"); } catch(e) {}
                        if (!Array.isArray(currentOptions)) currentOptions = [];
                        currentOptions.push({ capacity: '', price: '' });
                        setForm({ ...form, storageOptions: JSON.stringify(currentOptions) });
                      }}
                      className="text-xs bg-primary-100 text-primary-700 px-3 py-1.5 rounded-lg hover:bg-primary-200 transition font-bold"
                    >
                      + Add Option
                    </button>
                  </div>
                  {(() => {
                    let currentOptions = [];
                    try { currentOptions = JSON.parse(form.storageOptions || "[]"); } catch(e) {}
                    if (!Array.isArray(currentOptions)) currentOptions = [];
                    
                    if (currentOptions.length === 0) {
                      return <p className="text-xs text-secondary-500 italic mt-2">No storage options added.</p>;
                    }

                    return currentOptions.map((opt, idx) => {
                      const capacity = typeof opt === 'string' ? opt : (opt.capacity || '');
                      const price = typeof opt === 'string' ? '' : (opt.price !== undefined && opt.price !== null ? opt.price : '');
                      
                      return (
                        <div key={idx} className="flex gap-2 mb-2 items-center">
                          <input
                            type="text"
                            placeholder="Capacity (e.g. 256GB)"
                            value={capacity}
                            onChange={(e) => {
                              const newOpts = [...currentOptions];
                              if (typeof newOpts[idx] === 'string') newOpts[idx] = { capacity: newOpts[idx], price: '' };
                              newOpts[idx].capacity = e.target.value;
                              setForm({ ...form, storageOptions: JSON.stringify(newOpts) });
                            }}
                            className="input text-sm py-2 flex-1"
                          />
                          <input
                            type="number"
                            placeholder="Price (e.g. 240000)"
                            value={price}
                            onChange={(e) => {
                              const newOpts = [...currentOptions];
                              if (typeof newOpts[idx] === 'string') newOpts[idx] = { capacity: newOpts[idx], price: '' };
                              newOpts[idx].price = e.target.value === '' ? '' : Number(e.target.value);
                              setForm({ ...form, storageOptions: JSON.stringify(newOpts) });
                            }}
                            className="input text-sm py-2 flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newOpts = [...currentOptions];
                              newOpts.splice(idx, 1);
                              setForm({ ...form, storageOptions: JSON.stringify(newOpts) });
                            }}
                            className="text-red-500 hover:text-red-700 p-2 bg-white rounded-lg border border-red-100 hover:bg-red-50 transition"
                          >
                            <RiDeleteBin6Line size={16} />
                          </button>
                        </div>
                      );
                    });
                  })()}
                  <p className="text-[10px] text-secondary-500 mt-3 italic">If price is left empty, the standard base price will be used instead.</p>
                </div>
                {[['has5G', '5G Enabled'], ['isFeatured', 'Featured'], ['isNewArrival', 'New Arrival'], ['isBestSeller', 'Best Seller']].map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.checked })} className="w-4 h-4 rounded" />
                    <span className="text-sm text-secondary-700">{label}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 mt-6 pt-6 border-t border-secondary-100">
                <button type="submit" disabled={saving || uploadingImage} className="btn-primary">{saving ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}</button>
                <button type="button" onClick={closeForm} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
