import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Package, Tag, BookOpen, Hash,
  AlertTriangle, CheckCircle, Grid3X3, List, Filter,
  ChevronRight, ChevronLeft, Image as ImageIcon, Layers, Ruler,
  ArrowLeft, Maximize2, ZoomIn, Eye,
} from 'lucide-react';
import api from '../api/api.js';
import { ITEM_UNITS } from '../utils/constants.js';
import ImageLightbox from '../components/common/ImageLightbox.jsx';

/* ─── Placeholder image when item has no imageUrl ─────────────────── */
const PLACEHOLDER_COLORS = [
  ['#1e3a5f', '#2563eb'],
  ['#14532d', '#16a34a'],
  ['#7c2d12', '#ea580c'],
  ['#4c1d95', '#7c3aed'],
  ['#164e63', '#0891b2'],
  ['#713f12', '#ca8a04'],
];
const getPlaceholderGradient = (str) => {
  let hash = 0;
  for (let c of str) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return PLACEHOLDER_COLORS[Math.abs(hash) % PLACEHOLDER_COLORS.length];
};

const ItemPlaceholder = ({ nomenclature, size = 120 }) => {
  const [dark, light] = getPlaceholderGradient(nomenclature || 'item');
  const initials = (nomenclature || 'IT')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size < 80 ? 10 : 16,
        background: `linear-gradient(135deg, ${dark} 0%, ${light} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: size * 0.28,
        fontWeight: 800,
        color: 'rgba(255,255,255,0.9)',
        letterSpacing: '-0.02em',
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  );
};

/* ─── Stat pill ─────────────────────────────────────────────────────── */
const StatPill = ({ icon: Icon, label, value, color }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 16px',
      borderRadius: 12,
      background: color + '12',
      border: `1px solid ${color}28`,
      flex: 1,
      minWidth: 0,
    }}
  >
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: color + '20',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        flexShrink: 0,
      }}
    >
      <Icon size={17} />
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  </div>
);

/* ─── Item Card (Flipkart-style grid card) ───────────────────────── */
const ItemCard = ({ item, onClick }) => {
  const [activeImg, setActiveImg] = useState(0);
  const imgs = item.images || [];
  const firstImg = imgs[0]?.url || null;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => onClick(item)}
      style={{
        background: 'var(--bg-card)',
        borderRadius: 14,
        border: '1.5px solid var(--border-color)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
      whileHover={{
        scale: 1.025,
        boxShadow: '0 8px 32px rgba(34,197,94,0.16)',
        borderColor: '#22c55e60',
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Image Area */}
      <div
        className="item-card-image-bg"
        style={{
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {firstImg ? (
          <img
            src={imgs[activeImg]?.url || firstImg}
            alt={item.nomenclature}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.2s' }}
          />
        ) : (
          <ItemPlaceholder nomenclature={item.nomenclature} size={100} />
        )}

        {/* Multi-image dot indicators */}
        {imgs.length > 1 && (
          <div
            style={{
              position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 4,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {imgs.map((_, i) => (
              <button
                key={i}
                onMouseEnter={() => setActiveImg(i)}
                onClick={(e) => { e.stopPropagation(); setActiveImg(i); }}
                style={{
                  width: i === activeImg ? 16 : 6, height: 6, borderRadius: 4,
                  background: i === activeImg ? '#22c55e' : 'rgba(255,255,255,0.6)',
                  border: 'none', padding: 0, cursor: 'pointer',
                  transition: 'width 0.2s, background 0.2s',
                }}
              />
            ))}
          </div>
        )}

        {/* Image count badge */}
        {imgs.length > 1 && (
          <span
            style={{
              position: 'absolute', top: 10, left: 10,
              background: 'rgba(0,0,0,0.55)', color: '#fff',
              fontSize: 9, fontWeight: 700, padding: '3px 7px',
              borderRadius: 20, backdropFilter: 'blur(6px)',
            }}
          >
            📷 {imgs.length}
          </span>
        )}

        {/* Unit badge top-right */}
        <span
          style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(0,0,0,0.55)', color: '#fff',
            fontSize: 10, fontWeight: 700, padding: '3px 8px',
            borderRadius: 20, backdropFilter: 'blur(6px)', letterSpacing: '0.04em',
          }}
        >
          {item.unitOfIssue}
        </span>

        {/* Min-stock warning */}
        {item.minStockLevel > 0 && (
          <span
            style={{
              position: 'absolute', top: 10, left: 10,
              background: 'rgba(234,179,8,0.9)', color: '#78350f',
              fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
            }}
          >
            ⚠ Min: {item.minStockLevel}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '14px 14px 12px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <div
          style={{
            fontSize: 13, fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1.35,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}
        >
          {item.nomenclature}
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
          {item.ledgerFolio}
        </div>

        {item.description && (
          <div
            style={{
              fontSize: 11, color: 'var(--text-body)', lineHeight: 1.5, overflow: 'hidden',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginTop: 2,
            }}
          >
            {item.description}
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
              background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0',
            }}
          >
            {item.unitOfIssue}
          </span>
          <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
            View Details <ChevronRight size={13} />
          </span>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Detail Drawer ──────────────────────────────────────────────── */
const ItemDetailDrawer = ({ item, onClose }) => {
  const [activeImg, setActiveImg] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const imgs = item?.images || [];

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && !lightboxOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, lightboxOpen]);

  if (!item) return null;

  const handleOpenLightbox = (index = 0) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handlePrevImg = (e) => {
    e?.stopPropagation();
    if (imgs.length <= 1) return;
    setActiveImg((prev) => (prev === 0 ? imgs.length - 1 : prev - 1));
  };

  const handleNextImg = (e) => {
    e?.stopPropagation();
    if (imgs.length <= 1) return;
    setActiveImg((prev) => (prev === imgs.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(6px)', zIndex: 1050,
        }}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '100%', maxWidth: 520,
          background: 'var(--bg-card)', overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.22)', zIndex: 1051,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '20px 24px 16px', borderBottom: '1px solid var(--border-color)',
            position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10,
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
              borderRadius: 10, width: 36, height: 36, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-body)', flexShrink: 0,
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Nomenclature Item
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.nomenclature}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, borderRadius: 8 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Image Hero Area with Carousel & Zoom ── */}
        <div
          className="item-hero-image-bg"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px 24px 18px', position: 'relative',
            flexDirection: 'column', gap: 12, minHeight: 260,
          }}
        >
          {/* Top badges on hero */}
          <div
            style={{
              position: 'absolute', top: 14, left: 16, right: 16,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              zIndex: 3, pointerEvents: 'none',
            }}
          >
            {imgs.length > 0 ? (
              <span
                style={{
                  background: 'rgba(0,0,0,0.65)', color: '#fff',
                  fontSize: 11, fontWeight: 700, padding: '4px 10px',
                  borderRadius: 20, backdropFilter: 'blur(8px)',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <ImageIcon size={13} />
                {activeImg + 1} / {imgs.length}
              </span>
            ) : (
              <span />
            )}

            {imgs.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenLightbox(activeImg);
                }}
                style={{
                  pointerEvents: 'auto',
                  background: 'rgba(0,0,0,0.65)', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  fontSize: 11, fontWeight: 700, padding: '4px 10px',
                  borderRadius: 20, backdropFilter: 'blur(8px)',
                  display: 'flex', alignItems: 'center', gap: 5,
                  cursor: 'pointer',
                }}
                title="Click to view all photos in fullscreen"
              >
                <Maximize2 size={12} />
                View Fullscreen
              </button>
            )}
          </div>

          {/* Main image container */}
          <div
            onClick={() => imgs.length > 0 && handleOpenLightbox(activeImg)}
            style={{
              width: '100%',
              height: 220,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              cursor: imgs.length > 0 ? 'zoom-in' : 'default',
              borderRadius: 14,
            }}
            title={imgs.length > 0 ? 'Click to open fullscreen gallery' : ''}
          >
            {imgs.length > 0 ? (
              <>
                <motion.img
                  key={activeImg}
                  initial={{ scale: 0.94, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.22 }}
                  src={imgs[activeImg]?.url}
                  alt={item.nomenclature}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: 12,
                    boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
                  }}
                />

                {/* Left arrow on main image */}
                {imgs.length > 1 && (
                  <button
                    onClick={handlePrevImg}
                    style={{
                      position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                      width: 34, height: 34, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', backdropFilter: 'blur(6px)', zIndex: 4,
                    }}
                    title="Previous photo"
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}

                {/* Right arrow on main image */}
                {imgs.length > 1 && (
                  <button
                    onClick={handleNextImg}
                    style={{
                      position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                      width: 34, height: 34, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', backdropFilter: 'blur(6px)', zIndex: 4,
                    }}
                    title="Next photo"
                  >
                    <ChevronRight size={18} />
                  </button>
                )}

                {/* Bottom hover hint pill */}
                <div
                  style={{
                    position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(0, 0, 0, 0.65)', color: '#fff',
                    fontSize: 10, fontWeight: 600, padding: '3px 10px',
                    borderRadius: 16, backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', gap: 4, pointerEvents: 'none',
                  }}
                >
                  <ZoomIn size={11} /> Click to expand
                </div>
              </>
            ) : (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <ItemPlaceholder nomenclature={item.nomenclature} size={160} />
              </motion.div>
            )}
          </div>

          {/* Thumbnail strip (shown when >1 image) */}
          {imgs.length > 1 && (
            <div
              style={{
                display: 'flex', gap: 8, justifyContent: 'center',
                alignItems: 'center', flexWrap: 'nowrap', overflowX: 'auto',
                maxWidth: '100%', padding: '4px 6px',
              }}
            >
              {imgs.map((img, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImg(i);
                  }}
                  style={{
                    width: 50, height: 50, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
                    border: i === activeImg ? '2.5px solid #22c55e' : '2px solid rgba(0,0,0,0.15)',
                    padding: 0, cursor: 'pointer', background: '#fff',
                    boxShadow: i === activeImg ? '0 0 0 3px rgba(34,197,94,0.3)' : 'none',
                    transform: i === activeImg ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.18s ease',
                  }}
                  title={`View photo ${i + 1}`}
                >
                  <img src={img.url} alt={`Thumb ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content body */}
        <div style={{ padding: '24px 24px 32px', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Name + badges */}
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-dark)', lineHeight: 1.3, marginBottom: 8 }}>
              {item.nomenclature}
            </h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: '#dcfce7', color: '#15803d', fontWeight: 700, border: '1px solid #bbf7d0' }}>
                {item.unitOfIssue}
              </span>
              <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: '#eff6ff', color: '#1d4ed8', fontWeight: 600, border: '1px solid #bfdbfe', fontFamily: 'monospace' }}>
                {item.ledgerFolio}
              </span>
              <span style={{
                fontSize: 12, padding: '4px 12px', borderRadius: 20,
                background: item.isActive ? '#dcfce7' : '#fee2e2',
                color: item.isActive ? '#15803d' : '#b91c1c',
                fontWeight: 700, border: `1px solid ${item.isActive ? '#bbf7d0' : '#fecaca'}`,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {item.isActive ? <CheckCircle size={11} /> : <X size={11} />}
                {item.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Stat pills */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <StatPill icon={Ruler} label="Unit of Issue" value={item.unitOfIssue} color="#22c55e" />
            <StatPill icon={AlertTriangle} label="Min. Alert Stock" value={`${item.minStockLevel ?? 0} units`} color="#f59e0b" />
          </div>

          {/* ── All Uploaded Images Section ── */}
          <div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 10,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                Uploaded Images ({imgs.length})
              </div>
              {imgs.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleOpenLightbox(0)}
                  style={{
                    background: 'none', border: 'none',
                    color: '#22c55e', fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                    padding: '2px 6px',
                  }}
                >
                  <Eye size={13} /> View All Fullsize
                </button>
              )}
            </div>

            {imgs.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))',
                  gap: 10,
                  background: 'var(--bg-elevated)',
                  borderRadius: 12,
                  padding: 12,
                  border: '1px solid var(--border-color)',
                }}
              >
                {imgs.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleOpenLightbox(idx)}
                    style={{
                      position: 'relative',
                      aspectRatio: '1 / 1',
                      borderRadius: 10,
                      overflow: 'hidden',
                      border: idx === activeImg ? '2px solid #22c55e' : '1.5px solid var(--border-color)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      background: '#111',
                    }}
                    title={`Click to view Photo #${idx + 1} full size`}
                  >
                    <img
                      src={img.url}
                      alt={`Photo ${idx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.25s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 4,
                        right: 4,
                        background: 'rgba(0,0,0,0.65)',
                        color: '#fff',
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: 4,
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      #{idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
                  borderRadius: 12, border: '1.5px dashed var(--border-color)',
                  color: 'var(--text-muted)', fontSize: 13,
                }}
              >
                <ImageIcon size={16} />
                No uploaded photos for this item.
              </div>
            )}
          </div>

          {/* Description */}
          {item.description ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>
                Description / Technical Specifications
              </div>
              <div style={{
                fontSize: 13, color: 'var(--text-body)', lineHeight: 1.7,
                background: 'var(--bg-elevated)', borderRadius: 12, padding: '14px 16px',
                border: '1px solid var(--border-color)',
              }}>
                {item.description}
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
              borderRadius: 12, border: '1.5px dashed var(--border-color)',
              color: 'var(--text-muted)', fontSize: 13,
            }}>
              <ImageIcon size={16} />
              No technical specifications provided.
            </div>
          )}

          {/* Meta table */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 10 }}>
              Catalog Information
            </div>
            <div style={{ borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden', background: 'var(--bg-elevated)' }}>
              {[
                { label: 'Ledger Folio No.', value: item.ledgerFolio, mono: true },
                { label: 'Unit of Issue', value: item.unitOfIssue },
                { label: 'Min. Stock Warning', value: `${item.minStockLevel ?? 0} units` },
                { label: 'Status', value: item.isActive ? 'Active' : 'Inactive' },
                {
                  label: 'Added On',
                  value: item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—',
                },
                {
                  label: 'Last Updated',
                  value: item.updatedAt
                    ? new Date(item.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—',
                },
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '11px 16px',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border-color)' : 'none',
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>{row.label}</span>
                  <span style={{
                    fontSize: 13, fontWeight: 700, color: 'var(--text-dark)', textAlign: 'right',
                    fontFamily: row.mono ? 'monospace' : undefined,
                  }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Fullscreen Lightbox for all uploaded images */}
      <ImageLightbox
        isOpen={lightboxOpen}
        images={imgs}
        initialIndex={lightboxIndex}
        title={item.nomenclature}
        subtitle={item.ledgerFolio}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
};

/* ─── Main Page ──────────────────────────────────────────────────── */
const UNIT_FILTERS = ['All', ...Object.values(ITEM_UNITS)];

const ItemsCatalog = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [unitFilter, setUnitFilter] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/items', { params: { search: debouncedSearch, limit: 200 } });
      if (res.data.success) {
        setItems(res.data.data.items);
        setTotalCount(res.data.data.pagination?.total ?? res.data.data.items.length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [debouncedSearch]);

  const filteredItems = unitFilter === 'All'
    ? items
    : items.filter((it) => it.unitOfIssue === unitFilter);

  const hasImage = filteredItems.filter((i) => i.imageUrl).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{ minHeight: '100vh' }}
    >
      {/* ── Top Catalog Card (Banner + Filter Tabs) ── */}
      <div
        className="card-farm p-0 overflow-hidden"
        style={{
          borderRadius: 20,
          border: '1px solid rgba(92, 123, 87, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
        }}
      >
        {/* ── Header Banner ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--bg-sidebar) 0%, #1a4547 100%)',
            padding: '28px 24px 24px',
            position: 'relative',
            overflow: 'hidden',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          <div aria-hidden="true" style={{
            position: 'absolute', top: -60, right: -60, width: 220, height: 220,
            borderRadius: '50%', background: 'rgba(34,197,94,0.15)', filter: 'blur(60px)', pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                  Items Catalog
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.6)', margin: '6px 0 0', fontSize: 13 }}>
                  {totalCount} nomenclature items in store ledger
                  {hasImage > 0 && <> · {hasImage} with images</>}
                </p>
              </div>

              {/* View toggle */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 3, gap: 2 }}>
                {[{ mode: 'grid', icon: Grid3X3 }, { mode: 'list', icon: List }].map(({ mode, icon: Icon }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    style={{
                      background: viewMode === mode ? '#fff' : 'none',
                      border: 'none', borderRadius: 8, width: 36, height: 36,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      color: viewMode === mode ? '#1a4547' : 'rgba(255,255,255,0.7)',
                      transition: 'all 0.18s',
                    }}
                    title={`${mode} view`}
                  >
                    <Icon size={17} />
                  </button>
                ))}
              </div>
            </div>

            {/* Search bar */}
            <div className="catalog-search-wrapper" style={{ marginTop: 18, position: 'relative' }}>
              <Search size={18} className="catalog-search-icon" />
              <input
                type="text"
                id="catalog-search"
                className="catalog-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by item name or ledger folio number..."
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="catalog-search-clear"
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Category / Unit Filter Tabs ── */}
        <div
          style={{
            background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)',
            padding: '0 16px', overflowX: 'auto', scrollbarWidth: 'none',
            display: 'flex', gap: 4, alignItems: 'center',
            borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
          }}
        >
        {UNIT_FILTERS.map((unit) => (
          <button
            key={unit}
            onClick={() => setUnitFilter(unit)}
            style={{
              flexShrink: 0, padding: '12px 16px', background: 'none', border: 'none',
              borderBottom: unitFilter === unit ? '3px solid #22c55e' : '3px solid transparent',
              color: unitFilter === unit ? '#22c55e' : 'var(--text-body)',
              fontWeight: unitFilter === unit ? 700 : 500,
              fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: '0.03em',
              transition: 'all 0.15s',
            }}
          >
            {unit}
          </button>
        ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', flexShrink: 0 }}>
            <Filter size={13} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
              {filteredItems.length} items
            </span>
          </div>
        </div>
      </div>

      {/* ── Content Grid/List ── */}
      <div style={{ padding: '20px 20px 60px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(200px, 1fr))' : '1fr', gap: 16 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ borderRadius: 14, height: viewMode === 'grid' ? 280 : 90 }} />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: 16, textAlign: 'center' }}
          >
            <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={36} style={{ color: '#22c55e' }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-dark)' }}>No items found</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                {search ? `No results for "${search}". Try a different search.` : 'No nomenclature items in this category.'}
              </div>
            </div>
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ padding: '10px 20px', borderRadius: 10, background: '#22c55e', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
              >
                Clear Search
              </button>
            )}
          </motion.div>
        ) : viewMode === 'grid' ? (
          <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <ItemCard key={item._id} item={item} onClick={setSelectedItem} />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.22 }}
                  onClick={() => setSelectedItem(item)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px',
                    background: 'var(--bg-card)', borderRadius: 12, border: '1.5px solid var(--border-color)',
                    cursor: 'pointer',
                  }}
                  whileHover={{ boxShadow: '0 4px 20px rgba(34,197,94,0.12)', borderColor: '#22c55e60' }}
                >
                  <div style={{
                    width: 64, height: 64, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                    background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {(item.images && item.images[0]) ? (
                      <img src={item.images[0].url} alt={item.nomenclature} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <ItemPlaceholder nomenclature={item.nomenclature} size={64} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 3 }}>{item.nomenclature}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: 5 }}>{item.ledgerFolio}</div>
                    {item.description && (
                      <div style={{ fontSize: 12, color: 'var(--text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.description}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
                      {item.unitOfIssue}
                    </span>
                    {item.minStockLevel > 0 && (
                      <span style={{ fontSize: 10, color: '#92400e', fontWeight: 600 }}>⚠ Min: {item.minStockLevel}</span>
                    )}
                  </div>
                  <ChevronRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Detail Drawer ── */}
      <AnimatePresence>
        {selectedItem && (
          <ItemDetailDrawer item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ItemsCatalog;
