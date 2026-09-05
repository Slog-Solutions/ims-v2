import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, Shield, X, Package, ImagePlus, Camera } from 'lucide-react';
import api from '../api/api.js';
import { ITEM_UNITS } from '../utils/constants.js';
import ImageLightbox from '../components/common/ImageLightbox.jsx';

const NomenclatureMaster = () => {
  const { user } = useSelector((state) => state.auth);
  const isMaster = user?.role === 'master';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [galleryItem, setGalleryItem] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Form fields
  const [nomenclature, setNomenclature] = useState('');
  const [unitOfIssue, setUnitOfIssue] = useState('Nos');
  const [ledgerFolio, setLedgerFolio] = useState('');
  const [description, setDescription] = useState('');
  const [minStockLevel, setMinStockLevel] = useState(0);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Multi-image state: arrays of { file, preview } for new files + existing URLs from DB
  const [imageFiles, setImageFiles] = useState([]);     // new File objects to upload
  const [imagePreviews, setImagePreviews] = useState([]); // { src, isExisting, publicId? }
  const IMAGE_LIMIT = 5;

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/items', { params: { search } });
      if (res.data.success) {
        setItems(res.data.data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setNomenclature('');
    setUnitOfIssue('Nos');
    setLedgerFolio('');
    setDescription('');
    setMinStockLevel(0);
    setFormError('');
    setImageFiles([]);
    setImagePreviews([]);
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setNomenclature(item.nomenclature);
    setUnitOfIssue(item.unitOfIssue);
    setLedgerFolio(item.ledgerFolio);
    setDescription(item.description || '');
    setMinStockLevel(item.minStockLevel || 0);
    setFormError('');
    setImageFiles([]);
    // Populate existing images from DB
    setImagePreviews(
      (item.images || []).map((img) => ({ src: img.url, isExisting: true, publicId: img.publicId }))
    );
    setModalOpen(true);
  };

  const addImageFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter((f) => f.type.startsWith('image/'));
    const remaining = IMAGE_LIMIT - imagePreviews.length;
    if (remaining <= 0) return;
    const toAdd = valid.slice(0, remaining);
    setImageFiles((prev) => [...prev, ...toAdd]);
    setImagePreviews((prev) => [
      ...prev,
      ...toAdd.map((f) => ({ src: URL.createObjectURL(f), isExisting: false, publicId: null })),
    ]);
  };

  const handleImageChange = (e) => {
    if (e.target.files) addImageFiles(e.target.files);
    // reset so same file can be picked again
    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    const preview = imagePreviews[index];
    if (!preview.isExisting) {
      // Count how many new files precede this index
      const newFilesBefore = imagePreviews.slice(0, index).filter((p) => !p.isExisting).length;
      setImageFiles((prev) => prev.filter((_, i) => i !== newFilesBefore));
    }
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    const formData = new FormData();
    formData.append('nomenclature', nomenclature);
    formData.append('unitOfIssue', unitOfIssue);
    formData.append('ledgerFolio', ledgerFolio);
    formData.append('description', description);
    formData.append('minStockLevel', Number(minStockLevel));

    // Append each new image file under the 'images' key
    imageFiles.forEach((file) => formData.append('images', file));

    // When editing, tell backend which existing images were removed
    if (editingItem) {
      const originalPublicIds = (editingItem.images || []).map((img) => img.publicId);
      const keptPublicIds = imagePreviews.filter((p) => p.isExisting).map((p) => p.publicId);
      const removed = originalPublicIds.filter((pid) => !keptPublicIds.includes(pid));
      removed.forEach((pid) => formData.append('removeImageIds', pid));
    }

    try {
      if (editingItem) {
        const res = await api.put(`/items/${editingItem._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data.success) { setModalOpen(false); fetchItems(); }
      } else {
        const res = await api.post('/items', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data.success) { setModalOpen(false); fetchItems(); }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit nomenclature item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this Nomenclature Item?')) return;
    try {
      const res = await api.delete(`/items/${itemId}`);
      if (res.data.success) {
        fetchItems();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete nomenclature item');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="container-fluid py-3"
    >
      {/* Header section */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h1 className="page-title gradient-text mb-1">Central Nomenclature Master</h1>
          <p className="page-subtitle mb-0">Official military store ledger cards, stock catalogs, and unit definitions</p>
        </div>
        {isMaster && (
          <button onClick={handleOpenAdd} className="btn btn-primary-farm press-scale">
            <Plus size={16} /> Add Catalog Item
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card-farm p-3 mb-4">
        <div className="position-relative">
          <Search className="position-absolute text-muted" size={18} style={{ left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search nomenclature catalog by item name or ledger folio number..."
            className="form-control ps-5"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Items Table */}
      <div className="card-farm glass-panel p-4">
        {loading ? (
          <div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="d-flex gap-3 py-3 align-items-center" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="skeleton skeleton-text" style={{ width: '12%', height: 16, marginBottom: 0 }} />
                <div className="skeleton skeleton-text" style={{ width: '28%', height: 16, marginBottom: 0 }} />
                <div className="skeleton skeleton-text" style={{ width: '10%', height: 16, marginBottom: 0 }} />
                <div className="skeleton skeleton-text" style={{ width: '35%', height: 16, marginBottom: 0 }} />
                <div className="skeleton skeleton-text" style={{ width: '8%', height: 16, marginBottom: 0 }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="table-responsive-farm">
            <table className="table table-hover glass-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Ledger Folio No.</th>
                  <th>Nomenclature</th>
                  <th>Unit of Issue</th>
                  <th>Description</th>
                  <th>Min Alert Stock</th>
                  {isMaster && <th className="text-end">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={isMaster ? 6 : 5} className="text-center py-5 text-muted">
                      <Package size={36} className="mx-auto mb-2 opacity-50" />
                      <div>No nomenclature items found.</div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item._id} className="table-row-interactive">
                      <td>
                        {(item.images && item.images.length > 0) ? (
                          <div
                            onClick={() => {
                              setGalleryItem(item);
                              setGalleryIndex(0);
                            }}
                            style={{ display: 'flex', gap: 4, cursor: 'pointer', alignItems: 'center' }}
                            title={`Click to view all ${item.images.length} photos`}
                          >
                            <img
                              src={item.images[0].url}
                              alt={item.nomenclature}
                              style={{
                                width: 44, height: 44, objectFit: 'cover',
                                borderRadius: 8, border: '2px solid var(--border-color)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                                transition: 'transform 0.18s, border-color 0.18s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.08)';
                                e.currentTarget.style.borderColor = '#22c55e';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                              }}
                            />
                            {item.images.length > 1 && (
                              <div
                                style={{
                                  width: 44, height: 44, borderRadius: 8,
                                  background: 'var(--primary-green-subtle)',
                                  border: '2px solid var(--border-color)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 11, fontWeight: 700, color: 'var(--primary-green)',
                                  transition: 'background 0.18s',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(34, 197, 94, 0.25)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--primary-green-subtle)')}
                              >
                                +{item.images.length - 1}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{
                            width: 44, height: 44, borderRadius: 8,
                            background: 'var(--bg-card)',
                            border: '2px dashed var(--border-color)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5,
                          }}>
                            <Package size={18} />
                          </div>
                        )}
                      </td>
                      <td><span className="badge bg-dark font-mono px-2.5 py-1">{item.ledgerFolio}</span></td>
                      <td><span className="fw-semibold text-success">{item.nomenclature}</span></td>
                      <td><span className="badge bg-light text-dark">{item.unitOfIssue}</span></td>
                      <td className="text-muted" style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.description || 'No description provided'}
                      </td>
                      <td>
                        <span className="fw-bold">{item.minStockLevel || 0}</span>
                      </td>
                      {isMaster && (
                        <td className="text-end">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="btn btn-outline-success btn-sm rounded-3 me-2 border-0 press-scale"
                            style={{ padding: '6px 10px' }}
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="btn btn-outline-danger btn-sm rounded-3 border-0 press-scale"
                            style={{ padding: '6px 10px' }}
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Nomenclature Modal — rendered via portal onto document.body so that
          position:fixed isn't scoped inside the page motion.div transform */}
      {createPortal(
        <AnimatePresence>
          {modalOpen && (
          /* ── Backdrop: position:fixed covers everything, flex centres the card ── */
          <div
            tabIndex="-1"
            onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1055,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            {/* ── Card ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: '100%',
                maxWidth: '560px',
                maxHeight: 'calc(100dvh - 2rem)',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg, 16px)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Sticky header ── */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px 24px 16px',
                  borderBottom: '1px solid var(--border-color)',
                  flexShrink: 0,
                }}
              >
                <h3 className="fw-bold mb-0 text-success" style={{ fontSize: 'var(--fs-h3)' }}>
                  {editingItem ? 'Edit Nomenclature Item' : 'New Nomenclature Catalog Entry'}
                </h3>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: 6, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* ── Scrollable form body ── */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                <form id="nomenclature-form" onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                  {formError && (
                    <div className="alert alert-danger py-2 px-3 rounded-3" style={{ fontSize: 'var(--fs-sm)' }}>
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="form-label fw-semibold" style={{ fontSize: 'var(--fs-sm)' }}>Nomenclature (Item Name)</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Sapper Shovel Mk.IV"
                      value={nomenclature}
                      onChange={(e) => setNomenclature(e.target.value)}
                    />
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 'var(--fs-sm)' }}>Unit of Issue</label>
                      <select
                        className="form-select"
                        value={unitOfIssue}
                        onChange={(e) => setUnitOfIssue(e.target.value)}
                      >
                        {Object.values(ITEM_UNITS).map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold" style={{ fontSize: 'var(--fs-sm)' }}>Ledger Folio No.</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        placeholder="e.g. LF/ENG/102"
                        value={ledgerFolio}
                        onChange={(e) => setLedgerFolio(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label fw-semibold" style={{ fontSize: 'var(--fs-sm)' }}>Min Stock Warning Level</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      value={minStockLevel}
                      onChange={(e) => setMinStockLevel(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label fw-semibold" style={{ fontSize: 'var(--fs-sm)' }}>Description / Technical Specifications</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Enter military hardware specifications or remarks..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {/* ── Multi-Image Upload Section ── */}
                  <div>
                    <label className="form-label fw-semibold" style={{ fontSize: 'var(--fs-sm)' }}>
                      <Camera size={14} className="me-1" style={{ verticalAlign: 'text-top' }} />
                      Product / Item Images
                      <span className="text-muted fw-normal ms-1">
                        (optional · {imagePreviews.length}/{IMAGE_LIMIT})
                      </span>
                    </label>

                    {/* Thumbnail grid */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>

                      {/* Existing + new image thumbnails */}
                      {imagePreviews.map((preview, index) => (
                        <div
                          key={index}
                          style={{
                            position: 'relative',
                            width: 86,
                            height: 86,
                            borderRadius: 10,
                            overflow: 'hidden',
                            border: preview.isExisting
                              ? '2px solid var(--primary-green)'
                              : '2px solid var(--border-color)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={preview.src}
                            alt={`Image ${index + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            style={{
                              position: 'absolute', top: 4, right: 4,
                              background: 'rgba(0,0,0,0.65)', border: 'none',
                              borderRadius: '50%', width: 22, height: 22,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', color: '#fff',
                              backdropFilter: 'blur(4px)',
                              padding: 0,
                            }}
                            title="Remove"
                          >
                            <X size={12} />
                          </button>
                          {/* Index badge */}
                          <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            background: 'rgba(0,0,0,0.45)', color: '#fff',
                            fontSize: 9, fontWeight: 700, textAlign: 'center',
                            padding: '2px 0',
                          }}>
                            {preview.isExisting ? '✓ saved' : `new`}
                          </div>
                        </div>
                      ))}

                      {/* Add-more zone (shown if below limit) */}
                      {imagePreviews.length < IMAGE_LIMIT && (
                        <label
                          htmlFor="item-images-upload"
                          style={{
                            width: 86, height: 86, borderRadius: 10,
                            border: '2px dashed var(--border-color)',
                            background: 'var(--bg-card)',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            gap: 4, cursor: 'pointer',
                            transition: 'border-color 0.2s, background 0.2s',
                            flexShrink: 0,
                            textAlign: 'center',
                          }}
                          onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#22c55e'; }}
                          onDragLeave={(e) => { e.currentTarget.style.borderColor = ''; }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.borderColor = '';
                            if (e.dataTransfer.files) addImageFiles(e.dataTransfer.files);
                          }}
                        >
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'rgba(34,197,94,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#22c55e',
                          }}>
                            <ImagePlus size={16} />
                          </div>
                          <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.3 }}>
                            Add
                          </span>
                          <input
                            id="item-images-upload"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleImageChange}
                          />
                        </label>
                      )}

                      {/* Empty state — show big dropzone when no images yet */}
                      {imagePreviews.length === 0 && (
                        <label
                          htmlFor="item-images-upload"
                          style={{
                            flex: 1, minWidth: 200, height: 110,
                            borderRadius: 12,
                            border: '2px dashed var(--border-color)',
                            background: 'var(--bg-card)',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            gap: 8, cursor: 'pointer',
                            transition: 'border-color 0.2s',
                            textAlign: 'center', padding: '0 16px',
                          }}
                          onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#22c55e'; }}
                          onDragLeave={(e) => { e.currentTarget.style.borderColor = ''; }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.borderColor = '';
                            if (e.dataTransfer.files) addImageFiles(e.dataTransfer.files);
                          }}
                        >
                          <div style={{
                            width: 44, height: 44, borderRadius: '50%',
                            background: 'rgba(34,197,94,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e',
                          }}>
                            <ImagePlus size={20} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)', color: 'var(--text-primary)' }}>
                              Click or drag & drop images
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                              JPG, PNG, WEBP · up to 5 images · 5 MB each
                            </div>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>

                </form>
              </div>

              {/* ── Pinned submit button ── */}
              <div
                style={{
                  padding: '16px 24px',
                  borderTop: '1px solid var(--border-color)',
                  flexShrink: 0,
                  background: 'var(--bg-card)',
                }}
              >
                <button
                  type="submit"
                  form="nomenclature-form"
                  disabled={submitting}
                  className="btn btn-primary-farm w-100 justify-content-center press-scale"
                  style={{ padding: '12px' }}
                >
                  {submitting ? (
                    <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Uploading & Saving...</>
                  ) : editingItem ? 'Save Nomenclature' : 'Register Nomenclature'}
                </button>
              </div>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Lightbox for viewing all images of an item */}
      <ImageLightbox
        isOpen={!!galleryItem}
        images={galleryItem?.images || []}
        initialIndex={galleryIndex}
        title={galleryItem?.nomenclature || ''}
        subtitle={galleryItem?.ledgerFolio || ''}
        onClose={() => setGalleryItem(null)}
      />
    </motion.div>
  );
};

export default NomenclatureMaster;
