import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin, FiClock, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './ContactPage.css';

const INFO = [
  { icon: FiMapPin, label: 'Address', value: '42, Tech Park, Whitefield\nBengaluru, Karnataka 560066' },
  { icon: FiPhone, label: 'Phone', value: '+91 80 4567 8900' },
  { icon: FiMail, label: 'Email', value: 'support@halfrobo.com' },
  { icon: FiClock, label: 'Business Hours', value: 'Mon – Sat: 9 AM – 7 PM IST\nSun: 10 AM – 4 PM IST' },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const set = k => e => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    toast.success('Message sent! We\'ll respond within 24 hours 🤖');
    setForm({ name: '', email: '', subject: '', message: '' });
    setSending(false);
  };

  return (
    <div className="contact-page page-enter">
      <div className="contact-hero">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <div className="section-tag">Get in Touch</div>
            <h1 className="heading-hero contact-hero__title">Contact <span className="text-gradient">HalfRobo</span></h1>
            <p className="contact-hero__sub">Have a question, feedback, or need help with your order? Our team of AI-powered support specialists (and actual humans!) are here to help.</p>
          </motion.div>
        </div>
      </div>

      <div className="container contact-layout">
        {/* Info Cards */}
        <motion.div className="contact-info" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          {INFO.map(i => (
            <div key={i.label} className="contact-info-card glass">
              <div className="contact-info-card__icon"><i.icon size={22} /></div>
              <div>
                <div className="contact-info-card__label">{i.label}</div>
                <div className="contact-info-card__val">{i.value.split('\n').map((l, j) => <span key={j}>{l}<br /></span>)}</div>
              </div>
            </div>
          ))}
          {/* Map placeholder */}
          <div className="contact-map glass">
            <div style={{ fontSize: '2.5rem' }}>📍</div>
            <div>
              <div style={{ fontWeight: 700 }}>HalfRobo HQ</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>Tech Park, Whitefield, Bengaluru</div>
            </div>
            <div className="contact-map__bg" />
          </div>
        </motion.div>

        {/* Form */}
        <motion.div className="contact-form-card glass" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <h2 className="heading-md" style={{ marginBottom: 24 }}>Send a Message</h2>
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-form__row">
              <div className="form-group">
                <label className="form-label">Your Name</label>
                <input className="form-input" required placeholder="Priyanshu Suman" value={form.name} onChange={set('name')} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" required placeholder="you@example.com" value={form.email} onChange={set('email')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input className="form-input" required placeholder="Order issue, product query, feedback..." value={form.subject} onChange={set('subject')} />
            </div>
            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea className="form-input" rows={5} required placeholder="Describe your query in detail..." value={form.message} onChange={set('message')} style={{ resize: 'vertical' }} />
            </div>
            <button type="submit" className="btn btn-primary btn-lg full-width" disabled={sending}>
              {sending ? <><span className="spinner" /> Sending...</> : <><FiSend /> Send Message</>}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
