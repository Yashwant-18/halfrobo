import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShoppingCart, FiMenu, FiX, FiUser, FiLogOut, FiPackage, FiHeart, FiChevronDown, FiSettings } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const { itemCount, setIsOpen } = useCart();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close menus on route change
  useEffect(() => { setMobileOpen(false); setUserMenuOpen(false); }, []);

  // Close dropdown when clicking OUTSIDE the menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Products' },
    { to: '/3d-print', label: '🖨️ 3D Print' },
    { to: '/projects', label: 'Projects' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
        <div className="container navbar__inner">
          {/* Logo */}
          <Link to="/" className="navbar__logo" onClick={() => setMobileOpen(false)}>
            <span className="navbar__logo-icon">⬡</span>
            <span className="navbar__logo-text">HALF<span className="text-gradient">ROBO</span></span>
          </Link>

          {/* Desktop Nav Links */}
          <ul className="navbar__links">
            {navLinks.map(link => (
              <li key={link.to}>
                <NavLink to={link.to} end={link.to === '/'} className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Right Actions */}
          <div className="navbar__actions">
            {/* Cart */}
            <button className="navbar__cart-btn" onClick={() => setIsOpen(true)} aria-label="Open cart">
              <FiShoppingCart size={20} />
              {itemCount > 0 && (
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="navbar__cart-badge"
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </motion.span>
              )}
            </button>

            {/* User Menu / Auth Buttons */}
            {user ? (
              <div className="navbar__user-menu" ref={userMenuRef}>
                <button className="navbar__user-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                  <div className="navbar__avatar">{user.name?.[0]?.toUpperCase()}</div>
                  <span className="navbar__user-name">{user.name?.split(' ')[0]}</span>
                  <FiChevronDown size={14} className={`navbar__chevron ${userMenuOpen ? 'navbar__chevron--open' : ''}`} />
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      className="navbar__dropdown glass"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="navbar__dropdown-header">
                        <div className="navbar__avatar navbar__avatar--lg">{user.name?.[0]?.toUpperCase()}</div>
                        <div>
                          <div className="navbar__dropdown-name">{user.name}</div>
                          <div className="navbar__dropdown-email">{user.email}</div>
                        </div>
                      </div>
                      <div className="navbar__dropdown-divider" />
                      {isAdmin && (
                        <Link to="/admin" className="navbar__dropdown-item" onClick={() => setUserMenuOpen(false)}>
                          <FiSettings size={16} /> Admin Panel
                        </Link>
                      )}
                      <Link to="/dashboard" className="navbar__dropdown-item" onClick={() => setUserMenuOpen(false)}>
                        <FiUser size={16} /> My Profile
                      </Link>
                      <Link to="/dashboard/orders" className="navbar__dropdown-item" onClick={() => setUserMenuOpen(false)}>
                        <FiPackage size={16} /> My Orders
                      </Link>
                      <Link to="/dashboard/wishlist" className="navbar__dropdown-item" onClick={() => setUserMenuOpen(false)}>
                        <FiHeart size={16} /> Wishlist
                      </Link>
                      <div className="navbar__dropdown-divider" />
                      <button className="navbar__dropdown-item navbar__dropdown-item--danger" onClick={logout}>
                        <FiLogOut size={16} /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="navbar__auth">
                <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button className="navbar__hamburger" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
              {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div className="navbar__overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
            <motion.div
              className="navbar__mobile glass"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="navbar__mobile-header">
                <span className="navbar__logo-text">Half<span className="text-gradient">Robo</span></span>
                <button onClick={() => setMobileOpen(false)}><FiX size={24} /></button>
              </div>
              {user && (
                <div className="navbar__mobile-user">
                  <div className="navbar__avatar navbar__avatar--lg">{user.name?.[0]?.toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{user.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
                  </div>
                </div>
              )}
              <ul className="navbar__mobile-links">
                {navLinks.map((link, i) => (
                  <motion.li key={link.to} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <NavLink to={link.to} end={link.to === '/'} className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>
                      {link.label}
                    </NavLink>
                  </motion.li>
                ))}
                {user && isAdmin && (
                  <motion.li initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                    <Link to="/admin" className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>Admin Panel</Link>
                  </motion.li>
                )}
                {user && (
                  <motion.li initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                    <Link to="/dashboard" className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>My Account</Link>
                  </motion.li>
                )}
              </ul>
              <div className="navbar__mobile-actions">
                {user ? (
                  <button className="btn btn-danger full-width" onClick={() => { logout(); setMobileOpen(false); }}>
                    <FiLogOut /> Sign Out
                  </button>
                ) : (
                  <>
                    <Link to="/login" className="btn btn-ghost full-width" onClick={() => setMobileOpen(false)}>Login</Link>
                    <Link to="/register" className="btn btn-primary full-width" onClick={() => setMobileOpen(false)}>Get Started</Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
