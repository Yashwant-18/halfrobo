import { useState, useEffect } from 'react';
import { FiSearch, FiStar, FiCheck, FiX, FiTrash2 } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './ProductManagement.css';

const STATUS_TABS = ['all', 'pending', 'approved', 'rejected'];

export default function ReviewManagement() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 15, ...(statusFilter !== 'all' && { status: statusFilter }) });
    api.get(`/admin/reviews?${params}`).then(r => { setReviews(r.data.data || []); setTotal(r.data.total || 0); }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, [statusFilter, page]);

  const updateStatus = async (id, status) => {
    try { await api.put(`/admin/reviews/${id}/status`, { status }); toast.success(`Review ${status}`); load(); } catch { toast.error('Failed'); }
  };
  const deleteReview = async id => {
    if (!window.confirm('Delete review?')) return;
    try { await api.delete(`/admin/reviews/${id}`); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  return (
    <div className="admin-page">
      <div className="admin-ph"><div><h1 className="admin-ph__title">Reviews</h1><p className="admin-ph__sub">{total} total reviews</p></div></div>
      <div style={{ display: 'flex', gap: 8 }}>
        {STATUS_TABS.map(s => <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setStatusFilter(s); setPage(1); }} style={{ textTransform: 'capitalize' }}>{s === 'all' ? 'All' : s}</button>)}
      </div>
      <div className="admin-table-wrap glass">
        <table className="admin-table">
          <thead><tr><th>User</th><th>Product</th><th>Rating</th><th>Comment</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7}><div className="skeleton" style={{ height: 48 }} /></td></tr>)
              : reviews.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.user_name || '—'}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.product_name || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(s => <FiStar key={s} size={13} className={s <= r.rating ? 'star--filled' : 'star--empty'} />)}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.comment || '—'}</td>
                  <td><span className={`badge ${r.status === 'approved' ? 'badge-green' : r.status === 'rejected' ? 'badge-pink' : 'badge-yellow'}`}>{r.status}</span></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {r.status !== 'approved' && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--neon-green)' }} title="Approve" onClick={() => updateStatus(r.id, 'approved')}><FiCheck size={14} /></button>}
                      {r.status !== 'rejected' && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-muted)' }} title="Reject" onClick={() => updateStatus(r.id, 'rejected')}><FiX size={14} /></button>}
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--neon-pink)' }} onClick={() => deleteReview(r.id)}><FiTrash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {!loading && reviews.length === 0 && <div className="admin-table__empty">No reviews found</div>}
      </div>
      <div className="admin-pagination">
        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p-1)}>← Prev</button>
        <span className="text-muted" style={{ fontSize: '0.85rem' }}>Page {page}</span>
        <button className="btn btn-ghost btn-sm" disabled={reviews.length < 15} onClick={() => setPage(p => p+1)}>Next →</button>
      </div>
    </div>
  );
}
