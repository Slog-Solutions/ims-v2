import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSpreadsheet, Plus, Search, Trash2, Printer,
  Check, X, ArrowUpRight, ArrowDownLeft, Calendar,
  User, Shield, Clipboard, ClipboardList, MapPin
} from 'lucide-react';
import api from '../api/api.js';

const Vouchers = () => {
  const { user } = useSelector((state) => state.auth);
  const isMaster = user?.role === 'master';
  const location = useLocation();

  const [vouchers, setVouchers] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  // Create Form State
  const [formOpen, setFormOpen] = useState(false);
  const [voucherNo, setVoucherNo] = useState('');
  const [voucherType, setVoucherType] = useState('receipt');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [formItems, setFormItems] = useState([{ item: '', qty: 1, remarks: '' }]);
  const [formError, setFormError] = useState('');

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vouchers', {
        params: { type: typeFilter, status: statusFilter }
      });
      if (res.data.success) {
        setVouchers(res.data.data.vouchers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNomenclatureItems = async () => {
    try {
      const res = await api.get('/items');
      if (res.data.success) {
        setItemsList(res.data.data.items);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVouchers();
    fetchNomenclatureItems();
  }, [typeFilter, statusFilter]);

  // Handle redirects from Dashboard quick actions
  useEffect(() => {
    if (location.state?.createType) {
      handleOpenCreate(location.state.createType);
      // Clear location state
      window.history.replaceState({}, document.title);
    } else if (location.state?.selectVoucherId) {
      handleOpenVoucher(location.state.selectVoucherId);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleOpenVoucher = async (voucherId) => {
    try {
      const res = await api.get(`/vouchers/${voucherId}`);
      if (res.data.success) {
        setSelectedVoucher(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load voucher details');
    }
  };

  const handleOpenCreate = (type = 'receipt') => {
    setVoucherType(type);
    setVoucherNo(`V-${type === 'receipt' ? 'RV' : 'IV'}-${Date.now().toString().slice(-6)}`);
    setOrigin(type === 'receipt' ? '' : user?.establishmentName || '');
    setDestination(type === 'receipt' ? user?.establishmentName || '' : '');
    setDate(new Date().toISOString().split('T')[0]);
    setFormItems([{ item: '', qty: 1, remarks: '' }]);
    setFormError('');
    setFormOpen(true);
  };

  const handleAddRow = () => {
    setFormItems([...formItems, { item: '', qty: 1, remarks: '' }]);
  };

  const handleRemoveRow = (index) => {
    if (formItems.length === 1) return;
    setFormItems(formItems.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formItems];
    updated[index][field] = value;
    setFormItems(updated);
  };

  const handleSubmitVoucher = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validations
    if (!voucherNo || !origin || !destination) {
      setFormError('Please fill out all required voucher header details.');
      return;
    }

    if (formItems.some(i => !i.item || i.qty < 1)) {
      setFormError('Please select items and specify valid quantities.');
      return;
    }

    const payload = {
      voucherNo,
      type: voucherType,
      date,
      origin,
      destination,
      items: formItems.map(i => ({ item: i.item, qty: Number(i.qty), remarks: i.remarks })),
    };

    try {
      const res = await api.post('/vouchers', payload);
      if (res.data.success) {
        setFormOpen(false);
        fetchVouchers();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit voucher');
    }
  };

  const handleApprove = async (voucherId) => {
    if (!window.confirm('Are you sure you want to approve this voucher? Stock ledgers will be updated immediately.')) return;
    try {
      const res = await api.post(`/vouchers/${voucherId}/approve`);
      if (res.data.success) {
        setSelectedVoucher(res.data.data);
        fetchVouchers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve voucher');
    }
  };

  const handleReject = async (voucherId) => {
    const reason = window.prompt('Enter rejection remarks / reason:');
    if (reason === null) return;
    try {
      const res = await api.post(`/vouchers/${voucherId}/reject`, { remarks: reason });
      if (res.data.success) {
        setSelectedVoucher(res.data.data);
        fetchVouchers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject voucher');
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container-fluid py-2"
    >
      {/* Header section */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3 no-print">
        <div>
          <h1 className="page-title gradient-text mb-1">Stores Vouchers Register</h1>
          <p className="page-subtitle mb-0">Track internal Receipts (incoming) and Issues (outgoing) items logs</p>
        </div>
        {!isMaster && (
          <div className="d-flex gap-2">
            <button onClick={() => handleOpenCreate('receipt')} className="btn btn-primary-farm">
              <Plus size={16} /> New Receipt Voucher
            </button>
            <button onClick={() => handleOpenCreate('issue')} className="btn btn-primary-farm" style={{ background: 'var(--primary-green-hover)' }}>
              <Plus size={16} /> New Issue Voucher
            </button>
          </div>
        )}
      </div>

      {/* Filters and Vouchers list */}
      <div className="row g-4 no-print">
        <div className="col-12">
          <div className="card-farm p-3 d-flex gap-3 align-items-center flex-wrap">
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted" style={{ fontSize: '13px', fontWeight: 600 }}>Type:</span>
              <select className="form-select py-1.5 px-3" style={{ width: '130px' }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">All</option>
                <option value="receipt">Receipt (RV)</option>
                <option value="issue">Issue (IV)</option>
              </select>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted" style={{ fontSize: '13px', fontWeight: 600 }}>Status:</span>
              <select className="form-select py-1.5 px-3" style={{ width: '130px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card-farm glass-panel p-4">
            {loading ? (
              <div className="d-flex justify-content-center py-5">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading vouchers...</span>
                </div>
              </div>
            ) : vouchers.length === 0 ? (
              <p className="text-center py-4 text-muted mb-0">No vouchers matching search filters.</p>
            ) : (
              <div className="table-responsive-farm">
                <table className="table table-hover glass-table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Voucher No</th>
                      <th>Type</th>
                      <th>Origin</th>
                      <th>Destination</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vouchers.map((v) => (
                      <tr key={v._id}>
                        <td><span className="fw-bold text-success">{v.voucherNo}</span></td>
                        <td>
                          {v.type === 'receipt' ? (
                            <span className="text-success fw-semibold d-flex align-items-center"><ArrowDownLeft size={14} className="me-1" /> Receipt</span>
                          ) : (
                            <span className="text-danger fw-semibold d-flex align-items-center"><ArrowUpRight size={14} className="me-1" /> Issue</span>
                          )}
                        </td>
                        <td>{v.origin}</td>
                        <td>{v.destination}</td>
                        <td>{new Date(v.date).toLocaleDateString('en-IN')}</td>
                        <td>
                          <span className={`badge bg-${v.status === 'approved' ? 'success' : v.status === 'rejected' ? 'danger' : 'warning'} text-${v.status === 'pending' ? 'dark' : 'white'} py-1.5 px-2.5 rounded-pill`}>
                            {v.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="text-end">
                          <button onClick={() => handleOpenVoucher(v._id)} className="btn btn-outline-success btn-sm rounded-3">
                            Open Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Voucher Fullscreen Panel */}
      <AnimatePresence>
        {formOpen && (
          <div className="bulk-add-overlay" style={{ background: 'var(--bg-cream)' }}>
            <div className="bulk-add-header">
              <div>
                <h3 className="fw-bold mb-0 text-success" style={{ fontSize: '20px' }}>
                  Compile {voucherType.toUpperCase()} Voucher Record
                </h3>
                <p className="text-muted mb-0" style={{ fontSize: '12px' }}>Fill voucher header and add nomenclature line items</p>
              </div>
              <button onClick={() => setFormOpen(false)} className="btn btn-outline-secondary rounded-pill p-2"><X size={18} /></button>
            </div>

            <div className="bulk-add-content container py-4">
              <form onSubmit={handleSubmitVoucher} className="d-flex flex-column gap-4">
                {formError && (
                  <div className="alert alert-danger py-2.5 px-3 rounded-4" style={{ fontSize: '13px' }}>
                    {formError}
                  </div>
                )}

                {/* Header Inputs */}
                <div className="card-farm p-4 d-flex flex-column gap-3">
                  <h4 className="fw-bold mb-0 text-success" style={{ fontSize: '15px' }}>Header Information</h4>
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>Voucher Number</label>
                      <input type="text" className="form-control" required value={voucherNo} onChange={(e) => setVoucherNo(e.target.value)} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>Voucher Date</label>
                      <input type="date" className="form-control" required value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>Source (Origin)</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        disabled={voucherType === 'issue'}
                        placeholder="e.g. Central Depot / Unit"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>Consignee (Destination)</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        disabled={voucherType === 'receipt'}
                        placeholder="e.g. Bridging Train Wing"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Items table */}
                <div className="card-farm p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="fw-bold mb-0 text-success" style={{ fontSize: '15px' }}>Voucher Serials (Line Items)</h4>
                    <button type="button" onClick={handleAddRow} className="btn btn-outline-success btn-sm rounded-3">
                      <Plus size={14} className="me-1" /> Add Row
                    </button>
                  </div>

                  <div className="table-responsive-farm border rounded-3 overflow-hidden">
                    <table className="table mb-0 align-middle">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '40px' }}>#</th>
                          <th>Select Nomenclature Item</th>
                          <th style={{ width: '130px' }}>Quantity</th>
                          <th>Remarks / Store State</th>
                          <th style={{ width: '60px' }} className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formItems.map((formItem, idx) => (
                          <tr key={idx}>
                            <td className="text-center font-bold text-muted">{idx + 1}</td>
                            <td>
                              <select
                                className="form-select"
                                required
                                value={formItem.item}
                                onChange={(e) => handleItemChange(idx, 'item', e.target.value)}
                              >
                                <option value="">-- Choose Item Catalog --</option>
                                {itemsList.map(item => (
                                  <option key={item._id} value={item._id}>
                                    {item.nomenclature} ({item.unitOfIssue}) - Folio: {item.ledgerFolio}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control text-center"
                                required
                                min="1"
                                value={formItem.qty}
                                onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Store condition / specifications..."
                                value={formItem.remarks}
                                onChange={(e) => handleItemChange(idx, 'remarks', e.target.value)}
                              />
                            </td>
                            <td className="text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(idx)}
                                className="btn btn-outline-danger btn-sm border-0"
                                disabled={formItems.length === 1}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mb-5">
                  <button type="button" onClick={() => setFormOpen(false)} className="btn btn-outline-secondary px-4 py-2 rounded-3">Cancel</button>
                  <button type="submit" className="btn btn-primary-farm px-5 py-2">Submit for Approval</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Voucher Detail modal (Printable area) */}
      <AnimatePresence>
        {selectedVoucher && (
          <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="modal-content card-farm p-4 border-0 text-start overflow-hidden position-relative"
                style={{ background: 'var(--bg-card)', maxHeight: '90vh', overflowY: 'auto' }}
              >
                {/* Print layout headers (Hidden in standard UI, visible in print) */}
                <div className="print-header-block d-none mb-4">
                  <h3 className="text-center fw-bold font-serif mb-1" style={{ textTransform: 'uppercase' }}>BEG & Centre Roorkee</h3>
                  <h4 className="text-center fw-semibold font-serif mb-4" style={{ textTransform: 'uppercase', textDecoration: 'underline' }}>
                    Stores {selectedVoucher.type === 'receipt' ? 'Receipt' : 'Issue'} Voucher - {selectedVoucher.voucherNo}
                  </h4>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3 no-print">
                  <h3 className="fw-bold mb-0 text-success" style={{ fontSize: '20px' }}>
                    Voucher Detail Sheet
                  </h3>
                  <button onClick={() => setSelectedVoucher(null)} className="btn btn-link text-muted p-0"><X size={20} /></button>
                </div>

                {/* Metadata Sheet */}
                <div className="border rounded-4 p-3 mb-4 bg-light-subtle">
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <div className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Voucher No.</div>
                      <div className="fw-bold text-success fs-5">{selectedVoucher.voucherNo}</div>
                    </div>
                    <div className="col-sm-6 text-sm-end">
                      <div className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Transaction Type</div>
                      <div className="fw-bold fs-5 text-capitalize" style={{ color: selectedVoucher.type === 'receipt' ? 'var(--primary-green-light)' : 'var(--accent-orange)' }}>
                        {selectedVoucher.type} (Voucher)
                      </div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="text-muted" style={{ fontSize: '11px', fontWeight: 600 }}>Voucher Date</div>
                      <div className="fw-semibold">{new Date(selectedVoucher.date).toLocaleDateString('en-IN')}</div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="text-muted" style={{ fontSize: '11px', fontWeight: 600 }}>Origin / Vendor</div>
                      <div className="fw-semibold">{selectedVoucher.origin}</div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="text-muted" style={{ fontSize: '11px', fontWeight: 600 }}>Consignee (Destination)</div>
                      <div className="fw-semibold">{selectedVoucher.destination}</div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="text-muted" style={{ fontSize: '11px', fontWeight: 600 }}>Log Status</div>
                      <div className="fw-semibold text-capitalize">{selectedVoucher.status}</div>
                    </div>
                  </div>
                </div>

                {/* Items List Table */}
                <h4 className="fw-bold text-success mb-2" style={{ fontSize: '15px' }}>Material Nomenclature Listing</h4>
                <div className="border rounded-3 overflow-hidden mb-4">
                  <table className="table align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '40px' }}>#</th>
                        <th>Ledger Folio</th>
                        <th>Nomenclature</th>
                        <th style={{ width: '100px' }} className="text-center">Unit</th>
                        <th style={{ width: '100px' }} className="text-center">Quantity</th>
                        <th>Line Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedVoucher.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="text-center text-muted font-semibold">{idx + 1}</td>
                          <td><span className="font-mono text-success fw-semibold">{it.item?.ledgerFolio}</span></td>
                          <td><span className="fw-semibold">{it.item?.nomenclature}</span></td>
                          <td className="text-center">{it.item?.unitOfIssue}</td>
                          <td className="text-center fw-bold">{it.qty}</td>
                          <td className="text-muted" style={{ fontSize: '13px' }}>{it.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Sign-offs (Print Layout only) */}
                <div className="print-signatures-block d-none mt-5">
                  <div className="d-flex justify-content-between" style={{ marginTop: '60px' }}>
                    <div className="text-center" style={{ width: '220px', borderTop: '1px solid #222', paddingTop: '8px' }}>
                      <div className="fw-bold text-capitalize">{selectedVoucher.submittedBy?.designation || 'OIC Stores'}</div>
                      <div className="text-muted" style={{ fontSize: '12px' }}>{selectedVoucher.submittedBy?.firstName} {selectedVoucher.submittedBy?.lastName}</div>
                      <div className="text-muted font-mono" style={{ fontSize: '11px' }}>{selectedVoucher.submittedBy?.serviceNumber || 'IC-XXXXX'}</div>
                    </div>

                    {selectedVoucher.approvedBy && (
                      <div className="text-center" style={{ width: '220px', borderTop: '1px solid #222', paddingTop: '8px' }}>
                        <div className="fw-bold">HQ Approving Officer</div>
                        <div className="text-muted" style={{ fontSize: '12px' }}>{selectedVoucher.approvedBy?.firstName} {selectedVoucher.approvedBy?.lastName}</div>
                        <div className="text-muted font-mono" style={{ fontSize: '11px' }}>{selectedVoucher.approvedBy?.serviceNumber || 'IC-XXXXX'}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="d-flex justify-content-between align-items-center mt-3 no-print">
                  <button onClick={triggerPrint} className="btn btn-outline-success rounded-3 d-flex align-items-center gap-2">
                    <Printer size={16} /> Print Voucher Form
                  </button>

                  <div className="d-flex gap-2">
                    {selectedVoucher.status === 'pending' && isMaster && (
                      <>
                        <button onClick={() => handleReject(selectedVoucher._id)} className="btn btn-danger rounded-3 d-flex align-items-center gap-1">
                          <X size={15} /> Reject
                        </button>
                        <button onClick={() => handleApprove(selectedVoucher._id)} className="btn btn-success rounded-3 d-flex align-items-center gap-1">
                          <Check size={15} /> Approve & Update Ledger
                        </button>
                      </>
                    )}
                    <button onClick={() => setSelectedVoucher(null)} className="btn btn-outline-secondary rounded-3">
                      Close
                    </button>
                  </div>
                </div>

              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Printing style injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
            background: #fff !important;
            color: #000 !important;
          }
          .modal.show, .modal-dialog, .modal-content, .modal-content * {
            visibility: visible;
          }
          .modal.show {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            background: transparent !important;
            overflow: visible !important;
          }
          .modal-content {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
          .print-header-block, .print-signatures-block {
            display: block !important;
          }
          .table {
            border: 1px solid #000 !important;
          }
          .table th, .table td {
            border-bottom: 1px solid #000 !important;
            border-right: 1px solid #000 !important;
            padding: 8px !important;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default Vouchers;
