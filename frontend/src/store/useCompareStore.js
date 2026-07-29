import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

export const useCompareStore = create(
  persist(
    (set, get) => ({
      compareItems: [],

      addToCompare: (product) => {
        const { compareItems } = get();
        if (compareItems.some((item) => item.id === product.id)) {
          toast.error(`${product.name} is already in comparison list!`);
          return;
        }
        if (compareItems.length >= 4) {
          toast.error('You can compare a maximum of 4 products at a time!');
          return;
        }
        set({ compareItems: [...compareItems, product] });
        toast.success(`Added ${product.name} to comparison!`);
      },

      removeFromCompare: (productId) => {
        set({ compareItems: get().compareItems.filter((item) => item.id !== productId) });
        toast.success('Removed from comparison list');
      },

      clearCompare: () => {
        set({ compareItems: [] });
      },

      isInCompare: (productId) => {
        return get().compareItems.some((item) => item.id === productId);
      },
    }),
    {
      name: 'techpulse-compare-storage',
    }
  )
);
