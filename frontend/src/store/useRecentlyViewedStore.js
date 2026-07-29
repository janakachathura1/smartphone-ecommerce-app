import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useRecentlyViewedStore = create(
  persist(
    (set, get) => ({
      recentlyViewed: [],

      addViewedProduct: (product) => {
        if (!product || !product.id) return;
        const current = get().recentlyViewed;
        // Remove duplicate if already present
        const filtered = current.filter((p) => p.id !== product.id);
        // Put newest at the front, limit to 10 items
        const updated = [product, ...filtered].slice(0, 10);
        set({ recentlyViewed: updated });
      },

      clearRecentlyViewed: () => set({ recentlyViewed: [] }),
    }),
    {
      name: 'techpulse-recently-viewed',
    }
  )
);
