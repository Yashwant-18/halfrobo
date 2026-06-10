import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  FiUsers, FiPackage, FiShoppingCart, FiDollarSign,
  FiTrendingUp, FiTrendingDown, FiPlus, FiList,
  FiRefreshCw, FiArrowRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

const STATUS_BADGE = {
  pending:    { cls: 'badge-yellow', label: 'Pending' },
  processing: { cls: 'badge-blue',   label: 'Processing' },
  shipped:    { cls: 'badge-purple', label: 'Shipped' },
  delivered:  { cls: 'badge-green',  label: 'Delivered' },
  cancelled:  { cls: 'badge-pink',   label: 'Cancelled' },
};

const FALLBACK_STATS = {
  totalUsers: 1284,
  totalProducts: 312,
  totalOrders: 4871,
  totalRevenue: 892450,
};

const FALLBACK_REVENUE = [
  { month: 'Jan', revenue: 62000, orders: 310 },
  { month: 'Feb', revenue: 75000, orders: 390 },
  { month: 'Mar', revenue: 68000, orders: 345 },
  { month: 'Apr', revenue: 91000, orders: 470 },
  { month: 'May', revenue: 85000, orders: 430 },
  { month: 'Jun', revenue: 104000, orders: 520 },
  { month: 'Jul', revenue: 118000, orders: 600 },
  { month: 'Aug', revenue: 97000, orders: 490 },
  { month: 'Sep', revenue: 112000, orders: 560 },
  { month: 'Oct', revenue: 128000, orders: 640 },
  { month: 'Nov', revenue: 143000, orders: 720 },
  { month: 'Dec', revenue: 156000, orders: 790 },
];

const FALLBACK_ORDERS = [
  { _id: '1', order_number: 'HR-0001', user_name: 'Alex Chen', total: 2499, status: 'delivered', createdAt: '2026-05-25T10:00:00Z' },
  { _id: '2', order_number: 'HR-0002', user_name: 'Sarah Kim',  total: 899,  status: 'processing', createdAt: '2026-05-26T11:30:00Z' },
  { _id: '3', order_number: 'HR-0003', user_name: 'Mike Ross',  total: 3299, status: 'shipped',    createdAt: '2026-05-26T14:00:00Z' },
  { _id: '4', order_number: 'HR-0004', user_name: 'Emma Lin',   total: 599,  status: 'pending',    createdAt: '2026-05-27T08:15:00Z' },
  { _id: '5', order_number: 'HR-0005', user_name: 'David Park', total: 1799, status: 'delivered',  createdAt: '2026-05-27T09:45:00Z' },
];

const STAT_CONFIGS = [
  { key: 'totalUsers',    label: 'Total Users',    icon: FiUsers,        change: '+12%', up: true,  color: 'blue',   format: (v) => (v ?? 0).toLocaleString('en-IN') },
  { key: 'totalProducts', label: 'Total Products', icon: FiPackage,      change: '+8%',  up: true,  color: 'purple', format: (v) => (v ?? 0).toLocaleString('en-IN') },
  { key: 'totalOrders',   label: 'Total Orders',   icon: FiShoppingCart, change: '+21%', up: true,  color: 'pink',   format: (v) => (v ?? 0).toLocaleString('en-IN') },
  { key: 'totalRevenue',  label: 'Total Revenue',  icon: FiDollarSign,   change: '+15%', up: true,  color: 'green',  format: (v) => `₹${((v ?? 0) / 1000).toFixed(1)}k` },
];

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="adash-chart-tooltip">
        <p className="adash-chart-tooltip__label">{label}</p>
        <p className="adash-chart-tooltip__value">
          Revenue: <span>₹{payload[0]?.value?.toLocaleString('en-IN')}</span>
        </p>
        {payload[1] && (
          <p className="adash-chart-tooltip__value">
            Orders: <span>{payload[1]?.value}</span>
          </p>
        )}
      </div>
    );
  }
  return null;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]           = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const [statsRes, revenueRes] = await Promise.allSettled([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/dashboard/revenue'),
      ]);

      const s = statsRes.status === 'fulfilled'
        ? (statsRes.value.data?.data || statsRes.value.data || FALLBACK_STATS)
        : FALLBACK_STATS;
      setStats(s);

      const rData = revenueRes.status === 'fulfilled'
        ? (revenueRes.value.data?.data || revenueRes.value.data || FALLBACK_REVENUE)
        : FALLBACK_REVENUE;
      setRevenueData(Array.isArray(rData) ? rData : FALLBACK_REVENUE);

      // Recent orders usually come nested in stats or a separate orders endpoint
      const orders = s?.recentOrders || FALLBACK_ORDERS;
      setRecentOrders(orders);

      if (showRefreshing) toast.success('Dashboard refreshed');
    } catch (err) {
      setStats(FALLBACK_STATS);
      setRevenueData(FALLBACK_REVENUE);
      setRecentOrders(FALLBACK_ORDERS);
      if (showRefreshing) toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  if (loading) {
    return (
      <div className="adash-loading">
        <div className="spinner spinner-lg" />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  return (
    <motion.div
      className="adash"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Header ── */}
      <motion.div className="adash-header" variants={itemVariants}>
        <div>
          <h1 className="adash-header__title">Dashboard</h1>
          <p className="adash-header__sub">
            Welcome back, <span>{user?.name || 'Admin'}</span> — here's what's happening.
          </p>
        </div>
        <div className="adash-header__actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <FiRefreshCw className={refreshing ? 'spin' : ''} />
            Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/products')}>
            <FiPlus /> Add Product
          </button>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="adash-stats">
        {STAT_CONFIGS.map((cfg) => {
          const Icon = cfg.icon;
          const val  = stats?.[cfg.key] ?? 0;
          return (
            <motion.div
              key={cfg.key}
              className={`adash-stat-card adash-stat-card--${cfg.color}`}
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="adash-stat-card__top">
                <div className={`adash-stat-card__icon adash-stat-card__icon--${cfg.color}`}>
                  <Icon size={22} />
                </div>
                <div className={`adash-stat-card__change ${cfg.up ? 'up' : 'down'}`}>
                  {cfg.up ? <FiTrendingUp size={13} /> : <FiTrendingDown size={13} />}
                  {cfg.change}
                </div>
              </div>
              <div className="adash-stat-card__value">{cfg.format(val)}</div>
              <div className="adash-stat-card__label">{cfg.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Revenue Chart ── */}
      <motion.div className="adash-chart-card glass" variants={itemVariants}>
        <div className="adash-chart-card__header">
          <div>
            <h2 className="adash-chart-card__title">Revenue Overview</h2>
            <p className="adash-chart-card__sub">Monthly revenue & order trends</p>
          </div>
        </div>
        <div className="adash-chart-wrap">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00D9FF" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00D9FF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7B61FF" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#7B61FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="month"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#00D9FF"
                strokeWidth={2.5}
                fill="url(#revenueGrad)"
                dot={false}
                activeDot={{ r: 5, fill: '#00D9FF', stroke: '#0a0a0a', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="orders"
                stroke="#7B61FF"
                strokeWidth={2}
                fill="url(#ordersGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#7B61FF', stroke: '#0a0a0a', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="adash-chart-legend">
          <span className="adash-chart-legend__item adash-chart-legend__item--blue">Revenue</span>
          <span className="adash-chart-legend__item adash-chart-legend__item--purple">Orders</span>
        </div>
      </motion.div>

      {/* ── Recent Orders ── */}
      <motion.div className="adash-orders-card glass" variants={itemVariants}>
        <div className="adash-orders-card__header">
          <div>
            <h2 className="adash-orders-card__title">Recent Orders</h2>
            <p className="adash-orders-card__sub">Latest transactions across the platform</p>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/admin/orders')}
          >
            View All <FiArrowRight size={14} />
          </button>
        </div>

        <div className="adash-table-wrap">
          <table className="adash-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, idx) => {
                const badge = STATUS_BADGE[order.status] || STATUS_BADGE.pending;
                const dateStr = order.created_at || order.createdAt;
                return (
                  <tr key={order.id || order._id || idx}>
                    <td className="adash-table__order-num">#{order.order_number}</td>
                    <td>{order.user_name || order.user?.name || '—'}</td>
                    <td className="adash-table__price">₹{parseFloat(order.total || 0).toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`badge ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td className="adash-table__date">
                      {dateStr ? new Date(dateStr).toLocaleDateString('en-IN', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      }) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Quick Actions ── */}
      <motion.div className="adash-quick-actions" variants={itemVariants}>
        <button className="adash-qa-btn adash-qa-btn--blue" onClick={() => navigate('/admin/products')}>
          <FiPlus size={20} />
          <span>Add Product</span>
          <p>List a new robot or component</p>
        </button>
        <button className="adash-qa-btn adash-qa-btn--purple" onClick={() => navigate('/admin/orders')}>
          <FiList size={20} />
          <span>Manage Orders</span>
          <p>View and update order statuses</p>
        </button>
        <button className="adash-qa-btn adash-qa-btn--pink" onClick={() => navigate('/admin/users')}>
          <FiUsers size={20} />
          <span>Manage Users</span>
          <p>Review and control user accounts</p>
        </button>
      </motion.div>
    </motion.div>
  );
}
