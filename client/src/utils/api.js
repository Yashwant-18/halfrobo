import axios from 'axios';

// In production (Vercel), VITE_API_URL is set to the Render backend URL.
// In development, Vite proxy handles /api → localhost:5000 automatically.
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('halfrobo_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isLoginAttempt = err.config?.url?.includes('/auth/login');
      const isLoginPage    = window.location.pathname.includes('/login');
      if (!isLoginAttempt && !isLoginPage) {
        localStorage.removeItem('halfrobo_token');
        localStorage.removeItem('halfrobo_user');
        const dest = window.location.pathname.startsWith('/admin')
          ? '/admin/login'
          : '/login';
        window.location.href = dest;
      }
    }
    return Promise.reject(err);
  }
);

export default api;
