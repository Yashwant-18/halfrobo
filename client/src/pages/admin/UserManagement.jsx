import { useState, useEffect } from 'react';
import { FiSearch, FiTrash2, FiUser, FiShield, FiShieldOff } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './ProductManagement.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = () => {
    setLoading(true);
    api.get(`/admin/users?search=${search}&page=${page}&limit=15`).then(r => { setUsers(r.data.data || []); setTotal(r.data.total || 0); }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, [search, page]);

  const toggleBlock = async (id, blocked) => {
    try { await api.put(`/admin/users/${id}/block`); toast.success(blocked ? 'User unblocked' : 'User blocked'); load(); } catch { toast.error('Failed'); }
  };
  const deleteUser = async id => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    try { await api.delete(`/admin/users/${id}`); toast.success('User deleted'); load(); } catch { toast.error('Failed'); }
  };

  return (
    <div className="admin-page">
      <div className="admin-ph"><div><h1 className="admin-ph__title">Users</h1><p className="admin-ph__sub">{total} registered users</p></div></div>
      <div className="admin-toolbar glass">
        <div style={{ position: 'relative', flex: 1 }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search users by name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>
      <div className="admin-table-wrap glass">
        <table className="admin-table">
          <thead><tr><th>User</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={7}><div className="skeleton" style={{ height: 48, margin: '4px 0' }} /></td></tr>)
              : users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>{u.name?.[0]}</div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.phone || '—'}</td>
                  <td><span className={`badge ${u.role === 'admin' ? 'badge-purple' : 'badge-blue'}`}>{u.role}</span></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                  <td><span className={`badge ${u.is_blocked ? 'badge-pink' : 'badge-green'}`}>{u.is_blocked ? 'Blocked' : 'Active'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" title={u.is_blocked ? 'Unblock' : 'Block'} onClick={() => toggleBlock(u.id, u.is_blocked)} style={{ color: u.is_blocked ? 'var(--neon-green)' : 'var(--neon-pink)' }}>
                        {u.is_blocked ? <FiShield size={14} /> : <FiShieldOff size={14} />}
                      </button>
                      {u.role !== 'admin' && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--neon-pink)' }} onClick={() => deleteUser(u.id)}><FiTrash2 size={14} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {!loading && users.length === 0 && <div className="admin-table__empty">No users found</div>}
      </div>
      <div className="admin-pagination">
        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p-1)}>← Prev</button>
        <span className="text-muted" style={{ fontSize: '0.85rem' }}>Page {page}</span>
        <button className="btn btn-ghost btn-sm" disabled={users.length < 15} onClick={() => setPage(p => p+1)}>Next →</button>
      </div>
    </div>
  );
}
