import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const ImageLightbox = ({
  isOpen,
  images = [],
  initialIndex = 0,
  title = '',
  subtitle = '',
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Sync initial index when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, (images?.length || 1) - 1)));
    }
  }, [isOpen, initialIndex, images]);

  const total = images?.length || 0;

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  }, [total]);

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  }, [total]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || total === 0) return null;

  const currentImg = images[currentIndex];
  const currentUrl = typeof currentImg === 'string' ? currentImg : currentImg?.url;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="image-lightbox-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 999999,
          background: 'rgba(7, 12, 16, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          userSelect: 'none',
          overflow: 'hidden',
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
        }}
      >
        {/* Top Header Bar */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 28px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(0, 0, 0, 0.45)',
            zIndex: 30,
            flexShrink: 0,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3
                style={{
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 700,
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {title || 'Item Image Gallery'}
              </h3>
              {subtitle && (
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: 'monospace',
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: 'rgba(255, 255, 255, 0.12)',
                    color: 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  {subtitle}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', marginTop: 3 }}>
              Viewing photo <strong style={{ color: '#22c55e' }}>{currentIndex + 1}</strong> of{' '}
              <strong style={{ color: '#fff' }}>{total}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <button
              onClick={onClose}
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.18)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
              }}
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Image Viewer Area - Equal padding & margin from every side */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
            overflow: 'hidden',
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
          }}
          onClick={onClose}
        >
          {/* Previous Photo Button */}
          {total > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Previous photo"
              style={{
                position: 'absolute',
                left: 24,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '2px solid rgba(34, 197, 94, 0.85)',
                color: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 40,
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 18px rgba(34, 197, 94, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#22c55e';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#22c55e';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(34, 197, 94, 0.65)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.85)';
                e.currentTarget.style.color = '#22c55e';
                e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.85)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 18px rgba(34, 197, 94, 0.3)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
              title="Previous photo (←)"
            >
              <ChevronLeft size={30} strokeWidth={2.5} />
            </button>
          )}

          {/* Centered Image with equal margins and padding on all 4 sides */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxSizing: 'border-box',
              margin: 'auto',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={currentIndex}
                src={currentUrl}
                alt={`${title} - Photo ${currentIndex + 1}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  maxWidth: total > 1 ? 'calc(100% - 150px)' : '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: 14,
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  margin: 'auto',
                  display: 'block',
                }}
              />
            </AnimatePresence>
          </div>

          {/* Next Photo Button */}
          {total > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Next photo"
              style={{
                position: 'absolute',
                right: 24,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '2px solid rgba(34, 197, 94, 0.85)',
                color: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 40,
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 18px rgba(34, 197, 94, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#22c55e';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#22c55e';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(34, 197, 94, 0.65)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.85)';
                e.currentTarget.style.color = '#22c55e';
                e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.85)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 18px rgba(34, 197, 94, 0.3)';
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
              }}
              title="Next photo (→)"
            >
              <ChevronRight size={30} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Bottom Thumbnail Strip Bar */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            padding: '12px 20px 18px',
            background: 'rgba(0, 0, 0, 0.55)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            zIndex: 30,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 10,
              overflowX: 'auto',
              maxWidth: '100%',
              padding: '4px 10px',
              scrollbarWidth: 'thin',
              alignItems: 'center',
            }}
          >
            {images.map((img, i) => {
              const url = typeof img === 'string' ? img : img?.url;
              const isActive = i === currentIndex;
              return (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  style={{
                    position: 'relative',
                    width: 60,
                    height: 60,
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: isActive
                      ? '2.5px solid #22c55e'
                      : '2px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: isActive
                      ? '0 0 18px rgba(34, 197, 94, 0.7)'
                      : '0 2px 8px rgba(0,0,0,0.3)',
                    padding: 0,
                    cursor: 'pointer',
                    background: '#111',
                    transform: isActive ? 'scale(1.06)' : 'scale(1)',
                    transition: 'all 0.18s ease',
                    flexShrink: 0,
                  }}
                  title={`View photo ${i + 1}`}
                >
                  <img
                    src={url}
                    alt={`Thumb ${i + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: isActive ? 1 : 0.65,
                      transition: 'opacity 0.18s',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 2,
                      right: 3,
                      background: isActive ? '#22c55e' : 'rgba(0,0,0,0.7)',
                      color: '#fff',
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: 4,
                    }}
                  >
                    #{i + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default ImageLightbox;

