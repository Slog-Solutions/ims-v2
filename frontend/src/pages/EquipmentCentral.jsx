import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Layers,
  MapPin,
  Clock,
  Wrench,
  Radio,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Map,
  Plus,
  ArrowRight,
  TrendingUp,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import api from '../api/api.js';
import { useSocket } from '../context/SocketContext.jsx';
import { useToast } from '../components/layout/Toast.jsx';

const EquipmentCentral = () => {
  const { user } = useSelector((state) => state.auth);
  const isMaster = user?.role === 'master';
  const socket = useSocket();
  const showToast = useToast();
  const toast = {
    success: (msg) => showToast({ title: 'Success', sub: msg, variant: 'success' }),
    error: (msg) => showToast({ title: 'Error', sub: msg, variant: 'error' }),
    warn: (msg) => showToast({ title: 'Warning', sub: msg, variant: 'warning' }),
    info: (msg) => showToast({ title: 'Info', sub: msg, variant: 'info' }),
  };

  // Search and Select
  const [equipmentSets, setEquipmentSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Establishments (HQ view)
  const [establishments, setEstablishments] = useState([]);
  const [selectedEst, setSelectedEst] = useState('');

  // Operational categories data
  const [stats, setStats] = useState(null);
  const [loadingSets, setLoadingSets] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [activeTab, setActiveTab] = useState('holding'); // holding, vintage, maintenance, rfid

  // Modals state
  const [showDefectModal, setShowDefectModal] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [selectedPhysicalItem, setSelectedPhysicalItem] = useState(null);

  // Form states
  const [defectForm, setDefectForm] = useState({ defectDescription: '', severity: 'medium' });
  const [maintForm, setMaintForm] = useState({
    serviceType: 'routine',
    description: '',
    cost: '',
    servicedBy: 'EME Workshops Roorkee',
    nextServiceDueDate: ''
  });

  // Fetch initial list of sets
  useEffect(() => {
    const fetchSets = async () => {
      try {
        setLoadingSets(true);
        const res = await api.get('/equipment-sets');
        if (res.data.success) {
          setEquipmentSets(res.data.data);
          // Auto select first set if exists
          if (res.data.data.length > 0) {
            setSelectedSet(res.data.data[0]);
          }
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load equipment sets');
      } finally {
        setLoadingSets(false);
      }
    };

    const fetchEstablishments = async () => {
      if (!isMaster) return;
      try {
        const res = await api.get('/users');
        if (res.data.success) {
          const ests = res.data.data.users.filter(u => u.role === 'establishment');
          setEstablishments(ests);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchSets();
    fetchEstablishments();
  }, [isMaster]);

  // Fetch stats when set or establishment changes
  const fetchStats = async () => {
    if (!selectedSet) return;
    try {
      setLoadingStats(true);
      let url = `/equipment-sets/${selectedSet._id}/stats`;
      if (selectedEst) {
        url += `?establishmentId=${selectedEst}`;
      }
      const res = await api.get(url);
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch equipment set metrics');
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedSet, selectedEst]);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleRfidScan = (data) => {
      // If the scanned item is part of our current dataset, trigger a refresh or toast notification
      if (selectedSet) {
        toast.success(`RFID Portal Sensor: Item ${data.serialNumber} scanned at ${data.locationName}`);
        fetchStats();
      }
    };

    const handleDefectReported = (data) => {
      if (selectedSet) {
        toast.warn(`Defect Logged: Item ${data.serialNumber} is now ${data.serviceability.toUpperCase()}`);
        fetchStats();
      }
    };

    socket.on('rfid:scan', handleRfidScan);
    socket.on('item:defect', handleDefectReported);

    return () => {
      socket.off('rfid:scan', handleRfidScan);
      socket.off('item:defect', handleDefectReported);
    };
  }, [socket, selectedSet, selectedEst]);

  // Handle reporting defect
  const handleDefectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPhysicalItem) return;
    try {
      const res = await api.post(`/physical-items/${selectedPhysicalItem._id}/defects`, defectForm);
      if (res.data.success) {
        toast.success('Defect reported successfully. Serviceability updated.');
        setShowDefectModal(false);
        setDefectForm({ defectDescription: '', severity: 'medium' });
        fetchStats();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to log defect');
    }
  };

  // Handle resolving defect
  const handleResolveDefect = async (itemId, defectId) => {
    try {
      const res = await api.patch(`/physical-items/${itemId}/defects/${defectId}/resolve`);
      if (res.data.success) {
        toast.success('Defect marked as resolved. Stock returns to Serviceable.');
        fetchStats();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to resolve defect');
    }
  };

  // Handle logging maintenance
  const handleMaintSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPhysicalItem) return;
    try {
      const res = await api.post(`/physical-items/${selectedPhysicalItem._id}/maintenance`, maintForm);
      if (res.data.success) {
        toast.success('Maintenance log recorded successfully.');
        setShowMaintModal(false);
        setMaintForm({
          serviceType: 'routine',
          description: '',
          cost: '',
          servicedBy: 'EME Workshops Roorkee',
          nextServiceDueDate: ''
        });
        fetchStats();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to log maintenance session');
    }
  };

  // Autocomplete / Filter sets
  const filteredSets = equipmentSets.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper values for custom SVG charts
  const getServiceabilityPercentages = () => {
    if (!stats || stats.vintages.length === 0) return { serv: 100, rep: 0, uns: 0 };
    const total = stats.vintages.length;
    const serv = Math.round((stats.vintages.filter(v => v.serviceability === 'serviceable').length / total) * 100);
    const rep = Math.round((stats.vintages.filter(v => v.serviceability === 'under_repair').length / total) * 100);
    const uns = Math.round((stats.vintages.filter(v => v.serviceability === 'unserviceable').length / total) * 100);
    return { serv, rep, uns };
  };

  const { serv, rep, uns } = getServiceabilityPercentages();

  return (
    <div className="container-fluid py-3">
      {/* Header and Search */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h1 className="page-title gradient-text mb-1">Equipment Central Control</h1>
          <p className="page-subtitle mb-0">Search Combat Engineer sets, monitor holding state, track vintage age, inspect defects and sensor telemetry.</p>
        </div>

        {/* Search & Selector */}
        <div className="d-flex gap-3 flex-wrap align-items-center">
          {isMaster && (
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted fw-semibold" style={{ fontSize: '13px' }}>Unit View:</span>
              <select
                className="form-select glass-input border-success-subtle rounded-3 py-1.5 px-3"
                value={selectedEst}
                onChange={(e) => setSelectedEst(e.target.value)}
                style={{ width: '180px', fontSize: '13px', background: 'var(--bg-card)', color: 'var(--text-dark)' }}
              >
                <option value="">All Units Combined</option>
                {establishments.map(e => (
                  <option key={e._id} value={e._id}>{e.establishmentName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Autocomplete Input */}
          <div className="position-relative" style={{ width: '280px' }}>
            <div className="input-group glass-panel rounded-pill shadow-sm" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
              <span className="input-group-text bg-transparent border-0 pe-1 text-success"><Search size={16} /></span>
              <input
                type="text"
                className="form-control bg-transparent border-0 py-2 ps-1 shadow-none text-dark-theme"
                placeholder="Search Equipment Set..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: '14px' }}
              />
            </div>
            {searchQuery && (
              <div className="position-absolute w-100 mt-1 glass-panel rounded-3 p-2 shadow-lg" style={{ zIndex: 10, maxHeight: '200px', overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                {filteredSets.length === 0 ? (
                  <div className="text-muted p-2 text-center" style={{ fontSize: '13px' }}>No matches found</div>
                ) : (
                  filteredSets.map(s => (
                    <button
                      key={s._id}
                      onClick={() => {
                        setSelectedSet(s);
                        setSearchQuery('');
                      }}
                      className="w-100 text-start btn btn-link text-decoration-none py-1.5 px-2 hover:bg-success-subtle text-dark-theme rounded-2"
                      style={{ fontSize: '13px' }}
                    >
                      <Layers size={13} className="me-2 text-success" />
                      {s.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {loadingSets ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading sets...</span>
          </div>
        </div>
      ) : !selectedSet ? (
        <div className="alert alert-info rounded-4 text-center p-5">
          <Layers size={48} className="text-success mb-3 opacity-50" />
          <h4 className="fw-bold text-success">No Equipment Sets Configured</h4>
          <p className="text-muted">Use the Nomenclature Master or seeding script to establish equipment sets.</p>
        </div>
      ) : (
        <div className="row g-4">

          {/* LEFT: Set summary and selectors */}
          <div className="col-lg-3">
            <div className="card-farm glass-panel p-4 h-100 d-flex flex-column gap-3">
              <div className="p-3 rounded-4 bg-success-subtle text-success text-center" style={{ alignSelf: 'center', width: 'fit-content' }}>
                <Layers size={36} />
              </div>
              <div className="text-center border-bottom pb-3">
                <h3 className="fw-bold mb-1" style={{ fontSize: '20px' }}>{selectedSet.name}</h3>
                <p className="text-muted mb-0" style={{ fontSize: '13px' }}>{selectedSet.description}</p>
              </div>

              {/* Set Navigation Tabs */}
              <div className="d-flex flex-column gap-2 mt-2">
                <button
                  onClick={() => setActiveTab('holding')}
                  className={`btn text-start d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 border-0 transition-all ${activeTab === 'holding' ? 'gradient-bg text-white shadow-sm' : 'text-success hover:bg-success-subtle'}`}
                  style={{ fontWeight: 600, fontSize: '14px' }}
                >
                  <Map size={18} />
                  Store & Ground Map
                </button>

                <button
                  onClick={() => setActiveTab('vintage')}
                  className={`btn text-start d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 border-0 transition-all ${activeTab === 'vintage' ? 'gradient-bg text-white shadow-sm' : 'text-success hover:bg-success-subtle'}`}
                  style={{ fontWeight: 600, fontSize: '14px' }}
                >
                  <Clock size={18} />
                  Vintage (Procurement)
                </button>

                <button
                  onClick={() => setActiveTab('maintenance')}
                  className={`btn text-start d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 border-0 transition-all ${activeTab === 'maintenance' ? 'gradient-bg text-white shadow-sm' : 'text-success hover:bg-success-subtle'}`}
                  style={{ fontWeight: 600, fontSize: '14px' }}
                >
                  <Wrench size={18} />
                  Serviceability & Repairs
                </button>

                <button
                  onClick={() => setActiveTab('rfid')}
                  className={`btn text-start d-flex align-items-center gap-3 px-3 py-2.5 rounded-3 border-0 transition-all ${activeTab === 'rfid' ? 'gradient-bg text-white shadow-sm' : 'text-success hover:bg-success-subtle'}`}
                  style={{ fontWeight: 600, fontSize: '14px' }}
                >
                  <Radio size={18} />
                  RFID Telemetry
                </button>
              </div>

              {/* Quick statistics sidebar */}
              {stats && (
                <div className="mt-auto border-top pt-3">
                  <span className="text-muted fw-bold" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Serviceability Gauge</span>
                  <div className="d-flex align-items-center gap-2 mt-2">
                    <div className="progress flex-grow-1" style={{ height: '8px', background: 'rgba(255,255,255,0.1)' }}>
                      <div className="progress-bar bg-success" style={{ width: `${serv}%` }}></div>
                      <div className="progress-bar bg-warning" style={{ width: `${rep}%` }}></div>
                      <div className="progress-bar bg-danger" style={{ width: `${uns}%` }}></div>
                    </div>
                    <span className="fw-bold text-success" style={{ fontSize: '12px' }}>{serv}%</span>
                  </div>
                  <div className="d-flex justify-content-between mt-2 text-muted" style={{ fontSize: '11px' }}>
                    <span>{stats.vintages.filter(v => v.serviceability === 'serviceable').length} OK</span>
                    <span>{stats.vintages.filter(v => v.serviceability === 'under_repair').length} Repair</span>
                    <span>{stats.vintages.filter(v => v.serviceability === 'unserviceable').length} Down</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Operational Metrics details */}
          <div className="col-lg-9">
            {loadingStats ? (
              <div className="card-farm glass-panel p-5 d-flex justify-content-center align-items-center h-100">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Syncing metrics...</span>
                </div>
              </div>
            ) : !stats ? (
              <div className="card-farm glass-panel p-5 text-center">
                <Activity size={32} className="text-muted mb-2" />
                <p className="text-muted mb-0">Select an equipment set to load tactical data layers.</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">

                {/* CATEGORY 1: STORE HELD & MAP VIEW */}
                {activeTab === 'holding' && (
                  <motion.div
                    key="holding"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.25 }}
                    className="d-flex flex-column gap-4"
                  >
                    {/* Holdings Summary List */}
                    <div className="card-farm glass-panel p-4">
                      <h3 className="fw-bold mb-3" style={{ fontSize: '18px' }}>Store Holding State</h3>
                      <div className="table-responsive-farm">
                        <table className="table glass-table align-middle mb-0">
                          <thead>
                            <tr>
                              <th>Nomenclature</th>
                              <th className="text-center">Req Scale</th>
                              <th className="text-center">Total Held</th>
                              <th className="text-center">Serviceable</th>
                              <th className="text-center">Deployed</th>
                              <th className="text-center">Deficiency</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.holdingState.map((h, i) => (
                              <tr key={i}>
                                <td><span className="fw-bold text-success">{h.nomenclature}</span></td>
                                <td className="text-center fw-semibold">{h.required} {h.unitOfIssue}</td>
                                <td className="text-center fw-bold">{h.held}</td>
                                <td className="text-center text-success fw-bold">{h.serviceable}</td>
                                <td className="text-center text-info fw-bold">{h.deployed}</td>
                                <td className="text-center fw-bold text-danger">
                                  {h.deficiency > 0 ? (
                                    <span className="badge bg-danger-subtle text-danger px-2.5 py-1.5 rounded-pill">-{h.deficiency} Short</span>
                                  ) : (
                                    <span className="text-success"><CheckCircle2 size={15} className="me-1 inline" /> Fully Held</span>
                                  )}
                                </td>
                                <td>
                                  {h.serviceable >= h.required ? (
                                    <span className="text-success fw-bold" style={{ fontSize: '12px' }}>Operational</span>
                                  ) : (
                                    <span className="text-warning fw-bold" style={{ fontSize: '12px' }}>Shortage</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Interactive Tactical Grid Map */}
                    <div className="card-farm glass-panel p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <h3 className="fw-bold mb-1" style={{ fontSize: '18px' }}>Tactical Deployment Map</h3>
                          <p className="text-muted mb-0" style={{ fontSize: '12px' }}>Real-time location coordinates of physical set components mapped on the military grid canvas.</p>
                        </div>
                        <span className="badge bg-success-subtle text-success py-1.5 px-3 rounded-pill border-success-subtle d-flex align-items-center gap-1.5 fw-bold" style={{ fontSize: '11px' }}>
                          <Activity size={12} className="animate-pulse" /> Scanner Portals Online
                        </span>
                      </div>

                      {/* Map Simulation Container */}
                      <div className="position-relative overflow-hidden rounded-4" style={{ height: '360px', background: '#080d09', border: '1px solid var(--border-color)' }}>
                        {/* Radar sweep lines */}
                        <div className="position-absolute w-100 h-100 pointer-events-none" style={{
                          background: 'linear-gradient(rgba(0, 255, 0, 0.015) 50%, rgba(0, 0, 0, 0) 50%), linear-gradient(90deg, rgba(0, 255, 0, 0.015) 50%, rgba(0, 0, 0, 0) 50%)',
                          backgroundSize: '30px 30px',
                        }}></div>

                        {/* Radar scanner sweep animation */}
                        <div className="radar-sweep"></div>

                        {/* Interactive Coordinates */}
                        <svg className="w-100 h-100 position-absolute" style={{ top: 0, left: 0 }}>
                          {/* Tactical circles */}
                          <circle cx="50%" cy="50%" r="80" fill="none" stroke="rgba(92,123,87,0.1)" strokeWidth="1" strokeDasharray="5,5" />
                          <circle cx="50%" cy="50%" r="160" fill="none" stroke="rgba(92,123,87,0.06)" strokeWidth="1" />

                          {/* Map markers */}
                          {stats.mapPlotData.map((marker, i) => {
                            // Map coordinate lat 29.83 to 29.90 -> mapping y (from 10% to 90%)
                            // Map coordinate lng 77.85 to 77.94 -> mapping x (from 10% to 90%)
                            const minLat = 29.83;
                            const maxLat = 29.91;
                            const minLng = 77.85;
                            const maxLng = 77.95;

                            const x = 10 + ((marker.lng - minLng) / (maxLng - minLng)) * 80;
                            const y = 90 - ((marker.lat - minLat) / (maxLat - minLat)) * 80; // invert y for canvas

                            // Color codes: serviceable (green), under_repair (yellow), unserviceable (red)
                            let color = '#198754'; // green
                            if (marker.serviceability === 'under_repair') color = '#ffc107';
                            if (marker.serviceability === 'unserviceable') color = '#dc3545';

                            return (
                              <g key={i}>
                                <circle
                                  cx={`${x}%`}
                                  cy={`${y}%`}
                                  r="6"
                                  fill={color}
                                  className={marker.status === 'task_assigned' ? 'animate-ping opacity-75' : ''}
                                  style={{ transformOrigin: `${x}% ${y}%` }}
                                />
                                <circle
                                  cx={`${x}%`}
                                  cy={`${y}%`}
                                  r="5"
                                  fill={color}
                                  cursor="pointer"
                                >
                                  <title>
                                    {marker.nomenclature} ({marker.serialNumber})\nStatus: {marker.status.toUpperCase()}\nLocation: {marker.locationName}\nCoordinates: {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
                                  </title>
                                </circle>
                                {/* Text labels for deployed items */}
                                {marker.status === 'task_assigned' && (
                                  <text
                                    x={`${x}%`}
                                    y={`${y - 3}%`}
                                    fill="#ecf3ec"
                                    fontSize="9px"
                                    fontWeight="bold"
                                    textAnchor="middle"
                                  >
                                    {marker.serialNumber}
                                  </text>
                                )}
                              </g>
                            );
                          })}
                        </svg>

                        {/* Map HUD legends */}
                        <div className="position-absolute bottom-0 start-0 p-3 m-2 glass-panel rounded-3 d-flex flex-column gap-1.5" style={{ background: 'rgba(19, 26, 20, 0.85)', border: '1px solid rgba(92,123,87,0.2)' }}>
                          <span className="fw-bold mb-1 text-success" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Store Legends</span>
                          <div className="d-flex align-items-center gap-2" style={{ fontSize: '10px' }}>
                            <span className="d-inline-block rounded-circle" style={{ width: '8px', height: '8px', background: '#198754' }}></span>
                            <span>Serviceable Depot Store</span>
                          </div>
                          <div className="d-flex align-items-center gap-2" style={{ fontSize: '10px' }}>
                            <span className="d-inline-block rounded-circle animate-pulse" style={{ width: '8px', height: '8px', background: '#198754' }}></span>
                            <span>Deployed / Task Assigned</span>
                          </div>
                          <div className="d-flex align-items-center gap-2" style={{ fontSize: '10px' }}>
                            <span className="d-inline-block rounded-circle" style={{ width: '8px', height: '8px', background: '#ffc107' }}></span>
                            <span>Under Repair / Defective</span>
                          </div>
                          <div className="d-flex align-items-center gap-2" style={{ fontSize: '10px' }}>
                            <span className="d-inline-block rounded-circle" style={{ width: '8px', height: '8px', background: '#dc3545' }}></span>
                            <span>Unserviceable (Down)</span>
                          </div>
                        </div>

                        {/* Top corner coordinates info */}
                        <div className="position-absolute top-0 end-0 p-3 m-2 text-success" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                          GRID DEPOT SCALE: 10 KM<br />
                          CENTER: 29.8660°N, 77.8880°E
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* CATEGORY 2: VINTAGE (PROCUREMENT YEAR & AGE) */}
                {activeTab === 'vintage' && (
                  <motion.div
                    key="vintage"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="d-flex flex-column gap-4"
                  >
                    {/* Vintage summary cards */}
                    <div className="row g-3">
                      <div className="col-md-4">
                        <div className="card-farm p-3 d-flex align-items-center gap-3">
                          <div className="p-2.5 rounded-3 bg-success-subtle text-success"><TrendingUp size={20} /></div>
                          <div>
                            <span className="text-muted-farm fw-semibold" style={{ fontSize: '12px' }}>Average Age</span>
                            <h4 className="fw-bold mb-0">
                              {stats.vintages.length > 0
                                ? (stats.vintages.reduce((acc, curr) => acc + curr.age, 0) / stats.vintages.length).toFixed(1)
                                : 0} Years
                            </h4>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="card-farm p-3 d-flex align-items-center gap-3">
                          <div className="p-2.5 rounded-3 bg-warning-subtle text-warning"><Clock size={20} /></div>
                          <div>
                            <span className="text-muted-farm fw-semibold" style={{ fontSize: '12px' }}>Oldest Equipment</span>
                            <h4 className="fw-bold mb-0">
                              {stats.vintages.length > 0
                                ? Math.max(...stats.vintages.map(v => v.age))
                                : 0} Years (Vintage {stats.vintages.length > 0 ? Math.min(...stats.vintages.map(v => v.procurementYear)) : 'N/A'})
                            </h4>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="card-farm p-3 d-flex align-items-center gap-3">
                          <div className="p-2.5 rounded-3 bg-info-subtle text-info"><Sparkles size={20} /></div>
                          <div>
                            <span className="text-muted-farm fw-semibold" style={{ fontSize: '12px' }}>Newly Procured (2025+)</span>
                            <h4 className="fw-bold mb-0">
                              {stats.vintages.filter(v => v.procurementYear >= 2025).length} Items
                            </h4>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Age Brackets visualizer */}
                    <div className="card-farm glass-panel p-4">
                      <h3 className="fw-bold mb-3" style={{ fontSize: '17px' }}>Equipment Age Brackets (Lifespan Index)</h3>
                      <div className="row g-3">
                        {(() => {
                          const total = stats.vintages.length || 1;
                          const bracket1 = stats.vintages.filter(v => v.age <= 5).length;
                          const bracket2 = stats.vintages.filter(v => v.age > 5 && v.age <= 10).length;
                          const bracket3 = stats.vintages.filter(v => v.age > 10 && v.age <= 15).length;
                          const bracket4 = stats.vintages.filter(v => v.age > 15).length;

                          const pct1 = Math.round((bracket1 / total) * 100);
                          const pct2 = Math.round((bracket2 / total) * 100);
                          const pct3 = Math.round((bracket3 / total) * 100);
                          const pct4 = Math.round((bracket4 / total) * 100);

                          return (
                            <>
                              <div className="col-md-3">
                                <div className="border rounded-4 p-3 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                                  <span className="badge bg-success-subtle text-success py-1.5 px-2.5 rounded-pill mb-2">0 - 5 Years (New)</span>
                                  <h3 className="fw-bold mb-1" style={{ fontSize: '20px' }}>{bracket1} Units</h3>
                                  <div className="progress mx-auto" style={{ height: '6px', width: '80%', background: 'rgba(0,0,0,0.1)' }}>
                                    <div className="progress-bar bg-success" style={{ width: `${pct1}%` }}></div>
                                  </div>
                                  <span className="text-muted mt-2 d-block" style={{ fontSize: '11px' }}>{pct1}% of total sets</span>
                                </div>
                              </div>
                              <div className="col-md-3">
                                <div className="border rounded-4 p-3 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                                  <span className="badge bg-info-subtle text-info py-1.5 px-2.5 rounded-pill mb-2">6 - 10 Years (Mid-Life)</span>
                                  <h3 className="fw-bold mb-1" style={{ fontSize: '20px' }}>{bracket2} Units</h3>
                                  <div className="progress mx-auto" style={{ height: '6px', width: '80%', background: 'rgba(0,0,0,0.1)' }}>
                                    <div className="progress-bar bg-info" style={{ width: `${pct2}%` }}></div>
                                  </div>
                                  <span className="text-muted mt-2 d-block" style={{ fontSize: '11px' }}>{pct2}% of total sets</span>
                                </div>
                              </div>
                              <div className="col-md-3">
                                <div className="border rounded-4 p-3 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                                  <span className="badge bg-warning-subtle text-warning py-1.5 px-2.5 rounded-pill mb-2">11 - 15 Years (Obsolete Alert)</span>
                                  <h3 className="fw-bold mb-1 text-warning" style={{ fontSize: '20px' }}>{bracket3} Units</h3>
                                  <div className="progress mx-auto" style={{ height: '6px', width: '80%', background: 'rgba(0,0,0,0.1)' }}>
                                    <div className="progress-bar bg-warning" style={{ width: `${pct3}%` }}></div>
                                  </div>
                                  <span className="text-muted mt-2 d-block" style={{ fontSize: '11px' }}>{pct3}% of total sets</span>
                                </div>
                              </div>
                              <div className="col-md-3">
                                <div className="border rounded-4 p-3 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                                  <span className="badge bg-danger-subtle text-danger py-1.5 px-2.5 rounded-pill mb-2">15+ Years (Critical)</span>
                                  <h3 className="fw-bold mb-1 text-danger" style={{ fontSize: '20px' }}>{bracket4} Units</h3>
                                  <div className="progress mx-auto" style={{ height: '6px', width: '80%', background: 'rgba(0,0,0,0.1)' }}>
                                    <div className="progress-bar bg-danger" style={{ width: `${pct4}%` }}></div>
                                  </div>
                                  <span className="text-muted mt-2 d-block" style={{ fontSize: '11px' }}>{pct4}% of total sets</span>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Custom SVG Vintage Histogram */}
                    <div className="card-farm glass-panel p-4">
                      <h3 className="fw-bold mb-3" style={{ fontSize: '18px' }}>Equipment Age Distribution (Histogram)</h3>
                      <div className="d-flex align-items-end gap-3 px-3 pt-4 border-bottom" style={{ height: '220px' }}>
                        {Object.entries(stats.vintageChart).map(([year, count]) => {
                          const maxCount = Math.max(...Object.values(stats.vintageChart));
                          const heightPct = maxCount > 0 ? (count / maxCount) * 85 : 0;
                          return (
                            <div key={year} className="d-flex flex-column align-items-center flex-grow-1">
                              <span className="fw-bold text-success mb-1.5" style={{ fontSize: '11px' }}>{count}</span>
                              <div
                                className="gradient-bg rounded-top-2 w-100"
                                style={{
                                  height: `${heightPct}%`,
                                  minHeight: '8px',
                                  transition: 'height 0.4s ease'
                                }}
                              ></div>
                              <span className="text-muted mt-2 fw-semibold" style={{ fontSize: '12px' }}>{year}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-center mt-3">
                        <span className="text-muted" style={{ fontSize: '11px' }}><Info size={12} className="inline me-1" /> Indicates count of items procured in corresponding budget year.</span>
                      </div>
                    </div>

                    {/* Vintages Items Ledger */}
                    <div className="card-farm glass-panel p-4">
                      <h3 className="fw-bold mb-3" style={{ fontSize: '18px' }}>Serialized Stores Register</h3>
                      <div className="table-responsive-farm" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table className="table table-hover glass-table align-middle mb-0">
                          <thead className="sticky-top bg-card" style={{ zIndex: 1 }}>
                            <tr>
                              <th>Serial Number</th>
                              <th>RFID Tag</th>
                              <th>Nomenclature</th>
                              <th>Procurement Year</th>
                              <th>Age</th>
                              <th>Location</th>
                              <th>Serviceability</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.vintages.map((v, i) => (
                              <tr key={i}>
                                <td><span className="fw-bold text-success">{v.serialNumber}</span></td>
                                <td><span className="text-muted fw-semibold" style={{ fontFamily: 'monospace' }}>{v.rfidTag}</span></td>
                                <td>{v.nomenclature}</td>
                                <td className="fw-bold">{v.procurementYear}</td>
                                <td>{v.age} Years</td>
                                <td>{v.location}</td>
                                <td>
                                  {v.serviceability === 'serviceable' ? (
                                    <span className="badge bg-success text-white px-2 py-1 rounded-pill">Serviceable</span>
                                  ) : v.serviceability === 'under_repair' ? (
                                    <span className="badge bg-warning text-dark px-2 py-1 rounded-pill">Under Repair</span>
                                  ) : (
                                    <span className="badge bg-danger text-white px-2 py-1 rounded-pill">Unserviceable</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* CATEGORY 3: MAINTENANCE & SERVICEABILITY */}
                {activeTab === 'maintenance' && (
                  <motion.div
                    key="maintenance"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="d-flex flex-column gap-4"
                  >
                    {/* Defects logs */}
                    <div className="card-farm glass-panel p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h3 className="fw-bold mb-0" style={{ fontSize: '18px' }}>Active Defects Log</h3>
                        <span className="text-muted fw-semibold" style={{ fontSize: '12px' }}>Logged by unit Storekeepers</span>
                      </div>

                      <div className="table-responsive-farm">
                        <table className="table glass-table align-middle mb-0">
                          <thead>
                            <tr>
                              <th>Serial Number</th>
                              <th>Nomenclature</th>
                              <th>Defect Description</th>
                              <th>Reported Date</th>
                              <th>Severity</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.defects.length === 0 ? (
                              <tr>
                                <td colSpan="7" className="text-center py-4 text-muted">No outstanding defects logged. Clean board!</td>
                              </tr>
                            ) : (
                              stats.defects.map((d, i) => (
                                <tr key={i}>
                                  <td><span className="fw-bold text-success">{d.serialNumber}</span></td>
                                  <td>{d.nomenclature}</td>
                                  <td className="text-muted">{d.defectDescription}</td>
                                  <td>{new Date(d.reportedDate).toLocaleDateString('en-IN')}</td>
                                  <td>
                                    {d.severity === 'critical' ? (
                                      <span className="text-danger fw-bold"><AlertTriangle size={13} className="inline me-1" /> Critical</span>
                                    ) : (
                                      <span className="text-warning fw-bold"><AlertTriangle size={13} className="inline me-1" /> Medium</span>
                                    )}
                                  </td>
                                  <td>
                                    <span className="badge bg-warning-subtle text-warning py-1.5 px-2.5 rounded-pill border-warning-subtle">{d.status}</span>
                                  </td>
                                  <td>
                                    <button
                                      onClick={() => handleResolveDefect(d.itemId, d.id)}
                                      className="btn btn-sm btn-outline-success rounded-pill px-3 py-1"
                                      style={{ fontSize: '11px' }}
                                    >
                                      Mark Resolved
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Maintenance Log & Schedule actions */}
                    <div className="card-farm glass-panel p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h3 className="fw-bold mb-0" style={{ fontSize: '18px' }}>EME Maintenance Workshop History</h3>
                        <span className="text-muted fw-semibold" style={{ fontSize: '12px' }}>Past service and repair activities</span>
                      </div>

                      <div className="table-responsive-farm" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                        <table className="table glass-table align-middle mb-0">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Serial Number</th>
                              <th>Nomenclature</th>
                              <th>Type</th>
                              <th>Description</th>
                              <th>Serviced By</th>
                              <th className="text-end">Cost</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.serviceRecords.length === 0 ? (
                              <tr>
                                <td colSpan="7" className="text-center py-4 text-muted">No maintenance records logged.</td>
                              </tr>
                            ) : (
                              stats.serviceRecords.map((r, i) => (
                                <tr key={i}>
                                  <td>{new Date(r.serviceDate).toLocaleDateString('en-IN')}</td>
                                  <td><span className="fw-bold text-success">{r.serialNumber}</span></td>
                                  <td>{r.nomenclature}</td>
                                  <td>
                                    <span className={`fw-semibold ${r.serviceType === 'routine' ? 'text-success' : r.serviceType === 'repair' ? 'text-warning' : 'text-danger'}`}>
                                      {r.serviceType.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="text-muted" style={{ fontSize: '13px' }}>{r.description}</td>
                                  <td>{r.servicedBy}</td>
                                  <td className="text-end fw-bold text-success">${r.cost}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Form to log new workshop event / defect */}
                    <div className="card-farm glass-panel p-4">
                      <h3 className="fw-bold mb-3" style={{ fontSize: '18px' }}>Log Workshop Action / Defect</h3>
                      <p className="text-muted mb-4" style={{ fontSize: '13px' }}>Select an item to report a defect or register a completed maintenance service event.</p>

                      <div className="table-responsive-farm" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        <table className="table table-hover glass-table align-middle mb-0">
                          <thead>
                            <tr>
                              <th>Serial Number</th>
                              <th>Nomenclature</th>
                              <th>Location</th>
                              <th>Serviceability</th>
                              <th className="text-end">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.vintages.map((v, i) => (
                              <tr key={i}>
                                <td><span className="fw-bold text-success">{v.serialNumber}</span></td>
                                <td>{v.nomenclature}</td>
                                <td>{v.location}</td>
                                <td>{v.serviceability}</td>
                                <td className="text-end">
                                  <div className="d-flex gap-2 justify-content-end">
                                    <button
                                      onClick={() => {
                                        setSelectedPhysicalItem(v);
                                        setShowDefectModal(true);
                                      }}
                                      className="btn btn-sm btn-outline-warning rounded-pill px-2.5 py-1"
                                      style={{ fontSize: '11px' }}
                                    >
                                      Report Defect
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedPhysicalItem(v);
                                        setShowMaintModal(true);
                                      }}
                                      className="btn btn-sm btn-outline-info rounded-pill px-2.5 py-1"
                                      style={{ fontSize: '11px' }}
                                    >
                                      Log Service
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* CATEGORY 4: RFID SENSOR TELEMETRY */}
                {activeTab === 'rfid' && (
                  <motion.div
                    key="rfid"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="d-flex flex-column gap-4"
                  >
                    {/* Live RFID telemetry list */}
                    <div className="card-farm glass-panel p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <h3 className="fw-bold mb-1" style={{ fontSize: '18px' }}>Active RF Tags Telemetry</h3>
                          <p className="text-muted mb-0" style={{ fontSize: '12px' }}>Real-time sensor logs from physical tags deployed on field equipment sets.</p>
                        </div>
                        <button
                          onClick={() => window.open('/rfid-simulator', '_blank')}
                          className="btn btn-sm btn-outline-success rounded-pill px-3 py-1.5 fw-bold"
                          style={{ fontSize: '12px' }}
                        >
                          Open RFID Scanner Simulator <ArrowRight size={12} className="inline ms-1" />
                        </button>
                      </div>

                      <div className="table-responsive-farm" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                        <table className="table glass-table align-middle mb-0">
                          <thead>
                            <tr>
                              <th>RFID Tag ID</th>
                              <th>Serial Number</th>
                              <th>Nomenclature</th>
                              <th>Sensor Status</th>
                              <th className="text-center">Signal Strength</th>
                              <th className="text-center">Battery Level</th>
                              <th>Last Scan Point</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.rfidLogs.map((log, i) => (
                              <tr key={i}>
                                <td>
                                  <span className="badge bg-success-subtle text-success py-1.5 px-3 rounded-pill border-success-subtle" style={{ fontFamily: 'monospace' }}>
                                    {log.rfidTag}
                                  </span>
                                </td>
                                <td><span className="fw-bold text-success">{log.serialNumber}</span></td>
                                <td>{log.nomenclature}</td>
                                <td>
                                  <span className="text-success fw-bold d-flex align-items-center gap-1.5" style={{ fontSize: '13px' }}>
                                    <span className="d-inline-block rounded-circle bg-success animate-pulse" style={{ width: '8px', height: '8px' }}></span>
                                    {log.status}
                                  </span>
                                </td>
                                <td className="text-center fw-bold text-success">{log.signalStrength}</td>
                                <td className="text-center fw-bold text-info">{log.batteryLevel}</td>
                                <td>{log.location}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            )}
          </div>
        </div>
      )}

      {/* REPORT DEFECT MODAL */}
      {showDefectModal && selectedPhysicalItem && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-panel p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-success">Report Defect - {selectedPhysicalItem.serialNumber}</h5>
                <button type="button" className="btn-close" onClick={() => setShowDefectModal(false)}></button>
              </div>
              <form onSubmit={handleDefectSubmit}>
                <div className="modal-body py-3">
                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold">Defect Description</label>
                    <textarea
                      required
                      className="form-control glass-input"
                      rows="3"
                      placeholder="Describe the defect or damage identified..."
                      value={defectForm.defectDescription}
                      onChange={(e) => setDefectForm({ ...defectForm, defectDescription: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold">Defect Severity</label>
                    <select
                      className="form-select glass-input"
                      value={defectForm.severity}
                      onChange={(e) => setDefectForm({ ...defectForm, severity: e.target.value })}
                    >
                      <option value="low">Low (Remains Serviceable)</option>
                      <option value="medium">Medium (Sets to Under Repair)</option>
                      <option value="critical">Critical (Sets to Unserviceable)</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowDefectModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary-farm rounded-pill px-4">Submit Defect</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* LOG SERVICE MODAL */}
      {showMaintModal && selectedPhysicalItem && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-panel p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-success">Record Workshop Service - {selectedPhysicalItem.serialNumber}</h5>
                <button type="button" className="btn-close" onClick={() => setShowMaintModal(false)}></button>
              </div>
              <form onSubmit={handleMaintSubmit}>
                <div className="modal-body py-3">
                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold">Service Type</label>
                    <select
                      className="form-select glass-input"
                      value={maintForm.serviceType}
                      onChange={(e) => setMaintForm({ ...maintForm, serviceType: e.target.value })}
                    >
                      <option value="routine">Routine Inspection</option>
                      <option value="repair">Defect Repair</option>
                      <option value="overhaul">Complete Workshop Overhaul</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold">Work Done Description</label>
                    <textarea
                      required
                      className="form-control glass-input"
                      rows="3"
                      placeholder="Describe work completed..."
                      value={maintForm.description}
                      onChange={(e) => setMaintForm({ ...maintForm, description: e.target.value })}
                    />
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label text-muted fw-semibold">Service Cost ($)</label>
                      <input
                        type="number"
                        className="form-control glass-input"
                        placeholder="Cost in USD"
                        value={maintForm.cost}
                        onChange={(e) => setMaintForm({ ...maintForm, cost: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-muted fw-semibold">EME Workshop Name</label>
                      <input
                        type="text"
                        className="form-control glass-input"
                        value={maintForm.servicedBy}
                        onChange={(e) => setMaintForm({ ...maintForm, servicedBy: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold">Next Service Due Date</label>
                    <input
                      type="date"
                      className="form-control glass-input"
                      value={maintForm.nextServiceDueDate}
                      onChange={(e) => setMaintForm({ ...maintForm, nextServiceDueDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowMaintModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary-farm rounded-pill px-4">Record Service</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EquipmentCentral;
