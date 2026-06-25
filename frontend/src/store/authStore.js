import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';
import toast from 'react-hot-toast';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          const { user, token } = data.data;
          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
          toast.success(`Welcome back, ${user.firstName}!`);
          return { success: true, role: user.role };
        } catch (error) {
          set({ isLoading: false });
          const msg = error.response?.data?.message || 'Login failed';
          toast.error(msg);
          return { success: false, message: msg };
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/register', userData);
          const { user, token } = data.data;
          localStorage.setItem('token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
          toast.success('Account created successfully!');
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          const msg = error.response?.data?.message || 'Registration failed';
          toast.error(msg);
          return { success: false, message: msg };
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
        toast.success('Logged out successfully.');
      },

      updateUser: (userData) => set({ user: { ...get().user, ...userData } }),

      fetchMe: async () => {
        set({ isLoading: true });
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.data.user, isAuthenticated: true, isLoading: false });
        } catch {
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
          localStorage.removeItem('token');
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
