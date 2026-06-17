import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiGithub, FiExternalLink, FiStar, FiCode } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const EMPTY_FORM = {
  name: '', description: '', tech_stack: '', github_url: '',
  live_url: '', code_download_url: '', category: 'Web App', is_featured: false, sort_order: 0,
};

const CATEGORIES = ['Web App', 'Robotics', 'IoT', 'Drones', 'AI', 'Hardware', 'Mobile', 'Other'];

export default function AdminProjectsPage() {
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null);   // null = add, object = edit
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(null);

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
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name || '',
      description: p.description || '',
      tech_stack: Array.isArray(p.tech_stack) ? p.tech_stack.join(', ') : (p.tech_stack || ''),
      github_url: p.github_url || '',
      live_url: p.live_url || '',
      code_download_url: p.code_download_url || '',
      category: p.category || 'Web App',
      is_featured: p.is_featured || false,
      sort_order: p.sort_order || 0,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Project name is required');
    setSaving(true);
    try {
      const payload = {
        ...form,
        tech_stack: JSON.stringify(form.tech_stack.split(',').map(t => t.trim()).filter(Boolean)),
        is_featured: form.is_featured ? 'true' : 'false',
      };
      if (editing) {
        await api.put(`/projects/${editing.id}`, payload);
        toast.success('Project updated!');
      } else {
        await api.post('/projects', payload);
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
    <div style={{ padding: '32px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
            <FiCode style={{ display: 'inline', marginRight: '10px', color: 'var(--neon-blue)' }} />
            Projects
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{projects.length} project{projects.length !== 1 ? 's' : ''} in database</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <FiPlus size={18} /> Add Project
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading...</div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
          <FiCode size={48} style={{ opacity: 0.3, marginBottom: '16px', display: 'block', margin: '0 auto 16px' }} />
          <h3 style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>No projects yet</h3>
          <p>Click "Add Project" to add your first project</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {projects.map(p => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass"
              style={{ padding: '20px 24px', borderRadius: '14px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '16px' }}
            >
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{p.name}</span>
                  {p.is_featured && <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '100px', background: 'linear-gradient(135deg,#FFB800,#FF6B35)', color: '#000', fontWeight: 700 }}><FiStar size={10} /> Featured</span>}
                  <span style={{ fontSize: '0.72rem', padding: '2px 10px', borderRadius: '100px', border: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>{p.category}</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '600px' }}>{p.description}</p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(Array.isArray(p.tech_stack) ? p.tech_stack : []).slice(0, 5).map(t => (
                    <span key={t} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(0,217,255,0.08)', border: '1px solid rgba(0,217,255,0.15)', color: 'var(--neon-blue)' }}>{t}</span>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                {p.github_url && <a href={p.github_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" title="GitHub"><FiGithub size={15} /></a>}
                {p.live_url && <a href={p.live_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" title="Live"><FiExternalLink size={15} /></a>}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)} title="Edit">
                  <FiEdit2 size={15} />
                </button>
                <button
                  className="btn btn-sm"
                  style={{ background: 'rgba(255,45,120,0.1)', border: '1px solid rgba(255,45,120,0.2)', color: 'var(--neon-pink)' }}
                  onClick={() => handleDelete(p.id)}
                  disabled={deleting === p.id}
                  title="Delete"
                >
                  <FiTrash2 size={15} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                zIndex: 1001, width: '90%', maxWidth: '600px', maxHeight: '90vh',
                overflowY: 'auto', background: 'var(--dark-2)',
                border: '1px solid var(--glass-border)', borderRadius: '20px', padding: '32px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {editing ? 'Edit Project' : 'Add New Project'}
                </h2>
                <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <FiX size={22} />
                </button>
              </div>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Name */}
                <div>
                  <label style={labelStyle}>Project Name *</label>
                  <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. NeuroBot Controller" required />
                </div>

                {/* Description */}
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this project do?" />
                </div>

                {/* Category + Featured row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Category</label>
                    <select style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Sort Order</label>
                    <input style={inputStyle} type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} placeholder="0" />
                  </div>
                </div>

                {/* Tech Stack */}
                <div>
                  <label style={labelStyle}>Tech Stack <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(comma separated)</span></label>
                  <input style={inputStyle} value={form.tech_stack} onChange={e => setForm(f => ({ ...f, tech_stack: e.target.value }))} placeholder="React, Node.js, Python, Arduino" />
                </div>

                {/* GitHub + Live URL */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}><FiGithub size={13} /> GitHub URL</label>
                    <input style={inputStyle} value={form.github_url} onChange={e => setForm(f => ({ ...f, github_url: e.target.value }))} placeholder="https://github.com/..." />
                  </div>
                  <div>
                    <label style={labelStyle}><FiExternalLink size={13} /> Live URL</label>
                    <input style={inputStyle} value={form.live_url} onChange={e => setForm(f => ({ ...f, live_url: e.target.value }))} placeholder="https://..." />
                  </div>
                </div>

                {/* Code Download URL */}
                <div>
                  <label style={labelStyle}>Code Download URL <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(optional — direct link to zip/file)</span></label>
                  <input style={inputStyle} value={form.code_download_url} onChange={e => setForm(f => ({ ...f, code_download_url: e.target.value }))} placeholder="https://github.com/.../archive/main.zip" />
                </div>

                {/* Featured toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
                    style={{ accentColor: 'var(--neon-blue)', width: '16px', height: '16px' }}
                  />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Mark as Featured (shows on homepage)</span>
                </label>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : editing ? 'Update Project' : 'Add to Database'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const labelStyle = {
  display: 'block', marginBottom: '6px', fontSize: '0.8rem',
  fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.03em',
};
const inputStyle = {
  width: '100%', padding: '10px 14px',
  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
  borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.875rem',
  outline: 'none', transition: 'border-color 0.2s',
};
