import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiGrid, FiPackage, FiShoppingBag, FiUsers, FiTag, FiStar, FiBox, FiBarChart2, FiSettings, FiLogOut, FiMenu, FiX, FiChevronRight, FiCode } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './AdminSidebar.css';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/admin/products', label: 'Products', icon: FiPackage },
  { to: '/admin/orders', label: 'Orders', icon: FiShoppingBag },
  { to: '/admin/users', label: 'Users', icon: FiUsers },
  { to: '/admin/categories', label: 'Categories', icon: FiTag },
  { to: '/admin/reviews', label: 'Reviews', icon: FiStar },
  { to: '/admin/projects', label: 'Projects', icon: FiCode },
  { to: '/admin/inventory', label: 'Inventory', icon: FiBox },
  { to: '/admin/analytics', label: 'Analytics', icon: FiBarChart2 },
  { to: '/admin/settings', label: 'Settings', icon: FiSettings },
];

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      className={`admin-sidebar ${collapsed ? 'admin-sidebar--collapsed' : ''}`}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Logo */}
      <div className="admin-sidebar__header">
        <Link to="/admin" className="admin-sidebar__logo">
          <span className="admin-sidebar__logo-icon">⬡</span>
          {!collapsed && <span className="admin-sidebar__logo-text">Half<span className="text-gradient">Robo</span></span>}
        </Link>
        <button className="admin-sidebar__collapse" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <FiMenu size={18} /> : <FiX size={18} />}
        </button>
      </div>

      {!collapsed && (
        <div className="admin-sidebar__user">
          <div className="admin-sidebar__avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div className="admin-sidebar__user-name">{user?.name}</div>
            <div className="admin-sidebar__user-role">Administrator</div>
          </div>
        </div>
      )}

      {!collapsed && <div className="admin-sidebar__section-label">Main Menu</div>}

      <nav className="admin-sidebar__nav">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''} ${collapsed ? 'admin-sidebar__link--icon-only' : ''}`}
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={20} className="admin-sidebar__link-icon" />
            {!collapsed && <span>{item.label}</span>}
            {!collapsed && <FiChevronRight size={14} className="admin-sidebar__link-arrow" />}
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar__footer">
        {!collapsed && <div className="admin-sidebar__divider" />}
        <Link to="/" className={`admin-sidebar__link ${collapsed ? 'admin-sidebar__link--icon-only' : ''}`} title="View Site">
          <FiGrid size={20} />
          {!collapsed && <span>View Site</span>}
        </Link>
        <button onClick={logout} className={`admin-sidebar__link admin-sidebar__link--danger ${collapsed ? 'admin-sidebar__link--icon-only' : ''}`} title="Logout">
          <FiLogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
}
