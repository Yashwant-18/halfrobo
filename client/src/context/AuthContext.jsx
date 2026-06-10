import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('halfrobo_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('halfrobo_token');
    if (token) {
      api.get('/auth/me').then(r => {
        setUser(r.data.data);
        localStorage.setItem('halfrobo_user', JSON.stringify(r.data.data));
      }).catch(() => {
        localStorage.removeItem('halfrobo_token');
        localStorage.removeItem('halfrobo_user');
        setUser(null);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user, token } = res.data.data;
    localStorage.setItem('halfrobo_token', token);
    localStorage.setItem('halfrobo_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const adminLogin = async (email, password) => {
    const res = await api.post('/auth/admin/login', { email, password });
    const { user, token } = res.data.data;
    localStorage.setItem('halfrobo_token', token);
    localStorage.setItem('halfrobo_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    const { user, token } = res.data.data;
    localStorage.setItem('halfrobo_token', token);
    localStorage.setItem('halfrobo_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('halfrobo_token');
    localStorage.removeItem('halfrobo_user');
    setUser(null);
    toast.success('Logged out successfully');
    window.location.href = '/';
  };

  const updateUser = (updated) => {
    setUser(updated);
    localStorage.setItem('halfrobo_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, adminLogin, register, logout, updateUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
