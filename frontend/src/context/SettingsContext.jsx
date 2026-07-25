import { create } from 'zustand';
import { settingsAPI } from '../services/api';

const defaults = {
  store_name: "Oziq-ovqat Do'koni",
  store_address: '',
  store_phone: '',
  store_email: '',
  logo_url: '',
  currency: 'UZS',
  currency_symbol: "so'm",
  tax_percentage: 0,
  receipt_header: '',
  receipt_footer: '',
  low_stock_threshold: 10,
  admin_telegram: '',
};

export const useSettingsStore = create((set, get) => ({
  settings: defaults,
  loaded: false,
  loading: false,

  loadSettings: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const { data } = await settingsAPI.get();
      if (data.settings) {
        const s = { ...defaults };
        for (const [k, v] of Object.entries(data.settings)) {
          if (v != null && v !== '') s[k] = v;
        }
        set({ settings: s, loaded: true, loading: false });
        localStorage.setItem('pos_settings', JSON.stringify(s));
      }
    } catch {
      const cached = localStorage.getItem('pos_settings');
      if (cached) {
        try { set({ settings: JSON.parse(cached), loaded: true }); } catch {}
      }
    } finally {
      set({ loading: false });
    }
  },

  updateSettings: (partial) => {
    const next = { ...get().settings, ...partial };
    set({ settings: next });
    localStorage.setItem('pos_settings', JSON.stringify(next));
  },

  getLogo: () => get().settings.logo_url || '',
  getStoreName: () => get().settings.store_name || defaults.store_name,
}));
