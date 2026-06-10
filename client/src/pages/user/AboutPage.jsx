import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiZap, FiAward, FiGlobe, FiUsers } from 'react-icons/fi';
import './AboutPage.css';

const team = [
  { name: 'Aditya Kumar', role: 'CEO & Co-Founder', emoji: '👨‍💼', bio: 'Ex-NVIDIA, MIT AI Lab. 15 years in robotics.' },
  { name: 'Priya Sharma', role: 'CTO & Co-Founder', emoji: '👩‍💻', bio: 'PhD Robotics, Carnegie Mellon. Former Boston Dynamics.' },
  { name: 'Rahul Verma', role: 'Head of Hardware', emoji: '🧑‍🔬', bio: 'IIT Bombay. 10+ patents in embedded systems.' },
  { name: 'Sana Kapoor', role: 'Head of AI Research', emoji: '👩‍🔬', bio: 'PhD Computer Vision, IISc Bangalore.' },
];
const milestones = [
  { year: '2019', event: 'HalfRobo founded in Bengaluru with 5-member team' },
  { year: '2020', event: 'Seed funding of ₹10Cr raised. First AI robot prototype' },
  { year: '2021', event: 'Series A ₹50Cr. Launched NeuroBot X1 to the market' },
  { year: '2022', event: 'Expanded to 10 countries. 10,000 customers milestone' },
  { year: '2023', event: 'Series B ₹200Cr. Launched IoT & Smart Home product line' },
  { year: '2024', event: '50,000+ customers. 500+ products. Global operations in 45 countries' },
];
const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

export default function AboutPage() {
  return (
    <div className="about-page page-enter">
      {/* Hero */}
      <section className="about-hero">
        <div className="about-hero__bg" />
        <div className="container about-hero__inner">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="section-tag">Our Story</motion.div>
            <motion.h1 variants={fadeUp} className="heading-hero about-hero__title">
              We Build The <span className="text-gradient">Future</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="about-hero__sub">
              HalfRobo was born from a simple belief: intelligent machines should empower humanity, not replace it. Since 2019, we've been engineering AI robotics and IoT solutions that make life smarter, safer, and more extraordinary.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Mission */}
      <section className="section" id="mission">
        <div className="container">
          <div className="about-mission">
            <motion.div className="about-mission__text" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="section-tag">Our Mission</div>
              <h2 className="heading-xl" style={{ marginTop: 16, marginBottom: 20 }}>Democratizing <span className="text-gradient">AI Robotics</span></h2>
              <p className="text-secondary" style={{ lineHeight: 1.8, fontSize: '1rem' }}>We believe cutting-edge AI and robotics shouldn't be confined to research labs and Fortune 500 companies. Our mission is to make intelligent automation accessible to everyone — from individual innovators and students to growing businesses and enterprises worldwide.</p>
              <div className="about-mission__values">
                {[{ icon: FiZap, label: 'Innovation First', desc: 'We push boundaries every single day' },
                  { icon: FiAward, label: 'Quality Obsessed', desc: 'No compromises on reliability or safety' },
                  { icon: FiGlobe, label: 'Global Impact', desc: 'Building technology for all of humanity' },
                ].map(v => (
                  <div key={v.label} className="about-value glass">
                    <v.icon size={20} className="about-value__icon" />
                    <div><div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{v.label}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{v.desc}</div></div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div className="about-mission__visual" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="about-robot-card glass">
                <div style={{ fontSize: '6rem', marginBottom: 16, filter: 'drop-shadow(0 0 20px rgba(0,217,255,0.4))' }} className="animate-float">🤖</div>
                <div className="about-stats-grid">
                  {[['500+', 'Products'], ['50K+', 'Customers'], ['45+', 'Countries'], ['4.9★', 'Rating']].map(([n, l]) => (
                    <div key={l} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 900, color: 'var(--neon-blue)' }}>{n}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section" id="team">
        <div className="container">
          <motion.div className="section-header" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="section-tag"><FiUsers size={13} /> The Team</motion.div>
            <motion.h2 variants={fadeUp} className="heading-xl section-title">Brilliant <span className="text-gradient">Minds</span></motion.h2>
            <motion.p variants={fadeUp} className="section-subtitle">World-class engineers, researchers and visionaries united by one goal: build machines that matter.</motion.p>
          </motion.div>
          <div className="about-team">
            {team.map((m, i) => (
              <motion.div key={m.name} className="team-card glass" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -8 }}>
                <div className="team-card__avatar">{m.emoji}</div>
                <h3 className="team-card__name">{m.name}</h3>
                <p className="team-card__role">{m.role}</p>
                <p className="team-card__bio">{m.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section about-timeline-section">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Our Journey</div>
            <h2 className="heading-xl section-title">From <span className="text-gradient">Garage to Global</span></h2>
          </div>
          <div className="about-timeline">
            {milestones.map((m, i) => (
              <motion.div key={m.year} className="timeline-item" initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="timeline-item__year">{m.year}</div>
                <div className="timeline-item__dot" />
                <div className="timeline-item__content glass">{m.event}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="heading-xl">Ready to <span className="text-gradient">Experience</span> HalfRobo?</h2>
            <p className="section-subtitle" style={{ margin: '16px auto 32px' }}>Join thousands of forward-thinkers who are already living in the future.</p>
            <Link to="/products" className="btn btn-primary btn-lg">Shop Now <FiArrowRight /></Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
