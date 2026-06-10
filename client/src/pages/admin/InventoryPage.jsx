import { useState, useEffect } from 'react';
import { FiAlertTriangle, FiEdit2, FiCheck } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './ProductManagement.css';

function StockBar({ stock }) {
  const pct = Math.min(100, (stock / 50) * 100);
  const color = stock === 0 ? 'var(--neon-pink)' : stock < 10 ? '#FFB800' : 'var(--neon-green)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--glass-border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: '0.85rem', fontWeight: 700, color, minWidth: 28, textAlign: 'right' }}>{stock}</span>
    </div>
  );
}

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editStock, setEditStock] = useState('');
  const [sortBy, setSortBy] = useState('asc');
  const [lowOnly, setLowOnly] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/admin/inventory').then(r => setProducts(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const saveStock = async (id) => {
    try { await api.put(`/admin/inventory/${id}`, { stock: parseInt(editStock) }); toast.success('Stock updated'); setEditingId(null); load(); } catch { toast.error('Failed'); }
  };

  const low = products.filter(p => p.stock < 10);
  const displayed = products.filter(p => !lowOnly || p.stock < 10).sort((a, b) => sortBy === 'asc' ? a.stock - b.stock : b.stock - a.stock);

  return (
    <div className="admin-page">
      <div className="admin-ph"><div><h1 className="admin-ph__title">Inventory</h1><p className="admin-ph__sub">Track and update product stock levels</p></div></div>

      {low.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'rgba(255,184,0,0.08)', border: '1px solid rgba(255,184,0,0.25)', borderRadius: 12 }}>
          <FiAlertTriangle size={20} style={{ color: '#FFB800', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: '#FFB800', fontSize: '0.9rem' }}>⚠️ Low Stock Alert</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{low.length} products have stock below 10 units.</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', fontSize: '0.875rem' }}>
          <input type="checkbox" checked={lowOnly} onChange={e => setLowOnly(e.target.checked)} style={{ accentColor: '#FFB800' }} /> Show low stock only
        </label>
        <select className="form-select" style={{ width: 'auto', padding: '8px 12px', fontSize: '0.85rem' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="asc">Stock: Low → High</option>
          <option value="desc">Stock: High → Low</option>
        </select>
      </div>

      <div className="admin-table-wrap glass">
        <table className="admin-table">
          <thead><tr><th>Product</th><th>SKU</th><th>Stock Level</th><th>Status</th><th>Update</th></tr></thead>
          <tbody>
            {loading ? [...Array(6)].map((_, i) => <tr key={i}><td colSpan={5}><div className="skeleton" style={{ height: 48 }} /></td></tr>)
              : displayed.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.sku || '—'}</td>
                  <td style={{ width: 220 }}><StockBar stock={p.stock} /></td>
                  <td><span className={`badge ${p.stock === 0 ? 'badge-pink' : p.stock < 10 ? 'badge-yellow' : 'badge-green'}`}>{p.stock === 0 ? 'Out of Stock' : p.stock < 10 ? 'Low Stock' : 'In Stock'}</span></td>
                  <td>
                    {editingId === p.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input type="number" className="form-input" style={{ width: 80, padding: '6px 10px', fontSize: '0.85rem' }} value={editStock} onChange={e => setEditStock(e.target.value)} autoFocus onKeyDown={e => { if (e.key === 'Enter') saveStock(p.id); if (e.key === 'Escape') setEditingId(null); }} />
                        <button className="btn btn-primary btn-sm" onClick={() => saveStock(p.id)}><FiCheck size={13} /></button>
                      </div>
                    ) : (
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditingId(p.id); setEditStock(p.stock); }}><FiEdit2 size={13} /> Edit</button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {!loading && displayed.length === 0 && <div className="admin-table__empty">No products found</div>}
      </div>
    </div>
  );
}
