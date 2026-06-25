import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiSearchLine, RiCloseLine, RiFlashlightLine,
  RiStoreLine, RiArrowRightLine, RiLoader4Line,
} from 'react-icons/ri';
import api from '../lib/api';
import { formatPrice } from '../lib/utils';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// Highlight matching text within a string
function Highlight({ text = '', query = '' }) {
  if (!query.trim()) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-primary-100 text-primary-700 rounded px-0.5 not-italic font-black">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

export default function SearchBar({ onClose, autoFocus = false, placeholder = 'Search smartphones, brands…' }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const abortRef = useRef(null);
  const debouncedQuery = useDebounce(query, 280);

  // Auto-focus when told to
  useEffect(() => {
    if (autoFocus) setTimeout(() => inputRef.current?.focus(), 80);
  }, [autoFocus]);

  // Fetch suggestions
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    api
      .get(`/products/suggestions?q=${encodeURIComponent(debouncedQuery)}`, {
        signal: abortRef.current.signal,
      })
      .then((r) => {
        setResults(r.data.data);
        setOpen(true);
        setActiveIdx(-1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Build a flat list of all nav-able items for keyboard nav
  const allItems = [
    ...(results?.products || []).map((p) => ({ type: 'product', item: p })),
    ...(results?.brands || []).map((b) => ({ type: 'brand', item: b })),
    ...(results?.categories || []).map((c) => ({ type: 'category', item: c })),
  ];

  const goToItem = useCallback((entry) => {
    if (entry.type === 'product') navigate(`/product/${entry.item.slug}`);
    else if (entry.type === 'brand') navigate(`/shop?brand=${entry.item.slug}`);
    else navigate(`/shop?category=${entry.item.slug}`);
    setQuery('');
    setOpen(false);
    onClose?.();
  }, [navigate, onClose]);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
    setQuery('');
    setOpen(false);
    onClose?.();
  };

  const handleKeyDown = (e) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && allItems[activeIdx]) {
        e.preventDefault();
        goToItem(allItems[activeIdx]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const isEmpty = results && results.products.length === 0 && results.brands.length === 0 && results.categories.length === 0;
  let flatIdx = -1; // track index across sections for keyboard nav

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input row */}
      <form onSubmit={handleSearch} className="relative flex items-center group">
        {/* Search icon */}
        <div className="absolute left-3.5 flex items-center pointer-events-none">
          {loading ? (
            <RiLoader4Line size={17} className="text-primary-500 animate-spin" />
          ) : (
            <RiSearchLine size={17} className="text-secondary-400 group-focus-within:text-primary-500 transition-colors" />
          )}
        </div>

        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); if (e.target.value.length >= 2) setOpen(true); }}
          onFocus={() => { if (results && query.length >= 2) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="
            w-full pl-10 pr-10 py-2.5
            bg-secondary-50 border border-secondary-200
            rounded-xl text-sm text-secondary-900
            placeholder-secondary-400
            focus:outline-none focus:bg-white focus:border-primary-400
            focus:shadow-[0_0_0_3px_rgba(14,165,233,0.12)]
            transition-all duration-200
          "
        />

        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setOpen(false); setResults(null); inputRef.current?.focus(); }}
            className="absolute right-3 p-0.5 text-secondary-400 hover:text-secondary-700 transition-colors"
            aria-label="Clear search"
          >
            <RiCloseLine size={16} />
          </button>
        )}
      </form>

      {/* Dropdown */}
      {open && (
        <div className="
          absolute top-full left-0 right-0 mt-2 z-[999]
          bg-white border border-secondary-100
          rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.18)]
          overflow-hidden
          animate-fade-in
        ">
          {/* No results */}
          {isEmpty && (
            <div className="px-5 py-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-secondary-50 flex items-center justify-center mx-auto mb-3">
                <RiSearchLine size={22} className="text-secondary-300" />
              </div>
              <p className="text-sm font-bold text-secondary-500">No results for "<span className="text-secondary-900">{query}</span>"</p>
              <p className="text-xs text-secondary-400 mt-1">Try a different keyword or browse all products</p>
            </div>
          )}

          {/* Products */}
          {results?.products?.length > 0 && (
            <div>
              <p className="px-4 pt-3.5 pb-1 text-[10px] font-black uppercase tracking-[0.35em] text-secondary-400">
                Products
              </p>
              {results.products.map((product) => {
                flatIdx++;
                const myIdx = flatIdx;
                const isActive = activeIdx === myIdx;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onMouseEnter={() => setActiveIdx(myIdx)}
                    onClick={() => goToItem({ type: 'product', item: product })}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                      ${isActive ? 'bg-primary-50' : 'hover:bg-secondary-50'}
                    `}
                  >
                    {/* Product image */}
                    <div className="w-11 h-11 rounded-xl bg-secondary-50 border border-secondary-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {product.images?.[0]?.url ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <RiFlashlightLine size={18} className="text-secondary-300" />
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-secondary-900 truncate">
                        <Highlight text={product.name} query={query} />
                      </p>
                      <p className="text-[11px] text-secondary-400 mt-0.5">{product.brand?.name}</p>
                    </div>
                    {/* Price */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-black text-secondary-950">{formatPrice(product.finalPrice)}</p>
                      {product.discountPercent > 0 && (
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                          -{product.discountPercent}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Brands */}
          {results?.brands?.length > 0 && (
            <div className={results?.products?.length > 0 ? 'border-t border-secondary-50' : ''}>
              <p className="px-4 pt-3.5 pb-1 text-[10px] font-black uppercase tracking-[0.35em] text-secondary-400">
                Brands
              </p>
              {results.brands.map((brand) => {
                flatIdx++;
                const myIdx = flatIdx;
                const isActive = activeIdx === myIdx;
                return (
                  <button
                    key={brand.id}
                    type="button"
                    onMouseEnter={() => setActiveIdx(myIdx)}
                    onClick={() => goToItem({ type: 'brand', item: brand })}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                      ${isActive ? 'bg-primary-50' : 'hover:bg-secondary-50'}
                    `}
                  >
                    <div className="w-8 h-8 rounded-lg bg-secondary-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {brand.logo ? (
                        <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <RiStoreLine size={15} className="text-secondary-500" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-secondary-800">
                      <Highlight text={brand.name} query={query} />
                    </span>
                    <span className="ml-auto text-[11px] text-secondary-400 font-medium">Brand</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Categories */}
          {results?.categories?.length > 0 && (
            <div className={(results?.products?.length > 0 || results?.brands?.length > 0) ? 'border-t border-secondary-50' : ''}>
              <p className="px-4 pt-3.5 pb-1 text-[10px] font-black uppercase tracking-[0.35em] text-secondary-400">
                Categories
              </p>
              {results.categories.map((cat) => {
                flatIdx++;
                const myIdx = flatIdx;
                const isActive = activeIdx === myIdx;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onMouseEnter={() => setActiveIdx(myIdx)}
                    onClick={() => goToItem({ type: 'category', item: cat })}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                      ${isActive ? 'bg-primary-50' : 'hover:bg-secondary-50'}
                    `}
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex-shrink-0 flex items-center justify-center">
                      <RiFlashlightLine size={15} className="text-primary-500" />
                    </div>
                    <span className="text-sm font-semibold text-secondary-800">
                      <Highlight text={cat.name} query={query} />
                    </span>
                    <span className="ml-auto text-[11px] text-secondary-400 font-medium">Category</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* View all results footer */}
          {!isEmpty && results && (
            <div className="border-t border-secondary-100 px-4 py-3">
              <button
                type="button"
                onClick={handleSearch}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-black text-primary-600 uppercase tracking-widest hover:text-primary-700 transition-colors group/footer"
              >
                <RiSearchLine size={13} />
                See all results for "<span className="font-black">{query}</span>"
                <RiArrowRightLine size={13} className="group-hover/footer:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
