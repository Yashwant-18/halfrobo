import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiGithub, FiExternalLink,
  FiStar, FiCode, FiUpload, FiImage, FiDownload
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import './AdminProjectsPage.css';

const EMPTY_FORM = {
  name: '', description: '', tech_stack: '', github_url: '',
  live_url: '', code_download_url: '', category: 'Web App',
  is_featured: false, sort_order: 0,
};
const CATEGORIES = ['Web App', 'Robotics', 'IoT', 'Drones', 'AI', 'Hardware', 'Mobile', 'Other'];
const MAX_IMAGES = 6;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminProjectsPage() {
  const [projects, setProjects]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [images, setImages]         = useState([]);        // { file, preview, existing? }
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(null);
  const [dragOver, setDragOver]     = useState(false);
  const fileRef                     = useRef();

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const r = await api.get('/projects');
      setProjects(r.data.data || []);
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchProjects(); }, []);

  const openAdd = () => {
    setEditing(null); setForm(EMPTY_FORM); setImages([]); setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name || '', description: p.description || '',
      tech_stack: Array.isArray(p.tech_stack) ? p.tech_stack.join(', ') : (p.tech_stack || ''),
      github_url: p.github_url || '', live_url: p.live_url || '',
      code_download_url: p.code_download_url || '', category: p.category || 'Web App',
      is_featured: p.is_featured || false, sort_order: p.sort_order || 0,
    });
    // Load existing images from DB
    const existingImgs = (Array.isArray(p.images) ? p.images : []).map(url => ({
      preview: url.startsWith('http') ? url : `${API_BASE}${url}`,
      url, existing: true,
    }));
    setImages(existingImgs);
    setModalOpen(true);
  };

  const handleFiles = (files) => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) { toast.error(`Max ${MAX_IMAGES} images allowed`); return; }
    const newFiles = Array.from(files).slice(0, remaining).map(file => ({
      file, preview: URL.createObjectURL(file), existing: false,
    }));
    setImages(prev => [...prev, ...newFiles]);
  };

  const removeImage = (idx) => {
    setImages(prev => {
      const updated = [...prev];
      if (!updated[idx].existing) URL.revokeObjectURL(updated[idx].preview);
      updated.splice(idx, 1);
      return updated;
    });
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Project name is required');
    if (images.length === 0) return toast.error('Please add at least 1 image');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      // Append new files
      const newImages = images.filter(i => !i.existing);
      newImages.forEach(i => fd.append('images', i.file));
      // Send existing image URLs to keep
      const keepImages = images.filter(i => i.existing).map(i => i.url);
      fd.append('keep_images', JSON.stringify(keepImages));

      if (editing) {
        await api.put(`/projects/${editing.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Project updated!');
      } else {
        await api.post('/projects', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Project added to database!');
      }
      setModalOpen(false);
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    setDeleting(id);
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(null); }
  };

  return (
    <div className="ap-page">
      {/* Header */}
      <div className="ap-header">
        <div>
          <h1 className="ap-title"><FiCode /> Projects</h1>
          <p className="ap-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} in database</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><FiPlus size={18} /> Add Project</button>
      </div>

      {/* List */}
      {loading ? (
        <div className="ap-loading">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="ap-empty">
          <FiCode size={48} />
          <h3>No projects yet</h3>
          <p>Click "Add Project" to get started</p>
          <button className="btn btn-primary" onClick={openAdd}><FiPlus /> Add First Project</button>
        </div>
      ) : (
        <div className="ap-list">
          {projects.map(p => {
            const imgs = Array.isArray(p.images) ? p.images : [];
            const thumb = imgs[0] ? (imgs[0].startsWith('http') ? imgs[0] : `${API_BASE}${imgs[0]}`) : null;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ap-row glass">
                {/* Thumbnail */}
                <div className="ap-row__thumb">
                  {thumb
                    ? <img src={thumb} alt={p.name} />
                    : <div className="ap-row__thumb-ph"><FiImage size={22} /></div>}
                  {imgs.length > 1 && <span className="ap-row__img-count">+{imgs.length}</span>}
                </div>
                {/* Info */}
                <div className="ap-row__info">
                  <div className="ap-row__name-row">
                    <span className="ap-row__name">{p.name}</span>
                    {p.is_featured && <span className="ap-row__featured"><FiStar size={10} /> Featured</span>}
                    <span className="ap-row__cat">{p.category}</span>
                  </div>
                  <p className="ap-row__desc">{p.description}</p>
                  <div className="ap-row__stack">
                    {(Array.isArray(p.tech_stack) ? p.tech_stack : []).slice(0, 5).map(t => (
                      <span key={t} className="ap-row__tech">{t}</span>
                    ))}
                  </div>
                </div>
                {/* Links + Actions */}
                <div className="ap-row__actions">
                  {p.github_url && <a href={p.github_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><FiGithub size={15} /></a>}
                  {p.live_url && <a href={p.live_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><FiExternalLink size={15} /></a>}
                  {p.code_download_url && <a href={p.code_download_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><FiDownload size={15} /></a>}
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}><FiEdit2 size={15} /></button>
                  <button className="btn btn-sm ap-row__delete" onClick={() => handleDelete(p.id)} disabled={deleting === p.id}><FiTrash2 size={15} /></button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="ap-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
            />
            {/* Centering wrapper — flex center so Framer Motion transform doesn't conflict */}
            <div className="ap-modal-wrap">
              <motion.div
                className="ap-modal glass"
                initial={{ opacity: 0, scale: 0.93, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 20 }}
              >
                {/* Header */}
                <div className="ap-modal__header">
                  <h2>{editing ? 'Edit Project' : 'Add New Project'}</h2>
                  <button onClick={() => setModalOpen(false)} className="ap-modal__close"><FiX size={22} /></button>
                </div>

                <form onSubmit={handleSave} className="ap-modal__body">
                  {/* ── LEFT: Form Fields ── */}
                  <div className="ap-modal__fields">
                    <div className="ap-field">
                      <label>Project Name *</label>
                      <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. NeuroBot Controller" required />
                    </div>
                    <div className="ap-field">
                      <label>Description</label>
                      <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this project do?" rows={3} />
                    </div>
                    <div className="ap-field-row">
                      <div className="ap-field">
                        <label>Category</label>
                        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="ap-field">
                        <label>Sort Order</label>
                        <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} placeholder="0" />
                      </div>
                    </div>
                    <div className="ap-field">
                      <label>Tech Stack <span>(comma separated)</span></label>
                      <input value={form.tech_stack} onChange={e => setForm(f => ({ ...f, tech_stack: e.target.value }))} placeholder="React, Node.js, Python, Arduino" />
                    </div>
                    <div className="ap-field-row">
                      <div className="ap-field">
                        <label><FiGithub size={12} /> GitHub URL</label>
                        <input value={form.github_url} onChange={e => setForm(f => ({ ...f, github_url: e.target.value }))} placeholder="https://github.com/..." />
                      </div>
                      <div className="ap-field">
                        <label><FiExternalLink size={12} /> Live URL</label>
                        <input value={form.live_url} onChange={e => setForm(f => ({ ...f, live_url: e.target.value }))} placeholder="https://..." />
                      </div>
                    </div>
                    <div className="ap-field">
                      <label><FiDownload size={12} /> Code Download URL <span>(zip link)</span></label>
                      <input value={form.code_download_url} onChange={e => setForm(f => ({ ...f, code_download_url: e.target.value }))} placeholder="https://github.com/.../archive/main.zip" />
                    </div>
                    <label className="ap-featured-toggle">
                      <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} />
                      <span>⭐ Mark as Featured</span>
                    </label>
                    <div className="ap-modal__btns">
                      <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving...' : editing ? 'Update Project' : 'Add to Database'}
                      </button>
                    </div>
                  </div>

                  {/* ── RIGHT: Image Sidebar ── */}
                  <div className="ap-img-sidebar">
                    <div className="ap-img-sidebar__header">
                      <span><FiImage size={14} /> Project Images</span>
                      <span className="ap-img-count">{images.length}/{MAX_IMAGES}</span>
                    </div>

                    {images.length < MAX_IMAGES && (
                      <div
                        className={`ap-dropzone ${dragOver ? 'ap-dropzone--active' : ''}`}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileRef.current.click()}
                      >
                        <FiUpload size={28} />
                        <p>Drop images here<br /><span>or click to browse</span></p>
                        <p className="ap-dropzone__limit">Max {MAX_IMAGES} images · JPG, PNG, WEBP</p>
                        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => handleFiles(e.target.files)} />
                      </div>
                    )}

                    <div className="ap-img-previews">
                      {images.map((img, idx) => (
                        <div key={idx} className="ap-img-preview">
                          <img src={img.preview} alt={`preview-${idx}`} />
                          {img.existing && <span className="ap-img-preview__badge">Saved</span>}
                          <button type="button" className="ap-img-preview__remove" onClick={() => removeImage(idx)}><FiX size={12} /></button>
                          {idx === 0 && <span className="ap-img-preview__main">Cover</span>}
                        </div>
                      ))}
                    </div>

                    {images.length === 0 && (
                      <p className="ap-img-sidebar__hint">Add images to showcase your project</p>
                    )}
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
