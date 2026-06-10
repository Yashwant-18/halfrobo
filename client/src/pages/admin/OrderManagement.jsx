import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiEye, FiTrash2, FiX, FiChevronDown } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './ProductManagement.css';

const STATUSES = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLORS = { pending: 'badge-yellow', processing: 'badge-blue', shipped: 'badge-purple', delivered: 'badge-green', cancelled: 'badge-pink' };

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 10, ...(search && { search }), ...(status !== 'all' && { status }) });
    api.get(`/admin/orders?${params}`).then(r => { setOrders(r.data.data || []); setTotal(r.data.total || 0); }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, [search, status, page]);

  const updateStatus = async (id, newStatus) => {
    try { await api.put(`/admin/orders/${id}/status`, { status: newStatus }); toast.success('Status updated'); load(); } catch { toast.error('Failed'); }
  };

  const deleteOrder = async id => {
    if (!window.confirm('Delete this order?')) return;
    try { await api.delete(`/admin/orders/${id}`); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  return (
    <div className="admin-page">
      <div className="admin-ph"><div><h1 className="admin-ph__title">Orders</h1><p className="admin-ph__sub">{total} orders total</p></div></div>

      {/* Status Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {STATUSES.map(s => <button key={s} className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setStatus(s); setPage(1); }} style={{ textTransform: 'capitalize' }}>{s === 'all' ? 'All Orders' : s}</button>)}
      </div>

      <div className="admin-toolbar glass">
        <div style={{ position: 'relative', flex: 1 }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search by order number..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div className="admin-table-wrap glass">
        <table className="admin-table">
          <thead><tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7}><div className="skeleton" style={{ height: 48, margin: '4px 0' }} /></td></tr>)
              : orders.map(o => (
                <tr key={o.id}>
                  <td><span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--neon-blue)', fontSize: '0.85rem' }}>#{o.order_number}</span></td>
                  <td><div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{o.user_name || 'Unknown'}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.user_email}</div></td>
                  <td>{Array.isArray(o.items) ? o.items.length : '—'}</td>
                  <td style={{ fontWeight: 700 }}>₹{parseFloat(o.total).toLocaleString('en-IN')}</td>
                  <td>
                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <select className="form-select" style={{ fontSize: '0.75rem', padding: '4px 8px', width: 'auto' }} value={o.status} onChange={e => updateStatus(o.id, e.target.value)}>
                        {['pending','processing','shipped','delivered','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelected(o)}><FiEye size={14} /></button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--neon-pink)' }} onClick={() => deleteOrder(o.id)}><FiTrash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {!loading && orders.length === 0 && <div className="admin-table__empty">No orders found</div>}
      </div>

      <div className="admin-pagination">
        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p-1)}>← Prev</button>
        <span className="text-muted" style={{ fontSize: '0.85rem' }}>Page {page}</span>
        <button className="btn btn-ghost btn-sm" disabled={orders.length < 10} onClick={() => setPage(p => p+1)}>Next →</button>
      </div>

      {/* Order Detail Modal */}
      {selected && (
        <div className="admin-modal-overlay" onClick={() => setSelected(null)}>
          <motion.div className="admin-modal glass" onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">Order #{selected.order_number}</h2>
              <button className="admin-modal__close" onClick={() => setSelected(null)}><FiX /></button>
            </div>
            <div className="admin-modal__body">
              <div className="admin-modal__grid2">
                <div><p className="form-label">Customer</p><p>{selected.user_name}</p></div>
                <div><p className="form-label">Status</p><span className={`badge ${STATUS_COLORS[selected.status] || 'badge-muted'}`}>{selected.status}</span></div>
                <div><p className="form-label">Total</p><p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--neon-blue)' }}>₹{parseFloat(selected.total).toLocaleString('en-IN')}</p></div>
                <div><p className="form-label">Payment</p><p>{selected.payment_method?.replace('_', ' ')}</p></div>
              </div>
              {selected.shipping_address && (
                <div><p className="form-label">Shipping Address</p>
                  <div style={{ padding: 12, background: 'var(--glass-bg)', borderRadius: 8, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {selected.shipping_address.name}<br/>{selected.shipping_address.address_line1}, {selected.shipping_address.city}, {selected.shipping_address.state} {selected.shipping_address.zip}
                  </div>
                </div>
              )}
              {Array.isArray(selected.items) && (
                <div><p className="form-label">Items ({selected.items.length})</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selected.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--glass-bg)', borderRadius: 8, fontSize: '0.875rem' }}>
                        <span>{item.name} × {item.quantity}</span>
                        <span style={{ fontWeight: 700 }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="admin-modal__footer"><button className="btn btn-ghost" onClick={() => setSelected(null)}>Close</button></div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
