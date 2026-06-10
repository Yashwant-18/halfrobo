import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiZap } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './LoginPage.css';

function StrengthBar({ password }) {
  const score = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 && /[A-Z]/.test(password) ? 2 : 3;
  const labels = ['', 'Weak', 'Medium', 'Strong'];
  const colors = ['', 'var(--neon-pink)', '#FFB800', 'var(--neon-green)'];
  return password ? (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= score ? colors[score] : 'var(--glass-border)', transition: 'all 0.3s' }} />
        ))}
      </div>
      <span style={{ fontSize: '0.75rem', color: colors[score] }}>{labels[score]}</span>
    </div>
  ) : null;
}

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) return toast.error('Please accept the terms & conditions');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      toast.success('Account created! Welcome to HalfRobo 🤖');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="auth-page">
      <div className="auth-page__bg">
        <div className="auth-page__grid" />
        <div className="auth-page__glow auth-page__glow--1" />
        <div className="auth-page__glow auth-page__glow--2" />
      </div>
      <div className="auth-page__inner">
        <motion.div className="auth-brand" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
          <Link to="/" className="auth-brand__logo">
            <span className="auth-brand__logo-icon">⬡</span>
            <span className="auth-brand__logo-text">Half<span className="text-gradient">Robo</span></span>
          </Link>
          <div className="auth-brand__robot animate-float">🦾</div>
          <h2 className="auth-brand__title">Join the Robot Revolution</h2>
          <p className="auth-brand__subtitle">Create your HalfRobo account and get instant access to the world's most advanced AI robotics and IoT marketplace.</p>
          <div className="auth-brand__stats">
            {['Free Shipping > ₹999', '2-Year Warranty', '24/7 Support'].map(s => (
              <div key={s} className="auth-brand__stat glass">{s}</div>
            ))}
          </div>
        </motion.div>
        <motion.div className="auth-card glass" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.1 }}>
          <div className="auth-card__header">
            <h1 className="heading-lg">Create Account</h1>
            <p className="text-secondary" style={{ marginTop: 8, fontSize: '0.9rem' }}>Get started with HalfRobo today</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="auth-input-wrap">
                <FiUser className="auth-input-icon" size={16} />
                <input type="text" className="form-input auth-input" placeholder="Priyanshu Suman" value={form.name} onChange={set('name')} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="auth-input-wrap">
                <FiMail className="auth-input-icon" size={16} />
                <input type="email" className="form-input auth-input" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Phone (optional)</label>
              <div className="auth-input-wrap">
                <FiPhone className="auth-input-icon" size={16} />
                <input type="tel" className="form-input auth-input" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="auth-input-wrap">
                <FiLock className="auth-input-icon" size={16} />
                <input type={showPass ? 'text' : 'password'} className="form-input auth-input" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required />
                <button type="button" className="auth-input-toggle" onClick={() => setShowPass(!showPass)}>{showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}</button>
              </div>
              <StrengthBar password={form.password} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="auth-input-wrap">
                <FiLock className="auth-input-icon" size={16} />
                <input type="password" className="form-input auth-input" placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} required />
              </div>
            </div>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2, accentColor: 'var(--neon-blue)' }} />
              I agree to HalfRobo's <Link to="#" className="auth-card__link" style={{ marginLeft: 4 }}>Terms of Service</Link> and <Link to="#" className="auth-card__link">Privacy Policy</Link>
            </label>
            <button type="submit" className="btn btn-primary full-width btn-lg" disabled={loading}>
              {loading ? <><span className="spinner" /> Creating account...</> : <><FiZap /> Create Account</>}
            </button>
          </form>
          <p className="text-secondary" style={{ fontSize: '0.9rem', textAlign: 'center' }}>
            Already have an account? <Link to="/login" className="auth-card__link">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
