import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiZap } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './LoginPage.css';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! 👋`);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__bg">
        <div className="auth-page__grid" />
        <div className="auth-page__glow auth-page__glow--1" />
        <div className="auth-page__glow auth-page__glow--2" />
      </div>

      <div className="auth-page__inner">
        {/* Left Brand Panel */}
        <motion.div className="auth-brand" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
          <Link to="/" className="auth-brand__logo">
            <span className="auth-brand__logo-icon">⬡</span>
            <span className="auth-brand__logo-text">Half<span className="text-gradient">Robo</span></span>
          </Link>
          <div className="auth-brand__robot animate-float">🤖</div>
          <h2 className="auth-brand__title">Welcome to the Future</h2>
          <p className="auth-brand__subtitle">AI-powered robotics & IoT devices that redefine what's possible. Join 50,000+ innovators worldwide.</p>
          <div className="auth-brand__stats">
            {['50K+ Customers', '4.9★ Rating', '45+ Countries'].map(s => (
              <div key={s} className="auth-brand__stat glass">{s}</div>
            ))}
          </div>
        </motion.div>

        {/* Right Form Panel */}
        <motion.div className="auth-card glass" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
          <div className="auth-card__header">
            <h1 className="heading-lg">Sign In</h1>
            <p className="text-secondary" style={{ marginTop: 8, fontSize: '0.9rem' }}>Enter your credentials to access your account</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="auth-input-wrap">
                <FiMail className="auth-input-icon" size={16} />
                <input type="email" className="form-input auth-input" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="auth-input-wrap">
                <FiLock className="auth-input-icon" size={16} />
                <input type={showPass ? 'text' : 'password'} className="form-input auth-input" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" className="auth-input-toggle" onClick={() => setShowPass(!showPass)}>{showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}</button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary full-width btn-lg" disabled={loading}>
              {loading ? <><span className="spinner" /> Signing in...</> : <><FiZap /> Sign In</>}
            </button>
          </form>

          <div className="auth-card__footer">
            <p className="text-secondary" style={{ fontSize: '0.9rem', textAlign: 'center' }}>
              Don't have an account? <Link to="/register" className="auth-card__link">Create one</Link>
            </p>
            <p style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: 16, color: 'var(--text-muted)' }}>
              Admin? <Link to="/admin/login" className="auth-card__link auth-card__link--purple">Admin Portal →</Link>
            </p>
          </div>

          <div className="auth-card__demo">
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>Demo credentials:</p>
            <code style={{ fontSize: '0.78rem', color: 'var(--neon-blue)' }}>demo@halfrobo.com / demo123</code>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
