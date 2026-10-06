import axios from 'axios';

import { clearAllAppStorage, getAuthToken } from '@/lib/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,

  headers: {
    'Content-Type': 'application/json',
  },

  // V-16: a request that never times out holds a spinner on the till forever
  // and gives an attacker a cheap way to tie up the browser's connection pool.
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // V-16: was localStorage.getItem('authToken') read inline here. The token
    // now lives in memory (with a per-tab sessionStorage mirror) behind the
    // accessors in @/lib/auth, so there is exactly one place that knows where
    // it is kept.
    const token = getAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // V-16: the old handler removed only 'authToken' and 'user', leaving
      // invoice drafts, GRN drafts with cost prices and the cached service
      // catalogue behind for the next person to use the terminal.
      clearAllAppStorage();

      // Avoid a redirect loop when the 401 came from the login request itself.
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
