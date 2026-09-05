import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';
import { toggleSidebar, setSidebarOpen } from '../../store/slices/uiSlice.js';
import { logoutUser } from '../../store/slices/authSlice.js';
import { 
  LayoutDashboard, 
  Grid,
  FileSpreadsheet, 
  ShieldAlert, 
  BookOpen, 
  UserCircle,
  LogOut,
  Shield,
  Layers,
  CalendarRange,
  Radio,
  X,
  Menu,
  ShoppingBag
} from 'lucide-react';

const NAV_MAIN = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/catalog',     icon: ShoppingBag,     label: 'Items' },
  { to: '/items',       icon: Grid,            label: 'Nomenclature Master' },
  { to: '/vouchers',     icon: FileSpreadsheet, label: 'Voucher Logs' },
  { to: '/condemnations',icon: ShieldAlert,     label: 'Condemnation Boards' },
  { to: '/reports',      icon: BookOpen,        label: 'Stock Ledgers' },
];

const NAV_OPS = [
  { to: '/equipment-sets', icon: Layers,       label: 'Equipment Central' },
  { to: '/tasks',          icon: CalendarRange, label: 'Task Planner' },
  { to: '/rfid-simulator', icon: Radio,         label: 'RFID Simulator' },
];

const SidebarLink = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
    }
  >
    <Icon size={20} />
    <span>{label}</span>
  </NavLink>
);

const Sidebar = () => {
  const { user } = useSelector((state) => state.auth);
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutUser()).then(() => {
      navigate('/login');
    });
  };

  const closeMobile = () => {
    if (window.innerWidth < 992) {
      dispatch(setSidebarOpen(false));
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => dispatch(setSidebarOpen(false))}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar-panel${sidebarOpen ? ' sidebar-open' : ''}`}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Top Header of the Sidebar Partition (extends up to top: 0) */}
        <div className="sidebar-header">
          <div className="d-flex align-items-center gap-2">
            <div className="navbar-brand-icon-box">
              <Shield size={20} className="navbar-brand-shield" />
            </div>
            <span className="navbar-brand-title text-white">
              BEG &amp; Centre
            </span>
          </div>
          <button
            className="sidebar-toggle ms-auto"
            onClick={() => dispatch(toggleSidebar())}
            aria-label="Toggle navigation menu"
          >
            <Menu size={18} color="#FFFFFF" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="sidebar-nav" onClick={closeMobile}>
          {NAV_MAIN.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}

          <div className="sidebar-divider" />
          <span className="sidebar-section-label">Engineer Operations</span>

          {NAV_OPS.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}

          <div className="sidebar-divider" />

          <SidebarLink to="/profile" icon={UserCircle} label="Profile" />
        </nav>

        {/* Logout */}
        <div className="sidebar-logout-wrap">
          <button className="sidebar-logout" onClick={handleLogout}>
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
