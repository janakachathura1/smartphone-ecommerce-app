import { create } from 'zustand';
import api from '../lib/api';
import toast from 'react-hot-toast';

export const useWishlistStore = create((set, get) => ({
  wishlist: null,
  items: [],
  isLoading: false,

  fetchWishlist: async () => {
    try {
      const { data } = await api.get('/wishlist');
      const items = data.data.wishlist?.items || [];
      set({ wishlist: data.data.wishlist, items });
    } catch {
      set({ wishlist: null, items: [] });
    }
  },

  toggle: async (productId) => {
    try {
      const { data } = await api.post('/wishlist/toggle', { productId });
      if (data.data.added) {
        toast.success('Added to wishlist!');
      } else {
        toast.success('Removed from wishlist');
      }
      await get().fetchWishlist();
      return data.data.added;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update wishlist');
      return false;
    }
  },

  isInWishlist: (productId) => {
    return get().items.some((item) => item.productId === productId);
  },

  reset: () => set({ wishlist: null, items: [] }),
}));
