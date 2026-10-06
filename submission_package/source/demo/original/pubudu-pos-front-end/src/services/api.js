import axios from 'axios';
import { API_BASE_URL } from '../constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/login', credentials),
  register: (userData) => api.post('/register', userData),
  getMe: () => api.get('/me'),
  logout: () => api.post('/logout'),
};

export const categoryAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const brandAPI = {
  getAll: () => api.get('/brands'),
  create: (data) => api.post('/brands', data),
  update: (id, data) => api.put(`/brands/${id}`, data),
  delete: (id) => api.delete(`/brands/${id}`),
};

export const productAPI = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  getStock: (productCode) => api.get(`/products/${productCode}/stock`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const customerAPI = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  search: (query) => api.get(`/customers/search?q=${query}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
};

export const grnAPI = {
  getAll: () => api.get('/grns'),
  getById: (id) => api.get(`/grns/${id}`),
  getByCode: (code) => api.get(`/grns/code/${code}`),
  getStock: () => api.get('/grns/stock'),
  getProductBatches: (productCode) => api.get(`/grns/product/${productCode}/batches`),
  create: (data) => api.post('/grns', data),
};

export const invoiceAPI = {
  getAll: () => api.get('/invoices'),
  getById: (id) => api.get(`/invoices/${id}`),
  getByInvoiceNo: (invoiceNo) => api.get(`/invoices/invoice-no/${invoiceNo}`),
  getToday: () => api.get('/invoices/today'),
  getMonthly: (month, year) => api.get(`/invoices/monthly?month=${month}&year=${year}`),
  print: (invoiceNo) => api.get(`/invoices/print/${invoiceNo}`),
  create: (data) => api.post('/invoices', data),
  cancel: (id) => api.put(`/invoices/${id}`, { type: 'cancel' }),
};

export const discountAPI = {
  getAll: (status) => api.get(`/discount-requests${status ? `?status=${status}` : ''}`),
  getById: (id) => api.get(`/discount-requests/${id}`),
  getPendingCount: () => api.get('/discount-requests/pending-count'),
  create: (data) => api.post('/discount-requests', data),
  approve: (id, data) => api.post(`/discount-requests/${id}/approve`, data),
  reject: (id, data) => api.post(`/discount-requests/${id}/reject`, data),
};

export const reportAPI = {
  dailyProfit: (date) => api.get(`/reports/daily-profit?date=${date}`),
  monthlyProfit: (month, year) => api.get(`/reports/monthly-profit?month=${month}&year=${year}`),
  dailySales: (date) => api.get(`/reports/daily-sales?date=${date}`),
  stockSummary: () => api.get('/reports/stock-summary'),
  topSelling: (startDate, endDate, limit = 10) => 
    api.get(`/reports/top-selling-products?start_date=${startDate}&end_date=${endDate}&limit=${limit}`),
  dashboardSummary: () => api.get('/reports/dashboard-summary'),
};

export default api;
