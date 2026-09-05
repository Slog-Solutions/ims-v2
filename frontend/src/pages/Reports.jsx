import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  BookOpen, FileSpreadsheet, Download, Search,
  Grid, ClipboardList, AlertTriangle, ArrowDown, ArrowUp
} from 'lucide-react';
import api from '../api/api.js';

const Reports = () => {
  const { user } = useSelector((state) => state.auth);
  const isMaster = user?.role === 'master';

  const [activeTab, setActiveTab] = useState('register'); // 'register' or 'ledger'
  const [establishments, setEstablishments] = useState([]);
  const [itemsList, setItemsList] = useState([]);

  // Selection filters
  const [selectedEst, setSelectedEst] = useState('');
  const [selectedItem, setSelectedItem] = useState('');

  // Data states
  const [inventoryList, setInventoryList] = useState([]);
  const [consolidatedData, setConsolidatedData] = useState(null);
  const [ledgerHistory, setLedgerHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchInitialFilters = async () => {
    try {
      const itemsRes = await api.get('/items');
      if (itemsRes.data.success) {
        setItemsList(itemsRes.data.data.items);
        if (itemsRes.data.data.items.length > 0) {
          setSelectedItem(itemsRes.data.data.items[0]._id);
        }
      }

      // Master user needs the list of establishments
      if (isMaster) {
        const estRes = await api.get('/users'); // gets all users (master and establishments)
        if (estRes.data.success) {
          const units = estRes.data.data.users.filter(u => u.role === 'establishment');
          setEstablishments(units);
          if (units.length > 0) {
            setSelectedEst(units[0]._id);
          }
        }
      } else {
        setSelectedEst(user._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInitialFilters();
  }, []);

  // Fetch Inventory for specific unit
  const fetchInventory = async () => {
    if (!selectedEst) return;
    try {
      setLoading(true);
      const res = await api.get(`/reports/inventory/${selectedEst}`);
      if (res.data.success) {
        setInventoryList(res.data.data.inventory);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Consolidated Master Grid
  const fetchConsolidated = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/consolidated');
      if (res.data.success) {
        setConsolidatedData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Ledger History
  const fetchLedger = async () => {
    if (!selectedItem || !selectedEst) return;
    try {
      setLoading(true);
      const res = await api.get('/reports/ledger', {
        params: { itemId: selectedItem, establishmentId: selectedEst }
      });
      if (res.data.success) {
        setLedgerHistory(res.data.data.history);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'register') {
      if (isMaster && selectedEst === 'consolidated') {
        fetchConsolidated();
      } else {
        fetchInventory();
      }
    } else if (activeTab === 'ledger') {
      fetchLedger();
    }
  }, [activeTab, selectedEst, selectedItem]);

  const handleExportExcel = () => {
    if (!selectedItem || !selectedEst) return;
    const token = localStorage.getItem('accessToken');
    const exportUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/reports/export/excel?itemId=${selectedItem}&establishmentId=${selectedEst}&token=${token}`;
    window.open(exportUrl, '_blank');
  };

  const filteredInventory = inventoryList.filter(itemObj =>
    itemObj.item.nomenclature.toLowerCase().includes(search.toLowerCase()) ||
    itemObj.item.ledgerFolio.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="page-title gradient-text mb-1">Ledgers & Reports Portal</h1>
          <p className="page-subtitle mb-0">Review running stock registers, ledger sheets, and export official summaries</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="d-flex border-bottom mb-4 gap-2">
        <button
          onClick={() => setActiveTab('register')}
          className={`btn py-2.5 px-4 fw-bold border-0 border-bottom rounded-0 d-flex align-items-center gap-2 ${activeTab === 'register' ? 'border-success text-success border-2' : 'text-muted'}`}
        >
          <Grid size={18} /> Stock Registers
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`btn py-2.5 px-4 fw-bold border-0 border-bottom rounded-0 d-flex align-items-center gap-2 ${activeTab === 'ledger' ? 'border-success text-success border-2' : 'text-muted'}`}
        >
          <BookOpen size={18} /> Ledger Sheet (Ledger Card)
        </button>
      </div>

      {activeTab === 'register' ? (
        <div className="d-flex flex-column gap-4">
          {/* Controls */}
          <div className="card-farm p-3 d-flex justify-content-between align-items-center gap-3 flex-wrap">
            <div className="d-flex align-items-center gap-3 flex-wrap">
              {isMaster && (
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted fw-semibold" style={{ fontSize: '13px' }}>Establishment:</span>
                  <select
                    className="form-select py-1.5 px-3"
                    style={{ width: '230px' }}
                    value={selectedEst}
                    onChange={(e) => setSelectedEst(e.target.value)}
                  >
                    <option value="consolidated">-- Consolidated Center Grid --</option>
                    {establishments.map(est => (
                      <option key={est._id} value={est._id}>{est.establishmentName}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedEst !== 'consolidated' && (
                <div className="position-relative" style={{ width: '280px' }}>
                  <Search className="position-absolute text-muted" size={17} style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Filter inventory table..."
                    className="form-control ps-5 py-1.5"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Grid Register table */}
          <div className="card-farm glass-panel p-4">
            {loading ? (
              <div className="d-flex justify-content-center py-5">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading stock register...</span>
                </div>
              </div>
            ) : selectedEst === 'consolidated' ? (
              // Consolidated Master Grid View
              <div className="table-responsive-farm">
                <table className="table table-hover glass-table align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Nomenclature</th>
                      <th>Folio</th>
                      <th>Unit</th>
                      {consolidatedData?.establishments.map(est => (
                        <th key={est._id} className="text-center" style={{ fontSize: '11px', whiteSpace: 'normal', maxWidth: '100px' }}>
                          {est.name}
                        </th>
                      ))}
                      <th className="text-center bg-dark text-white fw-bold">Total Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!consolidatedData || consolidatedData.report.length === 0 ? (
                      <tr>
                        <td colSpan={5 + (consolidatedData?.establishments.length || 0)} className="text-center py-4 text-muted">
                          No stock records seeded.
                        </td>
                      </tr>
                    ) : (
                      consolidatedData.report.map((row, idx) => (
                        <tr key={idx}>
                          <td><span className="fw-semibold text-success">{row.item.nomenclature}</span></td>
                          <td><span className="font-mono text-muted">{row.item.ledgerFolio}</span></td>
                          <td>{row.item.unitOfIssue}</td>
                          {consolidatedData.establishments.map(est => (
                            <td key={est._id} className="text-center fw-semibold">
                              {row.balances[est._id] !== undefined ? row.balances[est._id] : 0}
                            </td>
                          ))}
                          <td className="text-center bg-dark text-success fw-bold font-mono">{row.totalQty}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              // Individual Establishment Inventory Register
              <div className="table-responsive-farm">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Ledger Folio</th>
                      <th>Nomenclature</th>
                      <th>Unit of Issue</th>
                      <th className="text-center">Min Level</th>
                      <th className="text-center">Current Stock Balance</th>
                      <th>Remarks / Warnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-muted">No stock items in register.</td>
                      </tr>
                    ) : (
                      filteredInventory.map((inv, idx) => {
                        const isLow = inv.balance < inv.item.minStockLevel;
                        return (
                          <tr key={idx}>
                            <td><span className="badge bg-dark text-success-light border border-secondary font-mono px-2.5 py-1">{inv.item.ledgerFolio}</span></td>
                            <td><span className="fw-bold text-success">{inv.item.nomenclature}</span></td>
                            <td>{inv.item.unitOfIssue}</td>
                            <td className="text-center">{inv.item.minStockLevel}</td>
                            <td className="text-center fw-bold fs-6" style={{ color: isLow ? 'var(--accent-orange)' : 'var(--primary-green-light)' }}>
                              {inv.balance}
                            </td>
                            <td>
                              {isLow ? (
                                <span className="text-danger fw-semibold d-flex align-items-center" style={{ fontSize: '13px' }}>
                                  <AlertTriangle size={15} className="me-1" /> Stock Below Minimum Level
                                </span>
                              ) : (
                                <span className="text-success fw-semibold" style={{ fontSize: '13px' }}>Serviceable / Sufficient</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Ledger tab
        <div className="d-flex flex-column gap-4">
          {/* Filters */}
          <div className="card-farm p-3 d-flex align-items-center gap-3 flex-wrap">
            {isMaster && (
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted fw-semibold" style={{ fontSize: '13px' }}>Establishment:</span>
                <select
                  className="form-select py-1.5 px-3"
                  style={{ width: '220px' }}
                  value={selectedEst}
                  onChange={(e) => setSelectedEst(e.target.value)}
                >
                  {establishments.map(est => (
                    <option key={est._id} value={est._id}>{est.establishmentName}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="d-flex align-items-center gap-2">
              <span className="text-muted fw-semibold" style={{ fontSize: '13px' }}>Nomenclature:</span>
              <select
                className="form-select py-1.5 px-3"
                style={{ width: '280px' }}
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
              >
                {itemsList.map(item => (
                  <option key={item._id} value={item._id}>{item.nomenclature} - {item.ledgerFolio}</option>
                ))}
              </select>
            </div>

            <button onClick={handleExportExcel} className="btn btn-outline-success d-flex align-items-center gap-2 rounded-3 py-1.5 ms-auto no-print">
              <Download size={15} /> Export Ledger Excel
            </button>
          </div>

          {/* Ledger History sheet */}
          <div className="card-farm glass-panel p-4">
            <h3 className="fw-bold text-success mb-3 text-center" style={{ fontSize: '18px', textDecoration: 'underline' }}>
              Ledger Card (Folio Record Sheets)
            </h3>

            {loading ? (
              <div className="d-flex justify-content-center py-5">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading history log...</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive-farm">
                <table className="table table-bordered glass-table align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="text-center" style={{ width: '50px' }}>S.No</th>
                      <th>Date</th>
                      <th>Voucher / Details</th>
                      <th className="text-center" style={{ width: '130px' }}>Receipt Qty (+)</th>
                      <th className="text-center" style={{ width: '130px' }}>Issue Qty (-)</th>
                      <th className="text-center" style={{ width: '150px' }}>Balance Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerHistory.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-muted">No transactions recorded for this item.</td>
                      </tr>
                    ) : (
                      ledgerHistory.map((tx, idx) => {
                        const isReceipt = tx.quantity > 0;
                        const isSeeding = tx.transactionType === 'seeding';
                        return (
                          <tr key={tx._id}>
                            <td className="text-center text-muted font-bold">{idx + 1}</td>
                            <td>{new Date(tx.createdAt).toLocaleDateString('en-IN')}</td>
                            <td>
                              {isSeeding ? (
                                <span className="fw-semibold text-muted">Initial Seeding</span>
                              ) : (
                                <span className="fw-semibold">
                                  {tx.remarks || `${tx.transactionType.toUpperCase()} Voucher`} {tx.voucherId ? `(${tx.voucherId.voucherNo})` : ''}
                                </span>
                              )}
                            </td>
                            <td className="text-center text-success fw-bold font-mono">
                              {isReceipt && !isSeeding ? `+ ${tx.quantity}` : '-'}
                            </td>
                            <td className="text-center text-danger fw-bold font-mono">
                              {!isReceipt ? `- ${Math.abs(tx.quantity)}` : '-'}
                            </td>
                            <td className="text-center fw-bold font-mono" style={{ backgroundColor: 'rgba(92, 123, 87, 0.08)' }}>
                              {tx.closingBalance}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Reports;
