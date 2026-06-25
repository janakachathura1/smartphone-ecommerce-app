import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  RiFilterLine, RiCloseLine, RiSearchLine, RiArrowUpDownLine, RiGridLine, RiListUnordered,
} from 'react-icons/ri';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton, EmptyState, ErrorState } from '../components/ui';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'sales', label: 'Best Selling' },
];

// Categories and other options could also be dynamic later
const RAM_OPTIONS = ['4GB', '6GB', '8GB', '12GB', '16GB'];
const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB'];

function FilterSection({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-primary-100 pb-5 mb-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-3 text-left group"
      >
        <span className="font-black text-secondary-950 text-xs group-hover:text-primary-600 transition-colors uppercase tracking-[0.2em]">{title}</span>
        <span className="text-primary-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && children}
    </div>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group py-2 px-2 rounded-xl hover:bg-primary-50 transition-all">
      <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4 rounded border-primary-200 bg-white text-primary-600 focus:ring-primary-500 cursor-pointer" />
      <span className="text-sm text-secondary-600 group-hover:text-secondary-950 font-medium transition-colors">{label}</span>
    </label>
  );
}

const Filters = ({ 
  search, 
  setParam, 
  categoriesList, 
  category, 
  brands, 
  brand, 
  minPrice, 
  maxPrice, 
  has5G, 
  inStock, 
  isFeatured, 
  isNewArrival, 
  isBestSeller, 
  clearFilters, 
  hasFilters,
  navigate
}) => {
  const [localSearch, setLocalSearch] = useState(search);
  const [suggestions, setSuggestions] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.search-container')) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Sync local search with prop when it changes externally (e.g. clear filters)
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Fetch suggestions
  useEffect(() => {
    if (localSearch.length < 2) {
      setSuggestions(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data: r } = await api.get(`/products/suggestions?q=${encodeURIComponent(localSearch)}`);
        setSuggestions(r.data);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setParam('search', localSearch);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (type, slug) => {
    if (type === 'product') {
      navigate(`/product/${slug}`);
    } else {
      setParam(type, slug);
    }
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-0">
      {/* Search */}
      <div className="pb-5 mb-5 border-b border-primary-100 search-container relative">
        <form onSubmit={handleSearchSubmit}>
          <div className="relative">
            <RiSearchLine size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
            <input
              type="search"
              value={localSearch}
              onChange={(e) => { 
                setLocalSearch(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search phones..."
              className="input pl-9 text-sm py-2.5 bg-primary-50 border-primary-100 focus:bg-white transition-all w-full"
            />
          </div>
        </form>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-primary-100 rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto animate-fade-in p-2">
            {suggestions.products?.length === 0 && suggestions.categories?.length === 0 && suggestions.brands?.length === 0 && (
              <p className="p-4 text-center text-xs text-secondary-400 italic">No matches found</p>
            )}
            
            {suggestions.products?.length > 0 && (
              <div className="mb-2">
                <p className="px-3 py-1 text-[9px] font-black uppercase text-secondary-400 tracking-widest">Products</p>
                {suggestions.products.slice(0, 5).map(p => (
                  <button key={p.id} onClick={() => handleSuggestionClick('product', p.slug)} className="w-full text-left px-3 py-2 hover:bg-primary-50 rounded-xl transition-colors flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-secondary-50 flex-shrink-0 flex items-center justify-center p-1">
                      <img src={p.images?.[0]?.url || '/placeholder.png'} alt="" className="max-w-full max-h-full object-contain" />
                    </div>
                    <span className="text-xs font-bold text-secondary-700 truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            )}

            {suggestions.categories?.length > 0 && (
              <div className="mb-2 border-t border-secondary-50 pt-2">
                <p className="px-3 py-1 text-[9px] font-black uppercase text-secondary-400 tracking-widest">Categories</p>
                {suggestions.categories.map(c => (
                  <button key={c.id} onClick={() => handleSuggestionClick('category', c.slug)} className="w-full text-left px-3 py-2 hover:bg-primary-50 rounded-xl transition-colors text-xs font-bold text-secondary-700">
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            {suggestions.brands?.length > 0 && (
              <div className="border-t border-secondary-50 pt-2">
                <p className="px-3 py-1 text-[9px] font-black uppercase text-secondary-400 tracking-widest">Brands</p>
                {suggestions.brands.map(b => (
                  <button key={b.id} onClick={() => handleSuggestionClick('brand', b.slug)} className="w-full text-left px-3 py-2 hover:bg-primary-50 rounded-xl transition-colors text-xs font-bold text-secondary-700">
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <FilterSection title="Categories">
        {categoriesList.length > 0 ? (
          categoriesList.map((c) => (
            <Checkbox 
              key={c.id} 
              label={c.name} 
              checked={category === c.slug} 
              onChange={() => setParam('category', category === c.slug ? '' : c.slug)} 
            />
          ))
        ) : (
          <p className="text-[10px] text-secondary-400 font-medium px-2 italic">No categories found</p>
        )}
      </FilterSection>

      <FilterSection title="Brand">
        {brands.length > 0 ? (
          brands.map((b) => (
            <Checkbox 
              key={b.id} 
              label={b.name} 
              checked={brand === b.slug} 
              onChange={() => setParam('brand', brand === b.slug ? '' : b.slug)} 
            />
          ))
        ) : (
          <p className="text-[10px] text-secondary-400 font-medium px-2 italic">No brands found</p>
        )}
      </FilterSection>

      <FilterSection title="Price Range">
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder="Min $" value={minPrice} onChange={(e) => setParam('minPrice', e.target.value)} className="input text-sm py-2" />
          <input type="number" placeholder="Max $" value={maxPrice} onChange={(e) => setParam('maxPrice', e.target.value)} className="input text-sm py-2" />
        </div>
      </FilterSection>

      <FilterSection title="Features">
        <Checkbox label="5G Enabled" checked={has5G === 'true'} onChange={() => setParam('has5G', has5G === 'true' ? '' : 'true')} />
        <Checkbox label="In Stock Only" checked={inStock === 'true'} onChange={() => setParam('inStock', inStock === 'true' ? '' : 'true')} />
        <Checkbox label="Featured" checked={isFeatured === 'true'} onChange={() => setParam('isFeatured', isFeatured === 'true' ? '' : 'true')} />
        <Checkbox label="New Arrivals" checked={isNewArrival === 'true'} onChange={() => setParam('isNewArrival', isNewArrival === 'true' ? '' : 'true')} />
        <Checkbox label="Best Sellers" checked={isBestSeller === 'true'} onChange={() => setParam('isBestSeller', isBestSeller === 'true' ? '' : 'true')} />
      </FilterSection>

      {hasFilters && (
        <button onClick={clearFilters} className="w-full btn-secondary text-sm py-2">
          Clear All Filters
        </button>
      )}
    </div>
  );
};

export default function ShopPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [gridCols, setGridCols] = useState(3);

  // Read filters from URL
  const search = searchParams.get('search') || '';
  const brand = searchParams.get('brand') || '';
  const category = searchParams.get('category') || '';
  const isFeatured = searchParams.get('isFeatured') || '';
  const isNewArrival = searchParams.get('isNewArrival') || '';
  const isBestSeller = searchParams.get('isBestSeller') || '';
  const has5G = searchParams.get('has5G') || '';
  const inStock = searchParams.get('inStock') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1');

  const setParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value); else params.delete(key);
    params.set('page', '1');
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const { sortBy, order } = (() => {
    if (sort === 'price-asc') return { sortBy: 'price', order: 'asc' };
    if (sort === 'price-desc') return { sortBy: 'price', order: 'desc' };
    if (sort === 'rating') return { sortBy: 'rating', order: 'desc' };
    if (sort === 'sales') return { sortBy: 'sales', order: 'desc' };
    return { sortBy: 'newest', order: 'desc' };
  })();

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data?.data?.categories || []),
  });
  const categoriesList = categoriesData || [];

  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: () => api.get('/brands').then((r) => r.data?.data?.brands || []),
  });
  const brands = brandsData || [];

  const params = {
    page, limit: 12, search, brand, category, isFeatured, isNewArrival, isBestSeller,
    has5G, inStock, minPrice, maxPrice, sortBy, order,
  };
  const cleanParams = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== false));

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', cleanParams],
    queryFn: () => api.get('/products', { params: cleanParams }).then((r) => r.data.data),
  });

  const products = data?.products || [];
  const pagination = data?.pagination;

  const hasFilters = brand || category || isFeatured || isNewArrival || isBestSeller || has5G || inStock || minPrice || maxPrice || search;

  const activeCategory = categoriesList.find(c => c.slug === category);
  const activeBrand = brands.find(b => b.slug === brand);

  const getPageTitle = () => {
    if (search) return `Search: "${search}"`;
    if (category && activeCategory) return activeCategory.name;
    if (brand && activeBrand) return activeBrand.name;
    return 'All Smartphones';
  };

  const filterProps = {
    search, setParam, categoriesList, category, brands, brand, minPrice, maxPrice, 
    has5G, inStock, isFeatured, isNewArrival, isBestSeller, clearFilters, hasFilters,
    navigate
  };

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(r => r.data.data)
  });

  return (
    <div className="bg-white min-h-screen text-secondary-950">
      {/* Page header */}
      <div 
        className="py-16 relative overflow-hidden bg-center bg-cover bg-no-repeat border-b border-primary-100"
        style={settings?.shopBannerImageUrl ? { backgroundImage: `url(${settings.shopBannerImageUrl})` } : {}}
      >
        {settings?.shopBannerImageUrl ? (
          <div className="absolute inset-0 bg-white/80 md:bg-white/60 backdrop-blur-sm"></div>
        ) : (
           <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-primary-100"></div>
        )}
        <div className="container-custom relative z-10">
          <h1 className="text-3xl md:text-5xl font-black text-secondary-950 tracking-tight">
            {getPageTitle()}
          </h1>
          <p className="text-primary-600 text-xs mt-3 font-black uppercase tracking-[0.3em]">
            {pagination ? `${pagination.total} products found` : 'Browsing our collection...'}
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 p-8 rounded-[2.5rem] bg-primary-50 border border-primary-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-black text-secondary-950 uppercase tracking-widest text-xs flex items-center gap-2"><RiFilterLine size={18} className="text-primary-600" /> Filters</h2>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-[10px] uppercase font-black tracking-widest text-primary-600 hover:underline">Clear all</button>
                )}
              </div>
              <Filters {...filterProps} />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden btn-secondary text-sm py-2 gap-2"
              >
                <RiFilterLine size={16} /> Filters {hasFilters && `(active)`}
              </button>

              <div className="flex items-center gap-3 ml-auto">
                <div className="flex items-center gap-1 p-1 bg-secondary-100 rounded-xl">
                  <button onClick={() => setGridCols(3)} className={`p-1.5 rounded-lg transition-colors ${gridCols === 3 ? 'bg-white shadow-sm text-primary-600' : 'text-secondary-400'}`}>
                    <RiGridLine size={16} />
                  </button>
                  <button onClick={() => setGridCols(2)} className={`p-1.5 rounded-lg transition-colors ${gridCols === 2 ? 'bg-white shadow-sm text-primary-600' : 'text-secondary-400'}`}>
                    <RiListUnordered size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-2 border border-primary-100 rounded-xl px-4 py-2.5 bg-primary-50/50">
                  <RiArrowUpDownLine size={15} className="text-primary-600" />
                  <select
                    value={sort}
                    onChange={(e) => setParam('sort', e.target.value)}
                    className="text-sm font-bold text-secondary-800 bg-transparent focus:outline-none cursor-pointer"
                  >
                    {SORT_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Grid */}
            {isError ? (
              <ErrorState onRetry={refetch} />
            ) : (
              <>
                <div className={`grid gap-4 md:gap-5 ${gridCols === 3 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                  {isLoading
                    ? Array(12).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
                    : products.map((p) => <ProductCard key={p.id} product={p} />)
                  }
                </div>

                {!isLoading && products.length === 0 && (
                  <EmptyState
                    title="No products found"
                    description="Try adjusting your filters or search term."
                    action={<button onClick={clearFilters} className="btn-primary">Clear Filters</button>}
                  />
                )}

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
                    <button
                      onClick={() => setParam('page', String(page - 1))}
                      disabled={page <= 1}
                      className="btn-secondary text-sm py-2 px-4 disabled:opacity-40"
                    >
                      ← Prev
                    </button>
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).filter(p => Math.abs(p - page) <= 2).map((p) => (
                      <button
                        key={p}
                        onClick={() => setParam('page', String(p))}
                        className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${p === page ? 'bg-primary-600 text-white shadow-glow' : 'btn-secondary py-0 px-0'}`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setParam('page', String(page + 1))}
                      disabled={page >= pagination.pages}
                      className="btn-secondary text-sm py-2 px-4 disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-secondary-950/20 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} />
          <div className="relative ml-auto w-80 bg-white h-full overflow-y-auto p-10 shadow-2xl">
            <div className="flex items-center justify-between mb-10">
              <h2 className="font-black text-secondary-950 text-2xl flex items-center gap-2"><RiFilterLine size={24} className="text-primary-600" /> Filters</h2>
              <button onClick={() => setMobileFiltersOpen(false)} className="p-2 hover:bg-primary-50 rounded-xl text-secondary-500">
                <RiCloseLine size={24} />
              </button>
            </div>
            <Filters {...filterProps} />
          </div>
        </div>
      )}
    </div>
  );
}
