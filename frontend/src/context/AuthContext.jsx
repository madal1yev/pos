import { create } from 'zustand';
import { authAPI } from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('pos_user') || 'null'),
  token: localStorage.getItem('pos_token') || null,
  loading: false,
  error: null,

  isAuthenticated: () => !!get().token,
  isAdmin: () => get().user?.role === 'admin',

  login: async (email, password, remember = false) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authAPI.login({ email, password, remember });
      localStorage.setItem('pos_token', data.token);
      localStorage.setItem('pos_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return data;
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch {}
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    set({ user: null, token: null });
  },

  clearError: () => set({ error: null }),
}));
