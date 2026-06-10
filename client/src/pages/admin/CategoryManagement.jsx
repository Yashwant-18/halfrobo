import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiPackage, FiUpload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import './CategoryManagement.css';

const EMOJI_OPTIONS = ['🤖', '🦾', '🔬', '💡', '⚙️', '🛸', '🧬', '🔭', '💻', '🎮'];

const defaultForm = { name: '', description: '', emoji: '🤖', image: null };

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/categories');
      setCategories(res.data?.categories || res.data || []);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm(defaultForm);
    setPreviewUrl('');
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditTarget(cat);
    setForm({ name: cat.name || '', description: cat.description || '', emoji: cat.emoji || '🤖', image: null });
    setPreviewUrl(cat.image || '');
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEmojiOpen(false); };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(f => ({ ...f, image: file }));
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      fd.append('emoji', form.emoji);
      if (form.image) fd.append('image', form.image);

      if (editTarget) {
        await api.put(`/api/admin/categories/${editTarget._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Category updated!');
      } else {
        await api.post('/api/admin/categories', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Category created!');
      }
      closeModal();
      fetchCategories();
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    setDeleteId(id);
    try {
      await api.delete(`/api/admin/categories/${id}`);
      toast.success('Category deleted');
      setCategories(c => c.filter(x => x._id !== id));
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="catmgmt-page">
      <div className="catmgmt-header">
        <div>
          <h1 className="catmgmt-title">Category Management</h1>
          <p className="catmgmt-sub">Organize your product catalog</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-primary catmgmt-add-btn" onClick={openAdd}>
          <FiPlus /> Add Category
        </motion.button>
      </div>

      {loading ? (
        <div className="catmgmt-loading">
          {[...Array(6)].map((_, i) => <div key={i} className="catmgmt-skeleton" />)}
        </div>
      ) : (
        <motion.div className="catmgmt-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {categories.map((cat, i) => (
            <motion.div key={cat._id} className="catmgmt-card glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="catmgmt-card-top">
                <div className="catmgmt-emoji">{cat.emoji || '🤖'}</div>
                {cat.image && <img src={cat.image} alt={cat.name} className="catmgmt-thumb" />}
              </div>
              <div className="catmgmt-card-body">
                <h3 className="catmgmt-name">{cat.name}</h3>
                <p className="catmgmt-desc">{cat.description || 'No description'}</p>
                <div className="catmgmt-count-badge">
                  <FiPackage /> {cat.productCount ?? 0} products
                </div>
              </div>
              <div className="catmgmt-card-actions">
                <button className="catmgmt-action-btn edit" onClick={() => openEdit(cat)}>
                  <FiEdit2 /> Edit
                </button>
                <button className="catmgmt-action-btn delete" onClick={() => handleDelete(cat._id)} disabled={deleteId === cat._id}>
                  <FiTrash2 /> {deleteId === cat._id ? '...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          ))}
          {categories.length === 0 && (
            <div className="catmgmt-empty">No categories yet. Add your first one!</div>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <motion.div className="catmgmt-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal}>
            <motion.div className="catmgmt-modal glass" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="catmgmt-modal-header">
                <h2>{editTarget ? 'Edit Category' : 'Add Category'}</h2>
                <button className="catmgmt-close-btn" onClick={closeModal}><FiX /></button>
              </div>
              <form onSubmit={handleSave} className="catmgmt-form">
                <div className="catmgmt-field">
                  <label>Emoji Icon</label>
                  <div className="catmgmt-emoji-wrapper">
                    <button type="button" className="catmgmt-emoji-btn" onClick={() => setEmojiOpen(o => !o)}>
                      {form.emoji} <span>▾</span>
                    </button>
                    {emojiOpen && (
                      <div className="catmgmt-emoji-picker">
                        {EMOJI_OPTIONS.map(em => (
                          <button key={em} type="button" className={`catmgmt-emoji-opt ${form.emoji === em ? 'active' : ''}`}
                            onClick={() => { setForm(f => ({ ...f, emoji: em })); setEmojiOpen(false); }}>
                            {em}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="catmgmt-field">
                  <label>Name *</label>
                  <input className="catmgmt-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Category name" required />
                </div>
                <div className="catmgmt-field">
                  <label>Description</label>
                  <textarea className="catmgmt-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Category description" rows={3} />
                </div>
                <div className="catmgmt-field">
                  <label>Image</label>
                  <label className="catmgmt-upload-label">
                    <FiUpload /> {form.image ? form.image.name : 'Choose image'}
                    <input type="file" accept="image/*" onChange={handleFileChange} className="catmgmt-file-input" />
                  </label>
                  {previewUrl && <img src={previewUrl} alt="preview" className="catmgmt-preview" />}
                </div>
                <div className="catmgmt-modal-footer">
                  <button type="button" className="btn catmgmt-cancel-btn" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Category'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
