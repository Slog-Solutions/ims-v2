import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '../../store/slices/authSlice.js';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, LogIn, AlertCircle, CheckCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/api.js';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [loginStage, setLoginStage] = useState('idle'); // 'idle' | 'authenticating' | 'authorized' | 'transitioning'
  const [localError, setLocalError] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error: reduxError } = useSelector((state) => state.auth);

  const displayError = localError || reduxError;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setLoginStage('authenticating');

    try {
      const response = await api.post('/auth/login', { email, password, rememberMe });
      const { accessToken, refreshToken, user } = response.data.data;

      // Stage 1: Verified state (button turns glowing emerald, authorization pulse)
      setLoginStage('authorized');

      // Stage 2: Card dissolves and command portal expands
      setTimeout(() => {
        setLoginStage('transitioning');
      }, 380);

      // Stage 3: Commit Redux state & smoothly route into dashboard
      setTimeout(() => {
        dispatch(setCredentials({ user, accessToken, refreshToken }));
        navigate('/dashboard');
      }, 950);
    } catch (err) {
      setLoginStage('idle');
      setLocalError(err.response?.data?.message || 'Login failed. Please verify your credentials.');
    }
  };

  return (
    <div className="login-page">
      {/* Top Navbar */}
      <header
        className="login-navbar"
        style={{
          backgroundColor: 'rgba(21, 63, 66, 0.42)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          padding: '0 20px'
        }}
      >
        <div className="login-navbar-inner">
          <div className="login-navbar-brand">
            <div className="login-logo-pill">
              <Shield size={16} />
              <span>BEG-IMS</span>
            </div>
            <span className="login-navbar-title">BEG &amp; Centre Roorkee</span>
          </div>
        </div>
      </header>

      {/* Background Image Layer */}
      <div className="login-bg-photo" />
      <div className="login-bg-overlay" />
      {/* Decorative glow spots */}
      <div className="login-glow login-glow--tl" />
      <div className="login-glow login-glow--br" />

      {/* Canvas window — the framed content container with interactive 3D mouse hover & exit transition */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{
          opacity: loginStage === 'transitioning' ? 0 : 1,
          y: loginStage === 'transitioning' ? -25 : isHovered ? -8 : 0,
          scale: loginStage === 'transitioning' ? 1.05 : isHovered ? 1.01 : 1,
          filter: loginStage === 'transitioning' ? 'blur(10px)' : 'blur(0px)',
          rotateX: isHovered && loginStage === 'idle' ? -mousePos.y * 5 : 0,
          rotateY: isHovered && loginStage === 'idle' ? mousePos.x * 5 : 0,
        }}
        transition={{
          duration: loginStage === 'transitioning' ? 0.45 : 0.55,
          type: loginStage === 'transitioning' ? 'tween' : 'spring',
          stiffness: 300,
          damping: 25
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setIsHovered(false);
          setMousePos({ x: 0, y: 0 });
        }}
        className={`login-canvas ${isHovered ? 'is-hovered' : ''}`}
        style={{
          transformStyle: 'preserve-3d',
          perspective: 1200
        }}
      >
        {/* Interactive Spotlight Glare on Hover */}
        <div
          className="login-canvas-glare"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(650px circle at ${(mousePos.x + 0.5) * 100}% ${(mousePos.y + 0.5) * 100}%, rgba(34, 197, 94, 0.10), transparent 65%)`
          }}
        />
        {/* Left panel — branding */}
        <div className="login-left">

          <div className="login-brand-content">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              <div className="login-eyebrow">Military Inventory Platform</div>
              <h1 className="login-headline">
                Effortless<br />
                <span className="login-headline--green">Stores Management</span>
              </h1>
              <p className="login-brand-desc">
                HQ BEG &amp; Centre Roorkee — Secure equipment and stores accounting system for operations staff.
              </p>
            </motion.div>

            {/* Feature bullets */}
            <motion.div
              className="login-features"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {[
                'Real-time nomenclature tracking',
                'Voucher &amp; ledger automation',
                'Condemnation board workflows',
                'Equipment Central management',
              ].map((f, i) => (
                <div key={i} className="login-feature-item">
                  <CheckCircle size={15} className="login-feature-icon" />
                  <span dangerouslySetInnerHTML={{ __html: f }} />
                </div>
              ))}
            </motion.div>
          </div>

          {/* Illustration placeholder — decorative circles */}
          <div className="login-illustration">
            <div className="login-illus-ring login-illus-ring--1" />
            <div className="login-illus-ring login-illus-ring--2" />
            <div className="login-illus-ring login-illus-ring--3" />
            <Shield size={56} className="login-illus-shield" />
          </div>
        </div>

        {/* Right panel — form */}
        <div className="login-right">
          <div className="login-form-header">
            <h2 className="login-form-title">Welcome back</h2>
            <p className="login-form-subtitle">Sign in to access your console</p>
          </div>

          {displayError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="login-error"
            >
              <AlertCircle size={15} />
              {displayError}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label className="login-label" htmlFor="login-email">
                Email Address
              </label>
              <div className="login-input-wrap">
                <Mail size={17} className="login-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  className="login-input"
                  placeholder="officer@beg.centre"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="login-password">
                Password
              </label>
              <div className="login-input-wrap">
                <Lock size={17} className="login-input-icon" />
                <input
                  id="login-password"
                  type="password"
                  className="login-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="login-remember">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember">Keep me signed in</label>
            </div>

            <button
              type="submit"
              className={`login-submit press-scale ${loginStage === 'authorized' || loginStage === 'transitioning' ? 'login-submit--success' : ''}`}
              disabled={loginStage === 'authenticating' || loginStage === 'authorized' || loginStage === 'transitioning'}
            >
              {loginStage === 'authenticating' ? (
                <span className="d-flex align-items-center justify-content-center gap-2">
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  <span>Verifying Credentials...</span>
                </span>
              ) : loginStage === 'authorized' || loginStage === 'transitioning' ? (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="d-flex align-items-center justify-content-center gap-2 text-white"
                >
                  <Check size={18} strokeWidth={3} />
                  <span>Security Cleared • Launching Console</span>
                </motion.span>
              ) : (
                <>
                  <LogIn size={17} />
                  <span>Access Console</span>
                </>
              )}
            </button>
          </form>

          <p className="login-footer">
            Restricted access. Unauthorized use is monitored and logged.
          </p>
        </div>
      </motion.div>

      {/* Full-Screen Military Command Portal Transition Overlay */}
      <AnimatePresence>
        {loginStage === 'transitioning' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="login-auth-portal"
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="login-auth-portal-card"
            >
              <div className="login-auth-shield-wrap">
                <div className="login-auth-pulse-ring login-auth-pulse-ring--1" />
                <div className="login-auth-pulse-ring login-auth-pulse-ring--2" />
                <div className="login-auth-pulse-ring login-auth-pulse-ring--3" />
                <div className="login-auth-shield-circle">
                  <Shield size={40} className="text-white" />
                </div>
              </div>

              <div className="login-auth-status-badge">
                <Check size={13} strokeWidth={3} className="text-success" />
                <span>Security Clearance Level 1 Verified</span>
              </div>

              <h2 className="login-auth-title">Access Granted</h2>
              <p className="login-auth-desc">
                HQ BEG &amp; Centre Roorkee • Initializing Tactical Stores Console...
              </p>

              <div className="login-auth-progress-track">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.55, ease: 'easeInOut' }}
                  className="login-auth-progress-fill"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        /* ─── Top Navbar ─────────────────────────────────── */
        .login-navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 64px;
          z-index: 100;
          display: flex;
          align-items: center;
          padding: 0 20px;
          background: rgba(21, 63, 66, 0.42) !important;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.18);
        }

        .login-navbar .login-logo-pill {
          background: rgba(17, 24, 39, 0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .login-navbar-inner {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }

        .login-navbar-brand {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .login-navbar-title {
          font-family: 'Noto Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #FFFFFF;
          letter-spacing: -0.01em;
        }

        /* ─── Page Shell ─────────────────────────────────── */
        .login-page {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 80px 24px 24px;
          position: relative;
          overflow: hidden;
          background-color: #153F42;
        }

        /* ─── Background Image & Atmospheric Overlay ────── */
        .login-bg-photo {
          position: absolute;
          inset: 0;
          background-image: url('/inventory-bg.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          z-index: 0;
        }

        .login-bg-overlay {
          position: absolute;
          inset: 0;
          background: transparent;
          z-index: 0;
        }
        .login-glow {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }
        .login-glow--tl {
          top: -120px;
          left: -80px;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(34, 197, 94, 0.08) 0%, transparent 65%);
        }
        .login-glow--br {
          bottom: -100px;
          right: -60px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(44, 114, 116, 0.12) 0%, transparent 65%);
        }

        /* ─── Giant Background Watermark (now baked in background image) ─── */
        .login-bg-giant {
          display: none !important;
        }

        /* ─── Canvas Window ──────────────────────────────── */
        .login-canvas {
          position: relative;
          z-index: 1;
          display: flex;
          width: 100%;
          max-width: 980px;
          min-height: 580px;
          background: #FFFFFF;
          border: 1.5px solid rgba(255, 255, 255, 0.6);
          border-radius: 28px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.4), 0 4px 20px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          transition: box-shadow 0.35s ease, border-color 0.35s ease;
          cursor: default;
        }

        .login-canvas:hover,
        .login-canvas.is-hovered {
          box-shadow: 0 36px 95px rgba(0, 0, 0, 0.48), 0 0 40px rgba(34, 197, 94, 0.22), 0 8px 30px rgba(0, 0, 0, 0.28);
          border-color: rgba(34, 197, 94, 0.45);
        }

        .login-canvas-glare {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 10;
          border-radius: 28px;
          transition: opacity 0.3s ease;
        }

        /* ─── Left Panel (branding) ──────────────────────── */
        .login-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 36px 40px;
          background: linear-gradient(160deg, #D4EADB 0%, #BFE4CB 40%, #ADC0C4 100%);
          border-right: 1.5px solid #CBD5E1;
          position: relative;
          overflow: hidden;
        }

        .login-logo-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #111827;
          color: #FFFFFF;
          font-family: 'Noto Sans', sans-serif;
          font-weight: 700;
          font-size: 13px;
          padding: 8px 16px;
          border-radius: 9999px;
          letter-spacing: 0.03em;
          width: fit-content;
          flex-shrink: 0;
        }

        .login-brand-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 20px 0;
        }

        .login-eyebrow {
          font-family: 'Noto Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #22C55E;
          margin-bottom: 12px;
        }

        .login-headline {
          font-family: 'Noto Sans', sans-serif;
          font-size: clamp(28px, 4vw, 40px);
          font-weight: 800;
          line-height: 1.08;
          color: #111827;
          letter-spacing: -0.025em;
          margin: 0 0 16px 0;
        }
        .login-headline--green {
          color: #22C55E;
        }

        .login-brand-desc {
          font-family: 'Noto Sans', sans-serif;
          font-size: 15px;
          color: #4B5563;
          line-height: 1.65;
          max-width: 340px;
          margin: 0 0 28px 0;
        }

        .login-features {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .login-feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'Noto Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          padding: 6px 12px;
          border-radius: 10px;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: default;
        }
        .login-feature-item:hover {
          background: rgba(34, 197, 94, 0.12);
          transform: translateX(6px);
          color: #15803D;
        }
        .login-feature-icon {
          color: #22C55E;
          flex-shrink: 0;
          transition: transform 0.25s ease;
        }
        .login-feature-item:hover .login-feature-icon {
          transform: scale(1.25);
        }

        /* Illustration */
        .login-illustration {
          position: absolute;
          bottom: -40px;
          right: -40px;
          width: 200px;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.4s ease;
        }
        .login-canvas.is-hovered .login-illustration {
          transform: scale(1.08);
        }
        .login-illus-ring {
          position: absolute;
          border-radius: 50%;
          border: 2px solid rgba(34, 197, 94, 0.2);
          transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .login-illus-ring--1 { width: 200px; height: 200px; }
        .login-illus-ring--2 { width: 145px; height: 145px; border-color: rgba(34, 197, 94, 0.3); }
        .login-illus-ring--3 { width: 90px; height: 90px; border-color: rgba(34, 197, 94, 0.5); background: rgba(34, 197, 94, 0.06); }

        .login-canvas.is-hovered .login-illus-ring--1 {
          transform: scale(1.06);
          border-color: rgba(34, 197, 94, 0.38);
        }
        .login-canvas.is-hovered .login-illus-ring--2 {
          transform: scale(1.12);
          border-color: rgba(34, 197, 94, 0.55);
        }
        .login-canvas.is-hovered .login-illus-ring--3 {
          transform: scale(1.18);
          border-color: rgba(34, 197, 94, 0.75);
          background: rgba(34, 197, 94, 0.12);
        }

        .login-illus-shield {
          color: rgba(34, 197, 94, 0.4);
          position: relative;
          z-index: 1;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .login-canvas.is-hovered .login-illus-shield {
          color: rgba(34, 197, 94, 0.75);
          filter: drop-shadow(0 6px 18px rgba(34, 197, 94, 0.45));
          transform: scale(1.1) rotate(4deg);
        }

        /* ─── Right Panel (form) ─────────────────────────── */
        .login-right {
          width: 380px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 40px;
        }

        .login-form-header {
          margin-bottom: 28px;
        }
        .login-form-title {
          font-family: 'Noto Sans', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.025em;
          margin: 0 0 6px 0;
          line-height: 1.1;
        }
        .login-form-subtitle {
          font-family: 'Noto Sans', sans-serif;
          font-size: 14px;
          color: #6B7280;
          margin: 0;
        }

        /* Error */
        .login-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.06);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #B91C1C;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 20px;
          font-family: 'Noto Sans', sans-serif;
          animation: shake 0.4s ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%      { transform: translateX(-5px); }
          40%      { transform: translateX(5px); }
          60%      { transform: translateX(-3px); }
          80%      { transform: translateX(3px); }
        }

        /* Form */
        .login-form { display: flex; flex-direction: column; }
        .login-field { margin-bottom: 18px; }
        .login-label {
          display: block;
          font-family: 'Noto Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 7px;
          letter-spacing: 0.01em;
        }
        .login-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .login-input-icon {
          position: absolute;
          left: 14px;
          color: #9CA3AF;
          transition: color 0.2s;
          pointer-events: none;
          z-index: 1;
        }
        .login-input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          border: 1.5px solid #E5E7EB;
          border-radius: 12px;
          background: #FFFFFF;
          color: #111827;
          font-family: 'Noto Sans', sans-serif;
          font-size: 15px;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .login-input::placeholder { color: #9CA3AF; }
        .login-input:focus {
          border-color: #22C55E;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
        }
        .login-input-wrap:focus-within .login-input-icon {
          color: #22C55E;
        }

        /* Remember */
        .login-remember {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
        }
        .login-remember input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: #22C55E;
          border-radius: 4px;
          cursor: pointer;
        }
        .login-remember label {
          font-family: 'Noto Sans', sans-serif;
          font-size: 13px;
          color: #6B7280;
          cursor: pointer;
          user-select: none;
        }

        /* Submit button — pill shape */
        .login-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 14px 28px;
          border: none;
          border-radius: 9999px;
          background: #22C55E;
          color: #FFFFFF;
          font-family: 'Noto Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.25s, transform 0.15s, box-shadow 0.25s;
          box-shadow: 0 4px 16px rgba(34, 197, 94, 0.30);
        }
        .login-submit:hover:not(:disabled) {
          background: #16A34A;
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(34, 197, 94, 0.38);
        }
        .login-submit:disabled {
          opacity: 0.85;
          cursor: not-allowed;
          transform: none;
        }
        .login-submit--success {
          background: linear-gradient(135deg, #16A34A 0%, #15803D 100%) !important;
          box-shadow: 0 0 30px rgba(34, 197, 94, 0.65) !important;
          opacity: 1 !important;
        }

        /* ─── Command Authorization Portal Overlay ──────── */
        .login-auth-portal {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(15, 45, 48, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }

        .login-auth-portal-card {
          position: relative;
          background: rgba(17, 24, 39, 0.94);
          border: 1.5px solid rgba(34, 197, 94, 0.45);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.7), 0 0 60px rgba(34, 197, 94, 0.3);
          border-radius: 28px;
          padding: 40px 44px;
          max-width: 440px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .login-auth-shield-wrap {
          position: relative;
          width: 86px;
          height: 86px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 22px;
        }

        .login-auth-shield-circle {
          position: relative;
          z-index: 2;
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: linear-gradient(135deg, #22C55E 0%, #15803D 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 25px rgba(34, 197, 94, 0.6);
        }

        .login-auth-pulse-ring {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid rgba(34, 197, 94, 0.4);
          animation: portalPulse 2s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
        }
        .login-auth-pulse-ring--1 { width: 86px; height: 86px; animation-delay: 0s; }
        .login-auth-pulse-ring--2 { width: 114px; height: 114px; animation-delay: 0.4s; }
        .login-auth-pulse-ring--3 { width: 142px; height: 142px; animation-delay: 0.8s; }

        @keyframes portalPulse {
          0% { transform: scale(0.7); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        .login-auth-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 9999px;
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid rgba(34, 197, 94, 0.35);
          color: #4ADE80;
          font-family: 'Noto Sans', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .login-auth-title {
          font-family: 'Noto Sans', sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: #FFFFFF;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }

        .login-auth-desc {
          font-family: 'Noto Sans', sans-serif;
          font-size: 13px;
          color: #9CA3AF;
          line-height: 1.5;
          margin-bottom: 22px;
        }

        .login-auth-progress-track {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 9999px;
          overflow: hidden;
        }

        .login-auth-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #22C55E 0%, #86EFAC 100%);
          border-radius: 9999px;
          box-shadow: 0 0 10px rgba(34, 197, 94, 0.8);
        }

        /* Footer */
        .login-footer {
          font-family: 'Noto Sans', sans-serif;
          font-size: 12px;
          color: #9CA3AF;
          margin-top: 24px;
          text-align: center;
          line-height: 1.6;
        }

        /* ─── Responsive ─────────────────────────────────── */
        @media (max-width: 768px) {
          .login-canvas {
            flex-direction: column;
            max-width: 480px;
            min-height: unset;
          }
          .login-left {
            padding: 28px 28px 20px;
            border-right: none;
            border-bottom: 1.5px solid #E5E7EB;
          }
          .login-illustration { display: none; }
          .login-right {
            width: 100%;
            padding: 28px 28px 32px;
          }
        }
        @media (max-width: 480px) {
          .login-page { padding: 16px; }
          .login-canvas { border-radius: 20px; }
          .login-left { padding: 24px 20px 16px; }
          .login-right { padding: 24px 20px 28px; }
          .login-headline { font-size: 24px; }
        }
      `}</style>
    </div>
  );
};

export default Login;
