import { Link } from 'react-router-dom';
import { useCompareStore } from '../store/useCompareStore';
import { useCartStore } from '../store/cartStore';
import { formatPrice } from '../lib/utils';
import {
  RiScales3Line,
  RiCloseLine,
  RiAddLine,
  RiShoppingCartLine,
  RiCheckLine,
  RiCloseCircleLine,
  RiStarFill,
} from 'react-icons/ri';
import { EmptyState } from '../components/ui';

export default function ComparePage() {
  const { compareItems, removeFromCompare, clearCompare } = useCompareStore();
  const { addToCart } = useCartStore();

  if (compareItems.length === 0) {
    return (
      <div className="bg-white min-h-[80vh] py-16 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-4">
          <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center text-primary-600 mx-auto mb-6 shadow-xl shadow-primary-500/10">
            <RiScales3Line size={36} />
          </div>
          <h1 className="text-3xl font-black text-secondary-950 tracking-tight mb-3">Compare Smartphones</h1>
          <p className="text-secondary-500 font-medium leading-relaxed mb-8">
            You haven't selected any smartphones to compare yet. Browse our store and click "Compare" on any phone to compare specs side by side!
          </p>
          <Link to="/shop" className="btn-primary py-3.5 px-8 inline-flex items-center gap-2">
            <RiAddLine size={18} />
            Explore Phones to Compare
          </Link>
        </div>
      </div>
    );
  }

  const SPEC_KEYS = [
    { key: 'price', label: 'Price', render: (p) => <span className="font-extrabold text-primary-600 text-lg">{formatPrice(p.finalPrice)}</span> },
    { key: 'brand', label: 'Brand', render: (p) => p.brand?.name || '-' },
    { key: 'os', label: 'Operating System' },
    { key: 'processor', label: 'Processor / Chipset' },
    { key: 'ram', label: 'RAM' },
    { key: 'storage', label: 'Storage Options' },
    { key: 'display', label: 'Display' },
    { key: 'camera', label: 'Rear Camera' },
    { key: 'frontCamera', label: 'Front Camera' },
    { key: 'battery', label: 'Battery' },
    { key: 'has5G', label: '5G Connectivity', render: (p) => p.has5G ? <span className="text-green-600 font-bold flex items-center gap-1"><RiCheckLine size={18}/> Supported</span> : <span className="text-secondary-400 font-medium flex items-center gap-1"><RiCloseCircleLine size={18}/> 4G Only</span> },
    { key: 'weight', label: 'Weight' },
    { key: 'stock', label: 'Stock Status', render: (p) => p.stock > 0 ? <span className="badge-success">{p.stock} in stock</span> : <span className="badge-danger">Out of stock</span> },
  ];

  return (
    <div className="bg-secondary-50 min-h-screen py-10 text-secondary-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary-600 mb-1">
              <RiScales3Line size={18} />
              Side-by-Side Comparison
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-secondary-950 tracking-tight">Smartphone Specs Comparison</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={clearCompare}
              className="px-4 py-2.5 rounded-2xl border border-secondary-200 text-secondary-600 hover:text-red-600 hover:border-red-200 font-bold text-xs transition-colors bg-white shadow-sm"
            >
              Clear All
            </button>
            <Link to="/shop" className="btn-outline py-2.5 px-5 text-xs font-bold bg-white">
              + Add More Phones
            </Link>
          </div>
        </div>

        {/* Comparison Grid Table */}
        <div className="bg-white rounded-3xl border border-secondary-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-secondary-100 bg-secondary-50/50">
                  <th className="p-6 w-1/4 min-w-[200px] text-xs font-black uppercase tracking-widest text-secondary-400 align-bottom">
                    Phone Models ({compareItems.length})
                  </th>
                  {compareItems.map((item) => (
                    <th key={item.id} className="p-6 w-1/4 min-w-[240px] text-center align-top relative border-l border-secondary-100">
                      <button
                        onClick={() => removeFromCompare(item.id)}
                        className="absolute top-4 right-4 p-1.5 rounded-full text-secondary-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Remove phone"
                      >
                        <RiCloseLine size={18} />
                      </button>
                      <div className="w-32 h-32 mx-auto bg-white rounded-2xl p-4 border border-secondary-100 shadow-sm mb-4 flex items-center justify-center">
                        <img src={item.images?.[0]?.url || 'https://placehold.co/120x120'} alt={item.name} className="w-full h-full object-contain hover:scale-105 transition-transform" />
                      </div>
                      <h3 className="font-extrabold text-secondary-950 text-base line-clamp-1 mb-1">{item.name}</h3>
                      <div className="flex items-center justify-center gap-1 text-amber-400 text-xs font-bold mb-3">
                        <RiStarFill size={14} />
                        <span>{item.rating || '4.5'}</span>
                      </div>
                      <button
                        onClick={() => addToCart(item.id, 1)}
                        disabled={item.stock === 0}
                        className="w-full btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 rounded-xl shadow-md disabled:opacity-50"
                      >
                        <RiShoppingCartLine size={14} />
                        {item.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </th>
                  ))}
                  {compareItems.length < 4 && (
                    <th className="p-6 w-1/4 min-w-[200px] text-center align-middle border-l border-secondary-100 bg-secondary-50/20">
                      <Link to="/shop" className="inline-flex flex-col items-center justify-center p-6 border-2 border-dashed border-secondary-200 hover:border-primary-500 rounded-2xl text-secondary-400 hover:text-primary-600 transition-all">
                        <RiAddLine size={32} className="mb-2" />
                        <span className="text-xs font-bold">Add Phone to Compare</span>
                      </Link>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {SPEC_KEYS.map(({ key, label, render }, idx) => (
                  <tr key={key} className={idx % 2 === 0 ? 'bg-white' : 'bg-secondary-50/30'}>
                    <td className="p-4 px-6 text-xs font-black uppercase tracking-wider text-secondary-600 border-t border-secondary-100">
                      {label}
                    </td>
                    {compareItems.map((item) => {
                      const val = item[key];
                      const content = render ? render(item) : (val || '-');
                      return (
                        <td key={item.id} className="p-4 text-center text-sm font-semibold text-secondary-800 border-t border-l border-secondary-100">
                          {content}
                        </td>
                      );
                    })}
                    {compareItems.length < 4 && <td className="border-t border-l border-secondary-100 bg-secondary-50/20"></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
