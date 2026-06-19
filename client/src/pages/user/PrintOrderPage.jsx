import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUploadCloud, FiFile, FiX, FiCheck, FiClock, FiTool, FiPackage, FiAlertCircle, FiChevronDown } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import './PrintOrderPage.css';

const MATERIALS = [
  { id: 'PLA', name: 'PLA', desc: 'Best for beginners. Biodegradable, easy to print.', price: '₹3/g' },
  { id: 'ABS', name: 'ABS', desc: 'Durable & heat resistant. Good for functional parts.', price: '₹4/g' },
  { id: 'PETG', name: 'PETG', desc: 'Strong, food-safe, slightly flexible.', price: '₹4.5/g' },
  { id: 'TPU', name: 'TPU (Flexible)', desc: 'Rubber-like, shock absorbing.', price: '₹6/g' },
  { id: 'Resin', name: 'Resin', desc: 'Ultra-high detail. Perfect for miniatures.', price: '₹8/g' },
  { id: 'Nylon', name: 'Nylon', desc: 'Strong, wear resistant, industrial grade.', price: '₹7/g' },
];

const COLORS = ['White', 'Black', 'Grey', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Transparent'];
const COLOR_HEX = { White: '#F5F5F5', Black: '#222', Grey: '#888', Red: '#E74C3C', Blue: '#3498DB', Green: '#2ECC71', Yellow: '#F1C40F', Orange: '#E67E22', Purple: '#9B59B6', Transparent: 'linear-gradient(135deg,#aaa,transparent)' };
const QUALITY = [
  { id: 'Draft (0.3mm)', name: 'Draft', desc: '0.3mm layer height · Fast & economic' },
  { id: 'Standard (0.2mm)', name: 'Standard', desc: '0.2mm layer height · Balanced' },
  { id: 'Fine (0.1mm)', name: 'Fine', desc: '0.1mm layer height · Smooth surfaces' },
  { id: 'Ultra Fine (0.05mm)', name: 'Ultra Fine', desc: '0.05mm layer height · Maximum detail' },
];
const INFILL = ['10%', '20%', '30%', '40%', '50%', '75%', '100% (Solid)'];

const STATUS_MAP = {
  pending:   { label: 'Pending Review', icon: <FiClock />, cls: 'pop-yellow' },
  reviewing: { label: 'Under Review', icon: <FiAlertCircle />, cls: 'pop-blue' },
  printing:  { label: 'Printing', icon: <FiTool />, cls: 'pop-purple' },
  completed: { label: 'Completed', icon: <FiCheck />, cls: 'pop-green' },
  rejected:  { label: 'Rejected', icon: <FiX />, cls: 'pop-red' },
  cancelled: { label: 'Cancelled', icon: <FiX />, cls: 'pop-muted' },
};

export default function PrintOrderPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('order'); // 'order' | 'my-orders'
  const [step, setStep] = useState(1);

  // Form state
  const [file, setFile] = useState(null);
  const [material, setMaterial] = useState('PLA');
  const [color, setColor] = useState('White');
  const [quality, setQuality] = useState('Standard (0.2mm)');
  const [infill, setInfill] = useState('20%');
  const [quantity, setQuantity] = useState(1);
  const [supports, setSupports] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [myOrders, setMyOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fileRef = useRef();
  const ACCEPTED = '.stl,.obj,.3mf,.step,.iges';

  const handleFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['stl', 'obj', '3mf', 'step', 'iges'].includes(ext)) {
      toast.error('Unsupported file type. Use STL, OBJ, 3MF, STEP or IGES');
      return;
    }
    if (f.size > 50 * 1024 * 1024) { toast.error('File too large (max 50MB)'); return; }
    setFile(f);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!user) { toast.error('Please login to submit a 3D print order'); return; }
    if (!file) { toast.error('Please upload a model file'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('model', file);
      fd.append('material', material);
      fd.append('color', color);
      fd.append('quality', quality);
      fd.append('infill', infill);
      fd.append('quantity', quantity);
      fd.append('supports', supports);
      fd.append('special_instructions', instructions);
      fd.append('phone', phone);
      await api.post('/3dprint', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('🎉 Order submitted! We\'ll contact you soon with a quote.');
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const loadMyOrders = () => {
    if (!user) { toast.error('Please login to view orders'); return; }
    setLoadingOrders(true);
    api.get('/3dprint/my-orders')
      .then(r => setMyOrders(r.data.data || []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoadingOrders(false));
  };

  const switchTab = t => {
    setTab(t);
    if (t === 'my-orders') loadMyOrders();
  };

  const reset = () => {
    setFile(null); setStep(1); setSubmitted(false);
    setMaterial('PLA'); setColor('White'); setQuality('Standard (0.2mm)');
    setInfill('20%'); setQuantity(1); setSupports(false); setInstructions(''); setPhone('');
  };

  return (
    <div className="pop-page">
      {/* Hero */}
      <section className="pop-hero">
        <div className="pop-hero__particles">
          {[...Array(15)].map((_, i) => <div key={i} className="pop-particle" style={{ '--delay': i * 0.4 + 's', '--x': Math.random() * 100 + '%', '--dur': (3 + Math.random() * 4) + 's' }} />)}
        </div>
        <div className="pop-hero__content">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="pop-hero__badge">🖨️ Custom 3D Printing Service</div>
            <h1 className="pop-hero__title">Bring Your<br /><span className="text-gradient">Ideas to Life</span></h1>
            <p className="pop-hero__sub">Upload your 3D model file and we'll print it with precision. Multiple materials, colors, and quality levels available.</p>
            <div className="pop-hero__stats">
              <div className="pop-hero__stat"><span>6+</span>Materials</div>
              <div className="pop-hero__stat"><span>10+</span>Colors</div>
              <div className="pop-hero__stat"><span>24h</span>Turnaround</div>
              <div className="pop-hero__stat"><span>50MB</span>Max file</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tabs */}
      <div className="pop-container">
        <div className="pop-tabs">
          <button className={`pop-tab ${tab === 'order' ? 'pop-tab--active' : ''}`} onClick={() => switchTab('order')}>🖨️ Place Order</button>
          <button className={`pop-tab ${tab === 'my-orders' ? 'pop-tab--active' : ''}`} onClick={() => switchTab('my-orders')}>📦 My Orders</button>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'my-orders' ? (
            <motion.div key="my-orders" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="pop-my-orders">
                {loadingOrders ? (
                  <div className="pop-loading">Loading orders…</div>
                ) : myOrders.length === 0 ? (
                  <div className="pop-empty">
                    <div className="pop-empty__icon">🖨️</div>
                    <h3>No orders yet</h3>
                    <p>Submit your first 3D print order to get started!</p>
                    <button className="btn btn-primary" onClick={() => switchTab('order')}>Place Order</button>
                  </div>
                ) : (
                  <div className="pop-order-list">
                    {myOrders.map(order => {
                      const st = STATUS_MAP[order.status] || STATUS_MAP.pending;
                      return (
                        <div key={order.id} className="pop-order-card glass">
                          <div className="pop-order-card__top">
                            <div>
                              <div className="pop-order-card__id">Order #{order.id?.slice(-6).toUpperCase()}</div>
                              <div className="pop-order-card__date">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                            </div>
                            <span className={`pop-status ${st.cls}`}>{st.icon} {st.label}</span>
                          </div>
                          <div className="pop-order-card__file"><FiFile size={14} /> {order.file_name}</div>
                          <div className="pop-order-card__specs">
                            <span>{order.material}</span>
                            <span>{order.color}</span>
                            <span>{order.quality}</span>
                            <span>×{order.quantity}</span>
                          </div>
                          {order.price_estimate && (
                            <div className="pop-order-card__price">Quoted Price: <strong>₹{order.price_estimate}</strong></div>
                          )}
                          {order.admin_note && (
                            <div className="pop-order-card__note">📝 {order.admin_note}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          ) : submitted ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="pop-success glass">
              <div className="pop-success__icon">🎉</div>
              <h2>Order Submitted!</h2>
              <p>Your 3D print order has been received. Our team will review your file and send you a price quote soon.</p>
              <div className="pop-success__actions">
                <button className="btn btn-primary" onClick={() => switchTab('my-orders')}>View My Orders</button>
                <button className="btn btn-ghost" onClick={reset}>New Order</button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Step indicator */}
              <div className="pop-steps">
                {['Upload Model', 'Configure', 'Review & Submit'].map((s, i) => (
                  <div key={i} className={`pop-step ${step > i + 1 ? 'pop-step--done' : step === i + 1 ? 'pop-step--active' : ''}`}>
                    <div className="pop-step__num">{step > i + 1 ? '✓' : i + 1}</div>
                    <div className="pop-step__label">{s}</div>
                    {i < 2 && <div className="pop-step__line" />}
                  </div>
                ))}
              </div>

              {/* Step 1: Upload */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="pop-upload-zone glass" onClick={() => fileRef.current.click()} onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('pop-upload-zone--drag'); }} onDragLeave={e => e.currentTarget.classList.remove('pop-upload-zone--drag')} onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('pop-upload-zone--drag'); const f = e.dataTransfer.files[0]; if (f) { const fakeEv = { target: { files: [f] } }; handleFile(fakeEv); } }}>
                    <FiUploadCloud size={56} className="pop-upload-zone__icon" />
                    <h3>Drop your 3D model here</h3>
                    <p>or click to browse files</p>
                    <div className="pop-upload-zone__formats">
                      {['STL', 'OBJ', '3MF', 'STEP', 'IGES'].map(f => <span key={f} className="badge badge-blue">.{f.toLowerCase()}</span>)}
                    </div>
                    <p className="pop-upload-zone__limit">Maximum file size: 50 MB</p>
                    <input ref={fileRef} type="file" accept={ACCEPTED} style={{ display: 'none' }} onChange={handleFile} />
                  </div>

                  {/* Materials preview */}
                  <div className="pop-materials-preview">
                    <h3>Available Materials</h3>
                    <div className="pop-mats-grid">
                      {MATERIALS.map(m => (
                        <div key={m.id} className="pop-mat-card glass">
                          <div className="pop-mat-card__name">{m.name}</div>
                          <div className="pop-mat-card__desc">{m.desc}</div>
                          <div className="pop-mat-card__price">{m.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Configure */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pop-config">
                  {/* File info */}
                  <div className="pop-config-file glass">
                    <FiFile size={20} style={{ color: 'var(--neon-blue)' }} />
                    <div>
                      <div className="pop-file-name">{file?.name}</div>
                      <div className="pop-file-size">{file ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : ''}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => { setFile(null); setStep(1); }}>
                      <FiX size={14} /> Remove
                    </button>
                  </div>

                  <div className="pop-config-grid">
                    {/* Material */}
                    <div className="pop-config-section glass">
                      <h3>Material</h3>
                      <div className="pop-mat-list">
                        {MATERIALS.map(m => (
                          <div key={m.id} className={`pop-mat-option ${material === m.id ? 'pop-mat-option--active' : ''}`} onClick={() => setMaterial(m.id)}>
                            <div className="pop-mat-option__check">{material === m.id && <FiCheck size={12} />}</div>
                            <div>
                              <div className="pop-mat-option__name">{m.name} <span className="pop-mat-option__price">{m.price}</span></div>
                              <div className="pop-mat-option__desc">{m.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* Color */}
                      <div className="pop-config-section glass">
                        <h3>Color</h3>
                        <div className="pop-colors">
                          {COLORS.map(c => (
                            <button key={c} className={`pop-color ${color === c ? 'pop-color--active' : ''}`} title={c} onClick={() => setColor(c)} style={{ background: c === 'Transparent' ? 'repeating-linear-gradient(45deg,#888 0,#888 5px,transparent 5px,transparent 10px)' : COLOR_HEX[c] }} />
                          ))}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 6 }}>Selected: <strong>{color}</strong></div>
                      </div>

                      {/* Quality */}
                      <div className="pop-config-section glass">
                        <h3>Print Quality</h3>
                        {QUALITY.map(q => (
                          <div key={q.id} className={`pop-quality-option ${quality === q.id ? 'pop-quality-option--active' : ''}`} onClick={() => setQuality(q.id)}>
                            <div className="pop-quality-option__check">{quality === q.id && <FiCheck size={12} />}</div>
                            <div>
                              <div className="pop-quality-option__name">{q.name}</div>
                              <div className="pop-quality-option__desc">{q.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Infill & Quantity */}
                      <div className="pop-config-section glass">
                        <h3>Infill & Quantity</h3>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Infill Density</label>
                            <select className="form-select" value={infill} onChange={e => setInfill(e.target.value)}>
                              {INFILL.map(i => <option key={i}>{i}</option>)}
                            </select>
                          </div>
                          <div className="form-group" style={{ width: 100 }}>
                            <label className="form-label">Quantity</label>
                            <input className="form-input" type="number" min={1} max={100} value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
                          </div>
                        </div>
                        <label className="pop-toggle-row" style={{ marginTop: 10 }}>
                          <input type="checkbox" checked={supports} onChange={e => setSupports(e.target.checked)} style={{ accentColor: 'var(--neon-blue)' }} />
                          Add support structures (recommended for overhangs)
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="pop-config-section glass">
                    <h3>Special Instructions <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></h3>
                    <textarea className="form-input" rows={3} value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="e.g. I need this in 2 days, specific finishing required, etc." style={{ resize: 'vertical' }} />
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setStep(3)}>Continue → Review</button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Review & Submit */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pop-review">
                  <div className="pop-review-card glass">
                    <h3>📋 Order Summary</h3>
                    <div className="pop-review-grid">
                      <div className="pop-review-row"><span>File</span><strong><FiFile size={13} /> {file?.name}</strong></div>
                      <div className="pop-review-row"><span>Material</span><strong>{material}</strong></div>
                      <div className="pop-review-row"><span>Color</span><strong><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: COLOR_HEX[color], marginRight: 4, border: '1px solid rgba(255,255,255,0.2)' }} />{color}</strong></div>
                      <div className="pop-review-row"><span>Quality</span><strong>{quality}</strong></div>
                      <div className="pop-review-row"><span>Infill</span><strong>{infill}</strong></div>
                      <div className="pop-review-row"><span>Quantity</span><strong>×{quantity}</strong></div>
                      <div className="pop-review-row"><span>Supports</span><strong>{supports ? '✅ Yes' : '❌ No'}</strong></div>
                      {instructions && <div className="pop-review-row pop-review-row--full"><span>Instructions</span><strong>{instructions}</strong></div>}
                    </div>
                    <div className="pop-review-note">
                      ℹ️ Pricing is calculated after our team reviews the model. We'll send you a quote within 24 hours.
                    </div>
                  </div>

                  {!user && (
                    <div className="pop-auth-notice glass">
                      ⚠️ You need to <a href="/login" style={{ color: 'var(--neon-blue)' }}>login</a> before submitting your order.
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Contact Phone (optional)</label>
                    <input className="form-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
                    <button className="btn btn-primary" style={{ flex: 1, fontSize: '1rem', padding: '14px 24px' }} onClick={handleSubmit} disabled={submitting || !user}>
                      {submitting ? '⏳ Submitting...' : '🚀 Submit 3D Print Order'}
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
