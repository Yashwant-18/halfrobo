import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiPackage, FiHeart, FiMapPin, FiBell, FiEdit2, FiChevronRight, FiLock } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './DashboardPage.css';

const STATUS_COLORS = { pending: '#FFB800', processing: 'var(--neon-blue)', shipped: 'var(--neon-purple)', delivered: 'var(--neon-green)', cancelled: 'var(--neon-pink)' };

const TABS = [
  { key: 'profile', label: 'Profile', icon: FiUser },
  { key: 'orders', label: 'My Orders', icon: FiPackage },
  { key: 'wishlist', label: 'Wishlist', icon: FiHeart },
  { key: 'addresses', label: 'Addresses', icon: FiMapPin },
];

export default function DashboardPage() {
  const { user, loading, logout, updateUser } = useAuth();
  const { cartItems } = useCart();
  const [tab, setTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user) setProfileForm({ name: user.name || '', phone: user.phone || '' }); }, [user]);

  useEffect(() => {
    if (tab === 'orders') {
      setOrdersLoading(true);
      api.get('/orders').then(r => setOrders(r.data.data || [])).catch(() => {}).finally(() => setOrdersLoading(false));
    }
  }, [tab]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><div className="spinner spinner-lg" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const saveProfile = async () => {
    setSaving(true);
    try {
      const r = await api.put('/auth/profile', profileForm);
      updateUser(r.data.data);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); } finally { setSaving(false); }
  };

  return (
    <div className="dashboard page-enter">
      <div className="dashboard__hero">
        <div className="container dashboard__hero-inner">
          <div className="dashboard__avatar">{user.name?.[0]?.toUpperCase()}</div>
          <div>
            <h1 className="dashboard__name">{user.name}</h1>
            <p className="text-secondary" style={{ fontSize: '0.9rem' }}>{user.email}</p>
            <span className="badge badge-blue" style={{ marginTop: 6 }}>{user.role === 'admin' ? '⚡ Administrator' : '👤 Member'}</span>
          </div>
        </div>
      </div>

      <div className="container dashboard__layout">
        {/* Sidebar Tabs */}
        <aside className="dashboard__sidebar glass">
          {TABS.map(t => (
            <button key={t.key} className={`dashboard__tab ${tab === t.key ? 'dashboard__tab--active' : ''}`} onClick={() => setTab(t.key)}>
              <t.icon size={18} /><span>{t.label}</span><FiChevronRight size={14} className="dashboard__tab-arrow" />
            </button>
          ))}
          <div className="dashboard__tab-divider" />
          <button className="dashboard__tab dashboard__tab--danger" onClick={logout}>
            <FiLock size={18} /><span>Sign Out</span>
          </button>
        </aside>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} className="dashboard__content" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>

            {/* PROFILE */}
            {tab === 'profile' && (
              <div className="dash-section">
                <h2 className="dash-section__title">Profile Settings</h2>
                <div className="dash-card glass">
                  <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={user.email} disabled style={{ opacity: 0.5 }} /></div>
                  <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+91 98765 43210" /></div>
                  <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                </div>
                <div className="dash-card glass" style={{ marginTop: 24 }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: 20 }}>Account Stats</h3>
                  <div className="dash-stats">
                    <div className="dash-stat-item"><span className="dash-stat-num">{orders.length || '—'}</span><span className="dash-stat-label">Orders</span></div>
                    <div className="dash-stat-item"><span className="dash-stat-num">{cartItems.length}</span><span className="dash-stat-label">In Cart</span></div>
                    <div className="dash-stat-item"><span className="dash-stat-num">{new Date(user.created_at).getFullYear()}</span><span className="dash-stat-label">Member Since</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* ORDERS */}
            {tab === 'orders' && (
              <div className="dash-section">
                <h2 className="dash-section__title">My Orders</h2>
                {ordersLoading ? <div className="dash-loading"><div className="spinner" /></div>
                  : orders.length === 0 ? (
                    <div className="dash-empty glass"><div style={{ fontSize: '3rem' }}>📦</div><p>No orders yet</p><Link to="/products" className="btn btn-primary" style={{ marginTop: 16 }}>Start Shopping</Link></div>
                  ) : (
                    <div className="dash-orders">
                      {orders.map(o => (
                        <div key={o.id} className="dash-order glass">
                          <div className="dash-order__header" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                            <div>
                              <div className="dash-order__number">#{o.order_number}</div>
                              <div className="dash-order__date text-muted">{new Date(o.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                              <span className="badge" style={{ background: `${STATUS_COLORS[o.status]}22`, color: STATUS_COLORS[o.status], border: `1px solid ${STATUS_COLORS[o.status]}44` }}>{o.status}</span>
                              <span style={{ fontWeight: 700 }}>₹{parseFloat(o.total).toLocaleString('en-IN')}</span>
                              <FiChevronRight size={16} style={{ transform: expanded === o.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text-muted)' }} />
                            </div>
                          </div>
                          {expanded === o.id && (
                            <motion.div className="dash-order__detail" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                              <div className="dash-order__detail-inner">
                                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: 8 }}>Items: {Array.isArray(o.items) ? o.items.length : '—'}</p>
                                <p className="text-muted" style={{ fontSize: '0.85rem' }}>Payment: {o.payment_method?.replace('_', ' ')}</p>
                                {o.estimated_delivery && <p className="text-muted" style={{ fontSize: '0.85rem' }}>Est. Delivery: {new Date(o.estimated_delivery).toLocaleDateString()}</p>}
                              </div>
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}

            {/* WISHLIST */}
            {tab === 'wishlist' && (
              <div className="dash-section">
                <h2 className="dash-section__title">My Wishlist</h2>
                <div className="dash-empty glass"><div style={{ fontSize: '3rem' }}>❤️</div><p>Your wishlist is empty</p><p className="text-muted" style={{ fontSize: '0.85rem', marginTop: 8 }}>Heart products while browsing to save them here</p><Link to="/products" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Products</Link></div>
              </div>
            )}

            {/* ADDRESSES */}
            {tab === 'addresses' && (
              <div className="dash-section">
                <h2 className="dash-section__title">My Addresses</h2>
                <div className="dash-empty glass"><div style={{ fontSize: '3rem' }}>📍</div><p>No saved addresses</p><p className="text-muted" style={{ fontSize: '0.85rem', marginTop: 8 }}>Addresses are saved during checkout</p><Link to="/checkout" className="btn btn-primary" style={{ marginTop: 16 }}>Place an Order</Link></div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
