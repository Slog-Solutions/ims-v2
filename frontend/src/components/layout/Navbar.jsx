import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebar } from '../../store/slices/uiSlice.js';
import { logoutUser } from '../../store/slices/authSlice.js';
import { useTheme } from '../../context/ThemeContext.jsx';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, Sun, Moon, Bell, LogOut, User,
  Settings, ChevronRight, FileSpreadsheet, ShieldCheck,
  Grid, BookOpen, LayoutDashboard, ShieldAlert, Shield
} from 'lucide-react';
import api from '../../api/api.js';

const PROFILE_MENU = {
  master: [
    { icon: LayoutDashboard, label: 'HQ Dashboard', to: '/dashboard' },
    { icon: Grid, label: 'Nomenclature Master', to: '/items' },
    { icon: FileSpreadsheet, label: 'Vouchers Approval', to: '/vouchers' },
    { icon: ShieldAlert, label: 'Condemnations', to: '/condemnations' },
    { icon: BookOpen, label: 'Stock Ledgers', to: '/reports' },
    { icon: Settings, label: 'Profile Settings', to: '/profile' },
  ],
  establishment: [
    { icon: LayoutDashboard, label: 'Unit Dashboard', to: '/dashboard' },
    { icon: FileSpreadsheet, label: 'My Voucher Logs', to: '/vouchers' },
    { icon: ShieldAlert, label: 'Condemnation Boards', to: '/condemnations' },
    { icon: BookOpen, label: 'My Stock Ledgers', to: '/reports' },
    { icon: Settings, label: 'Profile Settings', to: '/profile' },
  ],
};

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { unreadNotificationsCount, notifications, sidebarOpen } = useSelector((state) => state.ui);
  const { theme, toggleTheme } = useTheme();

  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const getScrollEl = () => document.querySelector('.main-content');
    const checkScroll = () => {
      const el = getScrollEl();
      const offset = el ? el.scrollTop : window.scrollY;
      setScrolled(offset > 6);
    };

    const el = getScrollEl();
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
    }
    window.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();

    const timer = setTimeout(checkScroll, 100);

    return () => {
      clearTimeout(timer);
      const el = getScrollEl();
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('scroll', checkScroll);
    };
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setProfileOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = () => {
    setProfileOpen(false);
    dispatch(logoutUser()).then(() => navigate('/login'));
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      dispatch({ type: 'ui/markAllNotificationsRead' });
    } catch (err) {
      console.error(err);
    }
  };

  const menuItems = PROFILE_MENU[user?.role] ?? PROFILE_MENU.establishment;

  return (
    <nav className={`navbar-farm ${scrolled ? 'navbar-scrolled' : ''}`} role="banner">
      {/* Left side: Show brand & toggle when sidebar is collapsed */}
      <div className="navbar-left">
        {!sidebarOpen && (
          <div className="d-flex align-items-center gap-2">
            <button
              className="sidebar-toggle me-1"
              onClick={() => dispatch(toggleSidebar())}
              aria-label="Toggle navigation menu"
            >
              <Menu size={20} color="#FFFFFF" />
            </button>
            <Link to="/" className="navbar-brand-farm text-decoration-none">
              <div className="navbar-brand-merged">
                <div className="navbar-brand-icon-box">
                  <Shield size={20} className="navbar-brand-shield" />
                </div>
                <span className="navbar-brand-title text-white">BEG &amp; Centre</span>
              </div>
            </Link>
          </div>
        )}
        {user?.role === 'establishment' && (
          <span className="badge-pending ms-2 px-2 py-1 rounded-3" style={{ fontSize: 'var(--fs-xs)' }}>
            {user?.establishmentName}
          </span>
        )}
      </div>

      {/* Right side: settings, theme toggle, and profile */}
      <div className="navbar-right">
        {/* Theme toggle */}
        <button
          className="nav-icon-btn press-scale"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        {/* Quick Nav Shortcut (Voucher logs) */}
        <button
          className="nav-icon-btn nav-icon-btn--labeled press-scale"
          onClick={() => navigate('/vouchers')}
          title="Vouchers"
        >
          <FileSpreadsheet size={19} />
          <span className="nav-icon-label text-white">Vouchers</span>
        </button>

        {/* Quick Nav Shortcut (Ledger sheets) */}
        <button
          className="nav-icon-btn nav-icon-btn--labeled press-scale"
          onClick={() => navigate('/reports')}
          title="Ledgers"
        >
          <BookOpen size={19} />
          <span className="nav-icon-label text-white">Ledgers</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="dropdown">
          <button
            className="nav-icon-btn position-relative press-scale"
            type="button"
            id="notificationsDropdown"
            data-bs-toggle="dropdown"
            data-bs-auto-close="outside"
            aria-expanded="false"
            aria-label={`Notifications${unreadNotificationsCount > 0 ? `, ${unreadNotificationsCount} unread` : ''}`}
          >
            <Bell size={19} />
            {unreadNotificationsCount > 0 && (
              <span className="notif-badge">
                {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          <div
            className="dropdown-menu dropdown-menu-end card-farm p-0 border-0"
            style={{ width: 'min(320px, 92vw)', minWidth: '260px' }}
            aria-labelledby="notificationsDropdown"
          >
            <div
              className="d-flex justify-content-between align-items-center px-3 py-2"
              style={{ borderBottom: '1px solid var(--border-color)' }}
            >
              <span className="fw-bold" style={{ fontSize: 'var(--fs-body)' }}>Notifications</span>
              {unreadNotificationsCount > 0 && (
                <button
                  className="btn btn-link text-success text-decoration-none p-0"
                  style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--primary-green-light)' }}
                  onClick={handleMarkAllRead}
                >
                  Mark all read
                </button>
              )}
            </div>
            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {!notifications || notifications.length === 0 ? (
                <p className="text-center text-muted py-4 mb-0" style={{ fontSize: 'var(--fs-sm)' }}>
                  No notifications yet
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`px-3 py-2 ${n.status?.isRead ? '' : 'notif-unread'}`}
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                  >
                    <div className="fw-semibold text-success" style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.3, color: 'var(--primary-green-light)' }}>
                      {n.title}
                    </div>
                    <div className="text-muted mt-1" style={{ fontSize: 'var(--fs-xs)', lineHeight: 1.4 }}>
                      {n.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Profile Dropdown */}
        <div className="profile-dropdown-wrap" ref={profileRef}>
          <button
            className="user-pill press-scale"
            onClick={() => setProfileOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={profileOpen}
            aria-label="Account menu"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.fullName}
                className="user-avatar"
              />
            ) : (
              <div className="user-avatar-placeholder gradient-bg">
                {user?.firstName?.charAt(0)?.toUpperCase() ?? <User size={16} />}
              </div>
            )}
            <div className="user-info d-none d-sm-block text-start">
              <div className="user-name">{user?.fullName || 'Military Officer'}</div>
              <div className="user-role" style={{ textTransform: 'capitalize' }}>
                {user?.role === 'master' ? 'HQ Master' : user?.establishmentName}
              </div>
            </div>
          </button>

          {profileOpen && (
            <div className="profile-dropdown-menu" role="menu">
              <div className="profile-dropdown-header">
                <div className="pd-avatar pd-avatar--placeholder gradient-bg">
                  {user?.firstName?.charAt(0)?.toUpperCase() ?? <User size={18} />}
                </div>
                <div className="pd-user-info text-start">
                  <div className="pd-user-name">{user?.fullName}</div>
                  <div className="pd-user-sub" style={{ fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)' }}>
                    {user?.serviceNumber} | {user?.designation}
                  </div>
                  <div className="pd-user-sub">{user?.email}</div>
                </div>
              </div>

              <div className="profile-dropdown-divider" />

              <nav className="pd-nav">
                {menuItems.map(({ icon: Icon, label, to }) => (
                  <button
                    key={to}
                    className="pd-item"
                    role="menuitem"
                    onClick={() => { setProfileOpen(false); navigate(to); }}
                  >
                    <span className="pd-item-icon">
                      <Icon size={18} />
                    </span>
                    <span className="pd-item-label">{label}</span>
                    <ChevronRight size={15} className="pd-item-arrow" />
                  </button>
                ))}
              </nav>

              <div className="profile-dropdown-divider" />

              <button className="pd-logout" role="menuitem" onClick={handleLogout}>
                <LogOut size={17} />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
