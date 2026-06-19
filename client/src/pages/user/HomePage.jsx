import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { FiArrowRight, FiZap, FiShield, FiCpu, FiWifi, FiUsers, FiStar, FiChevronDown, FiPlus, FiMinus } from 'react-icons/fi';
import api from '../../utils/api';
import ProductCard from '../../components/product/ProductCard';
import ParticleBackground from '../../components/ui/ParticleBackground';
import './HomePage.css';

// ─── Animated Counter ────────────────────────────────────────
function Counter({ end, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end]);
  return <span ref={ref}>{prefix}{count.toLocaleString('en-IN')}{suffix}</span>;
}

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } } };
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

const features = [
  { icon: FiCpu, title: 'Neural AI Core', desc: 'Advanced neural networks that learn, adapt, and evolve with every interaction in real time.' },
  { icon: FiZap, title: 'Lightning Performance', desc: 'Sub-millisecond response times powered by custom silicon and edge computing architecture.' },
  { icon: FiShield, title: 'Military-Grade Security', desc: 'End-to-end encrypted communications with biometric authentication and tamper detection.' },
  { icon: FiWifi, title: 'Connected Ecosystem', desc: 'Seamless IoT integration with over 10,000 compatible devices across all major protocols.' },
];

const stats = [
  { end: 500, suffix: '+', label: 'Products' },
  { end: 50000, suffix: '+', label: 'Happy Customers' },
  { end: 45, suffix: '+', label: 'Countries' },
  { end: 120, suffix: '+', label: 'Awards' },
];

const testimonials = [
  { name: 'Arjun Mehta', role: 'CTO, Innovatech', rating: 5, text: 'HalfRobo\'s industrial arm transformed our manufacturing line. ROI achieved in just 4 months. Absolutely revolutionary technology.' },
  { name: 'Sarah Chen', role: 'Smart Home Enthusiast', rating: 5, text: 'The SmartHub Infinity literally changed how I live. My entire home is now intelligently automated. Best purchase of my life.' },
  { name: 'Dr. Priya Kapoor', role: 'Research Director', rating: 5, text: 'The NanoBot Scout has accelerated our lab research by 10x. The AI navigation is eerily accurate. Truly next-gen hardware.' },
  { name: 'Rahul Sharma', role: 'Security Consultant', rating: 5, text: 'VisionGuard AI detected a security breach our human team missed. The AI detection accuracy is phenomenal. Outstanding product.' },
];

const partners = ['NVIDIA', 'Intel', 'Qualcomm', 'ARM', 'Samsung', 'Boston Dynamics', 'OpenAI', 'Tesla'];

const faqs = [
  { q: 'How does HalfRobo\'s AI technology work?', a: 'Our products are powered by proprietary neural network architectures trained on billions of data points. Each device runs local AI inference with cloud-backed continuous learning, ensuring it gets smarter over time.' },
  { q: 'What warranty do HalfRobo products come with?', a: 'All HalfRobo products come with a 2-year comprehensive warranty covering manufacturing defects, hardware failures, and software malfunctions. Extended warranty plans up to 5 years are available.' },
  { q: 'Do your robots require internet connectivity?', a: 'Our robots operate fully autonomously offline using edge AI processing. Internet connectivity enhances features like cloud backups, remote monitoring, and OTA updates, but is not required for core functions.' },
  { q: 'Can I integrate HalfRobo devices with existing smart home systems?', a: 'Absolutely! All our IoT and smart home products support Zigbee, Z-Wave, Matter, Apple HomeKit, Google Home, and Amazon Alexa out of the box. Our open API also allows custom integrations.' },
  { q: 'What is your shipping and delivery timeline?', a: 'Standard shipping delivers within 5-7 business days across India. Express delivery (1-2 days) is available for major metros. International shipping is available to 45+ countries.' },
];

const categories = [
  { slug: 'ai-robots', name: 'AI Robots', icon: '🤖', desc: 'Autonomous intelligent robots' },
  { slug: 'drones-uav', name: 'Drones & UAV', icon: '🛸', desc: 'Professional aerial systems' },
  { slug: 'smart-home', name: 'Smart Home', icon: '🏠', desc: 'Connected home automation' },
  { slug: 'security-systems', name: 'Security AI', icon: '🔒', desc: 'AI-powered surveillance' },
  { slug: 'industrial-robotics', name: 'Industrial', icon: '🦾', desc: 'Heavy-duty automation' },
  { slug: 'iot-sensors', name: 'IoT Sensors', icon: '📡', desc: 'Smart sensor networks' },
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products/featured').then(r => setFeaturedProducts(r.data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="home">
      {/* ─── HERO ──────────────────────────────── */}
      <section className="hero">
        <div className="hero__particle-bg"><ParticleBackground count={80} /></div>
        <div className="hero__gradient" />
        <div className="hero__grid" />

        <div className="container hero__content">
          <motion.div
            className="hero__inner"
            initial="hidden" animate="visible" variants={stagger}
          >
            <motion.div variants={fadeUp} className="hero__tag">
              <span className="hero__tag-dot" />
              AI-Powered Robotics • Next Generation Technology
            </motion.div>

            <motion.h1 variants={fadeUp} className="heading-hero hero__title">
              Where <span className="text-gradient">AI</span><br />
              Meets <span className="hero__title-outline">Robotics</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="hero__subtitle">
              Engineering intelligent automation for a smarter tomorrow. Premium AI robotic systems, IoT devices, and autonomous machines that redefine what's possible.
            </motion.p>

            <motion.div variants={fadeUp} className="hero__actions">
              <Link to="/products" className="btn btn-primary btn-lg hero__cta-primary">
                <FiZap size={20} /> Explore Products
              </Link>
              <Link to="/products" className="btn btn-secondary btn-lg">
                Shop Now <FiArrowRight size={18} />
              </Link>
              <Link to="/about" className="btn btn-ghost btn-lg">Learn More</Link>
            </motion.div>

            <motion.div variants={fadeUp} className="hero__meta">
              <div className="hero__meta-item"><span className="hero__meta-num">50K+</span><span>Customers</span></div>
              <div className="hero__meta-sep" />
              <div className="hero__meta-item"><span className="hero__meta-num">4.9★</span><span>Rating</span></div>
              <div className="hero__meta-sep" />
              <div className="hero__meta-item"><span className="hero__meta-num">45+</span><span>Countries</span></div>
            </motion.div>
          </motion.div>

          {/* Floating robot visual */}
          <motion.div className="hero__visual" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.3 }}>
            <div className="hero__robot-container animate-float">
              <div className="hero__robot-glow" />
              <div className="hero__robot-emoji">🤖</div>
              <div className="hero__robot-ring hero__robot-ring--1" />
              <div className="hero__robot-ring hero__robot-ring--2" />
              <div className="hero__robot-ring hero__robot-ring--3" />
            </div>
            <div className="hero__floating-cards">
              <motion.div className="hero__float-card glass" animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0 }}>
                <FiCpu className="hero__float-icon" /> <span>Neural AI v5.0</span>
              </motion.div>
              <motion.div className="hero__float-card glass" animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}>
                <FiShield className="hero__float-icon" /> <span>Military-Grade Security</span>
              </motion.div>
              <motion.div className="hero__float-card glass" animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.8 }}>
                <FiWifi className="hero__float-icon" /> <span>WiFi 6E + 5G</span>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <motion.div className="hero__scroll" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
          <span>Scroll to explore</span>
          <FiChevronDown className="hero__scroll-icon" />
        </motion.div>
      </section>

      {/* ─── CATEGORIES ──────────────────────── */}
      <section className="section home__categories">
        <div className="container">
          <motion.div className="section-header" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="section-tag"><span>Product Lines</span></motion.div>
            <motion.h2 variants={fadeUp} className="heading-xl section-title">Explore Our <span className="text-gradient">Universe</span></motion.h2>
            <motion.p variants={fadeUp} className="section-subtitle">From autonomous robots to smart home ecosystems — discover the full spectrum of HalfRobo innovation.</motion.p>
          </motion.div>
          <div className="categories-grid">
            {categories.map((cat, i) => (
              <motion.div key={cat.slug} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Link to={`/products?category=${cat.slug}`} className="category-card glass glass-hover">
                  <div className="category-card__icon">{cat.icon}</div>
                  <h3 className="category-card__name">{cat.name}</h3>
                  <p className="category-card__desc">{cat.desc}</p>
                  <div className="category-card__arrow"><FiArrowRight /></div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED PRODUCTS ───────────────── */}
      <section className="section home__featured">
        <div className="container">
          <motion.div className="section-header" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="section-tag">🔥 Most Popular</motion.div>
            <motion.h2 variants={fadeUp} className="heading-xl section-title">Featured <span className="text-gradient">Products</span></motion.h2>
            <motion.p variants={fadeUp} className="section-subtitle">Our most sought-after AI robotic systems and IoT devices, handpicked by our engineers.</motion.p>
          </motion.div>
          {loading ? (
            <div className="home__products-loading">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 400, borderRadius: 16 }} />)}
            </div>
          ) : (
            <div className="grid-4">
              {featuredProducts.slice(0, 8).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
          <div className="text-center" style={{ marginTop: 48 }}>
            <Link to="/products" className="btn btn-primary btn-lg">
              View All Products <FiArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── WHY HALFROBO ────────────────────── */}
      <section className="section home__why">
        <div className="home__why-bg" />
        <div className="container">
          <motion.div className="section-header" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="section-tag">Why Choose Us</motion.div>
            <motion.h2 variants={fadeUp} className="heading-xl section-title">Engineering <span className="text-gradient">Excellence</span></motion.h2>
          </motion.div>
          <div className="features-grid">
            {features.map((f, i) => (
              <motion.div key={f.title} className="feature-card glass"
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -8, borderColor: 'rgba(0,217,255,0.3)' }}
              >
                <div className="feature-card__icon-wrap">
                  <f.icon size={26} className="feature-card__icon" />
                </div>
                <h3 className="feature-card__title">{f.title}</h3>
                <p className="feature-card__desc">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ───────────────────────────── */}
      <section className="section home__stats">
        <div className="container">
          <div className="stats-grid">
            {stats.map((s, i) => (
              <motion.div key={s.label} className="stat-card glass"
                initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              >
                <div className="stat-card__num text-gradient">
                  <Counter end={s.end} suffix={s.suffix} prefix={s.prefix} />
                </div>
                <div className="stat-card__label">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ────────────────────── */}
      <section className="section home__testimonials">
        <div className="container">
          <motion.div className="section-header" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="section-tag"><FiStar size={14} /> Customer Stories</motion.div>
            <motion.h2 variants={fadeUp} className="heading-xl section-title">Loved by <span className="text-gradient">Innovators</span></motion.h2>
          </motion.div>
          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} className="testimonial-card glass"
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                whileHover={{ y: -6 }}
              >
                <div className="testimonial-card__stars">
                  {[...Array(t.rating)].map((_, j) => <FiStar key={j} className="star--filled" size={14} />)}
                </div>
                <p className="testimonial-card__text">"{t.text}"</p>
                <div className="testimonial-card__author">
                  <div className="testimonial-card__avatar">{t.name[0]}</div>
                  <div>
                    <div className="testimonial-card__name">{t.name}</div>
                    <div className="testimonial-card__role">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PARTNERS ────────────────── */}
      <section className="section home__partners">
        <div className="container">
          <motion.p className="home__partners-label text-muted text-center" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            Trusted Technology Partners
          </motion.p>
        </div>
        {/* Full-width scrolling strip — outside container so it bleeds edge-to-edge */}
        <div className="partners-viewport">
          <div className="partners-track">
            {[...partners, ...partners].map((p, i) => (
              <div key={i} className="partner-item glass">{p}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────── */}
      <section className="section home__faq">
        <div className="container">
          <motion.div className="section-header" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="section-tag">FAQ</motion.div>
            <motion.h2 variants={fadeUp} className="heading-xl section-title">Got <span className="text-gradient">Questions?</span></motion.h2>
          </motion.div>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <motion.div key={i} className={`faq-item glass ${openFaq === i ? 'faq-item--open' : ''}`}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              >
                <button className="faq-item__question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  <div className="faq-item__icon">{openFaq === i ? <FiMinus /> : <FiPlus />}</div>
                </button>
                {openFaq === i && (
                  <motion.div className="faq-item__answer" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                    {faq.a}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ──────────────────────── */}
      <section className="home__cta-banner">
        <ParticleBackground count={30} />
        <div className="container home__cta-content">
          <motion.h2 className="heading-xl" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            Ready to Join the <span className="text-gradient">Robot Revolution?</span>
          </motion.h2>
          <motion.p className="home__cta-text" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            Thousands of forward-thinking individuals and businesses are already using HalfRobo to automate their world.
          </motion.p>
          <motion.div className="home__cta-actions" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
            <Link to="/products" className="btn btn-primary btn-lg">Shop Now <FiArrowRight /></Link>
            <Link to="/register" className="btn btn-secondary btn-lg">Create Account</Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
