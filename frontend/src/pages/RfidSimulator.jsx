import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  Radio, 
  MapPin, 
  Cpu, 
  Activity, 
  Terminal, 
  Send, 
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../api/api.js';
import { useToast } from '../components/layout/Toast.jsx';

const MOCK_LOCATIONS = [
  { name: 'HQ General Depot', lat: 29.8660, lng: 77.8880, status: 'stored' },
  { name: 'Training Battalion I Depot', lat: 29.8700, lng: 77.8950, status: 'stored' },
  { name: 'Training Battalion II Depot', lat: 29.8650, lng: 77.9000, status: 'stored' },
  { name: 'Specialist Training Unit Store', lat: 29.8780, lng: 77.9120, status: 'stored' },
  { name: 'Solani River Crossing Site Alpha', lat: 29.8950, lng: 77.9250, status: 'deployed' },
  { name: 'Field Area Alpha Outpost', lat: 29.8950, lng: 77.9300, status: 'deployed' },
  { name: 'Field Area Bravo Depot', lat: 29.8400, lng: 77.8500, status: 'deployed' },
];

const RfidSimulator = () => {
  const { user } = useSelector((state) => state.auth);
  const showToast = useToast();
  const toast = {
    success: (msg) => showToast({ title: 'Success', sub: msg, variant: 'success' }),
    error: (msg) => showToast({ title: 'Error', sub: msg, variant: 'error' }),
    warn: (msg) => showToast({ title: 'Warning', sub: msg, variant: 'warning' }),
    info: (msg) => showToast({ title: 'Info', sub: msg, variant: 'info' }),
  };

  // State
  const [physicalItems, setPhysicalItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedLocIndex, setSelectedLocIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scanLogs, setScanLogs] = useState([]);

  // Fetch physical items
  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/physical-items');
      if (res.data.success) {
        setPhysicalItems(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedItemId(res.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load physical items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    const item = physicalItems.find(i => i._id === selectedItemId);
    const loc = MOCK_LOCATIONS[selectedLocIndex];

    if (!item || !loc) return;

    try {
      setSubmitting(true);
      
      const payload = {
        rfidTag: item.rfidTag,
        locationName: loc.name,
        lat: loc.lat,
        lng: loc.lng,
        status: loc.status
      };

      const res = await api.post('/physical-items/scan', payload);
      if (res.data.success) {
        toast.success(`RFID Broadcast: Scan logged for ${item.serialNumber}`);
        
        // Log in the simulator terminal
        const timestamp = new Date().toLocaleTimeString();
        const logMsg = `[${timestamp}] [PORTAL SCAN OK] TAG: ${item.rfidTag} | SN: ${item.serialNumber} | LOC: ${loc.name} (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}) | STATUS: ${loc.status.toUpperCase()}`;
        setScanLogs(prev => [logMsg, ...prev]);

        // Refresh physical items list to reflect changes in current selection
        fetchItems();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to simulate RFID scan');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedItem = physicalItems.find(i => i._id === selectedItemId);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="container-fluid py-3"
    >
      {/* Header */}
      <div className="mb-4">
        <h1 className="page-title gradient-text mb-1">RFID Sensor Portal Simulator</h1>
        <p className="page-subtitle mb-0">Simulate automated RF tracking gates registering component movement in and out of tactical store depots.</p>
      </div>

      <div className="row g-4">
        {/* Left Column: Scanner Panel Form */}
        <div className="col-lg-6">
          <div className="card-farm glass-panel p-4 h-100 d-flex flex-column gap-3">
            <div className="d-flex align-items-center gap-2 border-bottom pb-3 mb-2" style={{ borderColor: 'var(--border-color)' }}>
              <Cpu className="text-success" size={24} />
              <h3 className="fw-bold mb-0" style={{ fontSize: 'var(--fs-h3)' }}>Trigger Sensor Scan</h3>
            </div>

            {loading ? (
              <div className="d-flex justify-content-center py-5 flex-grow-1 align-items-center">
                <div className="spinner-border text-success" role="status"></div>
              </div>
            ) : physicalItems.length === 0 ? (
              <div className="alert alert-warning p-4 text-center rounded-3">
                <AlertCircle className="mx-auto mb-2 text-warning" size={32} />
                <h5 className="fw-bold">No Physical Items Seeded</h5>
                <p className="text-muted mb-0">Run the seed script first to establish individual physical items.</p>
              </div>
            ) : (
              <form onSubmit={handleScanSubmit} className="d-flex flex-column gap-3 flex-grow-1">
                {/* Select physical item */}
                <div>
                  <label className="form-label text-muted fw-semibold" style={{ fontSize: 'var(--fs-sm)' }}>Select Physical Component</label>
                  <select
                    className="form-select py-2.5 px-3 rounded-3"
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                  >
                    {physicalItems.map(pi => (
                      <option key={pi._id} value={pi._id}>
                        {pi.serialNumber} - {pi.item?.nomenclature || 'Unknown Item'} ({pi.location?.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Show RFID metadata */}
                {selectedItem && (
                  <div className="rounded-3 p-3 d-flex flex-column gap-2" style={{ background: 'var(--primary-green-subtle)', border: '1px solid var(--border-color)' }}>
                    <div className="d-flex justify-content-between text-muted" style={{ fontSize: 'var(--fs-xs)' }}>
                      <span>RFID Tag Code:</span>
                      <span className="fw-bold text-success font-mono">{selectedItem.rfidTag}</span>
                    </div>
                    <div className="d-flex justify-content-between text-muted" style={{ fontSize: 'var(--fs-xs)' }}>
                      <span>Holding Unit:</span>
                      <span className="fw-bold text-dark">{selectedItem.establishment?.establishmentName || 'HQ Store'}</span>
                    </div>
                    <div className="d-flex justify-content-between text-muted" style={{ fontSize: 'var(--fs-xs)' }}>
                      <span>Current Status:</span>
                      <span className="fw-bold text-dark">{selectedItem.status.toUpperCase()}</span>
                    </div>
                    <div className="d-flex justify-content-between text-muted" style={{ fontSize: 'var(--fs-xs)' }}>
                      <span>Current Location:</span>
                      <span className="fw-bold text-dark">{selectedItem.location?.name}</span>
                    </div>
                  </div>
                )}

                {/* Select target checkpoint portal */}
                <div>
                  <label className="form-label text-muted fw-semibold" style={{ fontSize: 'var(--fs-sm)' }}>Select Target Scanner Portal Checkpoint</label>
                  <select
                    className="form-select py-2.5 px-3 rounded-3"
                    value={selectedLocIndex}
                    onChange={(e) => setSelectedLocIndex(parseInt(e.target.value))}
                  >
                    {MOCK_LOCATIONS.map((loc, idx) => (
                      <option key={idx} value={idx}>
                        {loc.name} (Coords: {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}) - Status: {loc.status.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Form Action */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary-farm py-2.5 rounded-3 w-100 fw-bold mt-auto d-flex align-items-center justify-content-center gap-2 press-scale"
                >
                  <Send size={16} />
                  {submitting ? 'Broadcasting RF Signal...' : 'Trigger RF Portal Scan Checkpoint'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Console / Terminal Output */}
        <div className="col-lg-6">
          <div className="card-farm p-4 h-100 d-flex flex-column gap-3" style={{ background: '#080d09', borderColor: 'rgba(92, 123, 87, 0.25)', boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}>
            <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-2" style={{ borderColor: 'rgba(92, 123, 87, 0.3)' }}>
              <div className="d-flex align-items-center gap-2">
                <Terminal className="text-success" size={22} />
                <h3 className="fw-bold mb-0 text-success font-mono" style={{ fontSize: 'var(--fs-h3)' }}>Live RF Sensor Logs</h3>
              </div>
              <span className="badge bg-success text-dark px-2.5 py-1 rounded-pill fw-bold font-mono" style={{ fontSize: '10px' }}>
                LIVE FEED
              </span>
            </div>

            {/* Terminal Screen */}
            <div className="flex-grow-1 rounded-3 p-3 d-flex flex-column gap-2 overflow-auto" style={{ 
              background: '#040604', 
              border: '1px solid rgba(0, 255, 0, 0.18)',
              minHeight: '280px',
              maxHeight: '400px',
              fontFamily: 'monospace',
              fontSize: '11px',
              color: '#39ff14'
            }}>
              {scanLogs.length === 0 ? (
                <div className="text-muted opacity-50 py-5 text-center">
                  --- WAITING FOR TELEMETRY SIGNALS ---<br />
                  (Trigger a portal checkpoint scan to log signal activity)
                </div>
              ) : (
                scanLogs.map((log, idx) => (
                  <div key={idx} className="pb-1" style={{ borderBottom: '1px solid rgba(0,255,0,0.08)' }}>
                    {log}
                  </div>
                ))
              )}
            </div>

            <div className="text-muted mt-2 d-flex align-items-center gap-2" style={{ fontSize: 'var(--fs-xs)' }}>
              <Info size={14} className="text-success" />
              <span className="text-success" style={{ opacity: 0.8 }}>Scans will instantly update the map coordinates in Equipment Central via Socket.io.</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RfidSimulator;
