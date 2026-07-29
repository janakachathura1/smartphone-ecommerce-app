import { useRecentlyViewedStore } from '../store/useRecentlyViewedStore';
import ProductCard from './ProductCard';
import { RiHistoryLine, RiDeleteBinLine } from 'react-icons/ri';

export default function RecentlyViewedSection({ excludeId }) {
  const { recentlyViewed, clearRecentlyViewed } = useRecentlyViewedStore();

  const itemsToDisplay = recentlyViewed.filter((p) => p.id !== excludeId);

  if (itemsToDisplay.length === 0) return null;

  return (
    <section className="py-10 bg-secondary-50/60 border-t border-b border-secondary-100 my-10">
      <div className="container-custom">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary-600 mb-1">
              <RiHistoryLine size={16} />
              Browsing History
            </div>
            <h2 className="text-2xl font-black text-secondary-950 tracking-tight">Recently Viewed Smartphones</h2>
          </div>
          <button
            onClick={clearRecentlyViewed}
            className="text-xs font-bold text-secondary-400 hover:text-red-500 transition-colors flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-secondary-200"
          >
            <RiDeleteBinLine size={14} />
            <span>Clear History</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {itemsToDisplay.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
