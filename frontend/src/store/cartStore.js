import { create } from 'zustand';
import api from '../lib/api';
import toast from 'react-hot-toast';

export const useCartStore = create((set, get) => ({
  cart: null,
  itemCount: 0,
  subtotal: 0,
  isLoading: false,

  fetchCart: async () => {
    try {
      const { data } = await api.get('/cart');
      set({ cart: data.data.cart, itemCount: data.data.itemCount, subtotal: data.data.subtotal });
    } catch {
      // User likely not authenticated
      set({ cart: null, itemCount: 0, subtotal: 0 });
    }
  },

  addToCart: async (productId, quantity = 1, color = null, storage = null) => {
    set({ isLoading: true });
    try {
      await api.post('/cart', { productId, quantity, color, storage });
      toast.success('Added to cart!');
      await get().fetchCart();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      set({ isLoading: false });
    }
  },

  updateItem: async (itemId, quantity) => {
    try {
      await api.put(`/cart/items/${itemId}`, { quantity });
      await get().fetchCart();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update cart');
    }
  },

  removeItem: async (itemId) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
      toast.success('Item removed from cart');
      await get().fetchCart();
    } catch (error) {
      toast.error('Failed to remove item');
    }
  },

  clearCart: async () => {
    try {
      await api.delete('/cart');
      set({ cart: null, itemCount: 0, subtotal: 0 });
    } catch (error) {
      toast.error('Failed to clear cart');
    }
  },

  reset: () => set({ cart: null, itemCount: 0, subtotal: 0 }),
}));
