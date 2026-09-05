import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, 
  Users, 
  FileSpreadsheet, 
  ShieldAlert, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle, 
  XCircle,
  Plus,
  Radio,
  CalendarRange
} from 'lucide-react';
import api from '../api/api.js';
import EquipmentHoldingsDonutCard from '../components/dashboard/EquipmentHoldingsDonutCard.jsx';
import StockDistributionBarCard from '../components/dashboard/StockDistributionBarCard.jsx';

/* ─── Animation Variants ─────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
};

/* ─── Skeleton Loader ────────────────────────────────────── */
const SkeletonStatCard = () => (
  <div className="skeleton-card">
    <div className="skeleton skeleton-circle" style={{ width: 52, height: 52 }} />
    <div style={{ flex: 1 }}>
      <div className="skeleton skeleton-text" style={{ width: '60%', height: 12 }} />
      <div className="skeleton skeleton-text" style={{ width: '40%', height: 22, marginBottom: 0 }} />
    </div>
  </div>
);

const SkeletonTable = () => (
  <div className="card-farm p-4">
    <div className="skeleton skeleton-text mb-3" style={{ width: '35%', height: 18 }} />
    {[1,2,3].map(i => (
      <div key={i} className="d-flex gap-3 mb-3 align-items-center" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
        <div className="skeleton skeleton-text" style={{ width: '20%', height: 14, marginBottom: 0 }} />
        <div className="skeleton skeleton-text" style={{ width: '15%', height: 14, marginBottom: 0 }} />
        <div className="skeleton skeleton-text" style={{ width: '25%', height: 14, marginBottom: 0 }} />
        <div className="skeleton skeleton-text" style={{ width: '15%', height: 14, marginBottom: 0 }} />
        <div className="skeleton" style={{ width: 60, height: 22, borderRadius: 12 }} />
      </div>
    ))}
  </div>
);

/* ─── Stat Card Component ────────────────────────── */
const StatCard = ({ icon: Icon, label, value, bgColor, iconColor }) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="stat-card-modern"
  >
    <div className="stat-icon" style={{ background: bgColor }}>
      <Icon size={22} style={{ color: iconColor }} />
    </div>
    <div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  </motion.div>
);

/* ─── Status Badge ───────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  switch (status) {
    case 'approved':
      return <span className="badge bg-success text-white border-0 py-1 px-2 rounded-pill" style={{ fontSize: 'var(--fs-xs)' }}><CheckCircle size={12} className="me-1" /> Approved</span>;
    case 'rejected':
      return <span className="badge bg-danger text-white border-0 py-1 px-2 rounded-pill" style={{ fontSize: 'var(--fs-xs)' }}><XCircle size={12} className="me-1" /> Rejected</span>;
    default:
      return <span className="badge bg-warning text-dark border-0 py-1 px-2 rounded-pill" style={{ fontSize: 'var(--fs-xs)' }}><Clock size={12} className="me-1" /> Pending</span>;
  }
};

/* ═══════════════════════════════════════════════════════════ */
/*  DASHBOARD COMPONENT                                       */
/* ═══════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [recentVouchers, setRecentVouchers] = useState([]);
  const [recentCondemnations, setRecentCondemnations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/dashboard');
      if (res.data.success) {
        setStats(res.data.data.summary);
        setRecentVouchers(res.data.data.recentVouchers || []);
        setRecentCondemnations(res.data.data.recentCondemnations || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (error) {
    return (
      <div className="container-fluid py-3">
        <div className="card-farm p-4 text-center" style={{ borderLeft: '4px solid var(--accent-red)' }}>
          <h4 className="fw-bold mb-2" style={{ color: 'var(--accent-red)' }}>Configuration Error</h4>
          <p className="text-muted mb-3">{error}</p>
          <button onClick={fetchDashboardData} className="btn btn-primary-farm press-scale">Retry Request</button>
        </div>
      </div>
    );
  }

  const isMaster = user?.role === 'master';

  /* ─── Skeleton State ─── */
  if (loading) {
    return (
      <div className="container-fluid py-3">
        <div className="mb-4">
          <div className="skeleton skeleton-text" style={{ width: '40%', height: 26 }} />
          <div className="skeleton skeleton-text mt-2" style={{ width: '55%', height: 14 }} />
        </div>
        <div className="section-header"><h3>Equipment Holdings</h3></div>
        <div className="stats-grid mb-4">
          {[1,2,3,4].map(i => <SkeletonStatCard key={i} />)}
        </div>
        <div className="section-header mt-4"><h3>Administrative Vouchers</h3></div>
        <div className="stats-grid mb-4">
          {[1,2,3,4].map(i => <SkeletonStatCard key={i} />)}
        </div>
        <div className="two-col-layout">
          <SkeletonTable />
          <SkeletonTable />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="container-fluid py-3"
    >
      {/* Header Panel */}
      <motion.div variants={itemVariants} className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h1 className="page-title mb-1">
            {isMaster ? 'BEG & Centre Stores Headquarters' : `${user?.establishmentName} Stores`}
          </h1>
          <p className="page-subtitle mb-0">
            {isMaster ? 'Centralized Supervision, Audit Trail & Inventory Dashboard' : 'Unit Store Accounting, Receipt & Issue Voucher Logs'}
          </p>
        </div>
        {!isMaster && (
          <div className="d-flex gap-2">
            <button 
              onClick={() => navigate('/vouchers', { state: { createType: 'receipt' } })} 
              className="btn btn-primary-farm press-scale"
            >
              <Plus size={16} /> Log Receipt
            </button>
            <button 
              onClick={() => navigate('/vouchers', { state: { createType: 'issue' } })} 
              className="btn btn-primary-farm press-scale"
              style={{ background: 'var(--primary-green-hover)' }}
            >
              <Plus size={16} /> Log Issue
            </button>
          </div>
        )}
      </motion.div>

      {/* SECTION 1: Operational Sapper Assets - Donut & Stacked Bar Distribution Analytics */}
      <div className="row g-4 mb-4 align-items-stretch">
        <div className="col-12 col-xl-6 d-flex">
          <EquipmentHoldingsDonutCard stats={stats} />
        </div>
        <div className="col-12 col-xl-6 d-flex">
          <StockDistributionBarCard stats={stats} />
        </div>
      </div>

      {/* SECTION 2: General Ledger & Audit Summary */}
      <motion.div variants={itemVariants} className="section-header mt-2">
        <h3>Administrative Vouchers & Audits</h3>
      </motion.div>
      <motion.div variants={containerVariants} className="stats-grid mb-4">
        {isMaster ? (
          <>
            <StatCard icon={Package}         label="Items Cataloged"         value={stats?.nomenclatureCount || 0}    bgColor="rgba(34, 197, 94, 0.10)"  iconColor="#16A34A" />
            <StatCard icon={Users}           label="Establishments"          value={stats?.establishmentCount || 0}   bgColor="rgba(59, 130, 246, 0.10)" iconColor="#2563EB" />
            <StatCard icon={FileSpreadsheet} label="Pending Vouchers"        value={stats?.pendingVouchers || 0}      bgColor="rgba(168, 85, 247, 0.10)" iconColor="#9333EA" />
            <StatCard icon={ShieldAlert}      label="Pending Condemnations"   value={stats?.pendingCondemnations || 0} bgColor="rgba(249, 115, 22, 0.10)" iconColor="#EA580C" />
          </>
        ) : (
          <>
            <StatCard icon={Package}         label="Items In Stock"          value={stats?.stockItemsCount || 0}      bgColor="rgba(34, 197, 94, 0.10)"  iconColor="#16A34A" />
            <StatCard icon={FileSpreadsheet} label="My Pending Vouchers"     value={stats?.pendingVouchers || 0}      bgColor="rgba(59, 130, 246, 0.10)" iconColor="#2563EB" />
            <StatCard icon={ShieldAlert}      label="Pending Condemnations"   value={stats?.pendingCondemnations || 0} bgColor="rgba(168, 85, 247, 0.10)" iconColor="#9333EA" />
            <StatCard icon={ShieldAlert}      label="Low Stock Items"         value={stats?.lowStockCount || 0}        bgColor="rgba(249, 115, 22, 0.10)" iconColor={stats?.lowStockCount > 0 ? '#EA580C' : '#16A34A'} />
          </>
        )}
      </motion.div>

      {/* Two Column Layout: Activity Details */}
      <motion.div variants={containerVariants} className="two-col-layout">
        {/* Recent Vouchers */}
        <motion.div variants={itemVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }} className="card-farm glass-panel p-4 d-flex flex-column gap-3">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="fw-bold mb-0" style={{ fontSize: 'var(--fs-h3)', fontFamily: 'var(--font-heading)', color: 'var(--ink)' }}>
              {isMaster ? 'Recent Vouchers Submitted' : 'My Recent Vouchers'}
            </h3>
            <button onClick={() => navigate('/vouchers')} className="btn btn-link text-decoration-none p-0 fw-semibold" style={{ fontSize: 'var(--fs-sm)', color: 'var(--primary-green)' }}>
              View All
            </button>
          </div>

          <div className="table-responsive-farm">
            <table className="table table-hover glass-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Voucher No</th>
                  <th>Type</th>
                  <th>{isMaster ? 'Establishment' : 'Destination/Origin'}</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentVouchers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">No vouchers submitted recently.</td>
                  </tr>
                ) : (
                  recentVouchers.map((v) => (
                    <tr key={v._id} className="table-row-interactive" onClick={() => navigate('/vouchers', { state: { selectVoucherId: v._id } })}>
                      <td><span className="fw-bold text-success">{v.voucherNo}</span></td>
                      <td>
                        {v.type === 'receipt' ? (
                          <span className="text-success fw-semibold d-flex align-items-center"><ArrowDownLeft size={14} className="me-1" /> Receipt</span>
                        ) : (
                          <span className="text-danger fw-semibold d-flex align-items-center"><ArrowUpRight size={14} className="me-1" /> Issue</span>
                        )}
                      </td>
                      <td>{isMaster ? v.submittedBy?.establishmentName : (v.type === 'receipt' ? v.origin : v.destination)}</td>
                      <td>{new Date(v.date).toLocaleDateString('en-IN')}</td>
                      <td><StatusBadge status={v.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Recent Condemnation Boards */}
        <motion.div variants={itemVariants} whileHover={{ y: -4, transition: { duration: 0.2 } }} className="card-farm glass-panel p-4 d-flex flex-column gap-3">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="fw-bold mb-0" style={{ fontSize: 'var(--fs-h3)' }}>
              {isMaster ? 'Recent Condemnation Boards' : 'Condemnation & Safety Logs'}
            </h3>
            <button onClick={() => navigate('/condemnations')} className="btn btn-link text-decoration-none p-0 text-success fw-semibold" style={{ fontSize: 'var(--fs-sm)' }}>
              View All
            </button>
          </div>

          <div className="table-responsive-farm">
            <table className="table table-hover glass-table align-middle mb-0">
              <thead>
                <tr>
                  <th>Board No</th>
                  <th>Establishment</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentCondemnations.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-muted">No condemnation board records logged.</td>
                  </tr>
                ) : (
                  recentCondemnations.map((c) => (
                    <tr key={c._id} className="table-row-interactive" onClick={() => navigate('/condemnations', { state: { selectBoardId: c._id } })}>
                      <td><span className="fw-bold text-success">{c.boardNo}</span></td>
                      <td>{isMaster ? c.establishment?.establishmentName : user?.establishmentName}</td>
                      <td>{new Date(c.date).toLocaleDateString('en-IN')}</td>
                      <td><StatusBadge status={c.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
