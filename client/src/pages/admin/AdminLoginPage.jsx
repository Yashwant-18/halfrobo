import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield, FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import './AdminLoginPage.css';

/* ── Animated Grid Background ────────────────────────── */
function GridBackground() {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    let t = 0;
    const draw = () => {
      t += 0.004;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Pulsing dots grid
      const spacing = 50;
      const cols = Math.ceil(canvas.width  / spacing) + 1;
      const rows = Math.ceil(canvas.height / spacing) + 1;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = c * spacing;
          const y = r * spacing;
          const pulse = Math.sin(t + c * 0.3 + r * 0.3) * 0.5 + 0.5;
          const alpha = pulse * 0.12;
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(123, 97, 255, ${alpha})`;
          ctx.fill();
        }
      }

      // Scanning line
      const scanY = ((t * 80) % (canvas.height + 40)) - 20;
      const grad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
      grad.addColorStop(0,   'rgba(123,97,255,0)');
      grad.addColorStop(0.5, 'rgba(123,97,255,0.06)');
      grad.addColorStop(1,   'rgba(123,97,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 20, canvas.width, 40);

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="admin-canvas" />;
}

/* ── Shield Pulse Icon ───────────────────────────────── */
function ShieldIcon() {
  return (
    <div className="admin-shield-wrap">
      <motion.div
        className="admin-shield-ring admin-shield-ring-1"
        animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="admin-shield-ring admin-shield-ring-2"
        animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
      <motion.div
        className="admin-shield-core"
        animate={{ boxShadow: [
          '0 0 20px rgba(123,97,255,0.4), 0 0 60px rgba(123,97,255,0.15)',
          '0 0 40px rgba(123,97,255,0.7), 0 0 80px rgba(123,97,255,0.3)',
          '0 0 20px rgba(123,97,255,0.4), 0 0 60px rgba(123,97,255,0.15)',
        ]}}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <FiShield className="admin-shield-icon" />
      </motion.div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────── */
export default function AdminLoginPage() {
  const { adminLogin, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  // Redirect if already admin
  useEffect(() => {
    if (user && isAdmin) navigate('/admin', { replace: true });
  }, [user, isAdmin, navigate]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return toast.error('All fields are required');

    setLoading(true);
    try {
      const loggedUser = await adminLogin(email.trim(), password);
      if (loggedUser?.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
        localStorage.removeItem('halfrobo_token');
        localStorage.removeItem('halfrobo_user');
        return;
      }
      toast.success('Admin access granted ⚡');
      navigate('/admin', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Authentication failed. Access denied.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [email, password, adminLogin, navigate]);

  /* variants */
  const cardV = {
    hidden:  { opacity: 0, scale: 0.9, y: 30 },
    visible: { opacity: 1, scale: 1,   y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  };
  const itemV = {
    hidden:  { opacity: 0, y: 14 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: 0.3 + i * 0.08, duration: 0.4 } }),
  };

  return (
    <div className="admin-login-page">
      <GridBackground />

      {/* Corner decorations */}
      <div className="admin-corner admin-corner-tl" aria-hidden />
      <div className="admin-corner admin-corner-tr" aria-hidden />
      <div className="admin-corner admin-corner-bl" aria-hidden />
      <div className="admin-corner admin-corner-br" aria-hidden />

      <div className="admin-login-center">
        <motion.div
          className="admin-login-card glass"
          variants={cardV}
          initial="hidden"
          animate="visible"
        >
          {/* Top glow line */}
          <div className="admin-card-top-line" />

          {/* Shield */}
          <motion.div
            custom={0} variants={itemV} initial="hidden" animate="visible"
            className="admin-header"
          >
            <ShieldIcon />
            <div className="admin-header-text">
              <h1 className="heading-lg admin-title admin-purple-text">Admin Portal</h1>
              <p className="text-muted admin-subtitle">HalfRobo Control Center</p>
            </div>
          </motion.div>

          {/* Warning Banner */}
          <motion.div
            custom={1} variants={itemV} initial="hidden" animate="visible"
            className="admin-warning glass"
          >
            <FiAlertTriangle className="admin-warning-icon" />
            <p className="admin-warning-text">
              Restricted access. Admin credentials required. Unauthorized attempts are logged.
            </p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="admin-form" noValidate>
            {/* Email */}
            <motion.div custom={2} variants={itemV} initial="hidden" animate="visible" className="form-group">
              <label className="form-label admin-label" htmlFor="admin-email">Admin Email</label>
              <div className="admin-input-wrap">
                <FiMail className="admin-input-icon" />
                <input
                  id="admin-email" type="email"
                  className="form-input admin-input"
                  placeholder="admin@halfrobo.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  autoComplete="email" required
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div custom={3} variants={itemV} initial="hidden" animate="visible" className="form-group">
              <label className="form-label admin-label" htmlFor="admin-pass">Admin Password</label>
              <div className="admin-input-wrap">
                <FiLock className="admin-input-icon" />
                <input
                  id="admin-pass" type={showPass ? 'text' : 'password'}
                  className="form-input admin-input"
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password" required
                />
                <button
                  type="button" className="admin-eye-btn"
                  onClick={() => setShowPass(v => !v)}
                  aria-label="Toggle password visibility"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={showPass ? 'off' : 'on'}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.15 }}
                    >
                      {showPass ? <FiEyeOff /> : <FiEye />}
                    </motion.span>
                  </AnimatePresence>
                </button>
              </div>
            </motion.div>

            {/* Submit */}
            <motion.button
              custom={4} variants={itemV} initial="hidden" animate="visible"
              type="submit"
              className="btn admin-submit-btn btn-lg"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              {loading ? (
                <span className="spinner admin-spinner" />
              ) : (
                <> <FiShield /> Authenticate &amp; Enter </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <motion.div
            custom={5} variants={itemV} initial="hidden" animate="visible"
            className="admin-footer"
          >
            <Link to="/login" className="admin-back-link">
              <FiArrowLeft /> Back to User Login
            </Link>
            <p className="text-muted admin-copyright">
              HalfRobo Admin v2.0
            </p>
          </motion.div>

          {/* Bottom glow line */}
          <div className="admin-card-bottom-line" />
        </motion.div>
      </div>
    </div>
  );
}
