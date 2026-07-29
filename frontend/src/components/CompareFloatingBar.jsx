import { Link, useLocation } from 'react-router-dom';
import { useCompareStore } from '../store/useCompareStore';
import { RiScales3Line, RiCloseLine, RiArrowRightLine } from 'react-icons/ri';

export default function CompareFloatingBar() {
  const { compareItems, removeFromCompare, clearCompare } = useCompareStore();
  const location = useLocation();

  // Hide on compare page or if compare items is empty
  if (compareItems.length === 0 || location.pathname === '/compare') return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-2xl bg-secondary-950/95 backdrop-blur-xl border border-secondary-800 text-white rounded-3xl p-4 shadow-2xl animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-primary-600/20 text-primary-400 flex items-center justify-center border border-primary-500/30">
            <RiScales3Line size={20} />
          </div>
          <div className="hidden sm:block">
            <h4 className="text-xs font-black uppercase tracking-widest text-primary-400">Compare Queue</h4>
            <p className="text-[11px] text-secondary-400 font-medium">{compareItems.length} of 4 selected</p>
          </div>
        </div>

        {/* Selected Phone Thumbnails */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {compareItems.map((item) => (
            <div key={item.id} className="relative group flex-shrink-0">
              <div className="w-12 h-12 bg-white rounded-2xl p-1.5 border border-secondary-700 flex items-center justify-center">
                <img src={item.images?.[0]?.url || 'https://placehold.co/40x40'} alt={item.name} className="w-full h-full object-contain" />
              </div>
              <button
                onClick={() => removeFromCompare(item.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow-md transition-transform group-hover:scale-110"
                title="Remove"
              >
                <RiCloseLine size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {compareItems.length > 0 && (
            <button
              onClick={clearCompare}
              className="text-xs text-secondary-400 hover:text-white px-2 py-1 transition-colors font-medium hidden md:block"
            >
              Clear
            </button>
          )}
          <Link
            to="/compare"
            className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 rounded-2xl shadow-lg shadow-primary-600/30"
          >
            <span>Compare Now ({compareItems.length})</span>
            <RiArrowRightLine size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
