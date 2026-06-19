import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUploadCloud, FiFile, FiX, FiEye, FiCheck, FiClock,
  FiTool, FiSearch, FiChevronDown, FiDownload, FiPackage,
  FiRefreshCw, FiAlertCircle
} from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './Admin3DPrintPage.css';

const STATUS_COLORS = {
  pending:    'badge-yellow',
  reviewing:  'badge-blue',
  printing:   'badge-purple',
  completed:  'badge-green',
  rejected:   'badge-pink',
  cancelled:  'badge-muted',
};

const STATUS_ICONS = {
  pending:   <FiClock size={12} />,
  reviewing: <FiEye size={12} />,
  printing:  <FiTool size={12} />,
  completed: <FiCheck size={12} />,
  rejected:  <FiAlertCircle size={12} />,
  cancelled: <FiX size={12} />,
};

const MATERIALS = ['PLA', 'ABS', 'PETG', 'TPU (Flexible)', 'Resin', 'Nylon', 'ASA', 'HIPS'];
const COLORS_LIST = ['White', 'Black', 'Grey', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Transparent'];
const INFILL_OPTIONS = ['10%', '20%', '30%', '40%', '50%', '60%', '75%', '100% (Solid)'];
const QUALITY_OPTIONS = ['Draft (0.3mm)', 'Standard (0.2mm)', 'Fine (0.1mm)', 'Ultra Fine (0.05mm)'];

export default function Admin3DPrintPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [priceEstimate, setPriceEstimate] = useState('');
  const [tab, setTab] = useState('orders'); // 'orders' | 'guide'

  const load = () => {
    setLoading(true);
    api.get(`/admin/3dprint?search=${search}&status=${statusFilter}&page=${page}&limit=12`)
      .then(r => { setOrders(r.data.data || []); setTotal(r.data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, [search, statusFilter, page]);

  const openDetail = order => {
    setSelected(order);
    setNewStatus(order.status);
    setAdminNote(order.admin_note || '');
    setPriceEstimate(order.price_estimate || '');
    setShowDetail(true);
  };

  const updateOrder = async () => {
    if (!selected) return;
    setUpdatingStatus(true);
    try {
      await api.put(`/admin/3dprint/${selected.id}`, {
        status: newStatus,
        admin_note: adminNote,
        price_estimate: priceEstimate || null,
      });
      toast.success('Order updated successfully!');
      setShowDetail(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const deleteOrder = async id => {
    if (!window.confirm('Delete this 3D print order?')) return;
    try {
      await api.delete(`/admin/3dprint/${id}`);
      toast.success('Order deleted');
      setShowDetail(false);
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-ph">
        <div>
          <h1 className="admin-ph__title">
            <span className="print3d-icon">🖨️</span> 3D Print Orders
          </h1>
          <p className="admin-ph__sub">{total} custom print orders · Manage uploads & production</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={`btn ${tab === 'orders' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('orders')}>Orders</button>
          <button className={`btn ${tab === 'guide' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('guide')}>📋 Guide</button>
          <button className="btn btn-ghost" onClick={load}><FiRefreshCw size={14} /></button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'guide' ? (
          <motion.div key="guide" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass print3d-guide">
            <h2 className="print3d-guide__title">📌 How Custom 3D Printing Works</h2>
            <div className="print3d-guide__grid">
              {[
                { num: '01', title: 'User uploads file', desc: 'Customer uploads an STL, OBJ, or 3MF file and picks material, color, quality, and quantity.', icon: '📁' },
                { num: '02', title: 'Admin reviews order', desc: 'You review the file here, set a price estimate and change status to "Reviewing".', icon: '🔍' },
                { num: '03', title: 'Printing begins', desc: 'Change status to "Printing" when production starts. The user sees a live status update.', icon: '🖨️' },
                { num: '04', title: 'Delivery & complete', desc: 'Mark order "Completed" when shipped. Leave admin notes for any communication.', icon: '📦' },
              ].map(s => (
                <div key={s.num} className="print3d-step">
                  <div className="print3d-step__icon">{s.icon}</div>
                  <div className="print3d-step__num">Step {s.num}</div>
                  <div className="print3d-step__title">{s.title}</div>
                  <div className="print3d-step__desc">{s.desc}</div>
                </div>
              ))}
            </div>
            <div className="print3d-guide__formats">
              <strong>Supported Formats:</strong>
              {['.stl', '.obj', '.3mf', '.step', '.iges'].map(f => <span key={f} className="badge badge-blue" style={{ marginLeft: 6 }}>{f}</span>)}
              &nbsp;· Max file size: <strong>50 MB</strong>
            </div>
          </motion.div>
        ) : (
          <motion.div key="orders" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {/* Filters */}
            <div className="admin-toolbar glass">
              <div style={{ position: 'relative', flex: 1 }}>
                <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search by name, email, order ID..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <select className="form-select" style={{ width: 160 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="">All Statuses</option>
                {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>

            {/* Stats Row */}
            <div className="print3d-stats">
              {[
                { label: 'Total', value: total, cls: 'badge-blue' },
                { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, cls: 'badge-yellow' },
                { label: 'Printing', value: orders.filter(o => o.status === 'printing').length, cls: 'badge-purple' },
                { label: 'Completed', value: orders.filter(o => o.status === 'completed').length, cls: 'badge-green' },
              ].map(s => (
                <div key={s.label} className={`print3d-stat glass`}>
                  <div className={`print3d-stat__val badge ${s.cls}`}>{s.value}</div>
                  <div className="print3d-stat__label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Orders Grid */}
            {loading ? (
              <div className="print3d-grid">
                {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }} />)}
              </div>
            ) : orders.length === 0 ? (
              <div className="admin-table__empty glass" style={{ borderRadius: 16, padding: 60 }}>
                <div style={{ fontSize: 2.5 + 'rem', marginBottom: 12 }}>🖨️</div>
                No 3D print orders found
              </div>
            ) : (
              <div className="print3d-grid">
                {orders.map(order => (
                  <motion.div key={order.id} className="print3d-card glass" whileHover={{ y: -3, scale: 1.01 }} onClick={() => openDetail(order)}>
                    <div className="print3d-card__header">
                      <div className="print3d-card__id">#{order.id?.slice(-6).toUpperCase()}</div>
                      <span className={`badge ${STATUS_COLORS[order.status] || 'badge-muted'}`}>
                        {STATUS_ICONS[order.status]} &nbsp;{order.status}
                      </span>
                    </div>
                    <div className="print3d-card__user">
                      <div className="print3d-card__avatar">{order.user_name?.[0]?.toUpperCase() || '?'}</div>
                      <div>
                        <div className="print3d-card__name">{order.user_name || 'Unknown'}</div>
                        <div className="print3d-card__email">{order.user_email || ''}</div>
                      </div>
                    </div>
                    <div className="print3d-card__file">
                      <FiFile size={13} /> {order.file_name || 'model.stl'}
                    </div>
                    <div className="print3d-card__meta">
                      <span className="badge badge-muted">{order.material || 'PLA'}</span>
                      <span className="badge badge-muted">{order.color || '—'}</span>
                      <span className="badge badge-muted">×{order.quantity || 1}</span>
                      {order.price_estimate && <span className="badge badge-green">₹{order.price_estimate}</span>}
                    </div>
                    <div className="print3d-card__date">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            <div className="admin-pagination">
              <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>Page {page}</span>
              <button className="btn btn-ghost btn-sm" disabled={orders.length < 12} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {showDetail && selected && (
          <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDetail(false)}>
            <motion.div className="admin-modal glass print3d-modal" onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="admin-modal__header">
                <h2 className="admin-modal__title">🖨️ Order #{selected.id?.slice(-6).toUpperCase()}</h2>
                <button className="admin-modal__close" onClick={() => setShowDetail(false)}><FiX /></button>
              </div>
              <div className="admin-modal__body">
                {/* Customer */}
                <div className="pm-section-label">👤 Customer</div>
                <div className="print3d-detail-grid">
                  <div><span className="print3d-detail-lbl">Name</span><span>{selected.user_name}</span></div>
                  <div><span className="print3d-detail-lbl">Email</span><span>{selected.user_email}</span></div>
                  <div><span className="print3d-detail-lbl">Phone</span><span>{selected.phone || '—'}</span></div>
                  <div><span className="print3d-detail-lbl">Submitted</span><span>{new Date(selected.created_at).toLocaleString('en-IN')}</span></div>
                </div>

                {/* File */}
                <div className="pm-section-label">📁 Model File</div>
                <div className="print3d-file-box">
                  <FiFile size={24} style={{ color: 'var(--neon-blue)' }} />
                  <div>
                    <div className="print3d-file-name">{selected.file_name}</div>
                    <div className="print3d-file-size">{selected.file_size ? (selected.file_size / 1024 / 1024).toFixed(2) + ' MB' : ''}</div>
                  </div>
                  {selected.file_url && (
                    <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${selected.file_url}`} download className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>
                      <FiDownload size={14} /> Download
                    </a>
                  )}
                </div>

                {/* Print Specs */}
                <div className="pm-section-label">⚙️ Print Specifications</div>
                <div className="print3d-detail-grid">
                  <div><span className="print3d-detail-lbl">Material</span><span className="badge badge-blue">{selected.material}</span></div>
                  <div><span className="print3d-detail-lbl">Color</span><span>{selected.color}</span></div>
                  <div><span className="print3d-detail-lbl">Quality</span><span>{selected.quality}</span></div>
                  <div><span className="print3d-detail-lbl">Infill</span><span>{selected.infill}</span></div>
                  <div><span className="print3d-detail-lbl">Quantity</span><span>×{selected.quantity}</span></div>
                  <div><span className="print3d-detail-lbl">Supports</span><span>{selected.supports ? '✅ Yes' : '❌ No'}</span></div>
                </div>
                {selected.special_instructions && (
                  <div className="print3d-note-box">{selected.special_instructions}</div>
                )}

                {/* Admin Panel */}
                <div className="pm-section-label">🔧 Admin Controls</div>
                <div className="admin-modal__grid2">
                  <div className="form-group">
                    <label className="form-label">Update Status</label>
                    <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                      {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price Estimate (₹)</label>
                    <input className="form-input" type="number" value={priceEstimate} onChange={e => setPriceEstimate(e.target.value)} placeholder="Quote price for customer" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Admin Note (visible to customer)</label>
                  <textarea className="form-input" rows={3} value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Add notes, estimated timeline, or rejection reason..." style={{ resize: 'vertical' }} />
                </div>
              </div>
              <div className="admin-modal__footer">
                <button className="btn btn-ghost" style={{ color: 'var(--neon-pink)', marginRight: 'auto' }} onClick={() => deleteOrder(selected.id)}>
                  <FiX size={14} /> Delete Order
                </button>
                <button className="btn btn-ghost" onClick={() => setShowDetail(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={updateOrder} disabled={updatingStatus}>
                  {updatingStatus ? 'Updating...' : '✓ Update Order'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
