import { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../../utils/api';
import './AnalyticsPage.css';

const NEON = ['#00D9FF', '#7B61FF', '#FF2D78', '#00FF94', '#FFB800'];
const CustomTooltip = ({ active, payload, label }) => active && payload?.length ? (
  <div style={{ background: 'rgba(12,12,22,0.97)', border: '1px solid rgba(0,217,255,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: '0.85rem' }}>
    <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
    {payload.map((p, i) => <p key={i} style={{ color: p.color, fontWeight: 700 }}>{p.name}: {typeof p.value === 'number' && p.name?.toLowerCase().includes('revenue') ? `₹${p.value.toLocaleString('en-IN')}` : p.value}</p>)}
  </div>
) : null;

export default function AnalyticsPage() {
  const [revenue, setRevenue] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard/revenue'),
      api.get('/admin/dashboard/analytics'),
    ]).then(([r, a]) => { setRevenue(r.data.data || []); setAnalytics(a.data.data || {}); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const orderStatusData = analytics?.orderStatusDistribution || [];
  const topProducts = analytics?.topProducts || [];
  const userGrowth = analytics?.userGrowth || [];

  if (loading) return <div className="admin-page"><div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner spinner-lg" /></div></div>;

  return (
    <div className="admin-page">
      <div className="admin-ph"><div><h1 className="admin-ph__title">Analytics</h1><p className="admin-ph__sub">Platform performance overview</p></div></div>

      {/* Revenue Chart */}
      <div className="analytics-card glass">
        <h3 className="analytics-card__title">Revenue (Last 12 Months)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={revenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00D9FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00D9FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
            <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#00D9FF" fill="url(#revenueGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="analytics-grid2">
        {/* Order Status Pie */}
        <div className="analytics-card glass">
          <h3 className="analytics-card__title">Order Status Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={orderStatusData} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {orderStatusData.map((_, i) => <Cell key={i} fill={NEON[i % NEON.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth Bar */}
        <div className="analytics-card glass">
          <h3 className="analytics-card__title">User Growth</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={userGrowth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="New Users" fill="#7B61FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      {topProducts.length > 0 && (
        <div className="analytics-card glass">
          <h3 className="analytics-card__title">Top Selling Products</h3>
          <table className="admin-table">
            <thead><tr><th>#</th><th>Product</th><th>Units Sold</th><th>Revenue</th></tr></thead>
            <tbody>
              {topProducts.slice(0, 5).map((p, i) => (
                <tr key={p.id}>
                  <td><span style={{ fontFamily: 'var(--font-heading)', color: NEON[i], fontWeight: 800 }}>#{i + 1}</span></td>
                  <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</td>
                  <td><span className="badge badge-blue">{p.sold || 0}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--neon-green)' }}>₹{(p.revenue || 0).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
