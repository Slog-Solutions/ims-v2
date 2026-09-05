import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

/* ─── Config ─────────────────────────────────────────────────── */
const VARIANT_CONFIG = {
  success: {
    Icon: CheckCircle2,
    ringBg: 'rgba(22, 163, 74, 0.12)',
    ringBorder: 'rgba(22, 163, 74, 0.25)',
    iconColor: '#16a34a',
    bar: '#16a34a',
  },
  error: {
    Icon: AlertCircle,
    ringBg: 'rgba(220, 38, 38, 0.12)',
    ringBorder: 'rgba(220, 38, 38, 0.25)',
    iconColor: '#dc2626',
    bar: '#dc2626',
  },
  info: {
    Icon: Info,
    ringBg: 'rgba(37, 99, 235, 0.12)',
    ringBorder: 'rgba(37, 99, 235, 0.25)',
    iconColor: '#2563eb',
    bar: '#2563eb',
  },
  warning: {
    Icon: AlertTriangle,
    ringBg: 'rgba(217, 119, 6, 0.12)',
    ringBorder: 'rgba(217, 119, 6, 0.25)',
    iconColor: '#d97706',
    bar: '#d97706',
  },
};

/* ─── Context ────────────────────────────────────────────────── */
const ToastContext = createContext(null);

/* ─── Single Toast ───────────────────────────────────────────── */
const ToastItem = ({ toast, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef(null);
  const cfg = VARIANT_CONFIG[toast.variant] || VARIANT_CONFIG.success;
  const { Icon } = cfg;
  const duration = toast.duration ?? 3200;

  const dismiss = useCallback(() => {
    clearTimeout(timerRef.current);
    setLeaving(true);
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 340);
  }, [toast.id, onDismiss]);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    timerRef.current = setTimeout(dismiss, duration + 300);
    return () => clearTimeout(timerRef.current);
  }, [dismiss, duration]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 16,
        padding: '14px 16px',
        marginBottom: 10,
        boxShadow: 'var(--shadow-xl)',
        maxWidth: 400,
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
        transition: 'opacity 0.32s cubic-bezier(.16,1,.3,1), transform 0.32s cubic-bezier(.16,1,.3,1)',
        opacity: visible && !leaving ? 1 : 0,
        transform: visible && !leaving ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.96)',
        pointerEvents: 'auto',
      }}
    >
      {/* Icon ring */}
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: cfg.ringBg,
          border: `1.5px solid ${cfg.ringBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          animation: visible ? 'toast-pop 0.4s cubic-bezier(.34,1.56,.64,1) 0.05s both' : 'none',
        }}
      >
        <Icon size={18} color={cfg.iconColor} strokeWidth={2.5} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-dark)', marginBottom: 2, lineHeight: 1.3 }}>
          {toast.title}
        </div>
        {toast.sub && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {toast.sub}
          </div>
        )}
      </div>

      {/* Action + Close */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {toast.action && (
          <button
            onClick={() => { toast.action.onClick?.(); dismiss(); }}
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 8,
              border: `1px solid ${cfg.ringBorder}`,
              background: cfg.ringBg,
              color: cfg.iconColor,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {toast.action.label}
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-caption)',
            transition: 'color 0.15s',
          }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 2.5,
          background: 'rgba(92, 123, 87, 0.08)',
        }}
      >
        <div
          style={{
            height: '100%',
            background: cfg.bar,
            transformOrigin: 'left',
            animation: visible ? `toast-drain ${duration}ms linear 0.2s forwards` : 'none',
          }}
        />
      </div>

      <style>{`
        @keyframes toast-pop {
          0% { transform: scale(0.55); }
          65% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes toast-drain {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
};

/* ─── Container ──────────────────────────────────────────────── */
export const ToastContainer = () => {
  const { toasts, dismiss } = useContext(ToastContext);

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
        width: '100%',
        maxWidth: '420px',
        padding: '0 16px',
      }}
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  );
};

/* ─── Provider ───────────────────────────────────────────────── */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(({ title, sub, variant = 'success', action, duration = 3200 }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, sub, variant, action, duration }]);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismiss }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

/* ─── Hook ───────────────────────────────────────────────────── */
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx.showToast;
};
