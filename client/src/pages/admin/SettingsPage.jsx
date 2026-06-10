import { useState, useEffect, useMemo } from 'react';
import { FiPlus, FiTrash2, FiSave, FiX, FiGlobe, FiMapPin, FiPhone, FiMail, FiTwitter, FiInstagram, FiLinkedin, FiYoutube, FiGithub } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './ProductManagement.css';
import './SettingsPage.css';

const EMPTY_COUPON = { code: '', discount_percent: '', discount_amount: '', min_order: '', max_uses: '', expires_at: '', is_active: true };

export default function SettingsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_COUPON);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    site_name: 'HalfRobo',
    currency: 'INR',
    free_shipping_threshold: '999',
    support_email: 'support@halfrobo.com',
    tax_rate: '18',
  });

  const [footer, setFooter] = useState({
    footer_tagline: "Where AI meets robotics. Building the intelligent machines that will shape tomorrow's world.",
    footer_address: 'Bengaluru, Karnataka, India',
    footer_phone: '+91 98765 43210',
    footer_email: 'hello@halfrobo.com',
    footer_copyright: '© 2025 HalfRobo Technologies Pvt. Ltd. All rights reserved.',
    footer_twitter: '#',
    footer_instagram: '#',
    footer_linkedin: '#',
    footer_youtube: '#',
    footer_github: '#',
    footer_map_location: 'Bengaluru, Karnataka, India',
    footer_map_show: 'true',
  });

  // debounced map location for live preview (avoids rebuilding iframe on every keystroke)
  const [mapPreviewLocation, setMapPreviewLocation] = useState('Bengaluru, Karnataka, India');
  const [mapPreviewTimer, setMapPreviewTimer] = useState(null);
  const handleMapLocationChange = (val) => {
    setFooter(f => ({ ...f, footer_map_location: val }));
    clearTimeout(mapPreviewTimer);
    setMapPreviewTimer(setTimeout(() => setMapPreviewLocation(val), 800));
  };
  const mapEmbedURL = useMemo(() =>
    `https://maps.google.com/maps?q=${encodeURIComponent(mapPreviewLocation || 'India')}&output=embed&z=15`,
    [mapPreviewLocation]
  );

  const [settingsSaved, setSettingsSaved] = useState(false);
  const [footerSaved, setFooterSaved] = useState(false);

  // Load settings + coupons on mount
  useEffect(() => {
    api.get('/admin/settings').then(r => {
      const data = r.data?.data || {};
      setSettings({
        site_name: data.site_name || 'HalfRobo',
        currency: data.currency || 'INR',
        free_shipping_threshold: data.free_shipping_threshold || '999',
        support_email: data.support_email || 'support@halfrobo.com',
        tax_rate: data.tax_rate || '18',
      });
      const loc = data.footer_map_location || 'Bengaluru, Karnataka, India';
      setFooter({
        footer_tagline: data.footer_tagline || '',
        footer_address: data.footer_address || '',
        footer_phone: data.footer_phone || '',
        footer_email: data.footer_email || '',
        footer_copyright: data.footer_copyright || '',
        footer_twitter: data.footer_twitter || '#',
        footer_instagram: data.footer_instagram || '#',
        footer_linkedin: data.footer_linkedin || '#',
        footer_youtube: data.footer_youtube || '#',
        footer_github: data.footer_github || '#',
        footer_map_location: loc,
        footer_map_show: data.footer_map_show || 'true',
      });
      setMapPreviewLocation(loc);
    }).catch(() => {});
  }, []);

  const loadCoupons = () => {
    setLoading(true);
    api.get('/admin/coupons').then(r => setCoupons(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(loadCoupons, []);

  const saveCoupon = async () => {
    if (!form.code) return toast.error('Coupon code required');
    if (!form.discount_percent && !form.discount_amount) return toast.error('Set discount percent or amount');
    setSaving(true);
    try {
      await api.post('/admin/coupons', form);
      toast.success('Coupon created!');
      setForm(EMPTY_COUPON); setShowForm(false); loadCoupons();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); } finally { setSaving(false); }
  };

  const deleteCoupon = async id => {
    if (!window.confirm('Delete this coupon?')) return;
    try { await api.delete(`/admin/coupons/${id}`); toast.success('Deleted'); loadCoupons(); } catch { toast.error('Failed'); }
  };

  const saveSettings = async () => {
    try {
      await api.put('/admin/settings', settings);
      setSettingsSaved(true);
      toast.success('General settings saved!');
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch { toast.error('Failed to save settings'); }
  };

  const saveFooter = async () => {
    try {
      await api.put('/admin/settings', footer);
      setFooterSaved(true);
      toast.success('Footer settings saved! Changes are live 🎉');
      setTimeout(() => setFooterSaved(false), 3000);
    } catch { toast.error('Failed to save footer settings'); }
  };

  return (
    <div className="admin-page">
      <div className="admin-ph">
        <div>
          <h1 className="admin-ph__title">Settings</h1>
          <p className="admin-ph__sub">Platform configuration, footer content & coupon management</p>
        </div>
      </div>

      {/* ── General Settings ─────────────────────────── */}
      <div className="settings-section glass">
        <h3 className="settings-section__title">⚙️ General Settings</h3>
        <div className="settings-grid">
          <div className="form-group">
            <label className="form-label">Site Name</label>
            <input className="form-input" value={settings.site_name} onChange={e => setSettings({ ...settings, site_name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Support Email</label>
            <input className="form-input" type="email" value={settings.support_email} onChange={e => setSettings({ ...settings, support_email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Currency</label>
            <select className="form-select" value={settings.currency} onChange={e => setSettings({ ...settings, currency: e.target.value })}>
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Free Shipping Threshold (₹)</label>
            <input className="form-input" type="number" value={settings.free_shipping_threshold} onChange={e => setSettings({ ...settings, free_shipping_threshold: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Tax Rate (%)</label>
            <input className="form-input" type="number" value={settings.tax_rate} onChange={e => setSettings({ ...settings, tax_rate: e.target.value })} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={saveSettings}>
          <FiSave size={15} /> {settingsSaved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>

      {/* ── Footer Settings ───────────────────────────── */}
      <div className="settings-section glass">
        <div className="settings-section__header">
          <h3 className="settings-section__title">🦶 Footer Settings</h3>
          <span className="settings-section__badge">Live on website</span>
        </div>
        <p className="settings-section__desc">Changes here will instantly reflect in the website footer for all visitors.</p>

        {/* Contact Info */}
        <div className="settings-subsection">
          <h4 className="settings-subsection__title">📍 Contact Information</h4>
          <div className="settings-grid">
            <div className="form-group">
              <label className="form-label"><FiMapPin size={12} /> Address</label>
              <input className="form-input" placeholder="Bengaluru, Karnataka, India"
                value={footer.footer_address}
                onChange={e => setFooter({ ...footer, footer_address: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label"><FiPhone size={12} /> Phone</label>
              <input className="form-input" placeholder="+91 98765 43210"
                value={footer.footer_phone}
                onChange={e => setFooter({ ...footer, footer_phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label"><FiMail size={12} /> Email</label>
              <input className="form-input" type="email" placeholder="hello@halfrobo.com"
                value={footer.footer_email}
                onChange={e => setFooter({ ...footer, footer_email: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Tagline & Copyright */}
        <div className="settings-subsection">
          <h4 className="settings-subsection__title">✍️ Text Content</h4>
          <div className="settings-grid settings-grid--full">
            <div className="form-group">
              <label className="form-label">Footer Tagline</label>
              <textarea className="form-input" rows={2} placeholder="Where AI meets robotics..."
                value={footer.footer_tagline}
                onChange={e => setFooter({ ...footer, footer_tagline: e.target.value })}
                style={{ resize: 'vertical', minHeight: 60 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Copyright Text</label>
              <input className="form-input" placeholder="© 2025 HalfRobo Technologies..."
                value={footer.footer_copyright}
                onChange={e => setFooter({ ...footer, footer_copyright: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="settings-subsection">
          <h4 className="settings-subsection__title">🌐 Social Media Links</h4>
          <div className="settings-grid">
            {[
              { key: 'footer_twitter', icon: FiTwitter, label: 'Twitter URL' },
              { key: 'footer_instagram', icon: FiInstagram, label: 'Instagram URL' },
              { key: 'footer_linkedin', icon: FiLinkedin, label: 'LinkedIn URL' },
              { key: 'footer_youtube', icon: FiYoutube, label: 'YouTube URL' },
              { key: 'footer_github', icon: FiGithub, label: 'GitHub URL' },
            ].map(({ key, icon: Icon, label }) => (
              <div className="form-group" key={key}>
                <label className="form-label"><Icon size={12} /> {label}</label>
                <input className="form-input" type="url" placeholder="https://..."
                  value={footer[key] === '#' ? '' : footer[key]}
                  onChange={e => setFooter({ ...footer, [key]: e.target.value || '#' })} />
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="footer-preview">
          <div className="footer-preview__label">👁️ Live Preview</div>
          <div className="footer-preview__box">
            <p className="footer-preview__tagline">{footer.footer_tagline || '—'}</p>
            <div className="footer-preview__contact">
              {footer.footer_address && <span>📍 {footer.footer_address}</span>}
              {footer.footer_phone && <span>📞 {footer.footer_phone}</span>}
              {footer.footer_email && <span>✉️ {footer.footer_email}</span>}
            </div>
            <p className="footer-preview__copyright">{footer.footer_copyright || '—'}</p>
          </div>
        </div>

        <button className="btn btn-primary" onClick={saveFooter} style={{ marginTop: 8 }}>
          <FiGlobe size={15} /> {footerSaved ? '✓ Footer Updated!' : 'Save Footer Settings'}
        </button>
      </div>

      {/* ── Map Settings ───────────────────────────────── */}
      <div className="settings-section glass">
        <div className="settings-section__header">
          <h3 className="settings-section__title">🗺️ Shop Location Map</h3>
          <span className="settings-section__badge">Live on website</span>
        </div>
        <p className="settings-section__desc">Set your shop location — it will appear as an interactive map at the bottom of the website footer.</p>

        <div className="settings-subsection">
          <h4 className="settings-subsection__title">📍 Map Configuration</h4>
          <div className="settings-grid">
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">
                <FiMapPin size={12} /> Shop Location
                <span style={{ marginLeft: 8, fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>
                  Enter city, address or landmark (e.g. "Connaught Place, New Delhi")
                </span>
              </label>
              <input
                className="form-input"
                placeholder="e.g. Bengaluru, Karnataka, India"
                value={footer.footer_map_location}
                onChange={e => handleMapLocationChange(e.target.value)}
              />
            </div>

            {/* Show / Hide toggle */}
            <div className="form-group">
              <label className="form-label">Show Map on Website</label>
              <div className="map-toggle-row">
                <label className="map-toggle">
                  <input
                    type="checkbox"
                    checked={footer.footer_map_show === 'true'}
                    onChange={e => setFooter(f => ({ ...f, footer_map_show: e.target.checked ? 'true' : 'false' }))}
                  />
                  <span className="map-toggle__track">
                    <span className="map-toggle__thumb" />
                  </span>
                </label>
                <span style={{ fontSize: '0.85rem', color: footer.footer_map_show === 'true' ? '#00FF94' : 'rgba(255,255,255,0.3)' }}>
                  {footer.footer_map_show === 'true' ? 'Visible' : 'Hidden'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Map Preview */}
        <div className="map-admin-preview">
          <div className="map-admin-preview__label">
            🗺️ Live Map Preview
            <span style={{ marginLeft: 8, fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>
              (updates 0.8s after you stop typing)
            </span>
          </div>
          <div className="map-admin-preview__wrap">
            {footer.footer_map_show === 'true' ? (
              <>
                <iframe
                  key={mapEmbedURL}
                  title="Admin Map Preview"
                  src={mapEmbedURL}
                  className="map-admin-preview__iframe"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
                <div className="map-admin-preview__badge">
                  <FiMapPin size={11} />
                  {footer.footer_map_location || 'No location set'}
                </div>
              </>
            ) : (
              <div className="map-admin-preview__hidden">
                <span style={{ fontSize: '2rem' }}>🗺️</span>
                <p>Map is hidden — toggle "Show Map" to enable it</p>
              </div>
            )}
          </div>
        </div>

        <button className="btn btn-primary" onClick={saveFooter} style={{ marginTop: 8 }}>
          <FiMapPin size={15} /> {footerSaved ? '✓ Map Saved!' : 'Save Map Settings'}
        </button>
      </div>

      {/* ── Coupon Management ─────────────────────────── */}

      <div className="settings-section glass">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 className="settings-section__title">🏷️ Coupon Management</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? <><FiX /> Cancel</> : <><FiPlus /> Add Coupon</>}
          </button>
        </div>

        {showForm && (
          <div className="settings-coupon-form glass" style={{ marginBottom: 20 }}>
            <div className="settings-grid">
              <div className="form-group"><label className="form-label">Code *</label><input className="form-input" placeholder="WELCOME10" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
              <div className="form-group"><label className="form-label">Discount %</label><input className="form-input" type="number" placeholder="10" value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: e.target.value, discount_amount: '' })} /></div>
              <div className="form-group"><label className="form-label">Discount Amount ₹</label><input className="form-input" type="number" placeholder="100" value={form.discount_amount} onChange={e => setForm({ ...form, discount_amount: e.target.value, discount_percent: '' })} /></div>
              <div className="form-group"><label className="form-label">Min Order (₹)</label><input className="form-input" type="number" value={form.min_order} onChange={e => setForm({ ...form, min_order: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Max Uses</label><input className="form-input" type="number" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Expires At</label><input className="form-input" type="datetime-local" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} /></div>
            </div>
            <button className="btn btn-primary" onClick={saveCoupon} disabled={saving}>{saving ? 'Creating...' : 'Create Coupon'}</button>
          </div>
        )}

        <div className="admin-table-wrap" style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
          <table className="admin-table">
            <thead><tr><th>Code</th><th>Discount</th><th>Min Order</th><th>Usage</th><th>Expires</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {loading ? [...Array(3)].map((_, i) => <tr key={i}><td colSpan={7}><div className="skeleton" style={{ height: 40 }} /></td></tr>)
                : coupons.map(c => (
                  <tr key={c.id}>
                    <td><code style={{ background: 'rgba(0,217,255,0.08)', color: 'var(--neon-blue)', padding: '3px 8px', borderRadius: 6, fontSize: '0.85rem', fontWeight: 700 }}>{c.code}</code></td>
                    <td style={{ fontWeight: 700 }}>{c.discount_percent ? `${c.discount_percent}%` : `₹${c.discount_amount}`}</td>
                    <td>₹{c.min_order || 0}</td>
                    <td><span className="badge badge-blue">{c.used_count || 0}{c.max_uses ? `/${c.max_uses}` : ''}</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}</td>
                    <td><span className={`badge ${c.is_active ? 'badge-green' : 'badge-muted'}`}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td><button className="btn btn-ghost btn-sm" style={{ color: 'var(--neon-pink)' }} onClick={() => deleteCoupon(c.id)}><FiTrash2 size={14} /></button></td>
                  </tr>
                ))}
            </tbody>
          </table>
          {!loading && coupons.length === 0 && <div className="admin-table__empty">No coupons yet</div>}
        </div>
      </div>
    </div>
  );
}
