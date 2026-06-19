import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiUploadCloud, FiFile, FiX, FiCheck, FiClock,
  FiTool, FiAlertCircle, FiShoppingCart, FiStar,
  FiPackage, FiArrowRight
} from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './PrintOrderPage.css';

/* ── pre-made 3D model listings ── */
const SAMPLE_MODELS = [
  {
    id: 'm1', name: 'Mini Robot Figurine', category: 'Figurines',
    price: 349, rating: 4.8, reviews: 124,
    emoji: '🤖', material: 'PLA', color: '#00D9FF',
    desc: 'Detailed desktop robot figurine, fully articulated limbs.'
  },
  {
    id: 'm2', name: 'Drone Frame V2', category: 'Drone Parts',
    price: 1199, rating: 4.6, reviews: 87,
    emoji: '🚁', material: 'ABS', color: '#7B61FF',
    desc: 'Lightweight 5" racing drone frame, optimized for durability.'
  },
  {
    id: 'm3', name: 'IoT Enclosure Box', category: 'Electronics',
    price: 499, rating: 4.7, reviews: 203,
    emoji: '📦', material: 'PETG', color: '#00FF94',
    desc: 'Universal project enclosure for Arduino/ESP32 boards.'
  },
  {
    id: 'm4', name: 'Gear Set (12pc)', category: 'Mechanical',
    price: 699, rating: 4.5, reviews: 56,
    emoji: '⚙️', material: 'Nylon', color: '#FFB800',
    desc: 'Precision interlocking gear set for robotics projects.'
  },
  {
    id: 'm5', name: 'Camera Mount Bracket', category: 'Accessories',
    price: 279, rating: 4.9, reviews: 311,
    emoji: '📷', material: 'PLA', color: '#FF2D78',
    desc: 'Universal camera mount compatible with most action cameras.'
  },
  {
    id: 'm6', name: 'Robotic Arm Claw', category: 'Robotics',
    price: 899, rating: 4.7, reviews: 142,
    emoji: '🦾', material: 'ABS', color: '#00D9FF',
    desc: '3-finger gripper claw for servo-driven robotic arm kits.'
  },
];

const COLORS = ['White', 'Black', 'Grey', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Transparent'];
const COLOR_HEX = { White: '#F5F5F5', Black: '#222', Grey: '#888', Red: '#E74C3C', Blue: '#3498DB', Green: '#2ECC71', Yellow: '#F1C40F', Orange: '#E67E22', Purple: '#9B59B6', Transparent: 'repeating-linear-gradient(45deg,#888 0,#888 5px,transparent 5px,transparent 10px)' };

const MATERIALS = [
  { id: 'PLA',   name: 'PLA',           price: '₹3/g' },
  { id: 'ABS',   name: 'ABS',           price: '₹4/g' },
  { id: 'PETG',  name: 'PETG',          price: '₹4.5/g' },
  { id: 'TPU',   name: 'TPU (Flexible)',price: '₹6/g' },
  { id: 'Resin', name: 'Resin',         price: '₹8/g' },
  { id: 'Nylon', name: 'Nylon',         price: '₹7/g' },
];

const QUALITY = [
  { id: 'Draft (0.3mm)',      name: 'Draft',      desc: '0.3mm · Fast & economic' },
  { id: 'Standard (0.2mm)',   name: 'Standard',   desc: '0.2mm · Balanced' },
  { id: 'Fine (0.1mm)',       name: 'Fine',        desc: '0.1mm · Smooth surfaces' },
  { id: 'Ultra Fine (0.05mm)',name: 'Ultra Fine', desc: '0.05mm · Max detail' },
];

const INFILL = ['10%', '20%', '30%', '40%', '50%', '75%', '100% (Solid)'];

const STATUS_MAP = {
  pending:   { label: 'Pending Review', icon: <FiClock />,        cls: 'pop-yellow' },
  reviewing: { label: 'Under Review',   icon: <FiAlertCircle />,  cls: 'pop-blue'   },
  printing:  { label: 'Printing',       icon: <FiTool />,         cls: 'pop-purple' },
  completed: { label: 'Completed',      icon: <FiCheck />,        cls: 'pop-green'  },
  rejected:  { label: 'Rejected',       icon: <FiX />,            cls: 'pop-red'    },
  cancelled: { label: 'Cancelled',      icon: <FiX />,            cls: 'pop-muted'  },
};

export default function PrintOrderPage() {
  const { user } = useAuth();
  const { addToCart } = useCart?.() || {};
  const [tab, setTab] = useState('models'); // 'models' | 'order' | 'my-orders'
  const [step, setStep] = useState(1);

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
      toast.error('Unsupported file type'); return;
    }
    if (f.size > 50 * 1024 * 1024) { toast.error('Max 50MB allowed'); return; }
    setFile(f); setStep(2);
  };

  const handleSubmit = async () => {
    if (!user) { toast.error('Please login first'); return; }
    if (!file) { toast.error('Please upload a model file'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('model', file);
      fd.append('material', material); fd.append('color', color);
      fd.append('quality', quality); fd.append('infill', infill);
      fd.append('quantity', quantity); fd.append('supports', supports);
      fd.append('special_instructions', instructions); fd.append('phone', phone);
      await api.post('/3dprint', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Order submitted! We will quote you soon.');
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally { setSubmitting(false); }
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
    setInfill('20%'); setQuantity(1); setSupports(false);
    setInstructions(''); setPhone('');
  };

  return (
    <div className="pop-page">

      {/* ── Hero ────────────────────────────────── */}
      <section className="pop-hero">
        <div className="pop-hero__particles">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="pop-particle" style={{
              '--delay': i * 0.5 + 's',
              '--x': (i * 8.3) + '%',
              '--dur': (3 + (i % 4)) + 's',
            }} />
          ))}
        </div>
        <div className="pop-hero__content">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="pop-hero__badge">🖨️ Custom 3D Printing Service</div>
            <h1 className="pop-hero__title">
              Bring Your Ideas<br />
              <span className="text-gradient">to Life</span>
            </h1>
            <p className="pop-hero__sub">
              Buy ready-made 3D models or upload your own design. Printed with precision using premium materials.
            </p>
            <div className="pop-hero__stats">
              <div className="pop-hero__stat"><span>6+</span><label>Materials</label></div>
              <div className="pop-hero__stat"><span>10+</span><label>Colors</label></div>
              <div className="pop-hero__stat"><span>24h</span><label>Turnaround</label></div>
              <div className="pop-hero__stat"><span>50MB</span><label>Max file</label></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Tabs ────────────────────────────────── */}
      <div className="pop-container">
        <div className="pop-tabs">
          <button className={`pop-tab ${tab === 'models' ? 'pop-tab--active' : ''}`} onClick={() => switchTab('models')}>
            🛒 Models for Sale
          </button>
          <button className={`pop-tab ${tab === 'order' ? 'pop-tab--active' : ''}`} onClick={() => switchTab('order')}>
            🖨️ Custom Print
          </button>
          <button className={`pop-tab ${tab === 'my-orders' ? 'pop-tab--active' : ''}`} onClick={() => switchTab('my-orders')}>
            📦 My Orders
          </button>
        </div>

        <AnimatePresence mode="wait">

          {/* ── MODELS FOR SALE ── */}
          {tab === 'models' && (
            <motion.div key="models" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="pop-models-header">
                <h2 className="pop-models-title">Ready-to-Print Models</h2>
                <p className="pop-models-sub">Order pre-designed models — we print and deliver them to you.</p>
              </div>
              <div className="pop-models-grid">
                {SAMPLE_MODELS.map((m, i) => (
                  <motion.div
                    key={m.id}
                    className="pop-model-card glass"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    whileHover={{ y: -4 }}
                  >
                    {/* Thumbnail */}
                    <div className="pop-model-card__thumb" style={{ '--accent': m.color }}>
                      <div className="pop-model-card__emoji">{m.emoji}</div>
                      <span className="pop-model-card__cat">{m.category}</span>
                    </div>

                    <div className="pop-model-card__body">
                      <div className="pop-model-card__name">{m.name}</div>
                      <div className="pop-model-card__desc">{m.desc}</div>

                      <div className="pop-model-card__meta">
                        <span className="pop-model-card__material">{m.material}</span>
                        <div className="pop-model-card__rating">
                          <FiStar size={12} style={{ fill: '#FFB800', color: '#FFB800' }} />
                          <span>{m.rating}</span>
                          <span className="pop-model-card__rcount">({m.reviews})</span>
                        </div>
                      </div>

                      <div className="pop-model-card__footer">
                        <div className="pop-model-card__price">₹{m.price.toLocaleString('en-IN')}</div>
                        <button
                          className="btn btn-primary btn-sm pop-model-card__btn"
                          onClick={() => toast.success(`${m.name} added to cart!`)}
                        >
                          <FiShoppingCart size={13} /> Add to Cart
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA to custom print */}
              <div className="pop-models-cta">
                <div className="pop-models-cta__text">
                  <h3>Don't see what you need?</h3>
                  <p>Upload your own 3D model and we will print it exactly to your specs.</p>
                </div>
                <button className="btn btn-primary" onClick={() => setTab('order')}>
                  🖨️ Upload Custom Model <FiArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── MY ORDERS ── */}
          {tab === 'my-orders' && (
            <motion.div key="my-orders" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {loadingOrders ? (
                <div className="pop-loading">Loading orders…</div>
              ) : myOrders.length === 0 ? (
                <div className="pop-empty">
                  <div className="pop-empty__icon">📦</div>
                  <h3>No orders yet</h3>
                  <p>Submit a custom print order to get started.</p>
                  <button className="btn btn-primary" onClick={() => setTab('order')}>Place Order</button>
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
                            <div className="pop-order-card__date">
                              {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                          </div>
                          <span className={`pop-status ${st.cls}`}>{st.icon} {st.label}</span>
                        </div>
                        <div className="pop-order-card__file"><FiFile size={13} /> {order.file_name}</div>
                        <div className="pop-order-card__specs">
                          <span>{order.material}</span><span>{order.color}</span>
                          <span>{order.quality}</span><span>×{order.quantity}</span>
                        </div>
                        {order.price_estimate && (
                          <div className="pop-order-card__price">Quote: <strong>₹{order.price_estimate}</strong></div>
                        )}
                        {order.admin_note && (
                          <div className="pop-order-card__note">📝 {order.admin_note}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── CUSTOM PRINT FORM ── */}
          {tab === 'order' && !submitted && (
            <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Steps */}
              <div className="pop-steps">
                {['Upload File', 'Configure', 'Review & Submit'].map((s, i) => (
                  <div key={i} className={`pop-step ${step > i + 1 ? 'pop-step--done' : step === i + 1 ? 'pop-step--active' : ''}`}>
                    <div className="pop-step__num">{step > i + 1 ? '✓' : i + 1}</div>
                    <div className="pop-step__label">{s}</div>
                    {i < 2 && <div className="pop-step__line" />}
                  </div>
                ))}
              </div>

              {/* Step 1 */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div
                    className="pop-upload-zone glass"
                    onClick={() => fileRef.current.click()}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('pop-upload-zone--drag'); }}
                    onDragLeave={e => e.currentTarget.classList.remove('pop-upload-zone--drag')}
                    onDrop={e => {
                      e.preventDefault(); e.currentTarget.classList.remove('pop-upload-zone--drag');
                      const f = e.dataTransfer.files[0];
                      if (f) handleFile({ target: { files: [f] } });
                    }}
                  >
                    <FiUploadCloud size={52} className="pop-upload-zone__icon" />
                    <h3>Drop your 3D model file here</h3>
                    <p>or click to browse</p>
                    <div className="pop-upload-zone__formats">
                      {['STL', 'OBJ', '3MF', 'STEP', 'IGES'].map(f => (
                        <span key={f} className="badge badge-blue">.{f.toLowerCase()}</span>
                      ))}
                    </div>
                    <p className="pop-upload-zone__limit">Max file size: 50 MB</p>
                    <input ref={fileRef} type="file" accept={ACCEPTED} style={{ display: 'none' }} onChange={handleFile} />
                  </div>
                </motion.div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pop-config">
                  <div className="pop-config-file glass">
                    <FiFile size={18} style={{ color: 'var(--neon-blue)', flexShrink: 0 }} />
                    <div>
                      <div className="pop-file-name">{file?.name}</div>
                      <div className="pop-file-size">{file ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : ''}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}
                      onClick={() => { setFile(null); setStep(1); }}>
                      <FiX size={13} /> Remove
                    </button>
                  </div>

                  <div className="pop-config-grid">
                    {/* Material */}
                    <div className="pop-config-section glass">
                      <h3>Material</h3>
                      <div className="pop-mat-list">
                        {MATERIALS.map(m => (
                          <div key={m.id}
                            className={`pop-mat-option ${material === m.id ? 'pop-mat-option--active' : ''}`}
                            onClick={() => setMaterial(m.id)}>
                            <div className="pop-mat-option__check">{material === m.id && <FiCheck size={11} />}</div>
                            <div className="pop-mat-option__name">{m.name}</div>
                            <div className="pop-mat-option__price" style={{ marginLeft: 'auto' }}>{m.price}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {/* Color */}
                      <div className="pop-config-section glass">
                        <h3>Color — <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>{color}</span></h3>
                        <div className="pop-colors">
                          {COLORS.map(c => (
                            <button key={c} title={c}
                              className={`pop-color ${color === c ? 'pop-color--active' : ''}`}
                              onClick={() => setColor(c)}
                              style={{ background: COLOR_HEX[c] }} />
                          ))}
                        </div>
                      </div>

                      {/* Quality */}
                      <div className="pop-config-section glass">
                        <h3>Print Quality</h3>
                        {QUALITY.map(q => (
                          <div key={q.id}
                            className={`pop-quality-option ${quality === q.id ? 'pop-quality-option--active' : ''}`}
                            onClick={() => setQuality(q.id)}>
                            <div className="pop-quality-option__check">{quality === q.id && <FiCheck size={11} />}</div>
                            <div>
                              <div className="pop-quality-option__name">{q.name}</div>
                              <div className="pop-quality-option__desc">{q.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Infill & Qty */}
                      <div className="pop-config-section glass">
                        <h3>Infill & Quantity</h3>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Infill</label>
                            <select className="form-select" value={infill} onChange={e => setInfill(e.target.value)}>
                              {INFILL.map(i => <option key={i}>{i}</option>)}
                            </select>
                          </div>
                          <div className="form-group" style={{ width: 90 }}>
                            <label className="form-label">Qty</label>
                            <input className="form-input" type="number" min={1} max={100}
                              value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} />
                          </div>
                        </div>
                        <label className="pop-toggle-row" style={{ marginTop: 10 }}>
                          <input type="checkbox" checked={supports} onChange={e => setSupports(e.target.checked)}
                            style={{ accentColor: 'var(--neon-blue)' }} />
                          Add support structures
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="pop-config-section glass">
                    <h3>Special Instructions <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></h3>
                    <textarea className="form-input" rows={3} value={instructions}
                      onChange={e => setInstructions(e.target.value)}
                      placeholder="e.g. Needed in 2 days, specific finish required..." style={{ resize: 'vertical' }} />
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setStep(3)}>Review Order →</button>
                  </div>
                </motion.div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pop-review">
                  <div className="pop-review-card glass">
                    <h3>Order Summary</h3>
                    <div className="pop-review-grid">
                      <div className="pop-review-row"><span>File</span><strong><FiFile size={12} /> {file?.name}</strong></div>
                      <div className="pop-review-row"><span>Material</span><strong>{material}</strong></div>
                      <div className="pop-review-row">
                        <span>Color</span>
                        <strong>
                          <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: COLOR_HEX[color], marginRight: 4, border: '1px solid rgba(255,255,255,0.2)', verticalAlign: 'middle' }} />
                          {color}
                        </strong>
                      </div>
                      <div className="pop-review-row"><span>Quality</span><strong>{quality}</strong></div>
                      <div className="pop-review-row"><span>Infill</span><strong>{infill}</strong></div>
                      <div className="pop-review-row"><span>Quantity</span><strong>×{quantity}</strong></div>
                      <div className="pop-review-row"><span>Supports</span><strong>{supports ? 'Yes' : 'No'}</strong></div>
                      {instructions && <div className="pop-review-row pop-review-row--full"><span>Notes</span><strong>{instructions}</strong></div>}
                    </div>
                    <div className="pop-review-note">
                      Pricing is calculated after our team reviews your model. You will receive a quote within 24 hours.
                    </div>
                  </div>

                  {!user && (
                    <div className="pop-auth-notice glass">
                      You need to <a href="/login" style={{ color: 'var(--neon-blue)' }}>login</a> before submitting.
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Contact Phone (optional)</label>
                    <input className="form-input" type="tel" value={phone}
                      onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
                    <button className="btn btn-primary" style={{ flex: 1, padding: '13px 24px' }}
                      onClick={handleSubmit} disabled={submitting || !user}>
                      {submitting ? 'Submitting...' : 'Submit 3D Print Order'}
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── SUCCESS ── */}
          {tab === 'order' && submitted && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="pop-success glass">
              <div className="pop-success__icon">🎉</div>
              <h2>Order Submitted!</h2>
              <p>Your 3D print order has been received. Our team will review and send you a price quote soon.</p>
              <div className="pop-success__actions">
                <button className="btn btn-primary" onClick={() => switchTab('my-orders')}>View My Orders</button>
                <button className="btn btn-ghost" onClick={reset}>New Order</button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
