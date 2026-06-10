import axios from 'axios';

// Production: use Render backend directly
// Development: Vite proxy handles /api → localhost:5000
const RENDER_URL = 'https://halfrobo-api.onrender.com';

const isProduction = import.meta.env.PROD;

const api = axios.create({
  baseURL: isProduction ? `${RENDER_URL}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('halfrobo_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

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
          ? '/admin/login' : '/login';
        window.location.href = dest;
      }
    }
    return Promise.reject(err);
  }
);

export default api;
