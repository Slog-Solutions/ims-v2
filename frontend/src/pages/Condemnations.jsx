import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Plus, Search, X, Check, ArrowRight,
  User, Calendar, Trash2, ShieldCheck, Clipboard
} from 'lucide-react';
import api from '../api/api.js';

const Condemnations = () => {
  const { user } = useSelector((state) => state.auth);
  const isMaster = user?.role === 'master';
  const location = useLocation();

  const [boards, setBoards] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBoard, setSelectedBoard] = useState(null);

  // Form State
  const [formOpen, setFormOpen] = useState(false);
  const [boardNo, setBoardNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [presidingOfficer, setPresidingOfficer] = useState('');
  const [boardMembersRaw, setBoardMembersRaw] = useState('');
  const [formItems, setFormItems] = useState([{ item: '', qty: 1, condition: 'Unserviceable', recommendation: 'Write-off' }]);
  const [formError, setFormError] = useState('');

  // Disposal update state
  const [disposalModalOpen, setDisposalModalOpen] = useState(false);
  const [disposalStatus, setDisposalStatus] = useState('');
  const [disposalDate, setDisposalDate] = useState(new Date().toISOString().split('T')[0]);
  const [disposalRemarks, setDisposalRemarks] = useState('');

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const res = await api.get('/condemnations', { params: { status: statusFilter } });
      if (res.data.success) {
        setBoards(res.data.data.boards);
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
    fetchBoards();
    fetchNomenclatureItems();
  }, [statusFilter]);

  useEffect(() => {
    if (location.state?.selectBoardId) {
      handleOpenBoard(location.state.selectBoardId);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleOpenBoard = async (boardId) => {
    try {
      const res = await api.get(`/condemnations/${boardId}`);
      if (res.data.success) {
        setSelectedBoard(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load board details');
    }
  };

  const handleOpenCreate = () => {
    setBoardNo(`CB-${Date.now().toString().slice(-6)}`);
    setDate(new Date().toISOString().split('T')[0]);
    setPresidingOfficer('');
    setBoardMembersRaw('');
    setFormItems([{ item: '', qty: 1, condition: 'Unserviceable', recommendation: 'Write-off' }]);
    setFormError('');
    setFormOpen(true);
  };

  const handleAddRow = () => {
    setFormItems([...formItems, { item: '', qty: 1, condition: 'Unserviceable', recommendation: 'Write-off' }]);
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

  const handleSubmitBoard = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!boardNo || !presidingOfficer || !boardMembersRaw) {
      setFormError('Please fill out all required board headers.');
      return;
    }

    if (formItems.some(i => !i.item || i.qty < 1 || !i.condition || !i.recommendation)) {
      setFormError('Please complete all line items.');
      return;
    }

    const payload = {
      boardNo,
      date,
      presidingOfficer,
      boardMembers: boardMembersRaw.split(',').map(m => m.trim()).filter(Boolean),
      items: formItems.map(i => ({
        item: i.item,
        qty: Number(i.qty),
        condition: i.condition,
        recommendation: i.recommendation,
      })),
    };

    try {
      const res = await api.post('/condemnations', payload);
      if (res.data.success) {
        setFormOpen(false);
        fetchBoards();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit board request');
    }
  };

  const handleApproveBoard = async (boardId) => {
    if (!window.confirm('Are you sure you want to approve this condemnation write-off? Items will be immediately written-off from inventory.')) return;
    try {
      const res = await api.post(`/condemnations/${boardId}/approve`);
      if (res.data.success) {
        setSelectedBoard(res.data.data);
        fetchBoards();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve condemnation');
    }
  };

  const handleOpenDisposalUpdate = (board) => {
    setDisposalStatus(board.disposalStatus || 'Destroyed');
    setDisposalDate(new Date().toISOString().split('T')[0]);
    setDisposalRemarks('');
    setDisposalModalOpen(true);
  };

  const handleSubmitDisposal = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch(`/condemnations/${selectedBoard._id}/disposal`, {
        disposalStatus,
        disposalDate,
        remarks: disposalRemarks
      });
      if (res.data.success) {
        setSelectedBoard(res.data.data);
        setDisposalModalOpen(false);
        fetchBoards();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update disposal state');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="badge bg-success text-white border-0 py-1.5 px-2.5 rounded-pill">APPROVED</span>;
      case 'disposed':
        return <span className="badge bg-info text-white border-0 py-1.5 px-2.5 rounded-pill">DISPOSED</span>;
      case 'rejected':
        return <span className="badge bg-danger text-white border-0 py-1.5 px-2.5 rounded-pill">REJECTED</span>;
      default:
        return <span className="badge bg-warning text-dark border-0 py-1.5 px-2.5 rounded-pill">PENDING HQ APPROVAL</span>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container-fluid py-2"
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h1 className="page-title gradient-text mb-1">Condemnation Boards Register</h1>
          <p className="page-subtitle mb-0">Manage unserviceable stores, record board proceedings, and track write-off approvals</p>
        </div>
        {!isMaster && (
          <button onClick={handleOpenCreate} className="btn btn-primary-farm">
            <Plus size={16} /> New Condemnation Board
          </button>
        )}
      </div>

      {/* Filter panel */}
      <div className="card-farm p-3 mb-4">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted" style={{ fontSize: '13px', fontWeight: 600 }}>Status:</span>
          <select className="form-select py-1.5 px-3" style={{ width: '200px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="pending">Pending HQ Approval</option>
            <option value="approved">Approved for Disposal</option>
            <option value="disposed">Completed (Disposed)</option>
          </select>
        </div>
      </div>

      {/* Boards List */}
      <div className="card-farm glass-panel p-4">
        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading condemnation logs...</span>
            </div>
          </div>
        ) : boards.length === 0 ? (
          <p className="text-center py-4 text-muted mb-0">No condemnation board records logged.</p>
        ) : (
          <div className="table-responsive-farm">
            <table className="table table-hover glass-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Board No</th>
                  <th>Establishment</th>
                  <th>Presiding Officer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Disposal State</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {boards.map((b) => (
                  <tr key={b._id}>
                    <td><span className="fw-bold text-success">{b.boardNo}</span></td>
                    <td>{b.establishment?.establishmentName}</td>
                    <td>{b.presidingOfficer}</td>
                    <td>{new Date(b.date).toLocaleDateString('en-IN')}</td>
                    <td>{getStatusBadge(b.status)}</td>
                    <td><span className="text-muted fw-semibold" style={{ fontSize: '13px' }}>{b.disposalStatus}</span></td>
                    <td className="text-end">
                      <button onClick={() => handleOpenBoard(b._id)} className="btn btn-outline-success btn-sm rounded-3">
                        View Proceedings
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Condemnation Panel */}
      <AnimatePresence>
        {formOpen && (
          <div className="bulk-add-overlay" style={{ background: 'var(--bg-cream)' }}>
            <div className="bulk-add-header">
              <div>
                <h3 className="fw-bold mb-0 text-success" style={{ fontSize: '20px' }}>
                  Log Condemnation Board Proceedings
                </h3>
                <p className="text-muted mb-0" style={{ fontSize: '12px' }}>Input board membership details and unserviceable store quantities</p>
              </div>
              <button onClick={() => setFormOpen(false)} className="btn btn-outline-secondary rounded-pill p-2"><X size={18} /></button>
            </div>

            <div className="bulk-add-content container py-4">
              <form onSubmit={handleSubmitBoard} className="d-flex flex-column gap-4">
                {formError && (
                  <div className="alert alert-danger py-2.5 px-3 rounded-4" style={{ fontSize: '13px' }}>
                    {formError}
                  </div>
                )}

                {/* Header card */}
                <div className="card-farm p-4 d-flex flex-column gap-3">
                  <h4 className="fw-bold mb-0 text-success" style={{ fontSize: '15px' }}>Board Header</h4>
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>Board Proceedings No.</label>
                      <input type="text" className="form-control" required value={boardNo} onChange={(e) => setBoardNo(e.target.value)} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>Convening Date</label>
                      <input type="date" className="form-control" required value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>Presiding Officer (Rank/Name)</label>
                      <input type="text" className="form-control" required placeholder="e.g. Major R.K. Singh" value={presidingOfficer} onChange={(e) => setPresidingOfficer(e.target.value)} />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>Board Members (Comma separated)</label>
                      <input type="text" className="form-control" required placeholder="e.g. Capt A. Verma, Lt S. Sen" value={boardMembersRaw} onChange={(e) => setBoardMembersRaw(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <div className="card-farm p-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="fw-bold mb-0 text-success" style={{ fontSize: '15px' }}>Unserviceable Line Items</h4>
                    <button type="button" onClick={handleAddRow} className="btn btn-outline-success btn-sm rounded-3">
                      <Plus size={14} className="me-1" /> Add Row
                    </button>
                  </div>

                  <div className="table-responsive-farm border rounded-3 overflow-hidden">
                    <table className="table mb-0 align-middle">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '40px' }}>#</th>
                          <th>Nomenclature Item</th>
                          <th style={{ width: '120px' }}>Quantity</th>
                          <th>Condition / Technical State</th>
                          <th>Recommendation</th>
                          <th style={{ width: '60px' }} className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formItems.map((formItem, idx) => (
                          <tr key={idx}>
                            <td className="text-center text-muted font-bold">{idx + 1}</td>
                            <td>
                              <select
                                className="form-select"
                                required
                                value={formItem.item}
                                onChange={(e) => handleItemChange(idx, 'item', e.target.value)}
                              >
                                <option value="">-- Choose Item --</option>
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
                                required
                                placeholder="e.g. Unserviceable due to wear"
                                value={formItem.condition}
                                onChange={(e) => handleItemChange(idx, 'condition', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-control"
                                required
                                placeholder="e.g. Write-off and salvage"
                                value={formItem.recommendation}
                                onChange={(e) => handleItemChange(idx, 'recommendation', e.target.value)}
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
                  <button type="submit" className="btn btn-primary-farm px-5 py-2">Submit proceedings</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Board Details Modal */}
      <AnimatePresence>
        {selectedBoard && (
          <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="modal-content card-farm p-4 border-0 text-start overflow-hidden position-relative"
                style={{ background: 'var(--bg-card)', maxHeight: '90vh', overflowY: 'auto' }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="fw-bold mb-0 text-success" style={{ fontSize: '20px' }}>
                    Board Proceedings Sheet
                  </h3>
                  <button onClick={() => setSelectedBoard(null)} className="btn btn-link text-muted p-0"><X size={20} /></button>
                </div>

                {/* Details Sheet */}
                <div className="border rounded-4 p-3 mb-4 bg-light-subtle">
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <div className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Board No.</div>
                      <div className="fw-bold text-success fs-5">{selectedBoard.boardNo}</div>
                    </div>
                    <div className="col-sm-6 text-sm-end">
                      <div className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Status</div>
                      <div className="fw-bold fs-6">{getStatusBadge(selectedBoard.status)}</div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="text-muted" style={{ fontSize: '11px', fontWeight: 600 }}>Convened Date</div>
                      <div className="fw-semibold">{new Date(selectedBoard.date).toLocaleDateString('en-IN')}</div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="text-muted" style={{ fontSize: '11px', fontWeight: 600 }}>Establishment</div>
                      <div className="fw-semibold">{selectedBoard.establishment?.establishmentName}</div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="text-muted" style={{ fontSize: '11px', fontWeight: 600 }}>Presiding Officer</div>
                      <div className="fw-semibold">{selectedBoard.presidingOfficer}</div>
                    </div>
                    <div className="col-md-3 col-sm-6">
                      <div className="text-muted" style={{ fontSize: '11px', fontWeight: 600 }}>Disposal Status</div>
                      <div className="fw-bold text-success">{selectedBoard.disposalStatus}</div>
                    </div>
                    <div className="col-12">
                      <div className="text-muted" style={{ fontSize: '11px', fontWeight: 600 }}>Board Members</div>
                      <div className="fw-semibold">{selectedBoard.boardMembers?.join(', ') || 'None'}</div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <h4 className="fw-bold text-success mb-2" style={{ fontSize: '15px' }}>Condemned Stores Details</h4>
                <div className="border rounded-3 overflow-hidden mb-4">
                  <table className="table align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '40px' }}>#</th>
                        <th>Ledger Folio</th>
                        <th>Nomenclature</th>
                        <th style={{ width: '80px' }} className="text-center">Qty</th>
                        <th>Technical Condition</th>
                        <th>Board Recommendation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBoard.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="text-center text-muted font-semibold">{idx + 1}</td>
                          <td><span className="font-mono text-success fw-semibold">{it.item?.ledgerFolio}</span></td>
                          <td><span className="fw-semibold">{it.item?.nomenclature}</span></td>
                          <td className="text-center fw-bold">{it.qty}</td>
                          <td>{it.condition}</td>
                          <td>{it.recommendation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Rejection / Disposal Remarks */}
                {selectedBoard.remarks && (
                  <div className="alert alert-warning py-2.5 px-3 mb-4 rounded-3" style={{ fontSize: '13px' }}>
                    <strong>Proceedings Remarks:</strong> {selectedBoard.remarks}
                  </div>
                )}

                {/* Buttons */}
                <div className="d-flex justify-content-end gap-2 mt-2">
                  {selectedBoard.status === 'pending' && isMaster && (
                    <button onClick={() => handleApproveBoard(selectedBoard._id)} className="btn btn-success rounded-3 d-flex align-items-center gap-1">
                      <Check size={15} /> Approve & Write-off
                    </button>
                  )}
                  {selectedBoard.status === 'approved' && (
                    <button onClick={() => handleOpenDisposalUpdate(selectedBoard)} className="btn btn-primary-farm rounded-3">
                      Record Disposal Outcome
                    </button>
                  )}
                  <button onClick={() => setSelectedBoard(null)} className="btn btn-outline-secondary rounded-3">Close</button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Record Disposal Modal */}
      <AnimatePresence>
        {disposalModalOpen && (
          <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
            <div className="modal-dialog modal-dialog-centered">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="modal-content card-farm p-4 border-0 text-start"
                style={{ background: 'var(--bg-card)' }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="fw-bold mb-0 text-success" style={{ fontSize: '18px' }}>
                    Record Store Disposal Details
                  </h3>
                  <button onClick={() => setDisposalModalOpen(false)} className="btn btn-link text-muted p-0"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmitDisposal} className="d-flex flex-column gap-3">
                  <div>
                    <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>Disposal Action / Status</label>
                    <select className="form-select" value={disposalStatus} onChange={(e) => setDisposalStatus(e.target.value)}>
                      <option value="Destroyed under supervision">Destroyed under supervision</option>
                      <option value="Returned to Central Depot">Returned to Central Depot</option>
                      <option value="Sold by Public Auction">Sold by Public Auction</option>
                      <option value="Reduced to Scrap">Reduced to Scrap</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>Disposal Date</label>
                    <input type="date" className="form-control" required value={disposalDate} onChange={(e) => setDisposalDate(e.target.value)} />
                  </div>

                  <div>
                    <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>Disposal Remarks</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Input certificate numbers or disposal board remarks..."
                      value={disposalRemarks}
                      onChange={(e) => setDisposalRemarks(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary-farm w-100 justify-content-center py-2.5 mt-2">
                    Save Disposal Certificate
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Condemnations;
