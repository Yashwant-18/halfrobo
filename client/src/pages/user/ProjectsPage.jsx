import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGithub, FiExternalLink, FiDownload, FiCode, FiCpu, FiZap, FiStar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../../utils/api';
import './ProjectsPage.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DEMO_PROJECTS = [
  {
    id: 1, name: 'NeuroBot Controller',
    description: 'Full-stack robot control dashboard with real-time telemetry, sensor data visualization, and AI-powered navigation commands.',
    tech_stack: ['React', 'Node.js', 'WebSocket', 'Python', 'Arduino'], images: [],
    github_url: 'https://github.com/Yashwant-18', live_url: '', is_featured: true, category: 'Robotics',
  },
  {
    id: 2, name: 'IoT Smart Home Hub',
    description: 'Centralized IoT device management system with MQTT protocol, voice control integration, and energy monitoring dashboard.',
    tech_stack: ['Vue.js', 'MQTT', 'Node-RED', 'MongoDB', 'Raspberry Pi'], images: [],
    github_url: 'https://github.com/Yashwant-18', live_url: '', is_featured: true, category: 'IoT',
  },
  {
    id: 3, name: 'Drone Path Planner',
    description: 'Autonomous drone path planning algorithm using A* search with obstacle avoidance, GPS waypoints, and live map visualization.',
    tech_stack: ['Python', 'OpenCV', 'Flask', 'Leaflet.js', 'ROS'], images: [],
    github_url: 'https://github.com/Yashwant-18', live_url: '', is_featured: false, category: 'Drones',
  },
  {
    id: 4, name: 'HalfRobo Platform',
    description: 'Full-stack AI robotics e-commerce platform with admin panel, real-time inventory, JWT auth, and cloud deployment.',
    tech_stack: ['React', 'Node.js', 'PostgreSQL', 'Vite', 'Render', 'Vercel'], images: [],
    github_url: 'https://github.com/Yashwant-18/halfrobo',
    live_url: 'https://halfrobo-api.onrender.com/api/health', is_featured: true, category: 'Web App',
  },
];

const CATEGORY_COLORS = {
  Robotics: 'var(--neon-blue)', IoT: 'var(--neon-green)',
  Drones: 'var(--neon-purple)', 'Web App': 'var(--neon-pink)',
  AI: 'var(--neon-blue)', Hardware: '#FFB800',
};

/* ── Image Carousel ───────────────────────────────────────── */
function ImageCarousel({ images, name, category }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  const color = CATEGORY_COLORS[category] || 'var(--neon-blue)';

  const startAuto = useCallback(() => {
    if (images.length <= 1) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % images.length), 3000);
  }, [images.length]);

  useEffect(() => { startAuto(); return () => clearInterval(timerRef.current); }, [startAuto]);

  const go = (dir) => {
    setIdx(i => (i + dir + images.length) % images.length);
    startAuto();
  };

  if (!images || images.length === 0) {
    return (
      <div className="carousel carousel--placeholder">
        <FiCode size={40} style={{ color }} />
        <span>{category || 'Project'}</span>
      </div>
    );
  }

  const src = images[idx].startsWith('http') ? images[idx] : `${API_BASE}${images[idx]}`;

  return (
    <div className="carousel" onMouseEnter={() => clearInterval(timerRef.current)} onMouseLeave={startAuto}>
      <AnimatePresence mode="wait">
        <motion.img
          key={idx}
          src={src} alt={`${name} ${idx + 1}`}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.35 }}
          className="carousel__img"
        />
      </AnimatePresence>

      {images.length > 1 && (
        <>
          <button className="carousel__btn carousel__btn--prev" onClick={() => go(-1)}><FiChevronLeft size={16} /></button>
          <button className="carousel__btn carousel__btn--next" onClick={() => go(1)}><FiChevronRight size={16} /></button>
          <div className="carousel__dots">
            {images.map((_, i) => (
              <button
                key={i} className={`carousel__dot ${i === idx ? 'carousel__dot--active' : ''}`}
                style={i === idx ? { background: color } : {}}
                onClick={() => { setIdx(i); startAuto(); }}
              />
            ))}
          </div>
          <span className="carousel__counter">{idx + 1}/{images.length}</span>
        </>
      )}
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────── */
const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' } }),
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState(DEMO_PROJECTS);
  const [filter, setFilter]     = useState('All');
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/projects')
      .then(r => { if (r.data?.data?.length > 0) setProjects(r.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...new Set(projects.map(p => p.category).filter(Boolean))];
  const filtered   = filter === 'All' ? projects : projects.filter(p => p.category === filter);

  return (
    <div className="projects-page">
      {/* Hero */}
      <section className="projects-hero">
        <div className="projects-hero__bg" />
        <div className="container">
          <motion.div className="projects-hero__content" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="projects-hero__badge"><FiCpu size={14} /> Open Source Projects</span>
            <h1 className="projects-hero__title">Built with <span className="text-gradient">Code & Passion</span></h1>
            <p className="projects-hero__desc">Real-world robotics, IoT, and AI projects — all open source. Browse, download, and build.</p>
            <div className="projects-hero__stats">
              <div className="projects-hero__stat"><span className="projects-hero__stat-num">{projects.length}+</span><span>Projects</span></div>
              <div className="projects-hero__stat-divider" />
              <div className="projects-hero__stat"><span className="projects-hero__stat-num">{projects.filter(p => p.is_featured).length}</span><span>Featured</span></div>
              <div className="projects-hero__stat-divider" />
              <div className="projects-hero__stat"><span className="projects-hero__stat-num">100%</span><span>Open Source</span></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="projects-filter">
        <div className="container">
          <div className="projects-filter__tabs">
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)} className={`projects-filter__tab ${filter === cat ? 'active' : ''}`}>{cat}</button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="projects-grid-section">
        <div className="container">
          {loading ? (
            <div className="projects-loading">{[1,2,3,4].map(i => <div key={i} className="projects-skeleton" />)}</div>
          ) : (
            <div className="projects-grid">
              {filtered.map((project, i) => (
                <motion.div
                  key={project.id}
                  className={`project-card glass ${project.is_featured ? 'project-card--featured' : ''}`}
                  custom={i} variants={cardVariants}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                >
                  {/* Dynamic Image Carousel */}
                  <div className="project-card__preview">
                    <ImageCarousel images={Array.isArray(project.images) ? project.images : []} name={project.name} category={project.category} />
                    {project.is_featured && <span className="project-card__featured-badge"><FiStar size={11} /> Featured</span>}
                    <span className="project-card__category" style={{ borderColor: CATEGORY_COLORS[project.category] || 'var(--neon-blue)', color: CATEGORY_COLORS[project.category] || 'var(--neon-blue)' }}>
                      {project.category}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="project-card__content">
                    <h3 className="project-card__name">{project.name}</h3>
                    <p className="project-card__desc">{project.description}</p>
                    <div className="project-card__stack">
                      {(project.tech_stack || []).map(tech => <span key={tech} className="project-card__tech">{tech}</span>)}
                    </div>
                    <div className="project-card__actions">
                      {project.github_url && <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm"><FiGithub size={15} /> GitHub</a>}
                      {project.live_url && <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm"><FiExternalLink size={15} /> Live Demo</a>}
                      {project.code_download_url && <a href={project.code_download_url} download className="btn btn-primary btn-sm"><FiDownload size={15} /> Download Code</a>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          {filtered.length === 0 && !loading && (
            <div className="projects-empty">
              <FiZap size={48} /><h3>No projects in this category</h3>
              <button className="btn btn-primary" onClick={() => setFilter('All')}>View All</button>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="projects-cta">
        <div className="container">
          <motion.div className="projects-cta__box glass" initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <FiGithub size={40} className="projects-cta__icon" />
            <h2>Want to Contribute?</h2>
            <p>All projects are open source. Fork, star, and submit pull requests on GitHub.</p>
            <a href="https://github.com/Yashwant-18" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              <FiGithub size={18} /> Visit GitHub Profile
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
