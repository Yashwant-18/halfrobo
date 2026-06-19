import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiUpload, FiImage, FiStar } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './ProductManagement.css';

const EMPTY = {
  name: '', description: '', price: '', discount_price: '', stock: '', sku: '',
  gtin: '', brand: '', synced_to_meta: false, publish_date: '',
  category_id: '', is_featured: false, is_active: true,
  tags: '', specKey: '', specVal: '', specifications: {},
  existingImages: [], newImages: []
};

function AdminPageHeader({ title, subtitle, action }) {
  return (
    <div className="admin-ph">
      <div><h1 className="admin-ph__title">{title}</h1><p className="admin-ph__sub">{subtitle}</p></div>
      {action}
    </div>
  );
}

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [previews, setPreviews] = useState([]);
  const fileRef = useRef();

  const load = () => {
    setLoading(true);
    api.get(`/admin/products?search=${search}&page=${page}&limit=10`)
      .then(r => { setProducts(r.data.data || []); setTotal(r.data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, [search, page]);
  useEffect(() => { api.get('/categories').then(r => setCategories(r.data.data || [])); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setPreviews([]); setShowModal(true); };
  const openEdit = p => {
    setEditing(p);
    const specs = typeof p.specifications === 'object' ? p.specifications : {};
    setForm({
      name: p.name, description: p.description || '', price: p.price,
      discount_price: p.discount_price || '', stock: p.stock, sku: p.sku || '',
      gtin: p.gtin || '', brand: p.brand || '',
      synced_to_meta: p.synced_to_meta || false,
      publish_date: p.publish_date ? p.publish_date.split('T')[0] : '',
      category_id: p.category_id || '', is_featured: p.is_featured, is_active: p.is_active,
      tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
      specKey: '', specVal: '', specifications: specs,
      existingImages: Array.isArray(p.images) ? p.images : [], newImages: []
    });
    setPreviews([]);
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditing(null); };

  const handleFiles = e => {
    const files = Array.from(e.target.files);
    setForm(f => ({ ...f, newImages: [...f.newImages, ...files] }));
    files.forEach(file => { const r = new FileReader(); r.onload = ev => setPreviews(p => [...p, ev.target.result]); r.readAsDataURL(file); });
  };
  const removeExisting = img => setForm(f => ({ ...f, existingImages: f.existingImages.filter(i => i !== img) }));
  const removeNew = idx => { setForm(f => ({ ...f, newImages: f.newImages.filter((_, i) => i !== idx) })); setPreviews(p => p.filter((_, i) => i !== idx)); };
  const addSpec = () => { if (!form.specKey.trim()) return; setForm(f => ({ ...f, specifications: { ...f.specifications, [f.specKey]: f.specVal }, specKey: '', specVal: '' })); };
  const removeSpec = k => setForm(f => { const s = { ...f.specifications }; delete s[k]; return { ...f, specifications: s }; });

  const handleSave = async () => {
    if (!form.name || !form.price) return toast.error('Name and price are required');
    setSaving(true);
    try {
      const fd = new FormData();
      ['name', 'description', 'price', 'discount_price', 'stock', 'sku', 'category_id', 'gtin', 'brand', 'publish_date'].forEach(k => fd.append(k, form[k]));
      fd.append('is_featured', form.is_featured);
      fd.append('is_active', form.is_active);
      fd.append('synced_to_meta', form.synced_to_meta);
      fd.append('tags', JSON.stringify(form.tags.split(',').map(t => t.trim()).filter(Boolean)));
      fd.append('specifications', JSON.stringify(form.specifications));
      fd.append('existingImages', JSON.stringify(form.existingImages));
      form.newImages.forEach(f => fd.append('images', f));
      if (editing) await api.put(`/admin/products/${editing.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      else await api.post('/admin/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(editing ? 'Product updated!' : 'Product created!');
      closeModal(); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); } finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this product?')) return;
    try { await api.delete(`/admin/products/${id}`); toast.success('Deleted'); load(); } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="admin-page">
      <AdminPageHeader title="Products" subtitle={`${total} products total`}
        action={<button className="btn btn-primary" onClick={openCreate}><FiPlus /> Add Product</button>} />

      <div className="admin-toolbar glass">
        <div style={{ position: 'relative', flex: 1 }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div className="admin-table-wrap glass">
        <table className="admin-table">
          <thead><tr>
            <th>Product</th><th>SKU</th><th>GTIN / UPC</th>
            <th>Stock</th><th>Price</th>
            <th>Categories</th><th>Tags</th>
            <th><FiStar size={12} /> Featured</th><th>Date</th>
            <th>Meta Sync</th><th>Brand</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={12}><div className="skeleton" style={{ height: 48, margin: '4px 0' }} /></td></tr>)
              : products.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="admin-table__thumb">{Array.isArray(p.images) && p.images[0] ? <img src={p.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>🤖</span>}</div>
                      <div><div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.is_active ? '● Active' : '○ Hidden'}</div></div>
                    </div>
                  </td>
                  <td><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.sku || '—'}</span></td>
                  <td><span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.gtin || '—'}</span></td>
                  <td><span className={`badge ${p.stock === 0 ? 'badge-pink' : p.stock < 10 ? 'badge-yellow' : 'badge-green'}`}>{p.stock}</span></td>
                  <td>
                    <div style={{ fontWeight: 700 }}>₹{parseFloat(p.price).toLocaleString('en-IN')}</div>
                    {p.discount_price && <div style={{ fontSize: '0.75rem', color: 'var(--neon-green)' }}>₹{parseFloat(p.discount_price).toLocaleString('en-IN')} sale</div>}
                  </td>
                  <td><span className="badge badge-blue" style={{ fontSize: '0.75rem' }}>{p.category_name || '—'}</span></td>
                  <td><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 120 }}>{Array.isArray(p.tags) ? p.tags.slice(0, 2).map(t => <span key={t} className="badge badge-muted" style={{ fontSize: '0.68rem' }}>{t}</span>) : '—'}</div></td>
                  <td><span className={`badge ${p.is_featured ? 'badge-yellow' : 'badge-muted'}`}>{p.is_featured ? '★' : '☆'}</span></td>
                  <td><span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : '—'}</span></td>
                  <td><span className={`badge ${p.synced_to_meta ? 'badge-purple' : 'badge-muted'}`}>{p.synced_to_meta ? 'Synced' : 'No'}</span></td>
                  <td><span style={{ fontSize: '0.8rem' }}>{p.brand || '—'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}><FiEdit2 size={14} /></button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--neon-pink)' }} onClick={() => handleDelete(p.id)}><FiTrash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {!loading && products.length === 0 && <div className="admin-table__empty">No products found</div>}
      </div>

      {/* Pagination */}
      <div className="admin-pagination">
        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
        <span className="text-muted" style={{ fontSize: '0.85rem' }}>Page {page}</span>
        <button className="btn btn-ghost btn-sm" disabled={products.length < 10} onClick={() => setPage(p => p + 1)}>Next →</button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <motion.div className="admin-modal glass" onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="admin-modal__header">
              <h2 className="admin-modal__title">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button className="admin-modal__close" onClick={closeModal}><FiX /></button>
            </div>
            <div className="admin-modal__body">

              {/* Images */}
              <div className="form-group">
                <label className="form-label"><FiImage size={13} /> Product Images</label>
                <div className="pm-images">
                  {form.existingImages.map((img, i) => (
                    <div key={i} className="pm-img-thumb">
                      <img src={img} alt="" /><button className="pm-img-remove" onClick={() => removeExisting(img)}><FiX size={12} /></button>
                    </div>
                  ))}
                  {previews.map((src, i) => (
                    <div key={i} className="pm-img-thumb pm-img-thumb--new">
                      <img src={src} alt="" /><button className="pm-img-remove" onClick={() => removeNew(i)}><FiX size={12} /></button>
                    </div>
                  ))}
                  <button className="pm-img-add" onClick={() => fileRef.current.click()}><FiUpload size={20} /><span>Add</span></button>
                  <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleFiles} />
                </div>
              </div>

              {/* Section: Basic Info */}
              <div className="pm-section-label">📋 Basic Information</div>
              <div className="admin-modal__grid2">
                <div className="form-group"><label className="form-label">Product Name *</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Brand</label><input className="form-input" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="e.g. HalfRobo, Arduino, RaspPi" /></div>
              </div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} /></div>

              {/* Section: Pricing & Inventory */}
              <div className="pm-section-label">💰 Pricing & Inventory</div>
              <div className="admin-modal__grid3">
                <div className="form-group"><label className="form-label">Price (₹) *</label><input className="form-input" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Discount Price (₹)</label><input className="form-input" type="number" value={form.discount_price} onChange={e => setForm({ ...form, discount_price: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Stock</label><input className="form-input" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></div>
              </div>

              {/* Section: Identification */}
              <div className="pm-section-label">🏷️ Product Identification</div>
              <div className="admin-modal__grid3">
                <div className="form-group"><label className="form-label">SKU</label><input className="form-input" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="HR-001" /></div>
                <div className="form-group"><label className="form-label">GTIN / UPC / EAN / ISBN</label><input className="form-input" value={form.gtin} onChange={e => setForm({ ...form, gtin: e.target.value })} placeholder="12-digit barcode" /></div>
                <div className="form-group"><label className="form-label">Publish Date</label><input className="form-input" type="date" value={form.publish_date} onChange={e => setForm({ ...form, publish_date: e.target.value })} /></div>
              </div>

              {/* Section: Categorization */}
              <div className="pm-section-label">🗂️ Categorization</div>
              <div className="admin-modal__grid2">
                <div className="form-group"><label className="form-label">Category</label>
                  <select className="form-select" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">Select Category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Tags (comma separated)</label><input className="form-input" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="robot, AI, autonomous" /></div>
              </div>

              {/* Specifications */}
              <div className="pm-section-label">⚙️ Specifications</div>
              <div className="form-group">
                <div className="pm-specs">
                  {Object.entries(form.specifications).map(([k, v]) => (
                    <div key={k} className="pm-spec-row">
                      <span className="pm-spec-key">{k}</span><span className="pm-spec-val">{v}</span>
                      <button onClick={() => removeSpec(k)} style={{ color: 'var(--neon-pink)', background: 'none', border: 'none', cursor: 'pointer' }}><FiX size={14} /></button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="form-input" placeholder="Key" value={form.specKey} onChange={e => setForm({ ...form, specKey: e.target.value })} style={{ flex: 1 }} />
                    <input className="form-input" placeholder="Value" value={form.specVal} onChange={e => setForm({ ...form, specVal: e.target.value })} style={{ flex: 1 }} />
                    <button className="btn btn-secondary btn-sm" onClick={addSpec}><FiPlus /></button>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="pm-section-label">🔧 Settings</div>
              <div className="pm-toggles">
                <label className="pm-toggle-label"><input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} style={{ accentColor: 'var(--neon-blue)' }} /> ★ Featured Product</label>
                <label className="pm-toggle-label"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} style={{ accentColor: 'var(--neon-blue)' }} /> ● Active (Visible)</label>
                <label className="pm-toggle-label"><input type="checkbox" checked={form.synced_to_meta} onChange={e => setForm({ ...form, synced_to_meta: e.target.checked })} style={{ accentColor: '#9B59B6' }} /> 🔗 Synced to Meta Catalog</label>
              </div>
            </div>
            <div className="admin-modal__footer">
              <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
