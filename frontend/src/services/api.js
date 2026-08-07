import axios from 'axios';

// Production: VITE_API_URL dan foydalanadi (masalan: https://pos-backend.onrender.com)
// Local: '/api' (Vite proxy orqali localhost:5000 ga yonaltiriladi)
const VITE_API_URL = import.meta.env.VITE_API_URL;
let API_BASE = '/api';
if (VITE_API_URL) {
  const base = VITE_API_URL.replace(/\/+$/, '');
  API_BASE = base.endsWith('/api') ? base : `${base}/api`;
}

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRedirecting = false;

api.interceptors.response.use(
  (response) => {
    if (isRedirecting) isRedirecting = false;
    return response;
  },
  (error) => {
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      console.error('Network error:', error.message);
    }
    if (error.response?.status === 401 && !isRedirecting) {
      const token = localStorage.getItem('pos_token');
      const isLoginPage = window.location.pathname === '/login';
      if (token && !isLoginPage) {
        isRedirecting = true;
        localStorage.removeItem('pos_token');
        localStorage.removeItem('pos_user');
        window.location.href = '/login';
      } else if (!token && !isLoginPage) {
        isRedirecting = true;
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  pinLogin: (data) => api.post('/auth/pin-login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  changePassword: (data) => api.post('/auth/change-password', data),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Products
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// Categories
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
  bulkDelete: (ids) => api.post('/categories/bulk-delete', { ids }),
  bulkStatus: (ids, status) => api.post('/categories/bulk-status', { ids, status }),
  reorder: (orders) => api.patch('/categories/reorder', { orders }),
  exportCsv: () => api.get('/categories/export-csv', { responseType: 'blob' }),
  importCsv: (formData) => api.post('/categories/import-csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// Sales
export const salesAPI = {
  getAll: (params) => api.get('/sales', { params }),
  getAllIds: (params) => api.get('/sales', { params: { ...params, all_ids: 'true' } }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  getInvoice: (id) => api.get(`/sales/${id}/invoice`),
  cancelOrder: (id, reason) => api.post(`/sales/${id}/cancel`, { reason }),
  delete: (id) => api.delete(`/sales/${id}`),
  bulkDelete: (ids) => api.post('/sales/bulk-delete', { ids }),
};

// Reports
export const reportsAPI = {
  daily: (params) => api.get('/reports/daily', { params }),
  monthly: (params) => api.get('/reports/monthly', { params }),
  topProducts: (params) => api.get('/reports/top-products', { params }),
  inventory: (params) => api.get('/reports/inventory', { params }),
  revenue: (params) => api.get('/reports/revenue', { params }),
};

// Dashboard
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

// Settings
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  backup: () => api.get('/backup'),
};

// Customers
export const customersAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

// Suppliers
export const suppliersAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
};

// Bulk operations
export const bulkAPI = {
  updatePrices: (updates) => api.post('/bulk/bulk-update-prices', { updates }),
  updateProducts: (updates) => api.post('/bulk/bulk-update-products', { updates }),
  deleteProducts: (ids) => api.post('/bulk/bulk-delete-products', { ids }),
  importCSV: (formData) => api.post('/bulk/import-csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  exportCSV: () => api.get('/bulk/export-csv', { responseType: 'blob' }),
};

// Shifts (Smena)
export const shiftsAPI = {
  getAll: (params) => api.get('/shifts', { params }),
  getById: (id) => api.get(`/shifts/${id}`),
  getActive: () => api.get('/shifts/active'),
  open: (data) => api.post('/shifts/open', data),
  close: (id, data) => api.post(`/shifts/${id}/close`, data),
  getZReport: (id) => api.get(`/shifts/${id}/z-report`),
};

// Refunds
export const refundsAPI = {
  getAll: (params) => api.get('/refunds', { params }),
  getById: (id) => api.get(`/refunds/${id}`),
  getBySaleId: (saleId) => api.get(`/refunds/by-sale/${saleId}`),
  create: (data) => api.post('/refunds', data),
};

// Discounts & Promo Codes
export const discountsAPI = {
  getAll: (params) => api.get('/discounts', { params }),
  getById: (id) => api.get(`/discounts/${id}`),
  create: (data) => api.post('/discounts', data),
  update: (id, data) => api.put(`/discounts/${id}`, data),
  delete: (id) => api.delete(`/discounts/${id}`),
  getPromoCodes: () => api.get('/discounts/promo-codes'),
  createPromoCode: (data) => api.post('/discounts/promo-codes', data),
  validatePromo: (data) => api.post('/discounts/validate-promo', data),
};

// Inventory / Stock Ledger
export const inventoryAPI = {
  getLedger: (productId, params) => api.get(`/inventory/ledger/${productId}`, { params }),
  getMovements: (params) => api.get('/inventory/movements', { params }),
  adjust: (data) => api.post('/inventory/adjust', data),
  getSummary: () => api.get('/inventory/summary'),
};

// Profit/Loss Reports
export const reportsAPI_extended = {
  profitLoss: (params) => api.get('/reports/profit-loss', { params }),
};

// Audit Logs
export const auditAPI = {
  getAll: (params) => api.get('/audit-logs', { params }),
};

export default api;
