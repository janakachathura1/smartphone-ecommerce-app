import { useQuery } from '@tanstack/react-query';
import { useRecentlyViewedStore } from '../store/useRecentlyViewedStore';
import api from '../lib/api';
import ProductCard from './ProductCard';
import { RiMagicLine, RiSparkling2Fill } from 'react-icons/ri';

export default function RecommendedSection() {
  const { recentlyViewed } = useRecentlyViewedStore();

  // Extract recent brand IDs / names
  const recentBrandIds = [...new Set(recentlyViewed.map((p) => p.brandId || p.brand?.id).filter(Boolean))];

  const { data: recommendedProducts = [], isLoading } = useQuery({
    queryKey: ['recommended-products', recentBrandIds],
    queryFn: async () => {
      const res = await api.get('/products', {
        params: {
          limit: 8,
          isFeatured: true,
          brandId: recentBrandIds[0] || undefined,
        },
      });
      return res.data.data?.products || [];
    },
  });

  if (recommendedProducts.length === 0 && !isLoading) return null;

  return (
    <section className="py-12 bg-gradient-to-b from-white via-primary-50/20 to-white my-6">
      <div className="container-custom">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-600/30">
            <RiSparkling2Fill size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary-600">
              <RiMagicLine size={14} />
              Tailored For You
            </div>
            <h2 className="text-2xl lg:text-3xl font-black text-secondary-950 tracking-tight">Recommended Smartphones</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {recommendedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
